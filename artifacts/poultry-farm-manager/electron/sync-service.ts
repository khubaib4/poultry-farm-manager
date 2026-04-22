import mongoose from "mongoose";
import * as Models from "./models";
import { getSyncConfig, saveSyncConfig, isSyncEnabled } from "./sync-config";

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  pendingChanges: number;
  error: string | null;
}

let cloudConnection: mongoose.Connection | null = null;
let syncInterval: NodeJS.Timeout | null = null;

let syncStatus: SyncStatus = {
  isOnline: false,
  isSyncing: false,
  lastSyncTime: null,
  pendingChanges: 0,
  error: null,
};

function cloneSchemaWithSyncFields(schema: mongoose.Schema): mongoose.Schema {
  // clone() exists in modern mongoose; fall back to reusing if missing.
  const s = (schema as any).clone ? (schema as any).clone() : schema;
  s.add({
    _syncDeviceId: { type: String, index: true },
    _syncUpdatedAt: { type: Date, index: true },
  });
  return s;
}

function getCloudModel(modelName: string, baseSchema: mongoose.Schema, collectionName?: string) {
  if (!cloudConnection) throw new Error("Not connected to cloud");
  const existing = cloudConnection.models?.[modelName];
  if (existing) return existing;
  const schema = cloneSchemaWithSyncFields(baseSchema);
  return cloudConnection.model(modelName, schema, collectionName);
}

export async function connectToCloud(): Promise<boolean> {
  const config = getSyncConfig();
  if (!config.atlasUri) {
    syncStatus.error = "No Atlas URI configured";
    return false;
  }

  try {
    cloudConnection = await mongoose
      .createConnection(config.atlasUri, {
        serverSelectionTimeoutMS: 10_000,
        connectTimeoutMS: 10_000,
      })
      .asPromise();

    syncStatus.isOnline = true;
    syncStatus.error = null;
    syncStatus.lastSyncTime = config.lastSyncTime ?? null;
    console.log("[sync] Connected to MongoDB Atlas");
    return true;
  } catch (error) {
    cloudConnection = null;
    syncStatus.isOnline = false;
    syncStatus.error = `Failed to connect: ${error instanceof Error ? error.message : String(error)}`;
    console.error("[sync] Cloud connection failed:", error);
    return false;
  }
}

export async function disconnectFromCloud(): Promise<void> {
  if (cloudConnection) {
    await cloudConnection.close();
    cloudConnection = null;
  }
  syncStatus.isOnline = false;
}

export async function checkOnlineStatus(): Promise<boolean> {
  try {
    if (!cloudConnection) return await connectToCloud();
    await cloudConnection.db?.admin().ping();
    syncStatus.isOnline = true;
    return true;
  } catch {
    syncStatus.isOnline = false;
    return false;
  }
}

export function getSyncStatus(): SyncStatus {
  return { ...syncStatus };
}

export interface SyncFromCloudStats {
  farms: number;
  flocks: number;
  entries: number;
  sales: number;
  customers: number;
  expenses: number;
  inventory: number;
  vaccinations: number;
  users: number;
  saleItems: number;
  salePayments: number;
  inventoryTransactions: number;
  vaccines: number;
  eggPrices: number;
  eggCategories: number;
  dismissedAlerts: number;
  schedules: number;
  counters: number;
  merged: number;
}

function effectiveSyncTime(doc: unknown): number {
  if (!doc || typeof doc !== "object") return 0;
  const d = doc as { _syncUpdatedAt?: Date; updatedAt?: Date; createdAt?: Date };
  const raw = d._syncUpdatedAt ?? d.updatedAt ?? d.createdAt;
  return raw ? new Date(raw as Date).getTime() : 0;
}

/** Apply cloud document to local DB when cloud is strictly newer (by _syncUpdatedAt / timestamps). */
async function mergeCloudDocument(
  LocalModel: mongoose.Model<unknown>,
  cloudDoc: Record<string, unknown> | null | undefined
): Promise<boolean> {
  if (!cloudDoc?._id) return false;
  const existing = await LocalModel.findOne({ _id: cloudDoc._id as mongoose.Types.ObjectId }).lean();
  const cloudT = effectiveSyncTime(cloudDoc);
  const localT = effectiveSyncTime(existing);
  if (existing && cloudT <= localT) return false;
  await LocalModel.findOneAndUpdate(
    { _id: cloudDoc._id as mongoose.Types.ObjectId },
    { ...cloudDoc },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );
  return true;
}

