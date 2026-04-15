import { ipcMain, dialog, shell, app } from "electron";
import bcrypt from "bcryptjs";
import Store from "electron-store";
import { statSync } from "fs";
import { join } from "path";

import {
  OwnerModel,
  FarmModel,
  UserModel,
  FlockModel,
  DailyEntryModel,
  EggPriceModel,
  ExpenseModel,
  InventoryModel,
  InventoryTransactionModel,
  VaccinationModel,
  VaccinationScheduleModel,
  VaccineModel,
  CustomerModel,
  SaleModel,
  SaleItemModel,
  SalePaymentModel,
  DismissedAlertModel,
  nextSequence,
} from "./models";

import {
  ownerSchema,
  farmSchema,
  userSchema,
  flockSchema,
  dailyEntrySchema,
  eggPriceSchema,
  expenseSchema,
  inventorySchema,
  inventoryTransactionSchema,
  vaccinationSchema,
  vaccinationScheduleSchema,
  vaccineSchema,
  customerSchema,
  saleSchema,
  saleItemSchema,
  salePaymentSchema,
  dismissedAlertSchema,
} from "./schemas";

import {
  createBackup,
  restoreBackup,
  validateBackup,
  listBackups,
  getBackupDirectory,
  openBackupFolder,
  deleteBackupFile,
} from "./backup-mongo";
import {
  getAutoBackupSettings,
  saveAutoBackupSettings,
  runAutoBackup,
} from "./autoBackup";
import { getAllSettings, updateSettings, resetSettings } from "./settings";
import type { AppSettings } from "./settings";
import { getDatabasePath } from "./database";

interface SessionData {
  type: "owner" | "farm" | "user";
  id: number;
  name: string;
  farmId?: number;
  role?: string;
}

const store = new Store<{ session: SessionData | null }>({
  defaults: { session: null },
});

let currentSession: SessionData | null = store.get("session", null);

function requireAuth(): SessionData {
  if (!currentSession) throw new Error("Authentication required");
  return currentSession;
}

function requireOwner(): SessionData {
  const session = requireAuth();
  if (session.type !== "owner") throw new Error("Owner access required");
  return session;
}

function requireFarmAccess(farmId: number): SessionData {
  const session = requireAuth();
  if (session.type === "owner") return session;
  if (session.type === "farm" && session.farmId === farmId) return session;
  throw new Error("You do not have access to this farm");
}

function wrapHandler<T>(
  fn: (...args: unknown[]) => Promise<T> | T
): (...args: unknown[]) => Promise<{ success: boolean; data?: T; error?: string }> {
  return async (...args: unknown[]) => {
    try {
      const data = await fn(...args);
      return { success: true, data };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      console.error("IPC handler error:", message);
      return { success: false, error: message };
    }
  };
}

async function createWithId<T extends Record<string, unknown>>(
  modelName: string,
  Model: { create: (doc: T) => Promise<unknown> },
  doc: T
) {
  const id = await nextSequence(modelName);
  return Model.create({ ...doc, id } as T & { id: number });
}

function toPlain<T extends { toObject?: () => unknown }>(doc: any): T {
  if (!doc) return doc;
  if (typeof doc.toObject === "function") return doc.toObject() as T;
  return doc as T;
}

