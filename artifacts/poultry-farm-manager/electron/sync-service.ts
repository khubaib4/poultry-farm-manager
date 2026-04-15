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
          { upsert: true, new: true, setDefaultsOnInsert: true }
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

// Owner pull: minimal implementation (farms + farm-scoped collections).
// This is conservative to avoid overwriting local work on farm devices.
export async function syncFromCloud(ownerId: number): Promise<{ success: boolean; error?: string }> {
  if (!isSyncEnabled()) return { success: false, error: "Sync not enabled" };
  if (syncStatus.isSyncing) return { success: false, error: "Sync already in progress" };

  if (!cloudConnection) {
    const ok = await connectToCloud();
    if (!ok) return { success: false, error: syncStatus.error || "Connection failed" };
  }

  syncStatus.isSyncing = true;
  syncStatus.error = null;

  try {
    const CloudFarm = getCloudModel((Models.FarmModel as any).modelName ?? "Farm", (Models.FarmModel as any).schema, "farms");
    const cloudFarms = await (CloudFarm as any).find({ ownerId }).lean();

    for (const farm of cloudFarms ?? []) {
      if (!farm?.id) continue;
      const existing = await (Models.FarmModel as any).findOne({ id: farm.id }).lean();
      if (!existing) {
        await (Models.FarmModel as any).create(farm);
      } else {
        const cloudUpdated = new Date(farm._syncUpdatedAt || 0);
        const localUpdated = new Date(existing.updatedAt || 0);
        if (cloudUpdated > localUpdated) {
          await (Models.FarmModel as any).findOneAndUpdate({ id: farm.id }, farm);
        }
      }
    }

    syncStatus.isSyncing = false;
    return { success: true };
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