function cloudModel(localModel: mongoose.Model<unknown>, collectionName: string) {
  const name = (localModel as { modelName?: string }).modelName ?? collectionName;
  return getCloudModel(name, (localModel as { schema: mongoose.Schema }).schema, collectionName);
}

function emptyCloudPullStats(): SyncFromCloudStats {
  return {
    farms: 0,
    flocks: 0,
    entries: 0,
    sales: 0,
    customers: 0,
    expenses: 0,
    inventory: 0,
    vaccinations: 0,
    users: 0,
    saleItems: 0,
    salePayments: 0,
    inventoryTransactions: 0,
    vaccines: 0,
    eggPrices: 0,
      eggCategories: 0,
    dismissedAlerts: 0,
    schedules: 0,
    counters: 0,
    merged: 0,
  };
}

async function mergeOwnerDocumentsFromCloud(ownerId: number, stats: SyncFromCloudStats): Promise<void> {
  const CloudOwner = cloudModel(Models.OwnerModel as mongoose.Model<unknown>, "owners");
  const cloudOwners = await CloudOwner.find({ id: ownerId }).lean();
  for (const doc of cloudOwners ?? []) {
    if (await mergeCloudDocument(Models.OwnerModel as mongoose.Model<unknown>, doc as Record<string, unknown>)) {
      stats.merged += 1;
    }
  }
}

async function mergeVaccinationSchedulesFromCloud(stats: SyncFromCloudStats): Promise<void> {
  const bump = (key: keyof Omit<SyncFromCloudStats, "merged">, n: number) => {
    stats[key] += n;
  };
  const CloudSchedule = cloudModel(
    Models.VaccinationScheduleModel as mongoose.Model<unknown>,
    "vaccinationschedules"
  );
  const scheduleDocs = await CloudSchedule.find({}).lean();
  for (const doc of scheduleDocs ?? []) {
    if (
      await mergeCloudDocument(
        Models.VaccinationScheduleModel as mongoose.Model<unknown>,
        doc as Record<string, unknown>
      )
    ) {
      bump("schedules", 1);
      stats.merged += 1;
    }
  }
}

async function mergeCountersFromCloud(stats: SyncFromCloudStats): Promise<void> {
  const bump = (key: keyof Omit<SyncFromCloudStats, "merged">, n: number) => {
    stats[key] += n;
  };
  const CloudCounter = cloudModel(Models.CounterModel as mongoose.Model<unknown>, "counters");
  const cloudCounters = await CloudCounter.find({}).lean();
  for (const counter of cloudCounters ?? []) {
    const c = counter as { _id?: mongoose.Types.ObjectId; name?: string; seq?: number };
    if (!c?._id || c.name === undefined || c.seq === undefined) continue;
    const localCounter = await Models.CounterModel.findOne({ _id: c._id }).lean();
    const localSeq = (localCounter as { seq?: number } | null)?.seq ?? -1;
    if (c.seq > localSeq) {
      await Models.CounterModel.findOneAndUpdate(
        { _id: c._id },
        { ...c },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
      );
      bump("counters", 1);
    }
  }
}