export function registerIpcHandlers(): void {
  // --------------------
  // Auth
  // --------------------
  ipcMain.handle(
    "auth:loginOwner",
    wrapHandler(async (_e: unknown, email: string, password: string) => {
      const owner = await OwnerModel.findOne({
        email,
      }).lean();
      if (!owner) throw new Error("Invalid email or password");
      const valid = bcrypt.compareSync(password, owner.passwordHash);
      if (!valid) throw new Error("Invalid email or password");
      currentSession = { type: "owner", id: owner.id!, name: owner.name };
      store.set("session", currentSession);
      return currentSession;
    })
  );

  ipcMain.handle(
    "auth:loginFarm",
    wrapHandler(async (_e: unknown, username: string, password: string) => {
      const farm = await FarmModel.findOne({
        loginUsername: username,
      }).lean();
      if (!farm) throw new Error("Invalid username or password");
      const valid = bcrypt.compareSync(password, farm.loginPasswordHash);
      if (!valid) throw new Error("Invalid username or password");
      currentSession = {
        type: "farm",
        id: farm.id!,
        name: farm.name,
        farmId: farm.id!,
      };
      store.set("session", currentSession);
      return currentSession;
    })
  );

  ipcMain.handle(
    "auth:logout",
    wrapHandler(() => {
      currentSession = null;
      store.set("session", null);
      return null;
    })
  );

  ipcMain.handle(
    "auth:getCurrentUser",
    wrapHandler(async () => {
      if (!currentSession) return null;
      try {
        if (currentSession.type === "owner") {
          const owner = await OwnerModel.findOne({ id: currentSession.id }).lean();
          if (!owner) throw new Error("Owner not found");
          return currentSession;
        }
        if (currentSession.type === "farm") {
          const farmId = currentSession.farmId ?? currentSession.id;
          const farm = await FarmModel.findOne({ id: farmId }).lean();
          if (!farm) throw new Error("Farm not found");
          return currentSession;
        }
        if (currentSession.type === "user") {
          const user = await UserModel.findOne({ id: currentSession.id }).lean();
          if (!user) throw new Error("User not found");
          return currentSession;
        }
        throw new Error("Invalid session type");
      } catch (err) {
        // If anything goes wrong (stale session, db reset, etc.) clear session
        currentSession = null;
        store.set("session", null);
        return null;
      }
    })
  );

  // --------------------
  // Owners
  // --------------------
  ipcMain.handle(
    "owners:create",
    wrapHandler(
      async (
        _e: unknown,
        data: { name: string; email?: string; phone?: string; password: string }
      ) => {
        const parsed = ownerSchema
          .omit({ id: true })
          .safeParse({
            name: data.name,
            email: data.email,
            phone: data.phone,
            passwordHash: "placeholder",
          });
        if (!parsed.success) throw new Error(parsed.error.message);

        if (data.email) {
          const existing = await OwnerModel.findOne({ email: data.email }).lean();
          if (existing)
            throw new Error("An account with this email already exists");
        }
        const hash = bcrypt.hashSync(data.password, 10);
        const created = (await createWithId("owners", OwnerModel as any, {
          name: data.name,
          email: data.email,
          phone: data.phone,
          passwordHash: hash,
        })) as any;
        const obj = toPlain<any>(created);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash: _ph, _id, __v, ...safe } = obj;
        return safe;
      }
    )
  );

  ipcMain.handle(
    "owners:getById",
    wrapHandler(async (_e: unknown, id: number) => {
      const session = requireOwner();
      if (session.id !== id) throw new Error("Access denied");
      const owner = await OwnerModel.findOne({ id }).lean();
      if (!owner) throw new Error("Owner not found");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _ph, _id, __v, ...safe } = owner as any;
      return safe;
    })
  );

  ipcMain.handle(
    "owners:update",
    wrapHandler(
      async (
        _e: unknown,
        id: number,
        data: Partial<{ name: string; email: string; phone: string; password: string }>
      ) => {
        const session = requireOwner();
        if (session.id !== id) throw new Error("Access denied");

        const updates: Record<string, unknown> = {};
        if (data.name !== undefined) updates.name = data.name;
        if (data.email !== undefined) updates.email = data.email;
        if (data.phone !== undefined) updates.phone = data.phone;
        if (data.password !== undefined)
          updates.passwordHash = bcrypt.hashSync(data.password, 10);

        const updated = await OwnerModel.findOneAndUpdate(
          { id },
          updates,
          { new: true }
        ).lean();
        if (!updated) throw new Error("Owner not found");
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash: _ph, _id, __v, ...safe } = updated as any;
        return safe;
      }
    )
  );

  // --------------------
  // Farms
  // --------------------
  ipcMain.handle(
    "farms:create",
    wrapHandler(
      async (
        _e: unknown,
        data: {
          ownerId: number;
          name: string;
          location?: string;
          capacity?: number;
          loginUsername: string;
          loginPassword: string;
        }
      ) => {
        const session = requireOwner();
        if (session.id !== data.ownerId) throw new Error("Access denied");

        const parsed = farmSchema
          .omit({ id: true })
          .safeParse({
            ownerId: data.ownerId,
            name: data.name,
            location: data.location,
            capacity: data.capacity,
            loginUsername: data.loginUsername,
            loginPasswordHash: "placeholder",
            isActive: 1,
          });
        if (!parsed.success) throw new Error(parsed.error.message);

        const existingName = await FarmModel.findOne({
          ownerId: data.ownerId,
          name: data.name,
        }).lean();
        if (existingName) throw new Error("A farm with this name already exists");

        const existingUsername = await FarmModel.findOne({
          loginUsername: data.loginUsername,
        }).lean();
        if (existingUsername) throw new Error("This username is already taken");

        const hash = bcrypt.hashSync(data.loginPassword, 10);
        const created = (await createWithId("farms", FarmModel as any, {
          ownerId: data.ownerId,
          name: data.name,
          location: data.location,
          capacity: data.capacity,
          loginUsername: data.loginUsername,
          loginPasswordHash: hash,
          isActive: 1,
        })) as any;

        const obj = toPlain<any>(created);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { loginPasswordHash: _lph, _id, __v, ...safe } = obj;
        return safe;
      }
    )
  );

  ipcMain.handle(
    "farms:getAll",
    wrapHandler(async (_e: unknown, ownerId: number) => {
      const session = requireOwner();
      if (session.id !== ownerId) throw new Error("Access denied");
      const results = await FarmModel.find({ ownerId }).lean();
      return results.map((f: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { loginPasswordHash: _lph, _id, __v, ...safe } = f;
        return safe;
      });
    })
  );

  ipcMain.handle(
    "farms:getById",
    wrapHandler(async (_e: unknown, id: number) => {
      requireFarmAccess(id);
      const farm = await FarmModel.findOne({ id }).lean();
      if (!farm) throw new Error("Farm not found");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { loginPasswordHash: _lph, _id, __v, ...safe } = farm as any;
      return safe;
    })
  );

  ipcMain.handle(
    "farms:update",
    wrapHandler(
      async (
        _e: unknown,
        id: number,
        data: Partial<{
          name: string;
          location: string;
          capacity: number;
          loginUsername: string;
          isActive: number;
        }>
      ) => {
        requireFarmAccess(id);
        const updates: Record<string, unknown> = {};
        if (data.name !== undefined) updates.name = data.name;
        if (data.location !== undefined) updates.location = data.location;
        if (data.capacity !== undefined) updates.capacity = data.capacity;
        if (data.loginUsername !== undefined) updates.loginUsername = data.loginUsername;
        if (data.isActive !== undefined) updates.isActive = data.isActive;

        const updated = await FarmModel.findOneAndUpdate({ id }, updates, {
          new: true,
        }).lean();
        if (!updated) throw new Error("Farm not found");
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { loginPasswordHash: _lph, _id, __v, ...safe } = updated as any;
        return safe;
      }
    )
  );

  ipcMain.handle(
    "farms:delete",
    wrapHandler(async (_e: unknown, id: number) => {
      requireFarmAccess(id);
      await FarmModel.deleteOne({ id });
      return { deleted: true };
    })
  );

  ipcMain.handle(
    "farms:resetPassword",
    wrapHandler(async (_e: unknown, id: number, newPassword: string) => {
      requireFarmAccess(id);
      const hash = bcrypt.hashSync(newPassword, 10);
      const updated = await FarmModel.findOneAndUpdate(
        { id },
        { loginPasswordHash: hash },
        { new: true }
      ).lean();
      if (!updated) throw new Error("Farm not found");
      return { success: true };
    })
  );

  ipcMain.handle(
    "farms:checkUsername",
    wrapHandler(async (_e: unknown, username: string) => {
      requireAuth();
      const existing = await FarmModel.findOne({ loginUsername: username }).lean();
      return { available: !existing };
    })
  );

  // --------------------
  // Users (farm staff)
  // --------------------
  ipcMain.handle(
    "users:create",
    wrapHandler(async (_e: unknown, data: { farmId: number; name: string; role: string; password: string }) => {
      requireFarmAccess(data.farmId);
      const parsed = userSchema
        .omit({ id: true })
        .safeParse({
          farmId: data.farmId,
          name: data.name,
          role: data.role,
          passwordHash: "placeholder",
          isActive: 1,
        });
      if (!parsed.success) throw new Error(parsed.error.message);
      const hash = bcrypt.hashSync(data.password, 10);
      const created = await createWithId("users", UserModel as any, {
        farmId: data.farmId,
        name: data.name,
        role: data.role,
        passwordHash: hash,
        isActive: 1,
      });
      const obj = toPlain<any>(created);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _ph, _id, __v, ...safe } = obj;
      return safe;
    })
  );

  ipcMain.handle(
    "users:getByFarm",
    wrapHandler(async (_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      const users = await UserModel.find({ farmId }).lean();
      return users.map((u: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash: _ph, _id, __v, ...safe } = u;
        return safe;
      });
    })
  );

  ipcMain.handle(
    "users:getById",
    wrapHandler(async (_e: unknown, id: number) => {
      requireAuth();
      const user = await UserModel.findOne({ id }).lean();
      if (!user) throw new Error("User not found");
      // Access control: if farm session, enforce same farm
      if (currentSession?.type === "farm" && currentSession.farmId && user.farmId !== currentSession.farmId) {
        throw new Error("Access denied");
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _ph, _id, __v, ...safe } = user as any;
      return safe;
    })
  );

  ipcMain.handle(
    "users:update",
    wrapHandler(async (_e: unknown, id: number, data: Partial<{ name: string; role: string; password: string; isActive: number }>) => {
      requireAuth();
      const updates: Record<string, unknown> = {};
      if (data.name !== undefined) updates.name = data.name;
      if (data.role !== undefined) updates.role = data.role;
      if (data.isActive !== undefined) updates.isActive = data.isActive;
      if (data.password !== undefined) updates.passwordHash = bcrypt.hashSync(data.password, 10);

      const updated = await UserModel.findOneAndUpdate({ id }, updates, { new: true }).lean();
      if (!updated) throw new Error("User not found");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _ph, _id, __v, ...safe } = updated as any;
      return safe;
    })
  );

  ipcMain.handle(
    "users:delete",
    wrapHandler(async (_e: unknown, id: number) => {
      requireAuth();
      await UserModel.deleteOne({ id });
      return { deleted: true };
    })
  );

  // --------------------
  // Flocks
  // --------------------
  ipcMain.handle(
    "flocks:create",
    wrapHandler(
      async (
        _e: unknown,
        data: {
          farmId: number;
          batchName: string;
          breed?: string;
          initialCount: number;
          arrivalDate: string;
          ageAtArrivalDays?: number;
          notes?: string;
        }
      ) => {
        requireFarmAccess(data.farmId);
        const parsed = flockSchema
          .omit({ id: true })
          .safeParse({
            farmId: data.farmId,
            batchName: data.batchName,
            breed: data.breed,
            initialCount: data.initialCount,
            currentCount: data.initialCount,
            arrivalDate: data.arrivalDate,
            ageAtArrivalDays: data.ageAtArrivalDays ?? 0,
            status: "active",
            notes: data.notes,
          });
        if (!parsed.success) throw new Error(parsed.error.message);
        const created = await createWithId("flocks", FlockModel as any, {
          farmId: data.farmId,
          batchName: data.batchName,
          breed: data.breed,
          initialCount: data.initialCount,
          currentCount: data.initialCount,
          arrivalDate: data.arrivalDate,
          ageAtArrivalDays: data.ageAtArrivalDays ?? 0,
          status: "active",
          notes: data.notes,
        });
        return toPlain<any>(created);
      }
    )
  );

  ipcMain.handle(
    "flocks:getByFarm",
    wrapHandler(async (_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      return await FlockModel.find({ farmId }).sort({ id: -1 }).lean();
    })
  );

  ipcMain.handle(
    "flocks:getById",
    wrapHandler(async (_e: unknown, id: number) => {
      const flock = await FlockModel.findOne({ id }).lean();
      if (!flock) throw new Error("Flock not found");
      requireFarmAccess(flock.farmId!);

      // Aggregate lifetime stats from daily entries for this flock.
      // Note: `DailyEntry.entryDate` is stored as an ISO date string (YYYY-MM-DD).
      const statsAgg = await DailyEntryModel.aggregate([
        { $match: { flockId: id } },
        {
          $group: {
            _id: null,
            totalDeaths: { $sum: { $ifNull: ["$deaths", 0] } },
            totalEggsA: { $sum: { $ifNull: ["$eggsGradeA", 0] } },
            totalEggsB: { $sum: { $ifNull: ["$eggsGradeB", 0] } },
            totalEggsCracked: { $sum: { $ifNull: ["$eggsCracked", 0] } },
            totalFeed: { $sum: { $ifNull: ["$feedConsumedKg", 0] } },
            daysTracked: { $sum: 1 },
          },
        },
      ]);
      const s = statsAgg[0] ?? {
        totalDeaths: 0,
        totalEggsA: 0,
        totalEggsB: 0,
        totalEggsCracked: 0,
        totalFeed: 0,
        daysTracked: 0,
      };
      const totalEggs = Number(s.totalEggsA ?? 0) + Number(s.totalEggsB ?? 0) + Number(s.totalEggsCracked ?? 0);

      // Last 7 days stats for production rate and UI cards.
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setHours(0, 0, 0, 0);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoISO = sevenDaysAgo.toISOString().slice(0, 10);

      const last7Agg = await DailyEntryModel.aggregate([
        { $match: { flockId: id, entryDate: { $gte: sevenDaysAgoISO } } },
        {
          $group: {
            _id: null,
            eggs: {
              $sum: {
                $add: [
                  { $ifNull: ["$eggsGradeA", 0] },
                  { $ifNull: ["$eggsGradeB", 0] },
                  { $ifNull: ["$eggsCracked", 0] },
                ],
              },
            },
            feedKg: { $sum: { $ifNull: ["$feedConsumedKg", 0] } },
            daysCount: { $sum: 1 },
          },
        },
      ]);
      const last7 = last7Agg[0] ?? { eggs: 0, feedKg: 0, daysCount: 0 };

      const initialCount = Number(flock.initialCount ?? 0);
      const totalDeaths = Number(s.totalDeaths ?? 0);
      const currentCount = Math.max(0, initialCount - totalDeaths);
      const mortalityRate = initialCount > 0 ? (totalDeaths / initialCount) * 100 : 0;

      const eggsLast7Days = Number(last7.eggs ?? 0);
      const feedLast7Days = Number(last7.feedKg ?? 0);
      const daysCount = Number(last7.daysCount ?? 0);
      const productionRate =
        daysCount > 0 && currentCount > 0 ? ((eggsLast7Days / daysCount) / currentCount) * 100 : 0;

      // Age calculation: (today - arrivalDate) + ageAtArrivalDays
      const ageAtArrivalDays = Number(flock.ageAtArrivalDays ?? 0);
      const arrival = flock.arrivalDate ? new Date(String(flock.arrivalDate)) : null;
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const daysSinceArrival =
        arrival && !Number.isNaN(arrival.getTime())
          ? Math.max(0, Math.floor((now.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24)))
          : 0;
      const ageDays = daysSinceArrival + ageAtArrivalDays;

      return {
        ...flock,
        // Ensure the detail page always has these computed fields
        ageDays,
        currentCount,
        totalDeaths,
        totalEggs,
        eggsLast7Days,
        feedLast7Days,
        mortalityRate,
        productionRate,
        avgDailyEggs: daysCount > 0 ? eggsLast7Days / daysCount : 0,
        fcr: eggsLast7Days > 0 ? feedLast7Days / eggsLast7Days : 0,
      };
    })
  );

  ipcMain.handle(
    "flocks:update",
    wrapHandler(async (_e: unknown, id: number, data: Partial<{ batchName: string; breed: string; notes: string }>) => {
      const flock = await FlockModel.findOne({ id }).lean();
      if (!flock) throw new Error("Flock not found");
      requireFarmAccess(flock.farmId!);
      const updates: Record<string, unknown> = {};
      if (data.batchName !== undefined) updates.batchName = data.batchName;
      if (data.breed !== undefined) updates.breed = data.breed;
      if (data.notes !== undefined) updates.notes = data.notes;
      const updated = await FlockModel.findOneAndUpdate({ id }, updates, { new: true }).lean();
      return updated;
    })
  );

  ipcMain.handle(
    "flocks:changeStatus",
    wrapHandler(async (_e: unknown, id: number, status: string, date: string, notes?: string) => {
      const flock = await FlockModel.findOne({ id }).lean();
      if (!flock) throw new Error("Flock not found");
      requireFarmAccess(flock.farmId!);
      const updated = await FlockModel.findOneAndUpdate(
        { id },
        { status, statusChangedDate: date, statusNotes: notes ?? null },
        { new: true }
      ).lean();
      return updated;
    })
  );

  ipcMain.handle(
    "flocks:delete",
    wrapHandler(async (_e: unknown, id: number) => {
      const flock = await FlockModel.findOne({ id }).lean();
      if (!flock) throw new Error("Flock not found");
      requireFarmAccess(flock.farmId!);
      await DailyEntryModel.deleteMany({ flockId: id });
      await VaccinationModel.deleteMany({ flockId: id });
      await FlockModel.deleteOne({ id });
      return { deleted: true };
    })
  );

  ipcMain.handle(
    "flocks:getStats",
    wrapHandler(async (_e: unknown, id: number) => {
      const flock = await FlockModel.findOne({ id }).lean();
      if (!flock) throw new Error("Flock not found");
      requireFarmAccess(flock.farmId!);

      const agg = await DailyEntryModel.aggregate([
        { $match: { flockId: id } },
        {
          $group: {
            _id: null,
            totalEggsA: { $sum: { $ifNull: ["$eggsGradeA", 0] } },
            totalEggsB: { $sum: { $ifNull: ["$eggsGradeB", 0] } },
            totalCracked: { $sum: { $ifNull: ["$eggsCracked", 0] } },
            totalDeaths: { $sum: { $ifNull: ["$deaths", 0] } },
            totalFeed: { $sum: { $ifNull: ["$feedConsumedKg", 0] } },
            daysTracked: { $sum: 1 },
          },
        },
      ]);
      const s = agg[0] ?? {
        totalEggsA: 0,
        totalEggsB: 0,
        totalCracked: 0,
        totalDeaths: 0,
        totalFeed: 0,
        daysTracked: 0,
      };
      return {
        ...s,
        totalEggs: s.totalEggsA + s.totalEggsB + s.totalCracked,
      };
    })
  );

  // --------------------
  // Daily entries
  // --------------------
  ipcMain.handle(
    "dailyEntries:create",
    wrapHandler(async (_e: unknown, data: any) => {
      // Validate input
      const parsed = dailyEntrySchema.omit({ id: true }).safeParse(data);
      if (!parsed.success) throw new Error(parsed.error.message);

      const flock = await FlockModel.findOne({ id: data.flockId }).lean();
      if (!flock) throw new Error("Flock not found");
      requireFarmAccess(flock.farmId!);

      const existing = await DailyEntryModel.findOne({
        flockId: data.flockId,
        entryDate: data.entryDate,
      }).lean();
      if (existing) throw new Error("Entry already exists for this date");

      const created = await createWithId("daily_entries", DailyEntryModel as any, {
        ...data,
        deaths: data.deaths ?? 0,
        eggsGradeA: data.eggsGradeA ?? 0,
        eggsGradeB: data.eggsGradeB ?? 0,
        eggsCracked: data.eggsCracked ?? 0,
        feedConsumedKg: data.feedConsumedKg ?? 0,
      });

      // Update flock current count (deaths)
      const deaths = Number(data.deaths ?? 0);
      if (deaths > 0) {
        await FlockModel.updateOne(
          { id: data.flockId },
          { $inc: { currentCount: -deaths } }
        );
      }

      return toPlain<any>(created);
    })
  );

  ipcMain.handle(
    "dailyEntries:update",
    wrapHandler(async (_e: unknown, id: number, data: any) => {
      const existing = await DailyEntryModel.findOne({ id }).lean();
      if (!existing) throw new Error("Daily entry not found");
      const flock = await FlockModel.findOne({ id: existing.flockId }).lean();
      if (!flock) throw new Error("Flock not found");
      requireFarmAccess(flock.farmId!);
      const updated = await DailyEntryModel.findOneAndUpdate({ id }, data, {
        new: true,
      }).lean();
      return updated;
    })
  );

  ipcMain.handle(
    "dailyEntries:delete",
    wrapHandler(async (_e: unknown, id: number) => {
      const existing = await DailyEntryModel.findOne({ id }).lean();
      if (!existing) throw new Error("Daily entry not found");
      const flock = await FlockModel.findOne({ id: existing.flockId }).lean();
      if (!flock) throw new Error("Flock not found");
      requireFarmAccess(flock.farmId!);
      await DailyEntryModel.deleteOne({ id });
      return { deleted: true };
    })
  );

  ipcMain.handle(
    "dailyEntries:getByFlockAndDate",
    wrapHandler(async (_e: unknown, flockId: number, date: string) => {
      const flock = await FlockModel.findOne({ id: flockId }).lean();
      if (!flock) throw new Error("Flock not found");
      requireFarmAccess(flock.farmId!);
      return await DailyEntryModel.findOne({ flockId, entryDate: date }).lean();
    })
  );

  ipcMain.handle(
    "dailyEntries:getByFlock",
    wrapHandler(async (_e: unknown, flockId: number, startDate?: string, endDate?: string) => {
      const flock = await FlockModel.findOne({ id: flockId }).lean();
      if (!flock) throw new Error("Flock not found");
      requireFarmAccess(flock.farmId!);
      const query: any = { flockId };
      if (startDate || endDate) {
        query.entryDate = {};
        if (startDate) query.entryDate.$gte = startDate;
        if (endDate) query.entryDate.$lte = endDate;
      }
      return await DailyEntryModel.find(query).sort({ entryDate: -1 }).lean();
    })
  );

  ipcMain.handle(
    "dailyEntries:getByFarm",
    wrapHandler(async (_e: unknown, farmId: number, date: string) => {
      requireFarmAccess(farmId);
      const flocks = await FlockModel.find({ farmId }).lean();
      const flockIds = flocks.map((f: any) => f.id);
      return await DailyEntryModel.find({ flockId: { $in: flockIds }, entryDate: date }).lean();
    })
  );

  ipcMain.handle(
    "dailyEntries:getPreviousDayStock",
    wrapHandler(async (_e: unknown, flockId: number, date: string) => {
      const flock = await FlockModel.findOne({ id: flockId }).lean();
      if (!flock) throw new Error("Flock not found");
      requireFarmAccess(flock.farmId!);
      const prev = await DailyEntryModel.find({ flockId, entryDate: { $lt: date } })
        .sort({ entryDate: -1 })
        .limit(1)
        .lean();
      return prev[0] ?? null;
    })
  );

  // --------------------
  // Egg prices
  // --------------------
  ipcMain.handle(
    "eggPrices:createBatch",
    wrapHandler(async (_e: unknown, farmId: number, prices: any[], effectiveDate: string) => {
      requireFarmAccess(farmId);
      for (const p of prices) {
        const parsed = eggPriceSchema.omit({ id: true }).safeParse({
          farmId,
          grade: p.grade,
          pricePerEgg: p.pricePerEgg,
          pricePerTray: p.pricePerTray,
          effectiveDate,
        });
        if (!parsed.success) throw new Error(parsed.error.message);
        await createWithId("egg_prices", EggPriceModel as any, parsed.data);
      }
      return { success: true };
    })
  );

  ipcMain.handle(
    "eggPrices:getCurrentPrices",
    wrapHandler(async (_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      // For each grade, pick latest by effectiveDate
      const docs = await EggPriceModel.aggregate([
        { $match: { farmId } },
        { $sort: { effectiveDate: -1, id: -1 } },
        { $group: { _id: "$grade", doc: { $first: "$$ROOT" } } },
        { $replaceRoot: { newRoot: "$doc" } },
      ]);
      return docs;
    })
  );

  ipcMain.handle(
    "eggPrices:getHistory",
    wrapHandler(async (_e: unknown, farmId: number, limit?: number) => {
      requireFarmAccess(farmId);
      return await EggPriceModel.find({ farmId }).sort({ effectiveDate: -1, id: -1 }).limit(limit ?? 50).lean();
    })
  );

  ipcMain.handle(
    "eggPrices:getPriceOnDate",
    wrapHandler(async (_e: unknown, farmId: number, date: string) => {
      requireFarmAccess(farmId);
      const docs = await EggPriceModel.find({ farmId, effectiveDate: { $lte: date } })
        .sort({ effectiveDate: -1 })
        .lean();
      return docs;
    })
  );

  // --------------------
  // Expenses
  // --------------------
  ipcMain.handle(
    "expenses:create",
    wrapHandler(async (_e: unknown, data: any) => {
      const parsed = expenseSchema.omit({ id: true }).safeParse(data);
      if (!parsed.success) throw new Error(parsed.error.message);
      requireFarmAccess(parsed.data.farmId!);
      const created = await createWithId("expenses", ExpenseModel as any, parsed.data as any);
      return toPlain<any>(created);
    })
  );

  ipcMain.handle(
    "expenses:getByFarm",
    wrapHandler(async (_e: unknown, farmId: number, filters?: any) => {
      requireFarmAccess(farmId);
      const q: any = { farmId };
      if (filters?.startDate || filters?.endDate) {
        q.expenseDate = {};
        if (filters.startDate) q.expenseDate.$gte = filters.startDate;
        if (filters.endDate) q.expenseDate.$lte = filters.endDate;
      }
      if (filters?.category) q.category = filters.category;
      if (filters?.search) {
        const re = new RegExp(filters.search, "i");
        q.$or = [{ description: re }, { supplier: re }, { category: re }];
      }
      return await ExpenseModel.find(q).sort({ expenseDate: -1, id: -1 }).lean();
    })
  );

  ipcMain.handle(
    "expenses:getById",
    wrapHandler(async (_e: unknown, id: number) => {
      requireAuth();
      const exp = await ExpenseModel.findOne({ id }).lean();
      if (!exp) throw new Error("Expense not found");
      if (currentSession?.type === "farm" && currentSession.farmId && exp.farmId !== currentSession.farmId) {
        throw new Error("Access denied");
      }
      return exp;
    })
  );

  ipcMain.handle(
    "expenses:update",
    wrapHandler(async (_e: unknown, id: number, data: any) => {
      requireAuth();
      const updated = await ExpenseModel.findOneAndUpdate({ id }, data, { new: true }).lean();
      if (!updated) throw new Error("Expense not found");
      return updated;
    })
  );

  ipcMain.handle(
    "expenses:delete",
    wrapHandler(async (_e: unknown, id: number) => {
      requireAuth();
      await ExpenseModel.deleteOne({ id });
      return { deleted: true };
    })
  );

  ipcMain.handle(
    "expenses:getSummary",
    wrapHandler(async (_e: unknown, farmId: number, startDate: string, endDate: string) => {
      requireFarmAccess(farmId);
      const rows = await ExpenseModel.aggregate([
        { $match: { farmId, expenseDate: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: "$category",
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]);
      const byCategory: Record<string, number> = {};
      let total = 0;
      let count = 0;
      for (const r of rows) {
        const category = String(r?._id ?? "");
        const rTotal = Number(r?.total ?? 0);
        const rCount = Number(r?.count ?? 0);
        if (category) byCategory[category] = rTotal;
        total += rTotal;
        count += rCount;
      }
      return { total, byCategory, count };
    })
  );

  ipcMain.handle(
    "expenses:getSuppliers",
    wrapHandler(async (_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      const suppliers = await ExpenseModel.distinct("supplier", { farmId });
      return suppliers.filter(Boolean).sort();
    })
  );

  // --------------------
  // Inventory
  // --------------------
  ipcMain.handle(
    "inventory:create",
    wrapHandler(async (_e: unknown, data: any) => {
      const parsed = inventorySchema.omit({ id: true }).safeParse(data);
      if (!parsed.success) throw new Error(parsed.error.message);
      requireFarmAccess(parsed.data.farmId!);
      const created = await createWithId("inventory", InventoryModel as any, parsed.data as any);
      return toPlain<any>(created);
    })
  );

  ipcMain.handle(
    "inventory:getByFarm",
    wrapHandler(async (_e: unknown, farmId: number, itemType?: string) => {
      requireFarmAccess(farmId);
      const q: any = { farmId };
      if (itemType) q.itemType = itemType;
      return await InventoryModel.find(q).sort({ itemName: 1 }).lean();
    })
  );

  ipcMain.handle(
    "inventory:getById",
    wrapHandler(async (_e: unknown, id: number) => {
      requireAuth();
      const item = await InventoryModel.findOne({ id }).lean();
      if (!item) throw new Error("Inventory item not found");
      requireFarmAccess(item.farmId!);
      const transactions = await InventoryTransactionModel.find({ inventoryId: id })
        .sort({ date: -1, id: -1 })
        .lean();
      return { ...item, transactions };
    })
  );

  ipcMain.handle(
    "inventory:update",
    wrapHandler(async (_e: unknown, id: number, data: any) => {
      requireAuth();
      const item = await InventoryModel.findOne({ id }).lean();
      if (!item) throw new Error("Inventory item not found");
      requireFarmAccess(item.farmId!);
      const updated = await InventoryModel.findOneAndUpdate({ id }, data, { new: true }).lean();
      return updated;
    })
  );

  ipcMain.handle(
    "inventory:delete",
    wrapHandler(async (_e: unknown, id: number) => {
      requireAuth();
      const item = await InventoryModel.findOne({ id }).lean();
      if (!item) throw new Error("Inventory item not found");
      requireFarmAccess(item.farmId!);
      await InventoryTransactionModel.deleteMany({ inventoryId: id });
      await InventoryModel.deleteOne({ id });
      return { deleted: true };
    })
  );

  ipcMain.handle(
    "inventory:addStock",
    wrapHandler(async (_e: unknown, itemId: number, data: any) => {
      requireAuth();
      const item = await InventoryModel.findOne({ id: itemId }).lean();
      if (!item) throw new Error("Inventory item not found");
      requireFarmAccess(item.farmId!);

      const txParsed = inventoryTransactionSchema.omit({ id: true }).safeParse({
        inventoryId: itemId,
        type: "add",
        quantity: data.quantity,
        date: data.date,
        supplier: data.supplier,
        cost: data.cost,
        notes: data.notes,
      });
      if (!txParsed.success) throw new Error(txParsed.error.message);

      await createWithId("inventory_transactions", InventoryTransactionModel as any, txParsed.data as any);
      await InventoryModel.updateOne(
        { id: itemId },
        {
          $inc: { quantity: Number(data.quantity ?? 0) },
          $set: { expiryDate: data.expiryDate ?? item.expiryDate ?? null, lastUpdated: new Date().toISOString() },
        }
      );
      return await InventoryModel.findOne({ id: itemId }).lean();
    })
  );

  ipcMain.handle(
    "inventory:reduceStock",
    wrapHandler(async (_e: unknown, itemId: number, data: any) => {
      requireAuth();
      const item = await InventoryModel.findOne({ id: itemId }).lean();
      if (!item) throw new Error("Inventory item not found");
      requireFarmAccess(item.farmId!);

      const txParsed = inventoryTransactionSchema.omit({ id: true }).safeParse({
        inventoryId: itemId,
        type: "reduce",
        quantity: data.quantity,
        date: data.date,
        reason: data.reason,
        notes: data.notes,
      });
      if (!txParsed.success) throw new Error(txParsed.error.message);

      await createWithId("inventory_transactions", InventoryTransactionModel as any, txParsed.data as any);
      await InventoryModel.updateOne(
        { id: itemId },
        { $inc: { quantity: -Number(data.quantity ?? 0) }, $set: { lastUpdated: new Date().toISOString() } }
      );
      return await InventoryModel.findOne({ id: itemId }).lean();
    })
  );

  ipcMain.handle(
    "inventory:getLowStockItems",
    wrapHandler(async (_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      return await InventoryModel.find({
        farmId,
        minThreshold: { $ne: null },
        $expr: { $lt: ["$quantity", "$minThreshold"] },
      }).lean();
    })
  );

  ipcMain.handle(
    "inventory:getExpiringItems",
    wrapHandler(async (_e: unknown, farmId: number, days: number) => {
      requireFarmAccess(farmId);
      const now = new Date();
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() + Number(days ?? 0));
      const cutoffStr = cutoff.toISOString().slice(0, 10);
      return await InventoryModel.find({
        farmId,
        expiryDate: { $ne: null, $lte: cutoffStr },
      }).lean();
    })
  );

  // --------------------
  // Vaccinations
  // --------------------
  ipcMain.handle(
    "vaccinations:create",
    wrapHandler(async (_e: unknown, data: any) => {
      const parsed = vaccinationSchema.omit({ id: true }).safeParse(data);
      if (!parsed.success) throw new Error(parsed.error.message);
      const flock = await FlockModel.findOne({ id: parsed.data.flockId }).lean();
      if (!flock) throw new Error("Flock not found");
      requireFarmAccess(flock.farmId!);
      const created = await createWithId("vaccinations", VaccinationModel as any, parsed.data as any);
      return toPlain<any>(created);
    })
  );

  ipcMain.handle(
    "vaccinations:getByFlock",
    wrapHandler(async (_e: unknown, flockId: number) => {
      const flock = await FlockModel.findOne({ id: flockId }).lean();
      if (!flock) throw new Error("Flock not found");
      requireFarmAccess(flock.farmId!);
      return await VaccinationModel.find({ flockId }).sort({ scheduledDate: -1, id: -1 }).lean();
    })
  );

  ipcMain.handle(
    "vaccinations:getUpcoming",
    wrapHandler(async (_e: unknown, farmId: number, days: number = 30) => {
      requireFarmAccess(farmId);
      const flocks = await FlockModel.find({ farmId }).lean();
      const flockIds = flocks.map((f: any) => f.id);
      const now = new Date();
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() + Number(days));
      const nowStr = now.toISOString().slice(0, 10);
      const cutoffStr = cutoff.toISOString().slice(0, 10);

      const vaccs = await VaccinationModel.find({
        flockId: { $in: flockIds },
        scheduledDate: { $gte: nowStr, $lte: cutoffStr },
        status: { $ne: "completed" },
      }).sort({ scheduledDate: 1 }).lean();

      const flockMap = new Map<number, any>(flocks.map((f: any) => [f.id, f]));
      return vaccs.map((v: any) => {
        const f = flockMap.get(v.flockId);
        return {
          ...v,
          flockName: f?.batchName ?? "",
          flockBreed: f?.breed ?? "",
          flockCurrentCount: f?.currentCount ?? null,
          daysUntilDue: Math.ceil((new Date(v.scheduledDate).getTime() - Date.now()) / 86400000),
          flockAgeDays: 0,
          vaccAgeDays: 0,
        };
      });
    })
  );

  ipcMain.handle(
    "vaccinations:getCompleted",
    wrapHandler(async (_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      const flocks = await FlockModel.find({ farmId }).lean();
      const flockIds = flocks.map((f: any) => f.id);
      const vaccs = await VaccinationModel.find({
        flockId: { $in: flockIds },
        status: "completed",
      }).sort({ administeredDate: -1, id: -1 }).lean();
      const flockMap = new Map<number, any>(flocks.map((f: any) => [f.id, f]));
      return vaccs.map((v: any) => ({ ...v, flockName: flockMap.get(v.flockId)?.batchName ?? "" }));
    })
  );

  ipcMain.handle(
    "vaccinations:getAll",
    wrapHandler(async (_e: unknown, farmId: number, filters?: any) => {
      requireFarmAccess(farmId);
      const flocks = await FlockModel.find({ farmId }).lean();
      const flockIds = flocks.map((f: any) => f.id);
      const q: any = { flockId: { $in: flockIds } };
      if (filters?.flockId) q.flockId = filters.flockId;
      if (filters?.status) q.status = filters.status;
      return await VaccinationModel.find(q).sort({ scheduledDate: -1, id: -1 }).lean();
    })
  );

  ipcMain.handle(
    "vaccinations:update",
    wrapHandler(async (_e: unknown, id: number, data: any) => {
      requireAuth();
      const v = await VaccinationModel.findOne({ id }).lean();
      if (!v) throw new Error("Vaccination not found");
      const flock = await FlockModel.findOne({ id: v.flockId }).lean();
      if (!flock) throw new Error("Flock not found");
      requireFarmAccess(flock.farmId!);
      const updated = await VaccinationModel.findOneAndUpdate({ id }, data, { new: true }).lean();
      return updated;
    })
  );

  ipcMain.handle(
    "vaccinations:delete",
    wrapHandler(async (_e: unknown, id: number) => {
      requireAuth();
      const v = await VaccinationModel.findOne({ id }).lean();
      if (!v) throw new Error("Vaccination not found");
      const flock = await FlockModel.findOne({ id: v.flockId }).lean();
      if (!flock) throw new Error("Flock not found");
      requireFarmAccess(flock.farmId!);
      await VaccinationModel.deleteOne({ id });
      return { deleted: true };
    })
  );

  ipcMain.handle(
    "vaccinations:complete",
    wrapHandler(async (_e: unknown, id: number, data: any) => {
      requireAuth();
      const updated = await VaccinationModel.findOneAndUpdate(
        { id },
        { ...data, status: "completed" },
        { new: true }
      ).lean();
      if (!updated) throw new Error("Vaccination not found");
      return updated;
    })
  );

  ipcMain.handle(
    "vaccinations:skip",
    wrapHandler(async (_e: unknown, id: number, data: any) => {
      requireAuth();
      const updated = await VaccinationModel.findOneAndUpdate(
        { id },
        { notes: data?.notes ?? null, status: "skipped" },
        { new: true }
      ).lean();
      if (!updated) throw new Error("Vaccination not found");
      return updated;
    })
  );

  ipcMain.handle(
    "vaccinations:reschedule",
    wrapHandler(async (_e: unknown, id: number, newDate: string) => {
      requireAuth();
      const updated = await VaccinationModel.findOneAndUpdate(
        { id },
        { scheduledDate: newDate, status: "pending" },
        { new: true }
      ).lean();
      if (!updated) throw new Error("Vaccination not found");
      return updated;
    })
  );

  ipcMain.handle(
    "vaccinations:getHistory",
    wrapHandler(async (_e: unknown, farmId: number, filters: any) => {
      requireFarmAccess(farmId);
      const flocks = await FlockModel.find({ farmId }).lean();
      const flockIds = flocks.map((f: any) => f.id);
      const q: any = { flockId: { $in: flockIds } };
      if (filters?.flockId) q.flockId = filters.flockId;
      if (filters?.status) q.status = filters.status;
      if (filters?.startDate || filters?.endDate) {
        q.scheduledDate = {};
        if (filters.startDate) q.scheduledDate.$gte = filters.startDate;
        if (filters.endDate) q.scheduledDate.$lte = filters.endDate;
      }
      if (filters?.search) {
        const re = new RegExp(filters.search, "i");
        q.$or = [{ vaccineName: re }, { administeredBy: re }, { batchNumber: re }];
      }
      const page = Number(filters?.page ?? 1);
      const pageSize = Number(filters?.pageSize ?? 25);
      const total = await VaccinationModel.countDocuments(q);
      const items = await VaccinationModel.find(q)
        .sort({ scheduledDate: -1, id: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean();
      const flockMap = new Map<number, any>(flocks.map((f: any) => [f.id, f]));
      const enriched = items.map((v: any) => {
        const f = flockMap.get(v.flockId);
        return { ...v, flockName: f?.batchName ?? "", flockBreed: f?.breed ?? "" };
      });
      return { items: enriched, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    })
  );

  ipcMain.handle(
    "vaccinations:getByFlockDetailed",
    wrapHandler(async (_e: unknown, flockId: number) => {
      const flock = await FlockModel.findOne({ id: flockId }).lean();
      if (!flock) throw new Error("Flock not found");
      requireFarmAccess(flock.farmId!);
      const vaccs = await VaccinationModel.find({ flockId }).sort({ scheduledDate: -1 }).lean();
      const total = vaccs.length;
      const completed = vaccs.filter((v: any) => v.status === "completed").length;
      const skipped = vaccs.filter((v: any) => v.status === "skipped").length;
      const overdue = vaccs.filter((v: any) => v.status === "pending" && v.scheduledDate < new Date().toISOString().slice(0, 10)).length;
      const pending = total - completed - skipped;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        flock: {
          id: flock.id,
          batchName: flock.batchName,
          breed: flock.breed,
          currentCount: flock.currentCount ?? null,
          arrivalDate: flock.arrivalDate,
          ageAtArrivalDays: flock.ageAtArrivalDays ?? null,
          status: flock.status ?? null,
        },
        vaccinations: vaccs.map((v: any) => ({
          ...v,
          vaccAgeDays: 0,
        })),
        compliance: { total, completed, skipped, overdue, pending, rate },
      };
    })
  );

  ipcMain.handle(
    "vaccinations:addCustom",
    wrapHandler(async (_e: unknown, flockId: number, data: any) => {
      const flock = await FlockModel.findOne({ id: flockId }).lean();
      if (!flock) throw new Error("Flock not found");
      requireFarmAccess(flock.farmId!);
      const created = await createWithId("vaccinations", VaccinationModel as any, {
        flockId,
        vaccineName: data.vaccineName,
        scheduledDate: data.administeredDate,
        administeredDate: data.administeredDate,
        administeredBy: data.administeredBy,
        batchNumber: data.batchNumber,
        route: data.route,
        notes: data.notes,
        status: "completed",
      });
      return toPlain<any>(created);
    })
  );

  ipcMain.handle(
    "vaccinations:getComplianceStats",
    wrapHandler(async (_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      const flocks = await FlockModel.find({ farmId }).lean();
      const flockIds = flocks.map((f: any) => f.id);
      const vaccs = await VaccinationModel.find({ flockId: { $in: flockIds } }).lean();
      const total = vaccs.length;
      const completed = vaccs.filter((v: any) => v.status === "completed").length;
      const skipped = vaccs.filter((v: any) => v.status === "skipped").length;
      const overdue = vaccs.filter((v: any) => v.status === "pending" && v.scheduledDate < new Date().toISOString().slice(0, 10)).length;
      const pending = total - completed - skipped;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      const lastCompleted = vaccs
        .filter((v: any) => v.status === "completed" && v.administeredDate)
        .sort((a: any, b: any) => (b.administeredDate || "").localeCompare(a.administeredDate || ""))[0];
      return {
        total,
        completed,
        skipped,
        overdue,
        pending,
        rate,
        lastCompletedDate: lastCompleted?.administeredDate ?? null,
        lastCompletedVaccine: lastCompleted?.vaccineName ?? null,
      };
    })
  );

  ipcMain.handle(
    "vaccinations:exportHistory",
    wrapHandler(async (_e: unknown, farmId: number, filters: any) => {
      requireFarmAccess(farmId);
      const hist = await (ipcMain as any)._invokeHandlers?.get("vaccinations:getHistory")?.(null, farmId, { ...filters, page: 1, pageSize: 100000 });
      // Fallback: query directly
      const res = await VaccinationModel.find({}).limit(0).lean(); // placeholder to keep structure
      void res;
      // Use direct query
      const flocks = await FlockModel.find({ farmId }).lean();
      const flockMap = new Map<number, any>(flocks.map((f: any) => [f.id, f]));
      const q: any = {};
      const flockIds = flocks.map((f: any) => f.id);
      q.flockId = { $in: flockIds };
      if (filters?.flockId) q.flockId = filters.flockId;
      if (filters?.status) q.status = filters.status;
      if (filters?.startDate || filters?.endDate) {
        q.scheduledDate = {};
        if (filters.startDate) q.scheduledDate.$gte = filters.startDate;
        if (filters.endDate) q.scheduledDate.$lte = filters.endDate;
      }
      const items = await VaccinationModel.find(q).sort({ scheduledDate: -1 }).lean();
      return items.map((v: any) => ({
        date: v.scheduledDate,
        flock: flockMap.get(v.flockId)?.batchName ?? "",
        vaccine: v.vaccineName,
        status: v.status,
        administeredBy: v.administeredBy ?? "",
        batchNumber: v.batchNumber ?? "",
        notes: v.notes ?? "",
      }));
    })
  );

  ipcMain.handle(
    "vaccinations:getById",
    wrapHandler(async (_e: unknown, id: number) => {
      requireAuth();
      const v = await VaccinationModel.findOne({ id }).lean();
      if (!v) throw new Error("Vaccination not found");
      return v;
    })
  );

  // --------------------
  // Vaccination schedule
  // --------------------
  ipcMain.handle(
    "vaccinationSchedule:create",
    wrapHandler(async (_e: unknown, data: any) => {
      requireAuth();
      const parsed = vaccinationScheduleSchema.omit({ id: true }).safeParse(data);
      if (!parsed.success) throw new Error(parsed.error.message);
      const created = await createWithId("vaccination_schedule", VaccinationScheduleModel as any, parsed.data as any);
      return toPlain<any>(created);
    })
  );

  ipcMain.handle(
    "vaccinationSchedule:getAll",
    wrapHandler(async () => {
      requireAuth();
      return await VaccinationScheduleModel.find({}).sort({ ageDays: 1 }).lean();
    })
  );

  ipcMain.handle(
    "vaccinationSchedule:update",
    wrapHandler(async (_e: unknown, id: number, data: any) => {
      requireAuth();
      const updated = await VaccinationScheduleModel.findOneAndUpdate({ id }, data, { new: true }).lean();
      if (!updated) throw new Error("Schedule item not found");
      return updated;
    })
  );

  ipcMain.handle(
    "vaccinationSchedule:delete",
    wrapHandler(async (_e: unknown, id: number) => {
      requireAuth();
      await VaccinationScheduleModel.deleteOne({ id });
      return { deleted: true };
    })
  );

  ipcMain.handle(
    "vaccinationSchedule:resetToDefaults",
    wrapHandler(async () => {
      requireAuth();
      await VaccinationScheduleModel.deleteMany({});
      return { success: true };
    })
  );

  ipcMain.handle(
    "vaccinationSchedule:generateForFlock",
    wrapHandler(async (_e: unknown, flockId: number) => {
      const flock = await FlockModel.findOne({ id: flockId }).lean();
      if (!flock) throw new Error("Flock not found");
      requireFarmAccess(flock.farmId!);
      const schedule = await VaccinationScheduleModel.find({}).lean();
      let count = 0;
      for (const s of schedule) {
        const created = await createWithId("vaccinations", VaccinationModel as any, {
          flockId,
          vaccineName: s.vaccineName,
          scheduledDate: flock.arrivalDate,
          status: "pending",
          route: s.route,
          notes: s.notes,
        });
        void created;
        count++;
      }
      return { count };
    })
  );

  ipcMain.handle(
    "vaccinationSchedule:applyToFlocks",
    wrapHandler(async (_e: unknown, farmId: number, flockIds: number[]) => {
      requireFarmAccess(farmId);
      const flocks = await FlockModel.find({ farmId, id: { $in: flockIds } }).lean();
      const schedule = await VaccinationScheduleModel.find({}).lean();
      let count = 0;
      for (const flock of flocks) {
        for (const s of schedule) {
          await createWithId("vaccinations", VaccinationModel as any, {
            flockId: flock.id,
            vaccineName: s.vaccineName,
            scheduledDate: flock.arrivalDate,
            status: "pending",
            route: s.route,
            notes: s.notes,
          });
          count++;
        }
      }
      return { count };
    })
  );

  // --------------------
  // Vaccines
  // --------------------
  ipcMain.handle(
    "vaccines:getByFarm",
    wrapHandler(async (_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      return await VaccineModel.find({ farmId }).sort({ name: 1 }).lean();
    })
  );

  ipcMain.handle(
    "vaccines:create",
    wrapHandler(async (_e: unknown, farmId: number, data: any) => {
      requireFarmAccess(farmId);
      const parsed = vaccineSchema.omit({ id: true }).safeParse({ farmId, ...data });
      if (!parsed.success) throw new Error(parsed.error.message);
      const created = await createWithId("vaccines", VaccineModel as any, parsed.data as any);
      return toPlain<any>(created);
    })
  );

  ipcMain.handle(
    "vaccines:update",
    wrapHandler(async (_e: unknown, id: number, data: any) => {
      requireAuth();
      const updated = await VaccineModel.findOneAndUpdate({ id }, data, { new: true }).lean();
      if (!updated) throw new Error("Vaccine not found");
      return updated;
    })
  );

  ipcMain.handle(
    "vaccines:delete",
    wrapHandler(async (_e: unknown, id: number) => {
      requireAuth();
      await VaccineModel.deleteOne({ id });
      return { deleted: true };
    })
  );

  ipcMain.handle(
    "vaccines:resetToDefaults",
    wrapHandler(async (_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      await VaccineModel.deleteMany({ farmId });
      return await VaccineModel.find({ farmId }).lean();
    })
  );

  // --------------------
  // Customers
  // --------------------
  ipcMain.handle(
    "customers:create",
    wrapHandler(async (_e: unknown, data: any) => {
      const parsed = customerSchema.omit({ id: true }).safeParse(data);
      if (!parsed.success) throw new Error(parsed.error.message);
      requireFarmAccess(parsed.data.farmId!);
      const created = await createWithId("customers", CustomerModel as any, parsed.data as any);
      return toPlain<any>(created);
    })
  );

  ipcMain.handle(
    "customers:getByFarm",
    wrapHandler(async (_e: unknown, farmId: number, filters?: any) => {
      requireFarmAccess(farmId);
      const q: any = { farmId };
      if (filters?.category) q.category = filters.category;
      if (filters?.status === "active") q.isActive = 1;
      if (filters?.status === "inactive") q.isActive = 0;
      if (filters?.search) {
        const re = new RegExp(filters.search, "i");
        q.$or = [{ name: re }, { phone: re }, { businessName: re }];
      }
      return await CustomerModel.find(q).sort({ name: 1 }).lean();
    })
  );

  ipcMain.handle(
    "customers:getById",
    wrapHandler(async (_e: unknown, id: number) => {
      requireAuth();
      const customer = await CustomerModel.findOne({ id }).lean();
      if (!customer) throw new Error("Customer not found");
      requireFarmAccess(customer.farmId!);
      const statsAgg = await SaleModel.aggregate([
        { $match: { customerId: id, isDeleted: { $ne: 1 } } },
        {
          $group: {
            _id: null,
            totalPurchases: { $sum: { $ifNull: ["$totalAmount", 0] } },
            totalPaid: { $sum: { $ifNull: ["$paidAmount", 0] } },
            balanceDue: { $sum: { $ifNull: ["$balanceDue", 0] } },
            totalOrders: { $sum: 1 },
            lastPurchaseDate: { $max: "$saleDate" },
          },
        },
      ]);
      const stats = statsAgg[0] ?? {
        totalPurchases: 0,
        totalPaid: 0,
        balanceDue: 0,
        totalOrders: 0,
        lastPurchaseDate: null,
      };
      return { ...customer, stats };
    })
  );

  ipcMain.handle(
    "customers:update",
    wrapHandler(async (_e: unknown, id: number, data: any) => {
      requireAuth();
      const cust = await CustomerModel.findOne({ id }).lean();
      if (!cust) throw new Error("Customer not found");
      requireFarmAccess(cust.farmId!);
      const updated = await CustomerModel.findOneAndUpdate({ id }, data, { new: true }).lean();
      return updated;
    })
  );

  ipcMain.handle(
    "customers:delete",
    wrapHandler(async (_e: unknown, id: number) => {
      requireAuth();
      await CustomerModel.updateOne({ id }, { isActive: 0 });
      return { deleted: true };
    })
  );

  ipcMain.handle(
    "customers:deletePermanently",
    wrapHandler(async (_e: unknown, id: number) => {
      requireAuth();
      await CustomerModel.deleteOne({ id });
      return { deleted: true };
    })
  );

  ipcMain.handle(
    "customers:search",
    wrapHandler(async (_e: unknown, farmId: number, query: string) => {
      requireFarmAccess(farmId);
      const re = new RegExp(query, "i");
      return await CustomerModel.find({ farmId, $or: [{ name: re }, { phone: re }, { businessName: re }] })
        .limit(20)
        .lean();
    })
  );

  // --------------------
  // Sales (and items/payments)
  // --------------------
  function computeSaleTotals(input: {
    items: Array<{ quantity?: unknown; unitPrice?: unknown; lineTotal?: unknown }>;
    discountType?: unknown;
    discountValue?: unknown;
    paidAmount?: unknown;
  }): {
    subtotal: number;
    discountType: string;
    discountValue: number;
    discountAmount: number;
    totalAmount: number;
    paidAmount: number;
    balanceDue: number;
    paymentStatus: "unpaid" | "partial" | "paid";
  } {
    const items = Array.isArray(input.items) ? input.items : [];
    const subtotal = items.reduce((sum, it) => {
      const qty = Number((it as any)?.quantity ?? 0);
      const unit = Number((it as any)?.unitPrice ?? 0);
      const ltRaw = (it as any)?.lineTotal;
      const lineTotal =
        ltRaw === null || ltRaw === undefined || Number.isNaN(Number(ltRaw)) ? qty * unit : Number(ltRaw);
      return sum + (Number.isFinite(lineTotal) ? lineTotal : 0);
    }, 0);

    const discountType =
      input.discountType === "percentage" || input.discountType === "fixed" ? String(input.discountType) : "none";
    const discountValue = Number(input.discountValue ?? 0);
    const discountAmount =
      discountType === "percentage"
        ? Math.max(0, (subtotal * (Number.isFinite(discountValue) ? discountValue : 0)) / 100)
        : discountType === "fixed"
          ? Math.max(0, Number.isFinite(discountValue) ? discountValue : 0)
          : 0;
    const totalAmount = Math.max(0, subtotal - discountAmount);

    const paidAmount = Math.max(0, Number(input.paidAmount ?? 0));
    const balanceDue = Math.max(0, totalAmount - paidAmount);
    const paymentStatus = balanceDue <= 0 ? "paid" : paidAmount > 0 ? "partial" : "unpaid";

    return { subtotal, discountType, discountValue: Number.isFinite(discountValue) ? discountValue : 0, discountAmount, totalAmount, paidAmount, balanceDue, paymentStatus };
  }

  ipcMain.handle(
    "sales:getNextInvoiceNumber",
    wrapHandler(async (_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      const last = await SaleModel.find({ farmId }).sort({ id: -1 }).limit(1).lean();
      const lastInvoice = last[0]?.invoiceNumber ?? "INV-0000";
      const match = /(\d+)$/.exec(lastInvoice);
      const nextNum = match ? String(Number(match[1]) + 1).padStart(match[1].length, "0") : "0001";
      return `INV-${nextNum}`;
    })
  );

  ipcMain.handle(
    "sales:create",
    wrapHandler(async (_e: unknown, data: any) => {
      const computed = computeSaleTotals({
        items: data.items ?? [],
        discountType: data.discountType,
        discountValue: data.discountValue,
        paidAmount: data.amountPaid ?? data.paidAmount,
      });
      const parsed = saleSchema.omit({ id: true }).safeParse({
        farmId: data.farmId,
        customerId: data.customerId,
        invoiceNumber: data.invoiceNumber ?? "INV-0001",
        saleDate: data.saleDate,
        dueDate: data.dueDate,
        subtotal: computed.subtotal,
        discountType: computed.discountType,
        discountValue: computed.discountValue,
        discountAmount: computed.discountAmount,
        totalAmount: computed.totalAmount,
        paidAmount: computed.paidAmount,
        balanceDue: computed.balanceDue,
        paymentStatus: computed.paymentStatus,
        notes: data.notes,
        isDeleted: 0,
      });
      if (!parsed.success) throw new Error(parsed.error.message);
      requireFarmAccess(parsed.data.farmId!);

      const createdSale = await createWithId("sales", SaleModel as any, parsed.data as any);
      const sale = toPlain<any>(createdSale);

      // Items
      for (const item of data.items ?? []) {
        const qty = Number(item.quantity ?? 0);
        const unit = Number(item.unitPrice ?? 0);
        const lineTotal = Number.isFinite(Number(item.lineTotal)) ? Number(item.lineTotal) : qty * unit;
        const itemParsed = saleItemSchema.omit({ id: true }).safeParse({
          saleId: sale.id,
          itemType: item.itemType,
          grade: item.grade,
          quantity: qty,
          unitPrice: unit,
          lineTotal,
        });
        if (!itemParsed.success) throw new Error(itemParsed.error.message);
        await createWithId("sale_items", SaleItemModel as any, itemParsed.data as any);
      }

      // Payment
      if (computed.paidAmount > 0) {
        const payParsed = salePaymentSchema.omit({ id: true }).safeParse({
          saleId: sale.id,
          amount: computed.paidAmount,
          paymentDate: data.saleDate,
          paymentMethod: data.paymentMethod ?? "cash",
          notes: null,
        });
        if (!payParsed.success) throw new Error(payParsed.error.message);
        await createWithId("sale_payments", SalePaymentModel as any, payParsed.data as any);
      }

      // Return the sale with correct calculated totals (UI expects these for summary cards)
      return { ...sale, ...computed };
    })
  );

  ipcMain.handle(
    "sales:getByFarm",
    wrapHandler(async (_e: unknown, farmId: number, filters?: any) => {
      requireFarmAccess(farmId);
      const q: any = { farmId, isDeleted: { $ne: 1 } };
      if (filters?.startDate || filters?.endDate) {
        q.saleDate = {};
        if (filters.startDate) q.saleDate.$gte = filters.startDate;
        if (filters.endDate) q.saleDate.$lte = filters.endDate;
      }
      if (filters?.customerId) q.customerId = filters.customerId;
      if (filters?.paymentStatus) q.paymentStatus = filters.paymentStatus;
      if (filters?.search) {
        const re = new RegExp(filters.search, "i");
        q.invoiceNumber = re;
      }
      const sales = await SaleModel.find(q).sort({ saleDate: -1, id: -1 }).lean();
      const customerIds = Array.from(new Set(sales.map((s: any) => s.customerId)));
      const customers = await CustomerModel.find({ id: { $in: customerIds } }).lean();
      const cmap = new Map<number, any>(customers.map((c: any) => [c.id, c]));
      return sales.map((s: any) => {
        const c = cmap.get(s.customerId);
        return {
          ...s,
          customerName: c?.name ?? "",
          customerPhone: c?.phone ?? null,
          customerBusinessName: c?.businessName ?? null,
        };
      });
    })
  );

  ipcMain.handle(
    "sales:getById",
    wrapHandler(async (_e: unknown, id: number) => {
      requireAuth();
      const sale = await SaleModel.findOne({ id }).lean();
      if (!sale) throw new Error("Sale not found");
      requireFarmAccess(sale.farmId!);
      const customer = await CustomerModel.findOne({ id: sale.customerId }).lean();
      const items = await SaleItemModel.find({ saleId: id }).lean();
      const payments = await SalePaymentModel.find({ saleId: id }).sort({ paymentDate: -1 }).lean();

      const paidAmount = payments.reduce((sum: number, p: any) => sum + Number(p.amount ?? 0), 0);
      const computed = computeSaleTotals({
        items,
        discountType: sale.discountType,
        discountValue: sale.discountValue,
        paidAmount,
      });

      // Keep the stored sale consistent so other aggregations (summary/reports) remain correct.
      const needsUpdate =
        Number(sale.subtotal ?? 0) !== computed.subtotal ||
        Number(sale.discountAmount ?? 0) !== computed.discountAmount ||
        Number(sale.totalAmount ?? 0) !== computed.totalAmount ||
        Number(sale.paidAmount ?? 0) !== computed.paidAmount ||
        Number(sale.balanceDue ?? 0) !== computed.balanceDue ||
        String(sale.paymentStatus ?? "") !== computed.paymentStatus;
      if (needsUpdate) {
        await SaleModel.updateOne(
          { id },
          {
            subtotal: computed.subtotal,
            discountType: computed.discountType,
            discountValue: computed.discountValue,
            discountAmount: computed.discountAmount,
            totalAmount: computed.totalAmount,
            paidAmount: computed.paidAmount,
            balanceDue: computed.balanceDue,
            paymentStatus: computed.paymentStatus,
          }
        );
      }

      return { ...sale, ...computed, customer, items, payments };
    })
  );

  ipcMain.handle(
    "sales:update",
    wrapHandler(async (_e: unknown, id: number, data: any) => {
      requireAuth();
      const sale = await SaleModel.findOne({ id }).lean();
      if (!sale) throw new Error("Sale not found");
      requireFarmAccess(sale.farmId!);
      const updated = await SaleModel.findOneAndUpdate({ id }, data, { new: true }).lean();
      return updated;
    })
  );

  ipcMain.handle(
    "sales:delete",
    wrapHandler(async (_e: unknown, id: number) => {
      requireAuth();
      const sale = await SaleModel.findOne({ id }).lean();
      if (!sale) throw new Error("Sale not found");
      requireFarmAccess(sale.farmId!);
      await SaleModel.updateOne({ id }, { isDeleted: 1 });
      return { deleted: true };
    })
  );

  ipcMain.handle(
    "sales:getSummary",
    wrapHandler(async (_e: unknown, farmId: number, startDate: string, endDate: string) => {
      requireFarmAccess(farmId);
      const agg = await SaleModel.aggregate([
        {
          $match: {
            farmId,
            isDeleted: { $ne: 1 },
            saleDate: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: { $ifNull: ["$totalAmount", 0] } },
            totalReceived: { $sum: { $ifNull: ["$paidAmount", 0] } },
            totalOutstanding: { $sum: { $ifNull: ["$balanceDue", 0] } },
            salesCount: { $sum: 1 },
          },
        },
      ]);
      const s = (agg[0] ?? {}) as any;
      return {
        totalSales: Number(s.totalSales ?? 0),
        totalReceived: Number(s.totalReceived ?? 0),
        totalOutstanding: Number(s.totalOutstanding ?? 0),
        salesCount: Number(s.salesCount ?? 0),
      };
    })
  );

  ipcMain.handle(
    "sales:recordPayment",
    wrapHandler(async (_e: unknown, data: any) => {
      requireAuth();
      const sale = await SaleModel.findOne({ id: data.saleId }).lean();
      if (!sale) throw new Error("Sale not found");
      requireFarmAccess(sale.farmId!);

      const payParsed = salePaymentSchema.omit({ id: true }).safeParse({
        saleId: data.saleId,
        amount: data.amount,
        paymentDate: data.paymentDate,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
      });
      if (!payParsed.success) throw new Error(payParsed.error.message);

      const payment = await createWithId("sale_payments", SalePaymentModel as any, payParsed.data as any);
      const newPaid = Number(sale.paidAmount ?? 0) + Number(data.amount ?? 0);
      const balanceDue = Math.max(0, Number(sale.totalAmount ?? 0) - newPaid);
      const paymentStatus = balanceDue <= 0 ? "paid" : newPaid > 0 ? "partial" : "unpaid";
      await SaleModel.updateOne(
        { id: data.saleId },
        { paidAmount: newPaid, balanceDue, paymentStatus }
      );
      return toPlain<any>(payment);
    })
  );

  // --------------------
  // Payments / receivables
  // --------------------
  ipcMain.handle(
    "payments:getByFarm",
    wrapHandler(async (_e: unknown, farmId: number, filters?: any) => {
      requireFarmAccess(farmId);
      // Join payments -> sale -> customer
      const q: any = {};
      if (filters?.startDate || filters?.endDate) {
        q.paymentDate = {};
        if (filters.startDate) q.paymentDate.$gte = filters.startDate;
        if (filters.endDate) q.paymentDate.$lte = filters.endDate;
      }
      if (filters?.paymentMethod) q.paymentMethod = filters.paymentMethod;
      if (filters?.search) q.notes = new RegExp(filters.search, "i");

      const payments = await SalePaymentModel.find(q).sort({ paymentDate: -1, id: -1 }).lean();
      const saleIds = Array.from(new Set(payments.map((p: any) => p.saleId)));
      const sales = await SaleModel.find({ id: { $in: saleIds }, farmId }).lean();
      const saleMap = new Map<number, any>(sales.map((s: any) => [s.id, s]));
      const customerIds = Array.from(new Set(sales.map((s: any) => s.customerId)));
      const customers = await CustomerModel.find({ id: { $in: customerIds } }).lean();
      const custMap = new Map<number, any>(customers.map((c: any) => [c.id, c]));

      return payments
        .map((p: any) => {
          const s = saleMap.get(p.saleId);
          if (!s) return null;
          const c = custMap.get(s.customerId);
          return {
            ...p,
            invoiceNumber: s.invoiceNumber,
            customerId: s.customerId,
            customerName: c?.name ?? "",
            customerBusinessName: c?.businessName ?? null,
          };
        })
        .filter(Boolean);
    })
  );

  ipcMain.handle(
    "payments:getByCustomer",
    wrapHandler(async (_e: unknown, customerId: number) => {
      requireAuth();
      const sales = await SaleModel.find({ customerId, isDeleted: { $ne: 1 } }).lean();
      const saleIds = sales.map((s: any) => s.id);
      const payments = await SalePaymentModel.find({ saleId: { $in: saleIds } }).sort({ paymentDate: -1 }).lean();
      const invMap = new Map<number, string>(sales.map((s: any) => [s.id, s.invoiceNumber]));
      return payments.map((p: any) => ({ ...p, invoiceNumber: invMap.get(p.saleId) ?? "" }));
    })
  );

  ipcMain.handle(
    "payments:delete",
    wrapHandler(async (_e: unknown, paymentId: number) => {
      requireAuth();
      const payment = await SalePaymentModel.findOne({ id: paymentId }).lean();
      if (!payment) throw new Error("Payment not found");
      const sale = await SaleModel.findOne({ id: payment.saleId }).lean();
      if (!sale) throw new Error("Sale not found");
      requireFarmAccess(sale.farmId!);
      await SalePaymentModel.deleteOne({ id: paymentId });
      const newPaid = Math.max(0, Number(sale.paidAmount ?? 0) - Number(payment.amount ?? 0));
      const balanceDue = Math.max(0, Number(sale.totalAmount ?? 0) - newPaid);
      const paymentStatus = balanceDue <= 0 ? "paid" : newPaid > 0 ? "partial" : "unpaid";
      await SaleModel.updateOne({ id: sale.id }, { paidAmount: newPaid, balanceDue, paymentStatus });
      return { deleted: true };
    })
  );

  ipcMain.handle(
    "payments:getSummary",
    wrapHandler(async (_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      const today = new Date().toISOString().slice(0, 10);
      const now = new Date();
      const week = new Date(now);
      week.setDate(week.getDate() + 7);
      const month = new Date(now);
      month.setMonth(month.getMonth() + 1);
      const weekStr = week.toISOString().slice(0, 10);
      const monthStr = month.toISOString().slice(0, 10);

      const sales = await SaleModel.find({ farmId, isDeleted: { $ne: 1 } }).lean();
      const totalReceivables = sales.reduce((s: number, x: any) => s + Number(x.balanceDue ?? 0), 0);
      const overdue = sales.filter((x: any) => x.dueDate && x.dueDate < today && Number(x.balanceDue ?? 0) > 0);
      const dueThisWeek = sales.filter((x: any) => x.dueDate && x.dueDate >= today && x.dueDate <= weekStr && Number(x.balanceDue ?? 0) > 0).length;
      const dueThisMonth = sales.filter((x: any) => x.dueDate && x.dueDate >= today && x.dueDate <= monthStr && Number(x.balanceDue ?? 0) > 0).length;

      const overdueAmount = overdue.reduce((s: number, x: any) => s + Number(x.balanceDue ?? 0), 0);
      const overdueCount = overdue.length;

      const todaySalesIds = sales.map((s: any) => s.id);
      const paymentsToday = await SalePaymentModel.countDocuments({ saleId: { $in: todaySalesIds }, paymentDate: today });

      return { totalReceivables, overdueAmount, overdueCount, dueThisWeek, dueThisMonth, paymentsToday };
    })
  );

  ipcMain.handle(
    "receivables:getByFarm",
    wrapHandler(async (_e: unknown, farmId: number, filter?: string) => {
      requireFarmAccess(farmId);
      const today = new Date().toISOString().slice(0, 10);
      let sales = await SaleModel.find({ farmId, isDeleted: { $ne: 1 }, balanceDue: { $gt: 0 } })
        .sort({ dueDate: 1, saleDate: -1 })
        .lean();
      if (filter === "overdue") sales = sales.filter((s: any) => s.dueDate && s.dueDate < today);
      if (filter === "due_soon") {
        const soon = new Date();
        soon.setDate(soon.getDate() + 7);
        const soonStr = soon.toISOString().slice(0, 10);
        sales = sales.filter((s: any) => s.dueDate && s.dueDate >= today && s.dueDate <= soonStr);
      }
      const customerIds = Array.from(new Set(sales.map((s: any) => s.customerId)));
      const customers = await CustomerModel.find({ id: { $in: customerIds } }).lean();
      const cmap = new Map<number, any>(customers.map((c: any) => [c.id, c]));
      return sales.map((s: any) => {
        const c = cmap.get(s.customerId);
        const isOverdue = !!(s.dueDate && s.dueDate < today);
        const daysOverdue = isOverdue ? Math.ceil((Date.now() - new Date(s.dueDate).getTime()) / 86400000) : 0;
        const isDueSoon = !!(s.dueDate && s.dueDate >= today && s.dueDate <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
        return {
          id: s.id,
          invoiceNumber: s.invoiceNumber,
          saleDate: s.saleDate,
          dueDate: s.dueDate ?? null,
          totalAmount: Number(s.totalAmount ?? 0),
          paidAmount: Number(s.paidAmount ?? 0),
          balanceDue: Number(s.balanceDue ?? 0),
          paymentStatus: s.paymentStatus ?? "unpaid",
          customerId: s.customerId,
          customerName: c?.name ?? "",
          customerPhone: c?.phone ?? null,
          customerBusinessName: c?.businessName ?? null,
          isOverdue,
          daysOverdue,
          isDueSoon,
        };
      });
    })
  );

  ipcMain.handle(
    "receivables:getByCustomer",
    wrapHandler(async (_e: unknown, customerId: number) => {
      requireAuth();
      const customer = await CustomerModel.findOne({ id: customerId }).lean();
      if (!customer) throw new Error("Customer not found");
      requireFarmAccess(customer.farmId!);
      return await SaleModel.find({ customerId, isDeleted: { $ne: 1 }, balanceDue: { $gt: 0 } })
        .sort({ dueDate: 1 })
        .lean();
    })
  );

  // --------------------
  // Revenue / financial / dashboard / alerts / reports / owner
  // (Kept functional with aggregate-based computations)
  // --------------------
  ipcMain.handle(
    "revenue:getDailySummary",
    wrapHandler(async (_e: unknown, farmId: number, startDate: string, endDate: string) => {
      requireFarmAccess(farmId);
      const agg = await SaleModel.aggregate([
        { $match: { farmId, isDeleted: { $ne: 1 }, saleDate: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: "$saleDate",
            salesCount: { $sum: 1 },
            totalAmount: { $sum: { $ifNull: ["$totalAmount", 0] } },
            collectedAmount: { $sum: { $ifNull: ["$paidAmount", 0] } },
            outstanding: { $sum: { $ifNull: ["$balanceDue", 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      return {
        daily: (agg ?? []).map((r: any) => ({
          date: String(r?._id ?? ""),
          salesCount: Number(r?.salesCount ?? 0),
          totalAmount: Number(r?.totalAmount ?? 0),
          collectedAmount: Number(r?.collectedAmount ?? 0),
          outstanding: Number(r?.outstanding ?? 0),
        })),
      };
    })
  );

  ipcMain.handle(
    "revenue:getTotalRevenue",
    wrapHandler(async (_e: unknown, farmId: number, startDate: string, endDate: string) => {
      requireFarmAccess(farmId);
      const sales = await SaleModel.find({ farmId, isDeleted: { $ne: 1 }, saleDate: { $gte: startDate, $lte: endDate } }).lean();
      const totalRevenue = sales.reduce((s: number, x: any) => s + Number(x.totalAmount ?? 0), 0);
      const totalCollected = sales.reduce((s: number, x: any) => s + Number(x.paidAmount ?? 0), 0);
      const outstanding = sales.reduce((s: number, x: any) => s + Number(x.balanceDue ?? 0), 0);
      const totalSales = sales.length;
      const byCustomerAgg = await SaleModel.aggregate([
        { $match: { farmId, isDeleted: { $ne: 1 }, saleDate: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: "$customerId", totalAmount: { $sum: "$totalAmount" }, collectedAmount: { $sum: "$paidAmount" } } },
      ]);
      const customerIds = byCustomerAgg.map((r: any) => r._id);
      const customers = await CustomerModel.find({ id: { $in: customerIds } }).lean();
      const cmap = new Map<number, any>(customers.map((c: any) => [c.id, c]));
      const byCustomer = byCustomerAgg.map((r: any) => ({
        customerId: r._id,
        customerName: cmap.get(r._id)?.name ?? "",
        totalAmount: r.totalAmount ?? 0,
        collectedAmount: r.collectedAmount ?? 0,
      }));

      const saleItemsAgg = await SaleItemModel.aggregate([
        { $match: { saleId: { $in: sales.map((s: any) => s.id) } } },
        { $group: { _id: { itemType: "$itemType", grade: "$grade" }, quantity: { $sum: "$quantity" }, revenue: { $sum: "$lineTotal" } } },
      ]);
      const byType = saleItemsAgg.map((r: any) => ({
        itemType: r._id.itemType,
        grade: r._id.grade,
        quantity: r.quantity ?? 0,
        revenue: r.revenue ?? 0,
      }));

      return { totalRevenue, totalCollected, outstanding, totalSales, byCustomer, byType };
    })
  );

  ipcMain.handle(
    "revenue:getRevenueVsExpenses",
    wrapHandler(async (_e: unknown, farmId: number, startDate: string, endDate: string) => {
      requireFarmAccess(farmId);
      const salesAgg = await SaleModel.aggregate([
        { $match: { farmId, isDeleted: { $ne: 1 }, saleDate: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, revenue: { $sum: "$totalAmount" } } },
      ]);
      const expAgg = await ExpenseModel.aggregate([
        { $match: { farmId, expenseDate: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, expenses: { $sum: "$amount" } } },
      ]);
      const s = (salesAgg[0] ?? {}) as any;
      const e = (expAgg[0] ?? {}) as any;
      const revenue = Number(s.revenue ?? 0);
      const expenses = Number(e.expenses ?? 0);
      return { revenue, expenses, profit: revenue - expenses };
    })
  );

  ipcMain.handle(
    "financial:getProfitLoss",
    wrapHandler(async (_e: unknown, farmId: number, startDate: string, endDate: string) => {
      requireFarmAccess(farmId);
      const revenueAgg = await SaleModel.aggregate([
        { $match: { farmId, isDeleted: { $ne: 1 }, saleDate: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ["$totalAmount", 0] } },
            totalCollected: { $sum: { $ifNull: ["$paidAmount", 0] } },
            outstanding: { $sum: { $ifNull: ["$balanceDue", 0] } },
            salesCount: { $sum: 1 },
            customersServed: { $addToSet: "$customerId" },
          },
        },
      ]);
      const expAgg = await ExpenseModel.aggregate([
        { $match: { farmId, expenseDate: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: "$category", amount: { $sum: "$amount" } } },
      ]);
      const rev = (revenueAgg[0] ?? {}) as any;
      const byCategory: Record<string, number> = {};
      let expTotal = 0;
      for (const r of expAgg) {
        const category = String(r?._id ?? "");
        const amount = Number(r?.amount ?? 0);
        if (category) byCategory[category] = amount;
        expTotal += amount;
      }
      const revTotal = Number(rev.total ?? 0);
      const revCollected = Number(rev.totalCollected ?? 0);
      const revOutstanding = Number(rev.outstanding ?? 0);
      const revSalesCount = Number(rev.salesCount ?? 0);
      const customersServed = Array.isArray(rev.customersServed) ? rev.customersServed.length : 0;
      const profit = revTotal - expTotal;
      const margin = revTotal ? profit / revTotal : 0;
      return {
        revenue: {
          total: revTotal,
          totalCollected: revCollected,
          outstanding: revOutstanding,
          salesCount: revSalesCount,
          collectionRate: revTotal ? revCollected / revTotal : 0,
          customersServed,
          byCustomer: [],
          byProduct: [],
        },
        expenses: { byCategory, total: expTotal },
        profit,
        margin,
      };
    })
  );

  ipcMain.handle(
    "financial:getFinancialTrends",
    wrapHandler(async (_e: unknown, farmId: number, startDate: string, endDate: string, groupBy: string) => {
      requireFarmAccess(farmId);
      const groupField = groupBy === "month" ? { $substr: ["$saleDate", 0, 7] } : "$saleDate";
      const revAgg = await SaleModel.aggregate([
        { $match: { farmId, isDeleted: { $ne: 1 }, saleDate: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: groupField, revenue: { $sum: "$totalAmount" } } },
      ]);
      const expGroupField = groupBy === "month" ? { $substr: ["$expenseDate", 0, 7] } : "$expenseDate";
      const expAgg = await ExpenseModel.aggregate([
        { $match: { farmId, expenseDate: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: expGroupField, expenses: { $sum: "$amount" } } },
      ]);
      const map = new Map<string, any>();
      for (const r of revAgg) map.set(String(r._id), { period: String(r._id), revenue: r.revenue ?? 0, expenses: 0, profit: 0 });
      for (const e of expAgg) {
        const key = String(e._id);
        const cur = map.get(key) ?? { period: key, revenue: 0, expenses: 0, profit: 0 };
        cur.expenses = Number(e?.expenses ?? 0);
        map.set(key, cur);
      }
      const out = Array.from(map.values()).map((x) => ({ ...x, profit: x.revenue - x.expenses }));
      out.sort((a, b) => a.period.localeCompare(b.period));
      return out;
    })
  );

  ipcMain.handle(
    "financial:getPerBirdMetrics",
    wrapHandler(async (_e: unknown, farmId: number, startDate: string, endDate: string) => {
      requireFarmAccess(farmId);
      const flocks = await FlockModel.find({ farmId, status: "active" }).lean();
      const avgBirds = flocks.reduce((s: number, f: any) => s + Number(f.currentCount ?? 0), 0);
      const revAgg = await SaleModel.aggregate([
        { $match: { farmId, isDeleted: { $ne: 1 }, saleDate: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, revenue: { $sum: "$totalAmount" } } },
      ]);
      const expAgg = await ExpenseModel.aggregate([
        { $match: { farmId, expenseDate: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, expenses: { $sum: "$amount" } } },
      ]);
      const r = (revAgg[0] ?? {}) as any;
      const e = (expAgg[0] ?? {}) as any;
      const revenue = Number(r.revenue ?? 0);
      const expenses = Number(e.expenses ?? 0);
      const denom = avgBirds || 1;
      return {
        avgBirds,
        revenuePerBird: revenue / denom,
        expensePerBird: expenses / denom,
        profitPerBird: (revenue - expenses) / denom,
      };
    })
  );

  ipcMain.handle(
    "financial:getPerEggMetrics",
    wrapHandler(async (_e: unknown, farmId: number, startDate: string, endDate: string) => {
      requireFarmAccess(farmId);
      const flocks = await FlockModel.find({ farmId }).lean();
      const flockIds = flocks.map((f: any) => f.id);
      const entries = await DailyEntryModel.find({ flockId: { $in: flockIds }, entryDate: { $gte: startDate, $lte: endDate } }).lean();
      const totalEggs = entries.reduce((s: number, e: any) => s + Number(e.eggsGradeA ?? 0) + Number(e.eggsGradeB ?? 0) + Number(e.eggsCracked ?? 0), 0);
      const revAgg = await SaleModel.aggregate([
        { $match: { farmId, isDeleted: { $ne: 1 }, saleDate: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, revenue: { $sum: "$totalAmount" } } },
      ]);
      const expAgg = await ExpenseModel.aggregate([
        { $match: { farmId, expenseDate: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, expenses: { $sum: "$amount" } } },
      ]);
      const r = (revAgg[0] ?? {}) as any;
      const e = (expAgg[0] ?? {}) as any;
      const revenue = Number(r.revenue ?? 0);
      const expenses = Number(e.expenses ?? 0);
      const denom = totalEggs || 1;
      return {
        totalEggs,
        revenuePerEgg: revenue / denom,
        costPerEgg: expenses / denom,
        profitPerEgg: (revenue - expenses) / denom,
      };
    })
  );

  ipcMain.handle(
    "alerts:getAll",
    wrapHandler(async (_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      // Low stock + expiring + vaccination due + payment alerts
      const alerts: any[] = [];
      const lowStock = await InventoryModel.find({
        farmId,
        minThreshold: { $ne: null },
        $expr: { $lt: ["$quantity", "$minThreshold"] },
      }).lean();
      for (const item of lowStock) {
        alerts.push({
          id: `low_stock_${item.id}`,
          type: "low_stock",
          severity: "warning",
          title: "Low stock",
          message: `${item.itemName} is below minimum threshold`,
          referenceId: item.id,
          createdAt: new Date().toISOString(),
          isDismissed: false,
          actionUrl: "/farm/inventory",
        });
      }

      const dismissed = await DismissedAlertModel.find({ farmId }).lean();
      const dismissedSet = new Set(dismissed.map((d: any) => `${d.alertType}_${d.referenceId}`));
      return alerts.map((a) => ({
        ...a,
        isDismissed: dismissedSet.has(`${a.type}_${a.referenceId}`),
      }));
    })
  );

  ipcMain.handle(
    "alerts:getPaymentAlerts",
    wrapHandler(async (_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      const today = new Date().toISOString().slice(0, 10);
      const soon = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
      const sales = await SaleModel.find({ farmId, isDeleted: { $ne: 1 }, balanceDue: { $gt: 0 } }).lean();
      const custIds = Array.from(new Set(sales.map((s: any) => s.customerId)));
      const customers = await CustomerModel.find({ id: { $in: custIds } }).lean();
      const cmap = new Map<number, any>(customers.map((c: any) => [c.id, c]));
      const out: any[] = [];
      for (const s of sales) {
        if (!s.dueDate) continue;
        const c = cmap.get(s.customerId);
        if (s.dueDate < today) {
          out.push({
            type: "overdue",
            priority: "critical",
            saleId: s.id,
            invoiceNumber: s.invoiceNumber,
            customerId: s.customerId,
            customerName: c?.name ?? "",
            amount: Number(s.totalAmount ?? 0),
            balanceDue: Number(s.balanceDue ?? 0),
            dueDate: s.dueDate,
            daysOverdue: Math.ceil((Date.now() - new Date(s.dueDate).getTime()) / 86400000),
          });
        } else if (s.dueDate === today) {
          out.push({
            type: "due_today",
            priority: "high",
            saleId: s.id,
            invoiceNumber: s.invoiceNumber,
            customerId: s.customerId,
            customerName: c?.name ?? "",
            amount: Number(s.totalAmount ?? 0),
            balanceDue: Number(s.balanceDue ?? 0),
            dueDate: s.dueDate,
            daysTillDue: 0,
          });
        } else if (s.dueDate <= soon) {
          out.push({
            type: "due_soon",
            priority: "warning",
            saleId: s.id,
            invoiceNumber: s.invoiceNumber,
            customerId: s.customerId,
            customerName: c?.name ?? "",
            amount: Number(s.totalAmount ?? 0),
            balanceDue: Number(s.balanceDue ?? 0),
            dueDate: s.dueDate,
            daysTillDue: Math.ceil((new Date(s.dueDate).getTime() - Date.now()) / 86400000),
          });
        }
      }
      return out;
    })
  );

  ipcMain.handle(
    "alerts:dismiss",
    wrapHandler(async (_e: unknown, farmId: number, alertType: string, referenceId: number) => {
      requireFarmAccess(farmId);
      const parsed = dismissedAlertSchema.omit({ id: true }).safeParse({ farmId, alertType, referenceId, dismissedAt: new Date().toISOString() });
      if (!parsed.success) throw new Error(parsed.error.message);
      await DismissedAlertModel.updateOne(
        { farmId, alertType, referenceId },
        { $set: { ...parsed.data, dismissedAt: new Date().toISOString() } },
        { upsert: true }
      );
      return { success: true };
    })
  );

  ipcMain.handle(
    "alerts:undismiss",
    wrapHandler(async (_e: unknown, farmId: number, alertType: string, referenceId: number) => {
      requireFarmAccess(farmId);
      await DismissedAlertModel.deleteOne({ farmId, alertType, referenceId });
      return { success: true };
    })
  );

  ipcMain.handle(
    "alerts:clearDismissed",
    wrapHandler(async (_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      await DismissedAlertModel.deleteMany({ farmId });
      return { success: true };
    })
  );

  ipcMain.handle(
    "dashboard:getFarmStats",
    wrapHandler(async (_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      const activeFlocks = await FlockModel.find({ farmId, status: "active" }).lean();
      const totalBirds = activeFlocks.reduce((s: number, f: any) => s + Number(f.currentCount ?? 0), 0);
      const totalInitialBirds = activeFlocks.reduce((s: number, f: any) => s + Number(f.initialCount ?? 0), 0);
      const today = new Date().toISOString().split("T")[0];
      const flockIds = activeFlocks.map((f: any) => f.id);

      const todayEntries = flockIds.length
        ? await DailyEntryModel.find({ flockId: { $in: flockIds }, entryDate: today }).lean()
        : [];

      const todayEggs = todayEntries.reduce(
        (s: number, e: any) =>
          s +
          Number(e.eggsGradeA ?? 0) +
          Number(e.eggsGradeB ?? 0) +
          Number(e.eggsCracked ?? 0),
        0
      );
      const todayDeaths = todayEntries.reduce((s: number, e: any) => s + Number(e.deaths ?? 0), 0);
      const todayFeedRaw = todayEntries.reduce((s: number, e: any) => s + Number(e.feedConsumedKg ?? 0), 0);
      const todayFeed = Math.round(todayFeedRaw * 100) / 100;

      const flocksWithEntriesToday = new Set<number>(todayEntries.map((e: any) => e.flockId));
      const flocksCompleted = flocksWithEntriesToday.size;
      const flocksTotal = activeFlocks.length;

      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

      const todaySales = await SaleModel.find({
        farmId,
        isDeleted: { $ne: 1 },
        saleDate: today,
      })
        .sort({ id: -1 })
        .lean();
      const todaySalesCount = todaySales.length;
      const todaySalesAmount = Math.round(todaySales.reduce((s: number, r: any) => s + Number(r.totalAmount ?? 0), 0) * 100) / 100;

      const recentSalesRaw = await SaleModel.find({ farmId, isDeleted: { $ne: 1 } })
        .sort({ saleDate: -1, id: -1 })
        .limit(5)
        .lean();
      const recentCustomerIds = Array.from(new Set(recentSalesRaw.map((s: any) => s.customerId)));
      const recentCustomers = recentCustomerIds.length
        ? await CustomerModel.find({ id: { $in: recentCustomerIds } }).lean()
        : [];
      const customerMap = new Map<number, any>(recentCustomers.map((c: any) => [c.id, c]));
      const recentSales = recentSalesRaw.map((s: any) => ({
        id: s.id,
        invoiceNumber: s.invoiceNumber,
        saleDate: s.saleDate,
        totalAmount: Number(s.totalAmount ?? 0),
        paymentStatus: s.paymentStatus ?? "unpaid",
        customerName: customerMap.get(s.customerId)?.name ?? "Unknown",
      }));

      const monthSales = await SaleModel.find({
        farmId,
        isDeleted: { $ne: 1 },
        saleDate: { $gte: monthStart, $lte: today },
      }).lean();
      const monthRevenue = Math.round(monthSales.reduce((s: number, r: any) => s + Number(r.totalAmount ?? 0), 0) * 100) / 100;

      const monthExpAgg = await ExpenseModel.aggregate([
        { $match: { farmId, expenseDate: { $gte: monthStart, $lte: today } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);
      const monthExpenses = Number((monthExpAgg[0] ?? ({} as any)).total ?? 0);
      const monthProfit = Math.round((monthRevenue - monthExpenses) * 100) / 100;

      const outstandingAgg = await SaleModel.aggregate([
        { $match: { farmId, isDeleted: { $ne: 1 }, balanceDue: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: { $ifNull: ["$balanceDue", 0] } } } },
      ]);
      const totalOutstanding = Number((outstandingAgg[0] ?? ({} as any)).total ?? 0);

      return {
        totalBirds,
        totalInitialBirds,
        activeFlockCount: activeFlocks.length,
        todayEggs,
        todayDeaths,
        todayFeed,
        flocksCompleted,
        flocksTotal,
        todaySalesCount,
        todaySalesAmount,
        monthRevenue,
        monthExpenses,
        monthProfit,
        totalOutstanding,
        recentSales,
        flocks: activeFlocks.map((f: any) => ({
          id: f.id,
          batchName: f.batchName,
          breed: f.breed ?? null,
          currentCount: Number(f.currentCount ?? 0),
          initialCount: Number(f.initialCount ?? 0),
          arrivalDate: f.arrivalDate,
          ageAtArrivalDays: Number(f.ageAtArrivalDays ?? 0),
          hasEntryToday: flocksWithEntriesToday.has(f.id),
        })),
      };
    })
  );

  ipcMain.handle(
    "dashboard:getWeeklyTrends",
    wrapHandler(async (_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const dateOffset = (d: Date, offset: number) => {
        const nd = new Date(d);
        nd.setDate(nd.getDate() + offset);
        return nd.toISOString().split("T")[0];
      };
      const thisWeekStart = dateOffset(today, -6);
      const lastWeekStart = dateOffset(today, -13);
      const lastWeekEnd = dateOffset(today, -7);

      const allFlocks = await FlockModel.find({ farmId }).lean();
      const allFlockIds = allFlocks.map((f: any) => f.id);

      const getWeekData = async (startDate: string, endDate: string) => {
        const entries = allFlockIds.length
          ? await DailyEntryModel.find({
              flockId: { $in: allFlockIds },
              entryDate: { $gte: startDate, $lte: endDate },
            }).lean()
          : [];
        const eggs = entries.reduce(
          (s: number, e: any) =>
            s +
            Number(e.eggsGradeA ?? 0) +
            Number(e.eggsGradeB ?? 0) +
            Number(e.eggsCracked ?? 0),
          0
        );
        const deaths = entries.reduce((s: number, e: any) => s + Number(e.deaths ?? 0), 0);
        const feedRaw = entries.reduce((s: number, e: any) => s + Number(e.feedConsumedKg ?? 0), 0);
        const feed = Math.round(feedRaw * 100) / 100;
        const daysWithData = new Set(entries.map((e: any) => e.entryDate)).size;
        return { eggs, deaths, feed, daysWithData };
      };

      const thisWeek = await getWeekData(thisWeekStart, todayStr);
      const lastWeek = await getWeekData(lastWeekStart, lastWeekEnd);

      const activeFlocks = await FlockModel.find({ farmId, status: "active" }).lean();
      const totalBirds = activeFlocks.reduce((s: number, f: any) => s + Number(f.currentCount ?? 0), 0);
      const totalInitial = activeFlocks.reduce((s: number, f: any) => s + Number(f.initialCount ?? 0), 0);

      const avgEggsThisWeek = thisWeek.eggs / 7;
      const avgEggsLastWeek = lastWeek.eggs / 7;

      const productionRate = totalBirds > 0 ? (thisWeek.eggs / (totalBirds * 7)) * 100 : 0;
      const dailyMortalityRate = totalBirds > 0 ? (thisWeek.deaths / (totalBirds * 7)) * 100 : 0;
      const cumulativeMortality = totalInitial > 0 ? ((totalInitial - totalBirds) / totalInitial) * 100 : 0;
      const fcr = thisWeek.eggs > 0 ? thisWeek.feed / thisWeek.eggs : 0;

      return {
        thisWeek,
        lastWeek,
        avgEggsThisWeek: Math.round(avgEggsThisWeek),
        avgEggsLastWeek: Math.round(avgEggsLastWeek),
        productionRate: Math.round(productionRate * 10) / 10,
        dailyMortalityRate: Math.round(dailyMortalityRate * 100) / 100,
        cumulativeMortality: Math.round(cumulativeMortality * 10) / 10,
        fcr: Math.round(fcr * 100) / 100,
        totalBirds,
      };
    })
  );

  ipcMain.handle(
    "dashboard:getAlerts",
    wrapHandler(async (_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      const alerts: { type: "critical" | "warning" | "info"; message: string; link?: string }[] = [];

      const inventoryItems = await InventoryModel.find({ farmId }).lean();
      for (const item of inventoryItems) {
        const min = Number(item.minThreshold ?? 0);
        if (min > 0 && Number(item.quantity ?? 0) <= min) {
          const qty = Number(item.quantity ?? 0);
          alerts.push({
            type: qty <= 0 ? "critical" : "warning",
            message: `${item.itemName}: ${
              qty <= 0 ? "Out of stock" : `Low stock (${qty} ${item.unit} remaining)`
            }`,
            link: "/farm/inventory",
          });
        }
      }

      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      const todayStr = today.toISOString().split("T")[0];
      const nextWeekStr = nextWeek.toISOString().split("T")[0];

      const activeFlocks = await FlockModel.find({ farmId, status: "active" }).lean();
      for (const flock of activeFlocks) {
        const pending = await VaccinationModel.find({
          flockId: flock.id,
          status: "pending",
          scheduledDate: { $lte: nextWeekStr },
        }).lean();
        for (const v of pending) {
          if ((v.scheduledDate ?? "") < todayStr) {
            alerts.push({
              type: "critical",
              message: `${flock.batchName}: ${v.vaccineName} overdue (was due ${new Date(
                `${v.scheduledDate}T00:00:00`
              ).toLocaleDateString()})`,
              link: `/farm/flocks/${flock.id}`,
            });
          } else {
            alerts.push({
              type: "warning",
              message: `${flock.batchName}: ${v.vaccineName} due on ${new Date(
                `${v.scheduledDate}T00:00:00`
              ).toLocaleDateString()}`,
              link: `/farm/flocks/${flock.id}`,
            });
          }
        }
      }

      const yesterdayDate = new Date(today);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayStr = yesterdayDate.toISOString().split("T")[0];
      for (const flock of activeFlocks) {
        const y = await DailyEntryModel.findOne({ flockId: flock.id, entryDate: yesterdayStr }).lean();
        const deaths = Number((y as any)?.deaths ?? 0);
        if (deaths > 0 && Number(flock.currentCount ?? 0) > 0) {
          const mortalityPct = (deaths / (Number(flock.currentCount ?? 0) + deaths)) * 100;
          if (mortalityPct > 0.3) {
            alerts.push({
              type: "critical",
              message: `${flock.batchName}: High mortality yesterday (${mortalityPct.toFixed(
                1
              )}%, ${deaths} deaths)`,
              link: `/farm/flocks/${flock.id}`,
            });
          }
        }
      }

      const paymentOutstanding = await SaleModel.find({
        farmId,
        isDeleted: { $ne: 1 },
        paymentStatus: { $ne: "paid" },
        balanceDue: { $gt: 0 },
        dueDate: { $ne: null, $lte: nextWeekStr },
      }).lean();
      const custIds = Array.from(new Set(paymentOutstanding.map((s: any) => s.customerId)));
      const customers = custIds.length ? await CustomerModel.find({ id: { $in: custIds } }).lean() : [];
      const cmap = new Map<number, any>(customers.map((c: any) => [c.id, c]));

      const todayStartMs = new Date(`${todayStr}T00:00:00`).getTime();
      for (const s of paymentOutstanding) {
        const due = String(s.dueDate ?? "");
        const bal = Number(s.balanceDue ?? 0);
        const cname = cmap.get(s.customerId)?.name ?? "Customer";
        if (due && due < todayStr) {
          const daysOver = Math.floor((todayStartMs - new Date(`${due}T00:00:00`).getTime()) / 86400000);
          alerts.push({
            type: "critical",
            message: `${cname} — ${s.invoiceNumber} overdue by ${daysOver} day${daysOver !== 1 ? "s" : ""} (PKR ${bal.toLocaleString()})`,
            link: `/farm/sales/${s.id}`,
          });
        } else if (due === todayStr) {
          alerts.push({
            type: "warning",
            message: `${cname} — ${s.invoiceNumber} due today (PKR ${bal.toLocaleString()})`,
            link: `/farm/sales/${s.id}`,
          });
        } else if (due) {
          const daysTill = Math.floor((new Date(`${due}T00:00:00`).getTime() - todayStartMs) / 86400000);
          alerts.push({
            type: "info",
            message: `${cname} — ${s.invoiceNumber} due in ${daysTill} day${daysTill !== 1 ? "s" : ""} (PKR ${bal.toLocaleString()})`,
            link: `/farm/sales/${s.id}`,
          });
        }
      }

      alerts.sort((a, b) => {
        const priority = { critical: 0, warning: 1, info: 2 } as const;
        return priority[a.type] - priority[b.type];
      });

      return alerts;
    })
  );

  ipcMain.handle(
    "dashboard:getStatHistory",
    wrapHandler(async (_e: unknown, farmId: number, statType: string, days: number) => {
      requireFarmAccess(farmId);
      const allowedDays = [7, 14, 30, 90, 180];
      const safeDays = allowedDays.includes(days) ? days : 30;
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - (safeDays - 1));
      const startStr = startDate.toISOString().split("T")[0];
      const todayStr = today.toISOString().split("T")[0];

      const activeFlocks = await FlockModel.find({ farmId, status: "active" }).lean();
      const flockIds = activeFlocks.map((f: any) => f.id);

      // Special case: birds history based on initialCount - cumulative deaths
      if (statType === "birds") {
        const deathEntries = flockIds.length
          ? await DailyEntryModel.find({ flockId: { $in: flockIds } })
              .select({ entryDate: 1, deaths: 1, flockId: 1 })
              .lean()
          : [];

        const deathsByFlockAndDate: Record<string, Record<string, number>> = {};
        for (const e of deathEntries) {
          const fid = String((e as any).flockId);
          const date = String((e as any).entryDate);
          if (!deathsByFlockAndDate[fid]) deathsByFlockAndDate[fid] = {};
          deathsByFlockAndDate[fid][date] = (deathsByFlockAndDate[fid][date] || 0) + Number((e as any).deaths ?? 0);
        }

        const result: { date: string; value: number }[] = [];
        const d = new Date(startDate);
        while (d <= today) {
          const ds = d.toISOString().split("T")[0];
          let totalBirds = 0;
          for (const flock of activeFlocks) {
            const arrivalDate = String((flock as any).arrivalDate ?? (flock as any).createdAt?.split("T")[0] ?? "");
            if (arrivalDate && arrivalDate > ds) continue;
            let deathsUpToDate = 0;
            const flockDeaths = deathsByFlockAndDate[String(flock.id)] || {};
            for (const [deathDate, count] of Object.entries(flockDeaths)) {
              if (deathDate <= ds) deathsUpToDate += count;
            }
            totalBirds += Math.max(0, Number((flock as any).initialCount ?? 0) - deathsUpToDate);
          }
          result.push({ date: ds, value: totalBirds });
          d.setDate(d.getDate() + 1);
        }
        return result;
      }

      const entries = flockIds.length
        ? await DailyEntryModel.find({
            flockId: { $in: flockIds },
            entryDate: { $gte: startStr, $lte: todayStr },
          }).lean()
        : [];

      const byDate: Record<string, number> = {};
      for (const e of entries) {
        const ds = String((e as any).entryDate);
        if (!byDate[ds]) byDate[ds] = 0;
        if (statType === "eggs") {
          byDate[ds] +=
            Number((e as any).eggsGradeA ?? 0) +
            Number((e as any).eggsGradeB ?? 0) +
            Number((e as any).eggsCracked ?? 0);
        } else if (statType === "deaths") {
          byDate[ds] += Number((e as any).deaths ?? 0);
        } else if (statType === "feed") {
          byDate[ds] += Number((e as any).feedConsumedKg ?? 0);
        }
      }

      const result: { date: string; value: number }[] = [];
      const d = new Date(startDate);
      while (d <= today) {
        const ds = d.toISOString().split("T")[0];
        result.push({ date: ds, value: Number(byDate[ds] ?? 0) });
        d.setDate(d.getDate() + 1);
      }
      return result;
    })
  );

  ipcMain.handle(
    "reports:getDailySummary",
    wrapHandler(async (_e: unknown, farmId: number, date: string) => {
      requireFarmAccess(farmId);
      const farm = await FarmModel.findOne({ id: farmId }).lean();
      const flocks = await FlockModel.find({ farmId }).lean();
      const flockIds = flocks.map((f: any) => f.id);
      const entries = await DailyEntryModel.find({ flockId: { $in: flockIds }, entryDate: date }).lean();
      const flockMap = new Map<number, any>(flocks.map((f: any) => [f.id, f]));
      const flocksOut = entries.map((e: any) => {
        const f = flockMap.get(e.flockId);
        return {
          flockId: e.flockId,
          batchName: f?.batchName ?? "",
          breed: f?.breed ?? null,
          currentCount: f?.currentCount ?? 0,
          eggsGradeA: Number(e.eggsGradeA ?? 0),
          eggsGradeB: Number(e.eggsGradeB ?? 0),
          eggsCracked: Number(e.eggsCracked ?? 0),
          deaths: Number(e.deaths ?? 0),
          deathCause: e.deathCause ?? null,
          feedConsumedKg: Number(e.feedConsumedKg ?? 0),
          waterConsumedLiters: e.waterConsumedLiters ?? null,
          notes: e.notes ?? null,
        };
      });
      const totals = flocksOut.reduce(
        (acc: any, r: any) => {
          acc.birds += Number(r.currentCount ?? 0);
          acc.eggsGradeA += r.eggsGradeA;
          acc.eggsGradeB += r.eggsGradeB;
          acc.eggsCracked += r.eggsCracked;
          acc.eggsTotal += r.eggsGradeA + r.eggsGradeB + r.eggsCracked;
          acc.deaths += r.deaths;
          acc.feedKg += r.feedConsumedKg;
          return acc;
        },
        { birds: 0, eggsGradeA: 0, eggsGradeB: 0, eggsCracked: 0, eggsTotal: 0, deaths: 0, feedKg: 0, revenue: 0, expenses: 0 }
      );
      return { date, farm: { id: farmId, name: farm?.name ?? "", location: farm?.location ?? null }, flocks: flocksOut, totals, notes: [] };
    })
  );

  ipcMain.handle(
    "reports:getWeeklySummary",
    wrapHandler(async (_e: unknown, farmId: number, startDate: string, endDate: string) => {
      requireFarmAccess(farmId);
      const farm = await FarmModel.findOne({ id: farmId }).lean();
      const flocks = await FlockModel.find({ farmId }).lean();
      const flockIds = flocks.map((f: any) => f.id);
      const entries = await DailyEntryModel.find({ flockId: { $in: flockIds }, entryDate: { $gte: startDate, $lte: endDate } }).lean();
      const byDate = new Map<string, any>();
      for (const e of entries) {
        const d = e.entryDate;
        const cur = byDate.get(d) ?? { date: d, eggsGradeA: 0, eggsGradeB: 0, eggsCracked: 0, eggsTotal: 0, deaths: 0, feedKg: 0 };
        cur.eggsGradeA += Number(e.eggsGradeA ?? 0);
        cur.eggsGradeB += Number(e.eggsGradeB ?? 0);
        cur.eggsCracked += Number(e.eggsCracked ?? 0);
        cur.eggsTotal += Number(e.eggsGradeA ?? 0) + Number(e.eggsGradeB ?? 0) + Number(e.eggsCracked ?? 0);
        cur.deaths += Number(e.deaths ?? 0);
        cur.feedKg += Number(e.feedConsumedKg ?? 0);
        byDate.set(d, cur);
      }
      const dailyData = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
      const weeklyTotals = dailyData.reduce((a: any, d: any) => {
        a.eggsGradeA += d.eggsGradeA;
        a.eggsGradeB += d.eggsGradeB;
        a.eggsCracked += d.eggsCracked;
        a.eggsTotal += d.eggsTotal;
        a.deaths += d.deaths;
        a.feedKg += d.feedKg;
        return a;
      }, { birds: 0, eggsGradeA: 0, eggsGradeB: 0, eggsCracked: 0, eggsTotal: 0, deaths: 0, feedKg: 0 });
      const averages = {
        eggsPerDay: dailyData.length ? weeklyTotals.eggsTotal / dailyData.length : 0,
        mortalityRate: weeklyTotals.birds ? weeklyTotals.deaths / weeklyTotals.birds : 0,
        feedPerBird: weeklyTotals.birds ? weeklyTotals.feedKg / weeklyTotals.birds : 0,
      };
      const financial = { revenue: 0, expenses: 0, profit: 0 };
      return { startDate, endDate, farm: { id: farmId, name: farm?.name ?? "", location: farm?.location ?? null }, dailyData, weeklyTotals, averages, financial };
    })
  );

  ipcMain.handle(
    "reports:getMonthlySummary",
    wrapHandler(async (_e: unknown, farmId: number, month: number, year: number) => {
      requireFarmAccess(farmId);
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate = `${year}-${String(month).padStart(2, "0")}-31`;
      const farm = await FarmModel.findOne({ id: farmId }).lean();
      return {
        month,
        year,
        startDate,
        endDate,
        farm: { id: farmId, name: farm?.name ?? "", location: farm?.location ?? null },
        weeklyData: [],
        totals: { birds: 0, eggsGradeA: 0, eggsGradeB: 0, eggsCracked: 0, eggsTotal: 0, deaths: 0, feedKg: 0 },
        averages: { eggsPerDay: 0, productionRate: 0 },
        financial: { revenue: 0, expenses: 0, profit: 0, expensesByCategory: [] },
        inventory: { totalItems: 0, lowStock: 0, expiringSoon: 0 },
        vaccination: { complianceRate: 0, completed: 0, total: 0 },
      };
    })
  );

  ipcMain.handle(
    "reports:getFlockReport",
    wrapHandler(async (_e: unknown, flockId: number) => {
      const flock = await FlockModel.findOne({ id: flockId }).lean();
      if (!flock) throw new Error("Flock not found");
      requireFarmAccess(flock.farmId!);
      const farm = await FarmModel.findOne({ id: flock.farmId }).lean();
      const entries = await DailyEntryModel.find({ flockId }).sort({ entryDate: 1 }).lean();
      const stats = entries.reduce((a: any, e: any) => {
        a.totalEggsA += Number(e.eggsGradeA ?? 0);
        a.totalEggsB += Number(e.eggsGradeB ?? 0);
        a.totalCracked += Number(e.eggsCracked ?? 0);
        a.totalDeaths += Number(e.deaths ?? 0);
        a.totalFeed += Number(e.feedConsumedKg ?? 0);
        a.daysTracked += 1;
        return a;
      }, { totalEggs: 0, totalEggsA: 0, totalEggsB: 0, totalCracked: 0, totalDeaths: 0, totalFeed: 0, mortalityRate: 0, productionRate: 0, feedConversionRatio: 0, daysTracked: 0 });
      stats.totalEggs = stats.totalEggsA + stats.totalEggsB + stats.totalCracked;
      const productionCurve = entries.map((e: any) => ({
        date: e.entryDate,
        eggs: Number(e.eggsGradeA ?? 0) + Number(e.eggsGradeB ?? 0) + Number(e.eggsCracked ?? 0),
        deaths: Number(e.deaths ?? 0),
        feedKg: Number(e.feedConsumedKg ?? 0),
      }));
      const vaccs = await VaccinationModel.find({ flockId }).lean();
      const totalV = vaccs.length;
      const completed = vaccs.filter((v: any) => v.status === "completed").length;
      const complianceRate = totalV ? Math.round((completed / totalV) * 100) : 0;
      return {
        farm: { id: farm?.id ?? flock.farmId, name: farm?.name ?? "", location: farm?.location ?? null },
        flock: {
          id: flock.id,
          batchName: flock.batchName,
          breed: flock.breed ?? null,
          initialCount: flock.initialCount,
          currentCount: flock.currentCount ?? null,
          arrivalDate: flock.arrivalDate,
          ageAtArrivalDays: flock.ageAtArrivalDays ?? null,
          ageDays: 0,
          status: flock.status ?? null,
        },
        stats,
        productionCurve,
        vaccinations: {
          total: totalV,
          completed,
          complianceRate,
          records: vaccs.map((v: any) => ({ vaccineName: v.vaccineName, scheduledDate: v.scheduledDate, administeredDate: v.administeredDate ?? null, status: v.status ?? null })),
        },
      };
    })
  );

  ipcMain.handle(
    "reports:getFinancialReport",
    wrapHandler(async (_e: unknown, farmId: number, startDate: string, endDate: string) => {
      requireFarmAccess(farmId);
      const farm = await FarmModel.findOne({ id: farmId }).lean();
      const revenue = await (async () => {
        const res = await SaleModel.aggregate([
          { $match: { farmId, isDeleted: { $ne: 1 }, saleDate: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: null, total: { $sum: "$totalAmount" }, totalCollected: { $sum: "$paidAmount" }, outstanding: { $sum: "$balanceDue" }, salesCount: { $sum: 1 } } },
        ]);
        const r = res[0] ?? { total: 0, totalCollected: 0, outstanding: 0, salesCount: 0 };
        return { ...r, collectionRate: r.total ? r.totalCollected / r.total : 0, customersServed: 0, byCustomer: [], byProduct: [] };
      })();
      const expAgg = await ExpenseModel.aggregate([
        { $match: { farmId, expenseDate: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: "$category", amount: { $sum: "$amount" } } },
      ]);
      const expenses = {
        total: expAgg.reduce((s: number, r: any) => s + (r.amount ?? 0), 0),
        byCategory: expAgg.map((r: any) => ({ category: r._id, amount: r.amount ?? 0 })),
      };
      const profit = (revenue.total ?? 0) - expenses.total;
      const profitLoss = { profit, margin: revenue.total ? profit / revenue.total : 0 };
      const metrics = {
        revenuePerBird: 0,
        expensePerBird: 0,
        profitPerBird: 0,
        revenuePerEgg: 0,
        costPerEgg: 0,
        totalBirds: 0,
        totalEggs: 0,
      };
      return {
        startDate,
        endDate,
        farm: { id: farmId, name: farm?.name ?? "", location: farm?.location ?? null },
        revenue,
        expenses,
        profitLoss,
        metrics,
        dailyTrend: [],
      };
    })
  );

  // --------------------
  // Owner dashboard (owner-level aggregates)
  // --------------------
  ipcMain.handle(
    "owner:getDashboardStats",
    wrapHandler(async (_e: unknown, ownerId: number) => {
      const session = requireOwner();
      if (session.id !== ownerId) throw new Error("Access denied");
      const farms = await FarmModel.find({ ownerId }).lean();
      const farmIds = farms.map((f: any) => f.id);
      const flocks = await FlockModel.find({ farmId: { $in: farmIds }, status: "active" }).lean();
      const totalBirds = flocks.reduce((s: number, f: any) => s + Number(f.currentCount ?? 0), 0);
      const today = new Date().toISOString().slice(0, 10);
      const entries = await DailyEntryModel.find({ entryDate: today, flockId: { $in: flocks.map((f: any) => f.id) } }).lean();
      const totalEggsToday = entries.reduce((s: number, e: any) => s + Number(e.eggsGradeA ?? 0) + Number(e.eggsGradeB ?? 0) + Number(e.eggsCracked ?? 0), 0);
      return {
        totalBirds,
        totalEggsToday,
        revenueMonth: 0,
        profitMonth: 0,
        totalFarms: farms.length,
        totalBirdsChange: 0,
        totalEggsTrend: 0,
        revenueTrend: 0,
        profitTrend: 0,
      };
    })
  );

  ipcMain.handle(
    "owner:getFarmsOverview",
    wrapHandler(async (_e: unknown, ownerId: number) => {
      const session = requireOwner();
      if (session.id !== ownerId) throw new Error("Access denied");
      const farms = await FarmModel.find({ ownerId }).lean();
      const out: any[] = [];
      for (const farm of farms) {
        const flocks = await FlockModel.find({ farmId: farm.id, status: "active" }).lean();
        const totalBirds = flocks.reduce((s: number, f: any) => s + Number(f.currentCount ?? 0), 0);
        out.push({
          id: farm.id,
          name: farm.name,
          location: farm.location ?? null,
          capacity: farm.capacity ?? null,
          isActive: farm.isActive ?? 1,
          totalBirds,
          totalFlocks: flocks.length,
          eggsToday: 0,
          flocksWithEntriesToday: 0,
          productionRate: 0,
          mortalityRate: 0,
          profitMargin: 0,
          revenueMonth: 0,
          expensesMonth: 0,
          profitMonth: 0,
          performance: "good",
        });
      }
      return out;
    })
  );

  ipcMain.handle(
    "owner:getFarmComparison",
    wrapHandler(async (_e: unknown, ownerId: number, farmIds: number[], startDate: string, endDate: string) => {
      const session = requireOwner();
      if (session.id !== ownerId) throw new Error("Access denied");
      const farms = await FarmModel.find({ ownerId, id: { $in: farmIds } }).lean();
      return farms.map((f: any) => ({
        farmId: f.id,
        farmName: f.name,
        totalBirds: 0,
        avgEggsPerDay: 0,
        productionRate: 0,
        mortalityRate: 0,
        revenue: 0,
        expenses: 0,
        profit: 0,
        profitMargin: 0,
      }));
    })
  );

  ipcMain.handle(
    "owner:getConsolidatedAlerts",
    wrapHandler(async (_e: unknown, ownerId: number) => {
      const session = requireOwner();
      if (session.id !== ownerId) throw new Error("Access denied");
      return [];
    })
  );

  ipcMain.handle(
    "owner:getRecentActivity",
    wrapHandler(async (_e: unknown, ownerId: number, limit: number) => {
      const session = requireOwner();
      if (session.id !== ownerId) throw new Error("Access denied");
      return [];
    })
  );

  // --------------------
  // Backup / settings / profile / data (kept wired to existing implementation; Phase 4 will migrate backups)
  // --------------------
  ipcMain.handle(
    "backup:create",
    wrapHandler(async () => {
      const session = requireAuth();
      void session;
      return await createBackup();
    })
  );

  ipcMain.handle(
    "backup:createToPath",
    wrapHandler(async (_e: unknown, path: string) => {
      requireAuth();
      return await createBackup(path);
    })
  );

  ipcMain.handle(
    "backup:restore",
    wrapHandler(async () => {
      requireAuth();
      const result = await dialog.showOpenDialog({
        title: "Select Backup File",
        properties: ["openFile"],
        filters: [{ name: "MongoDB Backup", extensions: ["zip"] }],
      });
      if (result.canceled || !result.filePaths[0]) {
        throw new Error("Restore cancelled");
      }
      const backupPath = result.filePaths[0];
      const validation = await validateBackup(backupPath);
      if (!validation.valid) throw new Error(validation.error || "Invalid backup file");
      return { backupPath, metadata: validation.metadata };
    })
  );

  ipcMain.handle(
    "backup:confirmRestore",
    wrapHandler(async (_e: unknown, backupPath: string) => {
      requireAuth();
      const res = await restoreBackup(backupPath);
      if (!res.success) throw new Error(res.error || "Restore failed");
      return res;
    })
  );

  ipcMain.handle(
    "backup:validate",
    wrapHandler(async (_e: unknown, backupPath: string) => {
      requireAuth();
      return await validateBackup(backupPath);
    })
  );

  ipcMain.handle(
    "backup:getHistory",
    wrapHandler(async () => {
      requireAuth();
      return await listBackups();
    })
  );

  ipcMain.handle(
    "backup:delete",
    wrapHandler(async (_e: unknown, backupPath: string) => {
      requireAuth();
      await deleteBackupFile(backupPath);
      return { deleted: true, path: backupPath };
    })
  );

  ipcMain.handle(
    "backup:openFolder",
    wrapHandler(async () => {
      requireAuth();
      await openBackupFolder();
      return { opened: true, dir: getBackupDirectory() };
    })
  );

  ipcMain.handle(
    "backup:getSettings",
    wrapHandler(async () => {
      requireAuth();
      return getAutoBackupSettings();
    })
  );

  ipcMain.handle(
    "backup:saveSettings",
    wrapHandler(async (_e: unknown, settings: any) => {
      requireAuth();
      return saveAutoBackupSettings(settings);
    })
  );

  ipcMain.handle(
    "backup:runAutoBackup",
    wrapHandler(async () => {
      requireAuth();
      return runAutoBackup();
    })
  );

  ipcMain.handle(
    "backup:selectDirectory",
    wrapHandler(async () => {
      requireAuth();
      const result = await dialog.showOpenDialog({
        title: "Select Backup Directory",
        properties: ["openDirectory", "createDirectory"],
      });
      if (result.canceled || !result.filePaths[0]) {
        throw new Error("Selection cancelled");
      }
      return result.filePaths[0];
    })
  );

  ipcMain.handle(
    "settings:getAll",
    wrapHandler(async () => getAllSettings())
  );

  ipcMain.handle(
    "settings:update",
    wrapHandler(async (_e: unknown, partial: Partial<AppSettings>) => updateSettings(partial))
  );

  ipcMain.handle(
    "settings:reset",
    wrapHandler(async () => resetSettings())
  );

  ipcMain.handle(
    "profile:changePassword",
    wrapHandler(async (_e: unknown, currentPassword: string, newPassword: string) => {
      const session = requireAuth();
      if (session.type === "owner") {
        const owner = await OwnerModel.findOne({ id: session.id }).lean();
        if (!owner) throw new Error("Owner not found");
        if (!bcrypt.compareSync(currentPassword, owner.passwordHash)) throw new Error("Incorrect password");
        await OwnerModel.updateOne({ id: owner.id }, { passwordHash: bcrypt.hashSync(newPassword, 10) });
        return { success: true };
      }
      if (session.type === "farm") {
        const farm = await FarmModel.findOne({ id: session.farmId }).lean();
        if (!farm) throw new Error("Farm not found");
        if (!bcrypt.compareSync(currentPassword, farm.loginPasswordHash)) throw new Error("Incorrect password");
        await FarmModel.updateOne({ id: farm.id }, { loginPasswordHash: bcrypt.hashSync(newPassword, 10) });
        return { success: true };
      }
      throw new Error("Unsupported account type");
    })
  );

  ipcMain.handle(
    "profile:getOwnerProfile",
    wrapHandler(async () => {
      const session = requireOwner();
      const owner = await OwnerModel.findOne({ id: session.id }).lean();
      if (!owner) throw new Error("Owner not found");
      return {
        id: owner.id,
        name: owner.name,
        email: owner.email ?? null,
        phone: owner.phone ?? null,
        createdAt: (owner as any).createdAt ?? null,
        updatedAt: (owner as any).updatedAt ?? null,
      };
    })
  );

  ipcMain.handle(
    "profile:getFarmProfile",
    wrapHandler(async () => {
      const session = requireAuth();
      if (session.type !== "farm" || !session.farmId) throw new Error("Farm access required");
      const farm = await FarmModel.findOne({ id: session.farmId }).lean();
      if (!farm) throw new Error("Farm not found");
      return {
        id: farm.id,
        ownerId: farm.ownerId ?? null,
        name: farm.name,
        location: farm.location ?? null,
        capacity: farm.capacity ?? null,
        loginUsername: farm.loginUsername,
        isActive: farm.isActive ?? null,
        createdAt: (farm as any).createdAt ?? null,
      };
    })
  );

  ipcMain.handle(
    "data:getSystemInfo",
    wrapHandler(async () => {
      requireAuth();
      const dbPath = getDatabasePath();
      let dbSize = 0;
      try {
        dbSize = statSync(dbPath).size;
      } catch {}
      return {
        dbPath,
        dbSize,
        electronVersion: process.versions.electron,
        nodeVersion: process.versions.node,
        chromeVersion: process.versions.chrome,
        appVersion: app.getVersion(),
        platform: process.platform,
      };
    })
  );

  ipcMain.handle(
    "data:exportAllData",
    wrapHandler(async (_e: unknown, farmId: number, options: any) => {
      requireFarmAccess(farmId);
      const out: Record<string, unknown[]> = {};
      if (options?.includeFlocks) out.flocks = await FlockModel.find({ farmId }).lean();
      if (options?.includeEntries) {
        const flocks = await FlockModel.find({ farmId }).lean();
        out.dailyEntries = await DailyEntryModel.find({ flockId: { $in: flocks.map((f: any) => f.id) } }).lean();
      }
      if (options?.includeExpenses) out.expenses = await ExpenseModel.find({ farmId }).lean();
      if (options?.includeInventory) out.inventory = await InventoryModel.find({ farmId }).lean();
      if (options?.includeVaccinations) {
        const flocks = await FlockModel.find({ farmId }).lean();
        out.vaccinations = await VaccinationModel.find({ flockId: { $in: flocks.map((f: any) => f.id) } }).lean();
      }
      return out;
    })
  );

  ipcMain.handle(
    "data:clearDismissedAlerts",
    wrapHandler(async (_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      await DismissedAlertModel.deleteMany({ farmId });
      return { success: true };
    })
  );

  ipcMain.handle(
    "data:resetFarmData",
    wrapHandler(async (_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      await FlockModel.deleteMany({ farmId });
      await ExpenseModel.deleteMany({ farmId });
      await InventoryModel.deleteMany({ farmId });
      await CustomerModel.deleteMany({ farmId });
      await SaleModel.deleteMany({ farmId });
      return { success: true };
    })
  );

  ipcMain.handle(
    "data:deleteOwnerAccount",
    wrapHandler(async (_e: unknown, ownerId: number, password: string) => {
      const session = requireOwner();
      if (session.id !== ownerId) throw new Error("Access denied");
      const owner = await OwnerModel.findOne({ id: ownerId }).lean();
      if (!owner) throw new Error("Owner not found");
      if (!bcrypt.compareSync(password, owner.passwordHash)) throw new Error("Incorrect password");
      await OwnerModel.deleteOne({ id: ownerId });
      await FarmModel.deleteMany({ ownerId });
      currentSession = null;
      store.set("session", null);
      return { success: true };
    })
  );

  // --------------------
  // Sales Reports
  // --------------------
  ipcMain.handle(
    "salesReports:getSummary",
    wrapHandler(async (_e: unknown, farmId: number, startDate: string, endDate: string) => {
      requireFarmAccess(farmId);
      const sales = await SaleModel.find({ farmId, isDeleted: { $ne: 1 }, saleDate: { $gte: startDate, $lte: endDate } }).lean();
      const totals = {
        salesCount: sales.length,
        totalAmount: sales.reduce((s: number, x: any) => s + Number(x.totalAmount ?? 0), 0),
        totalCollected: sales.reduce((s: number, x: any) => s + Number(x.paidAmount ?? 0), 0),
        totalOutstanding: sales.reduce((s: number, x: any) => s + Number(x.balanceDue ?? 0), 0),
        averageSaleValue: sales.length ? sales.reduce((s: number, x: any) => s + Number(x.totalAmount ?? 0), 0) / sales.length : 0,
      };
      return { period: { start: startDate, end: endDate }, totals, dailyBreakdown: [], paymentMethods: [], gradeBreakdown: [] };
    })
  );

  ipcMain.handle(
    "salesReports:getCustomerHistory",
    wrapHandler(async (_e: unknown, customerId: number, startDate: string, endDate: string) => {
      requireAuth();
      const customer = await CustomerModel.findOne({ id: customerId }).lean();
      if (!customer) throw new Error("Customer not found");
      requireFarmAccess(customer.farmId!);
      const sales = await SaleModel.find({ customerId, isDeleted: { $ne: 1 }, saleDate: { $gte: startDate, $lte: endDate } }).lean();
      const saleIds = sales.map((s: any) => s.id);
      const items = await SaleItemModel.find({ saleId: { $in: saleIds } }).lean();
      const payments = await SalePaymentModel.find({ saleId: { $in: saleIds } }).lean();
      const salesOut = sales.map((s: any) => ({
        id: s.id,
        invoiceNumber: s.invoiceNumber,
        saleDate: s.saleDate,
        totalAmount: Number(s.totalAmount ?? 0),
        paidAmount: Number(s.paidAmount ?? 0),
        balanceDue: Number(s.balanceDue ?? 0),
        paymentStatus: s.paymentStatus ?? "unpaid",
        items: items.filter((i: any) => i.saleId === s.id).map((i: any) => ({
          itemType: i.itemType,
          grade: i.grade,
          quantity: Number(i.quantity ?? 0),
          unitPrice: Number(i.unitPrice ?? 0),
          lineTotal: Number(i.lineTotal ?? 0),
        })),
      }));
      const invMap = new Map<number, string>(sales.map((s: any) => [s.id, s.invoiceNumber]));
      const paymentsOut = payments.map((p: any) => ({
        id: p.id,
        saleId: p.saleId,
        invoiceNumber: invMap.get(p.saleId) ?? "",
        amount: Number(p.amount ?? 0),
        paymentDate: p.paymentDate,
        paymentMethod: p.paymentMethod ?? "cash",
      }));
      const totals = {
        totalPurchases: salesOut.reduce((s: number, x: any) => s + x.totalAmount, 0),
        totalPaid: salesOut.reduce((s: number, x: any) => s + x.paidAmount, 0),
        balanceDue: salesOut.reduce((s: number, x: any) => s + x.balanceDue, 0),
        salesCount: salesOut.length,
      };
      return {
        customer: {
          id: customer.id,
          name: customer.name,
          businessName: customer.businessName,
          phone: customer.phone,
          category: customer.category,
        },
        period: { start: startDate, end: endDate },
        totals,
        sales: salesOut,
        payments: paymentsOut,
      };
    })
  );

  ipcMain.handle(
    "salesReports:getTopCustomers",
    wrapHandler(async (_e: unknown, farmId: number, limit: number, startDate: string, endDate: string) => {
      requireFarmAccess(farmId);
      const agg = await SaleModel.aggregate([
        { $match: { farmId, isDeleted: { $ne: 1 }, saleDate: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: "$customerId", totalPurchases: { $sum: "$totalAmount" }, totalPaid: { $sum: "$paidAmount" }, balanceDue: { $sum: "$balanceDue" }, salesCount: { $sum: 1 }, lastPurchase: { $max: "$saleDate" } } },
        { $sort: { totalPurchases: -1 } },
        { $limit: limit },
      ]);
      const ids = agg.map((a: any) => a._id);
      const customers = await CustomerModel.find({ id: { $in: ids } }).lean();
      const cmap = new Map<number, any>(customers.map((c: any) => [c.id, c]));
      return agg.map((a: any, idx: number) => ({
        rank: idx + 1,
        customerId: a._id,
        customerName: cmap.get(a._id)?.name ?? "",
        businessName: cmap.get(a._id)?.businessName ?? "",
        category: cmap.get(a._id)?.category ?? "individual",
        totalPurchases: Number(a?.totalPurchases ?? 0),
        totalPaid: Number(a?.totalPaid ?? 0),
        balanceDue: Number(a?.balanceDue ?? 0),
        salesCount: Number(a?.salesCount ?? 0),
        lastPurchase: a.lastPurchase ?? "",
      }));
    })
  );

  ipcMain.handle(
    "salesReports:getSalesTrend",
    wrapHandler(async (_e: unknown, farmId: number, period: string, startDate: string, endDate: string) => {
      requireFarmAccess(farmId);
      const groupField = period === "month" ? { $substr: ["$saleDate", 0, 7] } : "$saleDate";
      const agg = await SaleModel.aggregate([
        { $match: { farmId, isDeleted: { $ne: 1 }, saleDate: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: groupField, revenue: { $sum: "$totalAmount" }, collected: { $sum: "$paidAmount" }, outstanding: { $sum: "$balanceDue" }, salesCount: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]);
      return (agg ?? []).map((a: any) => ({
        period: String(a?._id ?? ""),
        label: String(a?._id ?? ""),
        revenue: Number(a?.revenue ?? 0),
        collected: Number(a?.collected ?? 0),
        outstanding: Number(a?.outstanding ?? 0),
        salesCount: Number(a?.salesCount ?? 0),
      }));
    })
  );

  ipcMain.handle(
    "salesReports:getGradeBreakdown",
    wrapHandler(async (_e: unknown, farmId: number, startDate: string, endDate: string) => {
      requireFarmAccess(farmId);
      const sales = await SaleModel.find({ farmId, isDeleted: { $ne: 1 }, saleDate: { $gte: startDate, $lte: endDate } }).lean();
      const saleIds = sales.map((s: any) => s.id);
      const agg = await SaleItemModel.aggregate([
        { $match: { saleId: { $in: saleIds } } },
        { $group: { _id: "$grade", quantity: { $sum: "$quantity" }, amount: { $sum: "$lineTotal" } } },
      ]);
      return (agg ?? []).map((a: any) => ({
        grade: String(a?._id ?? ""),
        eggsQty: Number(a?.quantity ?? 0),
        eggsAmount: Number(a?.amount ?? 0),
        traysQty: 0,
        traysAmount: 0,
        totalAmount: Number(a?.amount ?? 0),
      }));
    })
  );
}