async function mergeSingleFarmSubtreeFromCloud(farm: Record<string, unknown>, stats: SyncFromCloudStats): Promise<void> {
  if (!farm?.id) return;
  const bump = (key: keyof Omit<SyncFromCloudStats, "merged">, n: number) => {
    stats[key] += n;
  };

  if (await mergeCloudDocument(Models.FarmModel as mongoose.Model<unknown>, farm)) {
    stats.merged += 1;
  }

  const farmId = farm.id as number;

  const farmScopedNoChildren: {
    local: mongoose.Model<unknown>;
    collection: string;
    stat: keyof Omit<SyncFromCloudStats, "merged">;
  }[] = [
    { local: Models.UserModel as mongoose.Model<unknown>, collection: "users", stat: "users" },
    { local: Models.CustomerModel as mongoose.Model<unknown>, collection: "customers", stat: "customers" },
    { local: Models.ExpenseModel as mongoose.Model<unknown>, collection: "expenses", stat: "expenses" },
    { local: Models.VaccineModel as mongoose.Model<unknown>, collection: "vaccines", stat: "vaccines" },
    { local: Models.EggPriceModel as mongoose.Model<unknown>, collection: "eggprices", stat: "eggPrices" },
    { local: Models.EggCategoryModel as mongoose.Model<unknown>, collection: "eggcategories", stat: "eggCategories" },
    { local: Models.DismissedAlertModel as mongoose.Model<unknown>, collection: "dismissedalerts", stat: "dismissedAlerts" },
  ];

  for (const { local, collection, stat } of farmScopedNoChildren) {
    const Cloud = cloudModel(local, collection);
    const docs = await Cloud.find({ farmId }).lean();
    for (const doc of docs ?? []) {
      if (await mergeCloudDocument(local, doc as Record<string, unknown>)) {
        stats.merged += 1;
        bump(stat, 1);
      }
    }
  }

  const CloudFlock = cloudModel(Models.FlockModel as mongoose.Model<unknown>, "flocks");
  const flockDocs = await CloudFlock.find({ farmId }).lean();
  for (const doc of flockDocs ?? []) {
    if (await mergeCloudDocument(Models.FlockModel as mongoose.Model<unknown>, doc as Record<string, unknown>)) {
      bump("flocks", 1);
      stats.merged += 1;
    }
  }
  const flockIds = (flockDocs ?? [])
    .map((f) => (f as { id?: number }).id)
    .filter((id): id is number => typeof id === "number");

  if (flockIds.length > 0) {
    const CloudDaily = cloudModel(Models.DailyEntryModel as mongoose.Model<unknown>, "dailyentries");
    const dailyDocs = await CloudDaily.find({ flockId: { $in: flockIds } }).lean();
    for (const doc of dailyDocs ?? []) {
      if (await mergeCloudDocument(Models.DailyEntryModel as mongoose.Model<unknown>, doc as Record<string, unknown>)) {
        bump("entries", 1);
        stats.merged += 1;
      }
    }

    const CloudVax = cloudModel(Models.VaccinationModel as mongoose.Model<unknown>, "vaccinations");
    const vaxDocs = await CloudVax.find({ flockId: { $in: flockIds } }).lean();
    for (const doc of vaxDocs ?? []) {
      if (await mergeCloudDocument(Models.VaccinationModel as mongoose.Model<unknown>, doc as Record<string, unknown>)) {
        bump("vaccinations", 1);
        stats.merged += 1;
      }
    }
  }

  const CloudSale = cloudModel(Models.SaleModel as mongoose.Model<unknown>, "sales");
  const saleDocs = await CloudSale.find({ farmId }).lean();
  for (const doc of saleDocs ?? []) {
    if (await mergeCloudDocument(Models.SaleModel as mongoose.Model<unknown>, doc as Record<string, unknown>)) {
      bump("sales", 1);
      stats.merged += 1;
    }
  }
  const saleIds = (saleDocs ?? [])
    .map((s) => (s as { id?: number }).id)
    .filter((id): id is number => typeof id === "number");

  if (saleIds.length > 0) {
    const CloudItems = cloudModel(Models.SaleItemModel as mongoose.Model<unknown>, "saleitems");
    const itemDocs = await CloudItems.find({ saleId: { $in: saleIds } }).lean();
    for (const doc of itemDocs ?? []) {
      if (await mergeCloudDocument(Models.SaleItemModel as mongoose.Model<unknown>, doc as Record<string, unknown>)) {
        bump("saleItems", 1);
        stats.merged += 1;
      }
    }

    const CloudPay = cloudModel(Models.SalePaymentModel as mongoose.Model<unknown>, "salepayments");
    const payDocs = await CloudPay.find({ saleId: { $in: saleIds } }).lean();
    for (const doc of payDocs ?? []) {
      if (await mergeCloudDocument(Models.SalePaymentModel as mongoose.Model<unknown>, doc as Record<string, unknown>)) {
        bump("salePayments", 1);
        stats.merged += 1;
      }
    }
  }

  const CloudInv = cloudModel(Models.InventoryModel as mongoose.Model<unknown>, "inventory");
  const invDocs = await CloudInv.find({ farmId }).lean();
  for (const doc of invDocs ?? []) {
    if (await mergeCloudDocument(Models.InventoryModel as mongoose.Model<unknown>, doc as Record<string, unknown>)) {
      bump("inventory", 1);
      stats.merged += 1;
    }
  }
  const inventoryIds = (invDocs ?? [])
    .map((i) => (i as { id?: number }).id)
    .filter((id): id is number => typeof id === "number");

  if (inventoryIds.length > 0) {
    const CloudTx = cloudModel(
      Models.InventoryTransactionModel as mongoose.Model<unknown>,
      "inventorytransactions"
    );
    const txDocs = await CloudTx.find({ inventoryId: { $in: inventoryIds } }).lean();
    for (const doc of txDocs ?? []) {
      if (
        await mergeCloudDocument(Models.InventoryTransactionModel as mongoose.Model<unknown>, doc as Record<string, unknown>)
      ) {
        bump("inventoryTransactions", 1);
        stats.merged += 1;
      }
    }
  }
}

/**
 * Farm device setup: pull one farm + owner + shared schedules from Atlas (sync does not need to be enabled yet).
 */
export async function pullFarmForDeviceSetup(
  ownerId: number,
  farmId: number
): Promise<{ success: boolean; error?: string; stats?: SyncFromCloudStats }> {
  if (syncStatus.isSyncing) return { success: false, error: "Sync already in progress" };

  if (!cloudConnection) {
    const ok = await connectToCloud();
    if (!ok) return { success: false, error: syncStatus.error || "Connection failed" };
  }

  syncStatus.isSyncing = true;
  syncStatus.error = null;

  const stats = emptyCloudPullStats();

  try {
    const CloudFarm = cloudModel(Models.FarmModel as mongoose.Model<unknown>, "farms");
    const farm = await CloudFarm.findOne({ id: farmId, ownerId }).lean();
    if (!farm) {
      syncStatus.isSyncing = false;
      return { success: false, error: "Farm data not found in cloud. Owner may need to sync first." };
    }

    await mergeOwnerDocumentsFromCloud(ownerId, stats);
    await mergeVaccinationSchedulesFromCloud(stats);
    stats.farms = 1;
    await mergeSingleFarmSubtreeFromCloud(farm as Record<string, unknown>, stats);
    await mergeCountersFromCloud(stats);

    const now = new Date().toISOString();
    saveSyncConfig({ lastSyncTime: now });
    syncStatus.lastSyncTime = now;
    syncStatus.isSyncing = false;
    return { success: true, stats };
  } catch (error) {
    syncStatus.isSyncing = false;
    syncStatus.error = error instanceof Error ? error.message : String(error);
    return { success: false, error: syncStatus.error };
  }
}

export async function syncToCloud(): Promise<{ success: boolean; error?: string }> {
  if (!isSyncEnabled()) return { success: false, error: "Sync not enabled" };
  if (syncStatus.isSyncing) return { success: false, error: "Sync already in progress" };

  if (!cloudConnection) {
    const ok = await connectToCloud();
    if (!ok) return { success: false, error: syncStatus.error || "Connection failed" };
  }

  syncStatus.isSyncing = true;
  syncStatus.error = null;

  try {
    const { deviceId } = getSyncConfig();

    const collectionsToSync = [
      { model: Models.OwnerModel, collectionName: "owners" },
      { model: Models.FarmModel, collectionName: "farms" },
      { model: Models.UserModel, collectionName: "users" },
      { model: Models.FlockModel, collectionName: "flocks" },
      { model: Models.DailyEntryModel, collectionName: "dailyentries" },
      { model: Models.CustomerModel, collectionName: "customers" },
      { model: Models.SaleModel, collectionName: "sales" },
      { model: Models.SaleItemModel, collectionName: "saleitems" },
      { model: Models.SalePaymentModel, collectionName: "salepayments" },
      { model: Models.ExpenseModel, collectionName: "expenses" },
      { model: Models.InventoryModel, collectionName: "inventory" },
      { model: Models.InventoryTransactionModel, collectionName: "inventorytransactions" },
      { model: Models.VaccinationModel, collectionName: "vaccinations" },
      { model: Models.VaccinationScheduleModel, collectionName: "vaccinationschedules" },
      { model: Models.VaccineModel, collectionName: "vaccines" },
      { model: Models.EggPriceModel, collectionName: "eggprices" },
      { model: Models.EggCategoryModel, collectionName: "eggcategories" },
      { model: Models.DismissedAlertModel, collectionName: "dismissedalerts" },
      { model: Models.CounterModel, collectionName: "counters" },
    ];

    for (const { model, collectionName } of collectionsToSync) {
      const localDocs = await (model as any).find({}).lean();
      if (!Array.isArray(localDocs) || localDocs.length === 0) continue;

      const cloudModelName = (model as any).modelName ?? collectionName;
      const CloudModel = getCloudModel(cloudModelName, (model as any).schema, collectionName);

      for (const doc of localDocs) {
        if (!doc?._id) continue;
        await (CloudModel as any).findOneAndUpdate(
          { _id: doc._id },
          {
            ...doc,
            _syncDeviceId: deviceId,
            _syncUpdatedAt: new Date(),
          },
          { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
        );
      }

      console.log(`[sync] Synced ${localDocs.length} ${collectionName}`);
    }

    const now = new Date().toISOString();
    saveSyncConfig({ lastSyncTime: now });
    syncStatus.lastSyncTime = now;
    syncStatus.isSyncing = false;
    return { success: true };
  } catch (error) {
    syncStatus.isSyncing = false;
    syncStatus.error = error instanceof Error ? error.message : String(error);
    return { success: false, error: syncStatus.error };
  }
}

/**
 * Owner pull: download all farms and related data from Atlas into the local DB.
 * Newer cloud revision wins when comparing `_syncUpdatedAt`, then `updatedAt`, then `createdAt`.
 */
export async function syncFromCloud(
  ownerId: number
): Promise<{ success: boolean; error?: string; stats?: SyncFromCloudStats }> {
  if (!isSyncEnabled()) return { success: false, error: "Sync not enabled" };
  if (syncStatus.isSyncing) return { success: false, error: "Sync already in progress" };

  if (!cloudConnection) {
    const ok = await connectToCloud();
    if (!ok) return { success: false, error: syncStatus.error || "Connection failed" };
  }

  syncStatus.isSyncing = true;
  syncStatus.error = null;

  const stats = emptyCloudPullStats();

  try {
    await mergeOwnerDocumentsFromCloud(ownerId, stats);

    const CloudFarm = cloudModel(Models.FarmModel as mongoose.Model<unknown>, "farms");
    const cloudFarms = await CloudFarm.find({ ownerId }).lean();
    stats.farms = cloudFarms?.length ?? 0;

    await mergeVaccinationSchedulesFromCloud(stats);

    for (const farm of cloudFarms ?? []) {
      if (!farm?.id) continue;
      await mergeSingleFarmSubtreeFromCloud(farm as Record<string, unknown>, stats);
    }

    await mergeCountersFromCloud(stats);

    const now = new Date().toISOString();
    saveSyncConfig({ lastSyncTime: now });
    syncStatus.lastSyncTime = now;
    syncStatus.isSyncing = false;
    return { success: true, stats };
  } catch (error) {
    syncStatus.isSyncing = false;
    syncStatus.error = error instanceof Error ? error.message : String(error);
    return { success: false, error: syncStatus.error };
  }
}

export function startBackgroundSync(): void {
  if (syncInterval) return;

  const config = getSyncConfig();
  const intervalMs = Math.max(1, Number(config.syncIntervalMinutes ?? 15)) * 60 * 1000;

  // Initial sync after 30 seconds
  setTimeout(() => {
    if (isSyncEnabled()) void syncToCloud();
  }, 30_000);

  syncInterval = setInterval(() => {
    if (isSyncEnabled()) void syncToCloud();
  }, intervalMs);

  console.log(`[sync] Background sync started (every ${config.syncIntervalMinutes} minutes)`);
}

export function stopBackgroundSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

