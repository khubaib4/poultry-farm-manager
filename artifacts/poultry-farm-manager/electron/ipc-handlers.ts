import { ipcMain, dialog, shell, app } from "electron";
import { join } from "path";
import { eq, and, gte, lte, sql, sum, like, desc, isNotNull, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";
import Store from "electron-store";
import { getDatabase } from "./database";
import * as schema from "../drizzle/schema";
import {
  createBackup,
  restoreBackup,
  validateBackup,
  validateBackupPath,
  deleteBackupFile,
  listBackupsInDirectory,
  generateBackupFilename,
} from "./backup";
import {
  getAutoBackupSettings,
  saveAutoBackupSettings,
  runAutoBackup,
} from "./autoBackup";
import {
  getAllSettings,
  updateSettings,
  resetSettings,
} from "./settings";
import type { AppSettings } from "./settings";
import { getDatabasePath } from "./database";
import { statSync } from "fs";

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

export function registerIpcHandlers(): void {
  const db = getDatabase();

  ipcMain.handle(
    "auth:loginOwner",
    wrapHandler(async (_e: unknown, email: string, password: string) => {
      const owner = db
        .select()
        .from(schema.owners)
        .where(eq(schema.owners.email, email))
        .get();
      if (!owner) throw new Error("Invalid email or password");
      const valid = bcrypt.compareSync(password, owner.passwordHash);
      if (!valid) throw new Error("Invalid email or password");
      currentSession = { type: "owner", id: owner.id, name: owner.name };
      store.set("session", currentSession);
      return currentSession;
    })
  );

  ipcMain.handle(
    "auth:loginFarm",
    wrapHandler(async (_e: unknown, username: string, password: string) => {
      const farm = db
        .select()
        .from(schema.farms)
        .where(eq(schema.farms.loginUsername, username))
        .get();
      if (!farm) throw new Error("Invalid username or password");
      const valid = bcrypt.compareSync(password, farm.loginPasswordHash);
      if (!valid) throw new Error("Invalid username or password");
      currentSession = {
        type: "farm",
        id: farm.id,
        name: farm.name,
        farmId: farm.id,
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
    wrapHandler(() => {
      return currentSession;
    })
  );

  ipcMain.handle(
    "owners:create",
    wrapHandler((_e: unknown, data: { name: string; email?: string; phone?: string; password: string }) => {
      if (data.email) {
        const existing = db
          .select()
          .from(schema.owners)
          .where(eq(schema.owners.email, data.email))
          .get();
        if (existing) throw new Error("An account with this email already exists");
      }
      const hash = bcrypt.hashSync(data.password, 10);
      const result = db
        .insert(schema.owners)
        .values({
          name: data.name,
          email: data.email,
          phone: data.phone,
          passwordHash: hash,
        })
        .returning()
        .get();
      const { passwordHash: _, ...safe } = result;
      return safe;
    })
  );

  ipcMain.handle(
    "owners:getById",
    wrapHandler((_e: unknown, id: number) => {
      const session = requireOwner();
      if (session.id !== id) throw new Error("Access denied");
      const owner = db
        .select()
        .from(schema.owners)
        .where(eq(schema.owners.id, id))
        .get();
      if (!owner) throw new Error("Owner not found");
      const { passwordHash: _, ...safe } = owner;
      return safe;
    })
  );

  ipcMain.handle(
    "owners:update",
    wrapHandler((_e: unknown, id: number, data: Partial<{ name: string; email: string; phone: string; password: string }>) => {
      const session = requireOwner();
      if (session.id !== id) throw new Error("Access denied");
      const updates: Record<string, unknown> = {};
      if (data.name !== undefined) updates.name = data.name;
      if (data.email !== undefined) updates.email = data.email;
      if (data.phone !== undefined) updates.phone = data.phone;
      if (data.password !== undefined) updates.passwordHash = bcrypt.hashSync(data.password, 10);
      updates.updatedAt = new Date().toISOString();
      const result = db
        .update(schema.owners)
        .set(updates)
        .where(eq(schema.owners.id, id))
        .returning()
        .get();
      if (!result) throw new Error("Owner not found");
      const { passwordHash: _, ...safe } = result;
      return safe;
    })
  );

  ipcMain.handle(
    "farms:create",
    wrapHandler((_e: unknown, data: { ownerId: number; name: string; location?: string; capacity?: number; loginUsername: string; loginPassword: string }) => {
      const session = requireOwner();
      if (session.id !== data.ownerId) throw new Error("Access denied");
      const existingName = db
        .select()
        .from(schema.farms)
        .where(and(eq(schema.farms.ownerId, data.ownerId), eq(schema.farms.name, data.name)))
        .get();
      if (existingName) throw new Error("A farm with this name already exists");
      const existingUsername = db
        .select()
        .from(schema.farms)
        .where(eq(schema.farms.loginUsername, data.loginUsername))
        .get();
      if (existingUsername) throw new Error("This username is already taken");
      const hash = bcrypt.hashSync(data.loginPassword, 10);
      const result = db
        .insert(schema.farms)
        .values({
          ownerId: data.ownerId,
          name: data.name,
          location: data.location,
          capacity: data.capacity,
          loginUsername: data.loginUsername,
          loginPasswordHash: hash,
        })
        .returning()
        .get();
      const { loginPasswordHash: _, ...safe } = result;
      return safe;
    })
  );

  ipcMain.handle(
    "farms:getAll",
    wrapHandler((_e: unknown, ownerId: number) => {
      const session = requireOwner();
      if (session.id !== ownerId) throw new Error("Access denied");
      const results = db
        .select()
        .from(schema.farms)
        .where(eq(schema.farms.ownerId, ownerId))
        .all();
      return results.map(({ loginPasswordHash: _, ...safe }) => safe);
    })
  );

  ipcMain.handle(
    "farms:getById",
    wrapHandler((_e: unknown, id: number) => {
      requireFarmAccess(id);
      const farm = db
        .select()
        .from(schema.farms)
        .where(eq(schema.farms.id, id))
        .get();
      if (!farm) throw new Error("Farm not found");
      const { loginPasswordHash: _, ...safe } = farm;
      return safe;
    })
  );

  ipcMain.handle(
    "farms:update",
    wrapHandler((_e: unknown, id: number, data: Partial<{ name: string; location: string; capacity: number; loginUsername: string; isActive: number }>) => {
      requireFarmAccess(id);
      const updates: Record<string, unknown> = {};
      if (data.name !== undefined) updates.name = data.name;
      if (data.location !== undefined) updates.location = data.location;
      if (data.capacity !== undefined) updates.capacity = data.capacity;
      if (data.loginUsername !== undefined) updates.loginUsername = data.loginUsername;
      if (data.isActive !== undefined) updates.isActive = data.isActive;
      const result = db
        .update(schema.farms)
        .set(updates)
        .where(eq(schema.farms.id, id))
        .returning()
        .get();
      if (!result) throw new Error("Farm not found");
      const { loginPasswordHash: _, ...safe } = result;
      return safe;
    })
  );

  ipcMain.handle(
    "farms:delete",
    wrapHandler((_e: unknown, id: number) => {
      requireFarmAccess(id);
      db.update(schema.farms)
        .set({ isActive: 0 })
        .where(eq(schema.farms.id, id))
        .run();
      return { id };
    })
  );

  ipcMain.handle(
    "farms:resetPassword",
    wrapHandler((_e: unknown, id: number, newPassword: string) => {
      requireFarmAccess(id);
      const hash = bcrypt.hashSync(newPassword, 10);
      db.update(schema.farms)
        .set({ loginPasswordHash: hash })
        .where(eq(schema.farms.id, id))
        .run();
      return { id };
    })
  );

  ipcMain.handle(
    "farms:checkUsername",
    wrapHandler((_e: unknown, username: string) => {
      requireAuth();
      const existing = db
        .select()
        .from(schema.farms)
        .where(eq(schema.farms.loginUsername, username))
        .get();
      return { available: !existing };
    })
  );

  ipcMain.handle(
    "users:create",
    wrapHandler((_e: unknown, data: { farmId: number; name: string; role: string; password: string }) => {
      requireFarmAccess(data.farmId);
      const hash = bcrypt.hashSync(data.password, 10);
      const result = db
        .insert(schema.users)
        .values({
          farmId: data.farmId,
          name: data.name,
          role: data.role,
          passwordHash: hash,
        })
        .returning()
        .get();
      const { passwordHash: _, ...safe } = result;
      return safe;
    })
  );

  ipcMain.handle(
    "users:getByFarm",
    wrapHandler((_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      const results = db
        .select()
        .from(schema.users)
        .where(eq(schema.users.farmId, farmId))
        .all();
      return results.map(({ passwordHash: _, ...safe }) => safe);
    })
  );

  ipcMain.handle(
    "users:getById",
    wrapHandler((_e: unknown, id: number) => {
      requireAuth();
      const user = db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, id))
        .get();
      if (!user) throw new Error("User not found");
      const { passwordHash: _, ...safe } = user;
      return safe;
    })
  );

  ipcMain.handle(
    "users:update",
    wrapHandler((_e: unknown, id: number, data: Partial<{ name: string; role: string; password: string; isActive: number }>) => {
      requireAuth();
      const updates: Record<string, unknown> = {};
      if (data.name !== undefined) updates.name = data.name;
      if (data.role !== undefined) updates.role = data.role;
      if (data.password !== undefined) updates.passwordHash = bcrypt.hashSync(data.password, 10);
      if (data.isActive !== undefined) updates.isActive = data.isActive;
      const result = db
        .update(schema.users)
        .set(updates)
        .where(eq(schema.users.id, id))
        .returning()
        .get();
      if (!result) throw new Error("User not found");
      const { passwordHash: _, ...safe } = result;
      return safe;
    })
  );

  ipcMain.handle(
    "users:delete",
    wrapHandler((_e: unknown, id: number) => {
      requireAuth();
      db.update(schema.users)
        .set({ isActive: 0 })
        .where(eq(schema.users.id, id))
        .run();
      return { id };
    })
  );

  function getFlockStats(flockId: number) {
    const deathsResult = db
      .select({ total: sum(schema.dailyEntries.deaths) })
      .from(schema.dailyEntries)
      .where(eq(schema.dailyEntries.flockId, flockId))
      .get();
    const totalDeaths = Number(deathsResult?.total || 0);

    const eggsResult = db
      .select({
        gradeA: sum(schema.dailyEntries.eggsGradeA),
        gradeB: sum(schema.dailyEntries.eggsGradeB),
        cracked: sum(schema.dailyEntries.eggsCracked),
      })
      .from(schema.dailyEntries)
      .where(eq(schema.dailyEntries.flockId, flockId))
      .get();
    const totalEggs = Number(eggsResult?.gradeA || 0) + Number(eggsResult?.gradeB || 0) + Number(eggsResult?.cracked || 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];
    const recentEggsResult = db
      .select({
        gradeA: sum(schema.dailyEntries.eggsGradeA),
        gradeB: sum(schema.dailyEntries.eggsGradeB),
      })
      .from(schema.dailyEntries)
      .where(and(
        eq(schema.dailyEntries.flockId, flockId),
        gte(schema.dailyEntries.entryDate, sevenDaysAgoStr)
      ))
      .get();
    const eggsLast7Days = Number(recentEggsResult?.gradeA || 0) + Number(recentEggsResult?.gradeB || 0);

    return { totalDeaths, totalEggs, eggsLast7Days };
  }

  ipcMain.handle(
    "flocks:create",
    wrapHandler((_e: unknown, data: { farmId: number; batchName: string; breed?: string; initialCount: number; arrivalDate: string; ageAtArrivalDays?: number; notes?: string }) => {
      requireFarmAccess(data.farmId);
      const existingName = db
        .select()
        .from(schema.flocks)
        .where(and(eq(schema.flocks.farmId, data.farmId), eq(schema.flocks.batchName, data.batchName)))
        .get();
      if (existingName) throw new Error("A flock with this batch name already exists in this farm");
      const flock = db.insert(schema.flocks).values({
        farmId: data.farmId,
        batchName: data.batchName,
        breed: data.breed,
        initialCount: data.initialCount,
        currentCount: data.initialCount,
        arrivalDate: data.arrivalDate,
        ageAtArrivalDays: data.ageAtArrivalDays || 0,
        notes: data.notes,
      }).returning().get();

      const schedules = db.select().from(schema.vaccinationSchedule).all();
      for (const sched of schedules) {
        const arrivalMs = new Date(data.arrivalDate).getTime();
        const ageAtArrival = data.ageAtArrivalDays || 0;
        const daysUntilVacc = sched.ageDays - ageAtArrival;
        if (daysUntilVacc >= 0) {
          const scheduledDate = new Date(arrivalMs + daysUntilVacc * 86400000).toISOString().split("T")[0];
          db.insert(schema.vaccinations).values({
            flockId: flock.id,
            vaccineName: sched.vaccineName,
            scheduledDate,
            status: "pending",
          }).run();
        }
      }

      return flock;
    })
  );

  ipcMain.handle(
    "flocks:getByFarm",
    wrapHandler((_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      const flocksList = db
        .select()
        .from(schema.flocks)
        .where(eq(schema.flocks.farmId, farmId))
        .all();
      return flocksList.map((flock) => {
        const stats = getFlockStats(flock.id);
        const currentCount = flock.initialCount - stats.totalDeaths;
        const ageDays = Math.max(0, Math.floor((Date.now() - new Date(flock.arrivalDate).getTime()) / 86400000) + (flock.ageAtArrivalDays || 0));
        const mortalityRate = flock.initialCount > 0 ? (stats.totalDeaths / flock.initialCount) * 100 : 0;
        const productionRate = currentCount > 0 && stats.eggsLast7Days > 0 ? (stats.eggsLast7Days / (currentCount * 7)) * 100 : 0;
        return { ...flock, currentCount, ageDays, mortalityRate: Math.round(mortalityRate * 100) / 100, productionRate: Math.round(productionRate * 100) / 100, totalDeaths: stats.totalDeaths, totalEggs: stats.totalEggs, eggsLast7Days: stats.eggsLast7Days };
      });
    })
  );

  function requireFlockAccess(flockId: number) {
    const flock = db.select().from(schema.flocks).where(eq(schema.flocks.id, flockId)).get();
    if (!flock) throw new Error("Flock not found");
    requireFarmAccess(flock.farmId!);
    return flock;
  }

  function enrichFlock(flock: typeof schema.flocks.$inferSelect) {
    const stats = getFlockStats(flock.id);
    const currentCount = flock.initialCount - stats.totalDeaths;
    const ageDays = Math.max(0, Math.floor((Date.now() - new Date(flock.arrivalDate).getTime()) / 86400000) + (flock.ageAtArrivalDays || 0));
    const mortalityRate = flock.initialCount > 0 ? (stats.totalDeaths / flock.initialCount) * 100 : 0;
    const productionRate = currentCount > 0 && stats.eggsLast7Days > 0 ? (stats.eggsLast7Days / (currentCount * 7)) * 100 : 0;
    return { ...flock, currentCount, ageDays, mortalityRate: Math.round(mortalityRate * 100) / 100, productionRate: Math.round(productionRate * 100) / 100, totalDeaths: stats.totalDeaths, totalEggs: stats.totalEggs, eggsLast7Days: stats.eggsLast7Days };
  }

  ipcMain.handle(
    "flocks:getById",
    wrapHandler((_e: unknown, id: number) => {
      const flock = requireFlockAccess(id);
      return enrichFlock(flock);
    })
  );

  ipcMain.handle(
    "flocks:update",
    wrapHandler((_e: unknown, id: number, data: Partial<{ batchName: string; breed: string; notes: string }>) => {
      requireFlockAccess(id);
      const updates: Record<string, unknown> = {};
      if (data.batchName !== undefined) updates.batchName = data.batchName;
      if (data.breed !== undefined) updates.breed = data.breed;
      if (data.notes !== undefined) updates.notes = data.notes;
      if (Object.keys(updates).length === 0) throw new Error("No valid fields to update");
      const result = db
        .update(schema.flocks)
        .set(updates)
        .where(eq(schema.flocks.id, id))
        .returning()
        .get();
      if (!result) throw new Error("Flock not found");
      return result;
    })
  );

  ipcMain.handle(
    "flocks:changeStatus",
    wrapHandler((_e: unknown, id: number, status: string, date: string, notes?: string) => {
      requireFlockAccess(id);
      if (!["culled", "sold"].includes(status)) throw new Error("Invalid status. Must be 'culled' or 'sold'");
      const result = db
        .update(schema.flocks)
        .set({ status, statusChangedDate: date, statusNotes: notes || null })
        .where(eq(schema.flocks.id, id))
        .returning()
        .get();
      if (!result) throw new Error("Flock not found");
      return result;
    })
  );

  ipcMain.handle(
    "flocks:delete",
    wrapHandler((_e: unknown, id: number) => {
      requireFlockAccess(id);
      const entries = db
        .select()
        .from(schema.dailyEntries)
        .where(eq(schema.dailyEntries.flockId, id))
        .all();
      if (entries.length > 0) throw new Error("Cannot delete flock with existing daily entries. Change status to 'culled' or 'sold' instead.");
      db.delete(schema.vaccinations).where(eq(schema.vaccinations.flockId, id)).run();
      db.delete(schema.flocks).where(eq(schema.flocks.id, id)).run();
      return { id };
    })
  );

  ipcMain.handle(
    "flocks:getStats",
    wrapHandler((_e: unknown, id: number) => {
      const flock = requireFlockAccess(id);
      const stats = getFlockStats(id);
      const currentCount = flock.initialCount - stats.totalDeaths;
      const ageDays = Math.max(0, Math.floor((Date.now() - new Date(flock.arrivalDate).getTime()) / 86400000) + (flock.ageAtArrivalDays || 0));
      const mortalityRate = flock.initialCount > 0 ? (stats.totalDeaths / flock.initialCount) * 100 : 0;
      const productionRate = currentCount > 0 && stats.eggsLast7Days > 0 ? (stats.eggsLast7Days / (currentCount * 7)) * 100 : 0;
      return { currentCount, ageDays, totalDeaths: stats.totalDeaths, totalEggs: stats.totalEggs, eggsLast7Days: stats.eggsLast7Days, mortalityRate: Math.round(mortalityRate * 100) / 100, productionRate: Math.round(productionRate * 100) / 100 };
    })
  );

  function requireDailyEntryAccess(entryId: number) {
    const entry = db.select().from(schema.dailyEntries).where(eq(schema.dailyEntries.id, entryId)).get();
    if (!entry) throw new Error("Daily entry not found");
    const flock = db.select().from(schema.flocks).where(eq(schema.flocks.id, entry.flockId!)).get();
    if (!flock) throw new Error("Flock not found");
    requireFarmAccess(flock.farmId!);
    return { entry, flock };
  }

  ipcMain.handle(
    "dailyEntries:create",
    wrapHandler((_e: unknown, data: { flockId: number; entryDate: string; deaths?: number; deathCause?: string; eggsGradeA?: number; eggsGradeB?: number; eggsCracked?: number; feedConsumedKg?: number; waterConsumedLiters?: number; notes?: string }) => {
      const flock = requireFlockAccess(data.flockId);
      if (flock.status !== "active") throw new Error("Cannot add entries to a non-active flock");
      const entryDate = data.entryDate;
      if (!entryDate) throw new Error("Entry date is required");
      const today = new Date().toISOString().split("T")[0];
      if (entryDate > today) throw new Error("Cannot create entries for future dates");
      if (entryDate < flock.arrivalDate) throw new Error("Cannot create entries before flock arrival date");
      const existing = db.select().from(schema.dailyEntries).where(and(eq(schema.dailyEntries.flockId, data.flockId), eq(schema.dailyEntries.entryDate, entryDate))).get();
      if (existing) throw new Error("An entry already exists for this flock on this date");
      const deaths = data.deaths || 0;
      if (deaths < 0) throw new Error("Deaths cannot be negative");
      if (deaths > flock.currentCount) throw new Error("Deaths cannot exceed current stock count");
      const entry = db.insert(schema.dailyEntries).values({
        flockId: data.flockId,
        entryDate: data.entryDate,
        deaths: deaths,
        deathCause: deaths > 0 ? (data.deathCause || null) : null,
        eggsGradeA: data.eggsGradeA || 0,
        eggsGradeB: data.eggsGradeB || 0,
        eggsCracked: data.eggsCracked || 0,
        feedConsumedKg: data.feedConsumedKg || 0,
        waterConsumedLiters: data.waterConsumedLiters || null,
        notes: data.notes || null,
      }).returning().get();
      if (deaths > 0) {
        db.update(schema.flocks).set({ currentCount: flock.currentCount - deaths }).where(eq(schema.flocks.id, flock.id)).run();
      }
      return entry;
    })
  );

  ipcMain.handle(
    "dailyEntries:update",
    wrapHandler((_e: unknown, id: number, data: Partial<{ deaths: number; deathCause: string; eggsGradeA: number; eggsGradeB: number; eggsCracked: number; feedConsumedKg: number; waterConsumedLiters: number; notes: string }>) => {
      const { entry, flock } = requireDailyEntryAccess(id);
      const oldDeaths = entry.deaths || 0;
      const newDeaths = data.deaths !== undefined ? data.deaths : oldDeaths;
      if (newDeaths < 0) throw new Error("Deaths cannot be negative");
      const deathsDiff = newDeaths - oldDeaths;
      if (deathsDiff > 0 && deathsDiff > flock.currentCount) throw new Error("Deaths cannot exceed current stock count");
      const updates: Record<string, unknown> = {};
      if (data.deaths !== undefined) updates.deaths = data.deaths;
      if (data.deathCause !== undefined) updates.deathCause = data.deathCause;
      if (data.eggsGradeA !== undefined) updates.eggsGradeA = data.eggsGradeA;
      if (data.eggsGradeB !== undefined) updates.eggsGradeB = data.eggsGradeB;
      if (data.eggsCracked !== undefined) updates.eggsCracked = data.eggsCracked;
      if (data.feedConsumedKg !== undefined) updates.feedConsumedKg = data.feedConsumedKg;
      if (data.waterConsumedLiters !== undefined) updates.waterConsumedLiters = data.waterConsumedLiters;
      if (data.notes !== undefined) updates.notes = data.notes;
      if (Object.keys(updates).length === 0) throw new Error("No valid fields to update");
      const result = db.update(schema.dailyEntries).set(updates).where(eq(schema.dailyEntries.id, id)).returning().get();
      if (deathsDiff !== 0) {
        db.update(schema.flocks).set({ currentCount: flock.currentCount - deathsDiff }).where(eq(schema.flocks.id, flock.id)).run();
      }
      return result;
    })
  );

  ipcMain.handle(
    "dailyEntries:delete",
    wrapHandler((_e: unknown, id: number) => {
      const { entry, flock } = requireDailyEntryAccess(id);
      const deaths = entry.deaths || 0;
      db.delete(schema.dailyEntries).where(eq(schema.dailyEntries.id, id)).run();
      if (deaths > 0) {
        db.update(schema.flocks).set({ currentCount: flock.currentCount + deaths }).where(eq(schema.flocks.id, flock.id)).run();
      }
      return { id };
    })
  );

  ipcMain.handle(
    "dailyEntries:getByFlockAndDate",
    wrapHandler((_e: unknown, flockId: number, date: string) => {
      requireFlockAccess(flockId);
      return db.select().from(schema.dailyEntries).where(and(eq(schema.dailyEntries.flockId, flockId), eq(schema.dailyEntries.entryDate, date))).get() || null;
    })
  );

  ipcMain.handle(
    "dailyEntries:getByFlock",
    wrapHandler((_e: unknown, flockId: number, startDate?: string, endDate?: string) => {
      requireFlockAccess(flockId);
      const conditions = [eq(schema.dailyEntries.flockId, flockId)];
      if (startDate) conditions.push(gte(schema.dailyEntries.entryDate, startDate));
      if (endDate) conditions.push(lte(schema.dailyEntries.entryDate, endDate));
      return db.select().from(schema.dailyEntries).where(and(...conditions)).orderBy(schema.dailyEntries.entryDate).all();
    })
  );

  ipcMain.handle(
    "dailyEntries:getByFarm",
    wrapHandler((_e: unknown, farmId: number, date: string) => {
      requireFarmAccess(farmId);
      const farmFlocks = db.select().from(schema.flocks).where(eq(schema.flocks.farmId, farmId)).all();
      const flockIds = farmFlocks.map(f => f.id);
      if (flockIds.length === 0) return [];
      const entries: (typeof schema.dailyEntries.$inferSelect)[] = [];
      for (const fId of flockIds) {
        const entry = db.select().from(schema.dailyEntries).where(and(eq(schema.dailyEntries.flockId, fId), eq(schema.dailyEntries.entryDate, date))).get();
        if (entry) entries.push(entry);
      }
      return entries;
    })
  );

  ipcMain.handle(
    "dailyEntries:getPreviousDayStock",
    wrapHandler((_e: unknown, flockId: number, date: string) => {
      const flock = requireFlockAccess(flockId);
      const prevEntries = db.select().from(schema.dailyEntries).where(and(eq(schema.dailyEntries.flockId, flockId), lte(schema.dailyEntries.entryDate, date))).orderBy(schema.dailyEntries.entryDate).all();
      const totalPrevDeaths = prevEntries.reduce((sum, e) => sum + (e.deaths || 0), 0);
      const todayEntry = prevEntries.find(e => e.entryDate === date);
      const todayDeaths = todayEntry ? (todayEntry.deaths || 0) : 0;
      const openingStock = flock.initialCount - (totalPrevDeaths - todayDeaths);
      return { openingStock, flockName: flock.batchName, flockId: flock.id, arrivalDate: flock.arrivalDate, currentCount: flock.currentCount };
    })
  );

  ipcMain.handle(
    "eggPrices:createBatch",
    wrapHandler((_e: unknown, farmId: number, prices: { grade: string; pricePerEgg: number; pricePerTray: number }[], effectiveDate: string) => {
      requireFarmAccess(farmId);
      if (!effectiveDate) throw new Error("Effective date is required");
      const today = new Date().toISOString().split("T")[0];
      if (effectiveDate > today) throw new Error("Effective date cannot be in the future");
      if (!prices || prices.length === 0) throw new Error("At least one price entry is required");
      const results: (typeof schema.eggPrices.$inferSelect)[] = [];
      for (const p of prices) {
        if (!p.grade || !["A", "B", "cracked"].includes(p.grade)) throw new Error(`Invalid grade: ${p.grade}`);
        if (p.pricePerEgg <= 0) throw new Error(`Price per egg must be positive for grade ${p.grade}`);
        if (p.pricePerTray <= 0) throw new Error(`Price per tray must be positive for grade ${p.grade}`);
        const expectedTray = Math.round(p.pricePerEgg * 30 * 100) / 100;
        if (Math.abs(p.pricePerTray - expectedTray) > 0.02) throw new Error(`Price per tray must equal price per egg × 30 for grade ${p.grade}`);
        const row = db.insert(schema.eggPrices).values({
          farmId,
          grade: p.grade,
          pricePerEgg: p.pricePerEgg,
          pricePerTray: p.pricePerTray,
          effectiveDate,
        }).returning().get();
        results.push(row);
      }
      return results;
    })
  );

  ipcMain.handle(
    "eggPrices:getCurrentPrices",
    wrapHandler((_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      const today = new Date().toISOString().split("T")[0];
      const grades = ["A", "B", "cracked"];
      const current: Record<string, typeof schema.eggPrices.$inferSelect | null> = {};
      for (const grade of grades) {
        const row = db.select().from(schema.eggPrices)
          .where(and(eq(schema.eggPrices.farmId, farmId), eq(schema.eggPrices.grade, grade), lte(schema.eggPrices.effectiveDate, today)))
          .orderBy(sql`${schema.eggPrices.effectiveDate} DESC`)
          .limit(1)
          .get();
        current[grade] = row || null;
      }
      return current;
    })
  );

  ipcMain.handle(
    "eggPrices:getHistory",
    wrapHandler((_e: unknown, farmId: number, limit?: number) => {
      requireFarmAccess(farmId);
      const allPrices = db.select().from(schema.eggPrices)
        .where(eq(schema.eggPrices.farmId, farmId))
        .orderBy(sql`${schema.eggPrices.effectiveDate} DESC, ${schema.eggPrices.grade} ASC`)
        .all();
      const grouped: Record<string, (typeof schema.eggPrices.$inferSelect)[]> = {};
      for (const p of allPrices) {
        if (!grouped[p.effectiveDate]) grouped[p.effectiveDate] = [];
        grouped[p.effectiveDate].push(p);
      }
      const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
      const limited = limit ? dates.slice(0, limit) : dates;
      return limited.map(date => ({ effectiveDate: date, prices: grouped[date] }));
    })
  );

  ipcMain.handle(
    "eggPrices:getPriceOnDate",
    wrapHandler((_e: unknown, farmId: number, date: string) => {
      requireFarmAccess(farmId);
      const grades = ["A", "B", "cracked"];
      const prices: Record<string, typeof schema.eggPrices.$inferSelect | null> = {};
      for (const grade of grades) {
        const row = db.select().from(schema.eggPrices)
          .where(and(eq(schema.eggPrices.farmId, farmId), eq(schema.eggPrices.grade, grade), lte(schema.eggPrices.effectiveDate, date)))
          .orderBy(sql`${schema.eggPrices.effectiveDate} DESC`)
          .limit(1)
          .get();
        prices[grade] = row || null;
      }
      return prices;
    })
  );

  ipcMain.handle(
    "expenses:create",
    wrapHandler((_e: unknown, data: { farmId: number; category: string; description: string; amount: number; expenseDate: string; supplier?: string; receiptRef?: string; notes?: string }) => {
      requireFarmAccess(data.farmId);
      if (!data.category || !data.description || !data.amount || !data.expenseDate) {
        throw new Error("Category, description, amount, and date are required");
      }
      if (data.amount <= 0 || data.amount > 10000000) {
        throw new Error("Amount must be between 1 and 10,000,000 PKR");
      }
      if (data.description.length < 3 || data.description.length > 200) {
        throw new Error("Description must be 3-200 characters");
      }
      const today = new Date().toISOString().split("T")[0];
      if (data.expenseDate > today) {
        throw new Error("Expense date cannot be in the future");
      }
      return db.insert(schema.expenses).values(data).returning().get();
    })
  );

  ipcMain.handle(
    "expenses:getByFarm",
    wrapHandler((_e: unknown, farmId: number, filters?: { startDate?: string; endDate?: string; category?: string; search?: string }) => {
      requireFarmAccess(farmId);
      const conditions = [eq(schema.expenses.farmId, farmId)];
      if (filters?.startDate) conditions.push(gte(schema.expenses.expenseDate, filters.startDate));
      if (filters?.endDate) conditions.push(lte(schema.expenses.expenseDate, filters.endDate));
      if (filters?.category) conditions.push(eq(schema.expenses.category, filters.category));
      if (filters?.search) conditions.push(like(schema.expenses.description, `%${filters.search}%`));
      return db
        .select()
        .from(schema.expenses)
        .where(and(...conditions))
        .orderBy(desc(schema.expenses.expenseDate), desc(schema.expenses.id))
        .all();
    })
  );

  ipcMain.handle(
    "expenses:getById",
    wrapHandler((_e: unknown, id: number) => {
      requireAuth();
      const result = db.select().from(schema.expenses).where(eq(schema.expenses.id, id)).get();
      if (!result) throw new Error("Expense not found");
      return result;
    })
  );

  ipcMain.handle(
    "expenses:update",
    wrapHandler((_e: unknown, id: number, data: Partial<{ category: string; description: string; amount: number; expenseDate: string; supplier: string; receiptRef: string; notes: string }>) => {
      requireAuth();
      if (data.amount !== undefined && (data.amount <= 0 || data.amount > 10000000)) {
        throw new Error("Amount must be between 1 and 10,000,000 PKR");
      }
      if (data.description !== undefined && (data.description.length < 3 || data.description.length > 200)) {
        throw new Error("Description must be 3-200 characters");
      }
      if (data.expenseDate) {
        const today = new Date().toISOString().split("T")[0];
        if (data.expenseDate > today) throw new Error("Expense date cannot be in the future");
      }
      const result = db
        .update(schema.expenses)
        .set(data)
        .where(eq(schema.expenses.id, id))
        .returning()
        .get();
      if (!result) throw new Error("Expense not found");
      return result;
    })
  );

  ipcMain.handle(
    "expenses:delete",
    wrapHandler((_e: unknown, id: number) => {
      requireAuth();
      const expense = db.select().from(schema.expenses).where(eq(schema.expenses.id, id)).get();
      if (!expense) throw new Error("Expense not found");
      db.delete(schema.expenses).where(eq(schema.expenses.id, id)).run();
      return { id };
    })
  );

  ipcMain.handle(
    "expenses:getSummary",
    wrapHandler((_e: unknown, farmId: number, startDate: string, endDate: string) => {
      requireFarmAccess(farmId);
      const rows = db.select().from(schema.expenses)
        .where(and(
          eq(schema.expenses.farmId, farmId),
          gte(schema.expenses.expenseDate, startDate),
          lte(schema.expenses.expenseDate, endDate)
        ))
        .all();
      const byCategory: Record<string, number> = {};
      let total = 0;
      for (const row of rows) {
        byCategory[row.category] = (byCategory[row.category] || 0) + row.amount;
        total += row.amount;
      }
      return { total, byCategory, count: rows.length };
    })
  );

  ipcMain.handle(
    "expenses:getSuppliers",
    wrapHandler((_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      const rows = db.select({ supplier: schema.expenses.supplier })
        .from(schema.expenses)
        .where(and(
          eq(schema.expenses.farmId, farmId),
          isNotNull(schema.expenses.supplier)
        ))
        .all();
      const unique = [...new Set(rows.map(r => r.supplier).filter(Boolean))];
      return unique.sort();
    })
  );

  ipcMain.handle(
    "revenue:getDailySummary",
    wrapHandler((_e: unknown, farmId: number, startDate: string, endDate: string) => {
      requireFarmAccess(farmId);

      const entries = db.select({
        entryDate: schema.dailyEntries.entryDate,
        eggsGradeA: schema.dailyEntries.eggsGradeA,
        eggsGradeB: schema.dailyEntries.eggsGradeB,
        eggsCracked: schema.dailyEntries.eggsCracked,
      })
        .from(schema.dailyEntries)
        .innerJoin(schema.flocks, eq(schema.dailyEntries.flockId, schema.flocks.id))
        .where(and(
          eq(schema.flocks.farmId, farmId),
          gte(schema.dailyEntries.entryDate, startDate),
          lte(schema.dailyEntries.entryDate, endDate)
        ))
        .all();

      const prices = db.select()
        .from(schema.eggPrices)
        .where(eq(schema.eggPrices.farmId, farmId))
        .orderBy(desc(schema.eggPrices.effectiveDate))
        .all();

      function getPriceOnDate(grade: string, date: string): number {
        const matching = prices.find(p => p.grade === grade && p.effectiveDate <= date);
        return matching?.pricePerEgg ?? 0;
      }

      const dailyMap: Record<string, { gradeA: { qty: number; revenue: number }; gradeB: { qty: number; revenue: number }; cracked: { qty: number; revenue: number }; total: number }> = {};

      for (const entry of entries) {
        const date = entry.entryDate;
        if (!dailyMap[date]) {
          dailyMap[date] = {
            gradeA: { qty: 0, revenue: 0 },
            gradeB: { qty: 0, revenue: 0 },
            cracked: { qty: 0, revenue: 0 },
            total: 0,
          };
        }
        const d = dailyMap[date];
        const a = entry.eggsGradeA ?? 0;
        const b = entry.eggsGradeB ?? 0;
        const c = entry.eggsCracked ?? 0;
        d.gradeA.qty += a;
        d.gradeB.qty += b;
        d.cracked.qty += c;

        const priceA = getPriceOnDate("A", date);
        const priceB = getPriceOnDate("B", date);
        const priceC = getPriceOnDate("cracked", date);

        d.gradeA.revenue += a * priceA;
        d.gradeB.revenue += b * priceB;
        d.cracked.revenue += c * priceC;
        d.total += (a * priceA) + (b * priceB) + (c * priceC);
      }

      const hasPrices = prices.length > 0;

      return {
        daily: Object.entries(dailyMap)
          .map(([date, data]) => ({ date, ...data }))
          .sort((a, b) => b.date.localeCompare(a.date)),
        hasPrices,
      };
    })
  );

  ipcMain.handle(
    "revenue:getTotalRevenue",
    wrapHandler((_e: unknown, farmId: number, startDate: string, endDate: string) => {
      requireFarmAccess(farmId);

      const entries = db.select({
        entryDate: schema.dailyEntries.entryDate,
        eggsGradeA: schema.dailyEntries.eggsGradeA,
        eggsGradeB: schema.dailyEntries.eggsGradeB,
        eggsCracked: schema.dailyEntries.eggsCracked,
      })
        .from(schema.dailyEntries)
        .innerJoin(schema.flocks, eq(schema.dailyEntries.flockId, schema.flocks.id))
        .where(and(
          eq(schema.flocks.farmId, farmId),
          gte(schema.dailyEntries.entryDate, startDate),
          lte(schema.dailyEntries.entryDate, endDate)
        ))
        .all();

      const prices = db.select()
        .from(schema.eggPrices)
        .where(eq(schema.eggPrices.farmId, farmId))
        .orderBy(desc(schema.eggPrices.effectiveDate))
        .all();

      function getPriceOnDate(grade: string, date: string): number {
        const matching = prices.find(p => p.grade === grade && p.effectiveDate <= date);
        return matching?.pricePerEgg ?? 0;
      }

      let totalRevenue = 0;
      let totalEggs = 0;
      const byGrade = { A: { qty: 0, revenue: 0 }, B: { qty: 0, revenue: 0 }, cracked: { qty: 0, revenue: 0 } };

      for (const entry of entries) {
        const a = entry.eggsGradeA ?? 0;
        const b = entry.eggsGradeB ?? 0;
        const c = entry.eggsCracked ?? 0;
        const date = entry.entryDate;

        const revA = a * getPriceOnDate("A", date);
        const revB = b * getPriceOnDate("B", date);
        const revC = c * getPriceOnDate("cracked", date);

        byGrade.A.qty += a;
        byGrade.A.revenue += revA;
        byGrade.B.qty += b;
        byGrade.B.revenue += revB;
        byGrade.cracked.qty += c;
        byGrade.cracked.revenue += revC;

        totalEggs += a + b + c;
        totalRevenue += revA + revB + revC;
      }

      const avgPricePerEgg = totalEggs > 0 ? totalRevenue / totalEggs : 0;

      return { totalRevenue, totalEggs, avgPricePerEgg, byGrade };
    })
  );

  ipcMain.handle(
    "revenue:getRevenueVsExpenses",
    wrapHandler((_e: unknown, farmId: number, startDate: string, endDate: string) => {
      requireFarmAccess(farmId);

      const entries = db.select({
        entryDate: schema.dailyEntries.entryDate,
        eggsGradeA: schema.dailyEntries.eggsGradeA,
        eggsGradeB: schema.dailyEntries.eggsGradeB,
        eggsCracked: schema.dailyEntries.eggsCracked,
      })
        .from(schema.dailyEntries)
        .innerJoin(schema.flocks, eq(schema.dailyEntries.flockId, schema.flocks.id))
        .where(and(
          eq(schema.flocks.farmId, farmId),
          gte(schema.dailyEntries.entryDate, startDate),
          lte(schema.dailyEntries.entryDate, endDate)
        ))
        .all();

      const eggPricesRows = db.select()
        .from(schema.eggPrices)
        .where(eq(schema.eggPrices.farmId, farmId))
        .orderBy(desc(schema.eggPrices.effectiveDate))
        .all();

      function getPriceOnDate(grade: string, date: string): number {
        const matching = eggPricesRows.find(p => p.grade === grade && p.effectiveDate <= date);
        return matching?.pricePerEgg ?? 0;
      }

      let revenue = 0;
      for (const entry of entries) {
        const date = entry.entryDate;
        revenue += (entry.eggsGradeA ?? 0) * getPriceOnDate("A", date);
        revenue += (entry.eggsGradeB ?? 0) * getPriceOnDate("B", date);
        revenue += (entry.eggsCracked ?? 0) * getPriceOnDate("cracked", date);
      }

      const expenseRows = db.select({ amount: schema.expenses.amount })
        .from(schema.expenses)
        .where(and(
          eq(schema.expenses.farmId, farmId),
          gte(schema.expenses.expenseDate, startDate),
          lte(schema.expenses.expenseDate, endDate)
        ))
        .all();

      const totalExpenses = expenseRows.reduce((s, r) => s + r.amount, 0);

      return { revenue, expenses: totalExpenses, profit: revenue - totalExpenses };
    })
  );

  ipcMain.handle(
    "financial:getProfitLoss",
    wrapHandler((_e: unknown, farmId: number, startDate: string, endDate: string) => {
      requireFarmAccess(farmId);

      const entries = db.select({
        entryDate: schema.dailyEntries.entryDate,
        eggsGradeA: schema.dailyEntries.eggsGradeA,
        eggsGradeB: schema.dailyEntries.eggsGradeB,
        eggsCracked: schema.dailyEntries.eggsCracked,
      })
        .from(schema.dailyEntries)
        .innerJoin(schema.flocks, eq(schema.dailyEntries.flockId, schema.flocks.id))
        .where(and(
          eq(schema.flocks.farmId, farmId),
          gte(schema.dailyEntries.entryDate, startDate),
          lte(schema.dailyEntries.entryDate, endDate)
        ))
        .all();

      const eggPricesRows = db.select()
        .from(schema.eggPrices)
        .where(eq(schema.eggPrices.farmId, farmId))
        .orderBy(desc(schema.eggPrices.effectiveDate))
        .all();

      function getPriceOnDate(grade: string, date: string): number {
        const matching = eggPricesRows.find(p => p.grade === grade && p.effectiveDate <= date);
        return matching?.pricePerEgg ?? 0;
      }

      const revenueByGrade = { A: 0, B: 0, cracked: 0 };
      let totalRevenue = 0;

      for (const entry of entries) {
        const date = entry.entryDate;
        const revA = (entry.eggsGradeA ?? 0) * getPriceOnDate("A", date);
        const revB = (entry.eggsGradeB ?? 0) * getPriceOnDate("B", date);
        const revC = (entry.eggsCracked ?? 0) * getPriceOnDate("cracked", date);
        revenueByGrade.A += revA;
        revenueByGrade.B += revB;
        revenueByGrade.cracked += revC;
        totalRevenue += revA + revB + revC;
      }

      const expenseRows = db.select({
        category: schema.expenses.category,
        amount: schema.expenses.amount,
      })
        .from(schema.expenses)
        .where(and(
          eq(schema.expenses.farmId, farmId),
          gte(schema.expenses.expenseDate, startDate),
          lte(schema.expenses.expenseDate, endDate)
        ))
        .all();

      const byCategory: Record<string, number> = {};
      let totalExpenses = 0;
      for (const row of expenseRows) {
        byCategory[row.category] = (byCategory[row.category] ?? 0) + row.amount;
        totalExpenses += row.amount;
      }

      const profit = totalRevenue - totalExpenses;
      const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

      return {
        revenue: { byGrade: revenueByGrade, total: totalRevenue },
        expenses: { byCategory, total: totalExpenses },
        profit,
        margin,
      };
    })
  );

  ipcMain.handle(
    "financial:getFinancialTrends",
    wrapHandler((_e: unknown, farmId: number, startDate: string, endDate: string, groupBy: string) => {
      requireFarmAccess(farmId);

      const entries = db.select({
        entryDate: schema.dailyEntries.entryDate,
        eggsGradeA: schema.dailyEntries.eggsGradeA,
        eggsGradeB: schema.dailyEntries.eggsGradeB,
        eggsCracked: schema.dailyEntries.eggsCracked,
      })
        .from(schema.dailyEntries)
        .innerJoin(schema.flocks, eq(schema.dailyEntries.flockId, schema.flocks.id))
        .where(and(
          eq(schema.flocks.farmId, farmId),
          gte(schema.dailyEntries.entryDate, startDate),
          lte(schema.dailyEntries.entryDate, endDate)
        ))
        .all();

      const eggPricesRows = db.select()
        .from(schema.eggPrices)
        .where(eq(schema.eggPrices.farmId, farmId))
        .orderBy(desc(schema.eggPrices.effectiveDate))
        .all();

      function getPriceOnDate(grade: string, date: string): number {
        const matching = eggPricesRows.find(p => p.grade === grade && p.effectiveDate <= date);
        return matching?.pricePerEgg ?? 0;
      }

      function getPeriodKey(dateStr: string): string {
        const d = new Date(dateStr + "T00:00:00");
        if (groupBy === "day") return dateStr;
        if (groupBy === "week") {
          const day = d.getDay();
          const diff = d.getDate() - day;
          const weekStart = new Date(d);
          weekStart.setDate(diff);
          return weekStart.toISOString().split("T")[0];
        }
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      }

      const revenueMap: Record<string, number> = {};
      for (const entry of entries) {
        const key = getPeriodKey(entry.entryDate);
        const rev = (entry.eggsGradeA ?? 0) * getPriceOnDate("A", entry.entryDate)
          + (entry.eggsGradeB ?? 0) * getPriceOnDate("B", entry.entryDate)
          + (entry.eggsCracked ?? 0) * getPriceOnDate("cracked", entry.entryDate);
        revenueMap[key] = (revenueMap[key] ?? 0) + rev;
      }

      const expenseRows = db.select({
        expenseDate: schema.expenses.expenseDate,
        amount: schema.expenses.amount,
      })
        .from(schema.expenses)
        .where(and(
          eq(schema.expenses.farmId, farmId),
          gte(schema.expenses.expenseDate, startDate),
          lte(schema.expenses.expenseDate, endDate)
        ))
        .all();

      const expenseMap: Record<string, number> = {};
      for (const row of expenseRows) {
        const key = getPeriodKey(row.expenseDate);
        expenseMap[key] = (expenseMap[key] ?? 0) + row.amount;
      }

      const allKeys = new Set([...Object.keys(revenueMap), ...Object.keys(expenseMap)]);
      const trends = Array.from(allKeys)
        .sort()
        .map(period => {
          const rev = revenueMap[period] ?? 0;
          const exp = expenseMap[period] ?? 0;
          return { period, revenue: rev, expenses: exp, profit: rev - exp };
        });

      return trends;
    })
  );

  ipcMain.handle(
    "financial:getPerBirdMetrics",
    wrapHandler((_e: unknown, farmId: number, startDate: string, endDate: string) => {
      requireFarmAccess(farmId);

      const activeFlocks = db.select({
        currentCount: schema.flocks.currentCount,
      })
        .from(schema.flocks)
        .where(and(
          eq(schema.flocks.farmId, farmId),
          eq(schema.flocks.status, "active")
        ))
        .all();

      const avgBirds = activeFlocks.reduce((s, f) => s + f.currentCount, 0);

      const entries = db.select({
        entryDate: schema.dailyEntries.entryDate,
        eggsGradeA: schema.dailyEntries.eggsGradeA,
        eggsGradeB: schema.dailyEntries.eggsGradeB,
        eggsCracked: schema.dailyEntries.eggsCracked,
      })
        .from(schema.dailyEntries)
        .innerJoin(schema.flocks, eq(schema.dailyEntries.flockId, schema.flocks.id))
        .where(and(
          eq(schema.flocks.farmId, farmId),
          gte(schema.dailyEntries.entryDate, startDate),
          lte(schema.dailyEntries.entryDate, endDate)
        ))
        .all();

      const eggPricesRows = db.select()
        .from(schema.eggPrices)
        .where(eq(schema.eggPrices.farmId, farmId))
        .orderBy(desc(schema.eggPrices.effectiveDate))
        .all();

      function getPriceOnDate(grade: string, date: string): number {
        const matching = eggPricesRows.find(p => p.grade === grade && p.effectiveDate <= date);
        return matching?.pricePerEgg ?? 0;
      }

      let totalRevenue = 0;
      for (const entry of entries) {
        totalRevenue += (entry.eggsGradeA ?? 0) * getPriceOnDate("A", entry.entryDate);
        totalRevenue += (entry.eggsGradeB ?? 0) * getPriceOnDate("B", entry.entryDate);
        totalRevenue += (entry.eggsCracked ?? 0) * getPriceOnDate("cracked", entry.entryDate);
      }

      const expenseRows = db.select({ amount: schema.expenses.amount })
        .from(schema.expenses)
        .where(and(
          eq(schema.expenses.farmId, farmId),
          gte(schema.expenses.expenseDate, startDate),
          lte(schema.expenses.expenseDate, endDate)
        ))
        .all();

      const totalExpenses = expenseRows.reduce((s, r) => s + r.amount, 0);
      const profit = totalRevenue - totalExpenses;

      return {
        avgBirds,
        revenuePerBird: avgBirds > 0 ? totalRevenue / avgBirds : 0,
        expensePerBird: avgBirds > 0 ? totalExpenses / avgBirds : 0,
        profitPerBird: avgBirds > 0 ? profit / avgBirds : 0,
      };
    })
  );

  ipcMain.handle(
    "financial:getPerEggMetrics",
    wrapHandler((_e: unknown, farmId: number, startDate: string, endDate: string) => {
      requireFarmAccess(farmId);

      const entries = db.select({
        entryDate: schema.dailyEntries.entryDate,
        eggsGradeA: schema.dailyEntries.eggsGradeA,
        eggsGradeB: schema.dailyEntries.eggsGradeB,
        eggsCracked: schema.dailyEntries.eggsCracked,
      })
        .from(schema.dailyEntries)
        .innerJoin(schema.flocks, eq(schema.dailyEntries.flockId, schema.flocks.id))
        .where(and(
          eq(schema.flocks.farmId, farmId),
          gte(schema.dailyEntries.entryDate, startDate),
          lte(schema.dailyEntries.entryDate, endDate)
        ))
        .all();

      const eggPricesRows = db.select()
        .from(schema.eggPrices)
        .where(eq(schema.eggPrices.farmId, farmId))
        .orderBy(desc(schema.eggPrices.effectiveDate))
        .all();

      function getPriceOnDate(grade: string, date: string): number {
        const matching = eggPricesRows.find(p => p.grade === grade && p.effectiveDate <= date);
        return matching?.pricePerEgg ?? 0;
      }

      let totalRevenue = 0;
      let totalEggs = 0;
      for (const entry of entries) {
        const a = entry.eggsGradeA ?? 0;
        const b = entry.eggsGradeB ?? 0;
        const c = entry.eggsCracked ?? 0;
        totalEggs += a + b + c;
        totalRevenue += a * getPriceOnDate("A", entry.entryDate)
          + b * getPriceOnDate("B", entry.entryDate)
          + c * getPriceOnDate("cracked", entry.entryDate);
      }

      const expenseRows = db.select({ amount: schema.expenses.amount })
        .from(schema.expenses)
        .where(and(
          eq(schema.expenses.farmId, farmId),
          gte(schema.expenses.expenseDate, startDate),
          lte(schema.expenses.expenseDate, endDate)
        ))
        .all();

      const totalExpenses = expenseRows.reduce((s, r) => s + r.amount, 0);

      return {
        totalEggs,
        revenuePerEgg: totalEggs > 0 ? totalRevenue / totalEggs : 0,
        costPerEgg: totalEggs > 0 ? totalExpenses / totalEggs : 0,
        profitPerEgg: totalEggs > 0 ? (totalRevenue - totalExpenses) / totalEggs : 0,
      };
    })
  );

  ipcMain.handle(
    "inventory:create",
    wrapHandler((_e: unknown, data: { farmId: number; itemType: string; itemName: string; quantity: number; unit: string; minThreshold?: number; expiryDate?: string; supplier?: string; notes?: string }) => {
      requireFarmAccess(data.farmId);
      const { supplier, notes, ...itemData } = data;
      const item = db.insert(schema.inventory).values(itemData).returning().get();

      if (item.quantity > 0) {
        db.insert(schema.inventoryTransactions).values({
          inventoryId: item.id,
          type: "add",
          quantity: item.quantity,
          date: new Date().toISOString().split("T")[0],
          reason: "Initial stock",
          supplier: supplier ?? null,
          notes: notes ?? null,
        }).run();
      }

      return item;
    })
  );

  ipcMain.handle(
    "inventory:getByFarm",
    wrapHandler((_e: unknown, farmId: number, itemType?: string) => {
      requireFarmAccess(farmId);
      const conditions = [eq(schema.inventory.farmId, farmId)];
      if (itemType && itemType !== "all") {
        conditions.push(eq(schema.inventory.itemType, itemType));
      }
      return db.select().from(schema.inventory)
        .where(and(...conditions))
        .orderBy(schema.inventory.itemName)
        .all();
    })
  );

  ipcMain.handle(
    "inventory:getById",
    wrapHandler((_e: unknown, id: number) => {
      requireAuth();
      const item = db.select().from(schema.inventory)
        .where(eq(schema.inventory.id, id))
        .get();
      if (!item) throw new Error("Inventory item not found");
      requireFarmAccess(item.farmId!);

      const transactions = db.select().from(schema.inventoryTransactions)
        .where(eq(schema.inventoryTransactions.inventoryId, id))
        .orderBy(desc(schema.inventoryTransactions.createdAt))
        .limit(50)
        .all();

      return { ...item, transactions };
    })
  );

  ipcMain.handle(
    "inventory:update",
    wrapHandler((_e: unknown, id: number, data: Partial<{ itemName: string; quantity: number; unit: string; minThreshold: number | null; expiryDate: string | null }>) => {
      requireAuth();
      const existing = db.select().from(schema.inventory).where(eq(schema.inventory.id, id)).get();
      if (!existing) throw new Error("Inventory item not found");
      requireFarmAccess(existing.farmId!);

      const updates = { ...data, lastUpdated: new Date().toISOString() };
      const result = db
        .update(schema.inventory)
        .set(updates)
        .where(eq(schema.inventory.id, id))
        .returning()
        .get();
      return result;
    })
  );

  ipcMain.handle(
    "inventory:delete",
    wrapHandler((_e: unknown, id: number) => {
      requireAuth();
      const existing = db.select().from(schema.inventory).where(eq(schema.inventory.id, id)).get();
      if (!existing) throw new Error("Inventory item not found");
      requireFarmAccess(existing.farmId!);

      db.delete(schema.inventoryTransactions).where(eq(schema.inventoryTransactions.inventoryId, id)).run();
      db.delete(schema.inventory).where(eq(schema.inventory.id, id)).run();
      return { id };
    })
  );

  ipcMain.handle(
    "inventory:addStock",
    wrapHandler((_e: unknown, itemId: number, data: { quantity: number; date: string; supplier?: string; cost?: number; expiryDate?: string; notes?: string }) => {
      requireAuth();
      if (!data.quantity || data.quantity <= 0) throw new Error("Quantity must be greater than 0");
      const item = db.select().from(schema.inventory).where(eq(schema.inventory.id, itemId)).get();
      if (!item) throw new Error("Inventory item not found");
      requireFarmAccess(item.farmId!);

      const newQty = item.quantity + data.quantity;
      const updates: Record<string, unknown> = { quantity: newQty, lastUpdated: new Date().toISOString() };
      if (data.expiryDate) updates.expiryDate = data.expiryDate;

      db.update(schema.inventory).set(updates).where(eq(schema.inventory.id, itemId)).run();

      db.insert(schema.inventoryTransactions).values({
        inventoryId: itemId,
        type: "add",
        quantity: data.quantity,
        date: data.date,
        supplier: data.supplier ?? null,
        cost: data.cost ?? null,
        notes: data.notes ?? null,
      }).run();

      return db.select().from(schema.inventory).where(eq(schema.inventory.id, itemId)).get();
    })
  );

  ipcMain.handle(
    "inventory:reduceStock",
    wrapHandler((_e: unknown, itemId: number, data: { quantity: number; date: string; reason: string; notes?: string }) => {
      requireAuth();
      if (!data.quantity || data.quantity <= 0) throw new Error("Quantity must be greater than 0");
      const item = db.select().from(schema.inventory).where(eq(schema.inventory.id, itemId)).get();
      if (!item) throw new Error("Inventory item not found");
      requireFarmAccess(item.farmId!);
      if (data.quantity > item.quantity) throw new Error("Cannot reduce more than current stock");

      const newQty = item.quantity - data.quantity;
      db.update(schema.inventory)
        .set({ quantity: newQty, lastUpdated: new Date().toISOString() })
        .where(eq(schema.inventory.id, itemId))
        .run();

      db.insert(schema.inventoryTransactions).values({
        inventoryId: itemId,
        type: "reduce",
        quantity: data.quantity,
        date: data.date,
        reason: data.reason,
        notes: data.notes ?? null,
      }).run();

      return db.select().from(schema.inventory).where(eq(schema.inventory.id, itemId)).get();
    })
  );

  ipcMain.handle(
    "inventory:getLowStockItems",
    wrapHandler((_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      return db.select().from(schema.inventory)
        .where(and(
          eq(schema.inventory.farmId, farmId),
          isNotNull(schema.inventory.minThreshold),
          sql`${schema.inventory.quantity} <= ${schema.inventory.minThreshold}`
        ))
        .all();
    })
  );

  ipcMain.handle(
    "inventory:getExpiringItems",
    wrapHandler((_e: unknown, farmId: number, days: number) => {
      requireFarmAccess(farmId);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + days);
      const cutoffStr = cutoff.toISOString().split("T")[0];
      return db.select().from(schema.inventory)
        .where(and(
          eq(schema.inventory.farmId, farmId),
          isNotNull(schema.inventory.expiryDate),
          lte(schema.inventory.expiryDate, cutoffStr)
        ))
        .all();
    })
  );

  ipcMain.handle(
    "vaccinations:create",
    wrapHandler((_e: unknown, data: { flockId: number; vaccineName: string; scheduledDate: string; administeredDate?: string; administeredBy?: string; batchNumber?: string; notes?: string; status?: string }) => {
      requireAuth();
      const flock = db.select().from(schema.flocks).where(eq(schema.flocks.id, data.flockId)).get();
      if (!flock) throw new Error("Flock not found");
      requireFarmAccess(flock.farmId!);
      return db.insert(schema.vaccinations).values(data).returning().get();
    })
  );

  ipcMain.handle(
    "vaccinations:getByFlock",
    wrapHandler((_e: unknown, flockId: number) => {
      requireAuth();
      const flock = db.select().from(schema.flocks).where(eq(schema.flocks.id, flockId)).get();
      if (!flock) throw new Error("Flock not found");
      requireFarmAccess(flock.farmId!);
      return db
        .select()
        .from(schema.vaccinations)
        .where(eq(schema.vaccinations.flockId, flockId))
        .all();
    })
  );

  ipcMain.handle(
    "vaccinations:getUpcoming",
    wrapHandler((_e: unknown, farmId: number, days: number = 30) => {
      requireFarmAccess(farmId);
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const futureDate = new Date(today.getTime() + days * 86400000).toISOString().split("T")[0];

      const rows = db.select({
        vaccination: schema.vaccinations,
        flock: schema.flocks,
      })
        .from(schema.vaccinations)
        .innerJoin(schema.flocks, eq(schema.vaccinations.flockId, schema.flocks.id))
        .where(and(
          eq(schema.flocks.farmId, farmId),
          eq(schema.flocks.status, "active"),
          eq(schema.vaccinations.status, "pending"),
          lte(schema.vaccinations.scheduledDate, futureDate)
        ))
        .all();

      return rows.map(row => {
        const v = row.vaccination;
        const f = row.flock;
        const daysUntilDue = Math.floor((new Date(v.scheduledDate).getTime() - today.getTime()) / 86400000);
        const arrivalDate = new Date(f.arrivalDate);
        const ageAtArrival = f.ageAtArrivalDays || 0;
        const flockAgeDays = Math.floor((today.getTime() - arrivalDate.getTime()) / 86400000) + ageAtArrival;
        const vaccAgeDays = Math.floor((new Date(v.scheduledDate).getTime() - arrivalDate.getTime()) / 86400000) + ageAtArrival;

        return {
          ...v,
          flockName: f.batchName,
          flockBreed: f.breed,
          flockCurrentCount: f.currentCount,
          daysUntilDue,
          flockAgeDays,
          vaccAgeDays,
        };
      }).sort((a, b) => a.daysUntilDue - b.daysUntilDue);
    })
  );

  ipcMain.handle(
    "vaccinations:getCompleted",
    wrapHandler((_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      const rows = db.select({
        vaccination: schema.vaccinations,
        flock: schema.flocks,
      })
        .from(schema.vaccinations)
        .innerJoin(schema.flocks, eq(schema.vaccinations.flockId, schema.flocks.id))
        .where(and(
          eq(schema.flocks.farmId, farmId),
          sql`${schema.vaccinations.status} IN ('completed', 'skipped')`
        ))
        .all();

      return rows.map(row => ({
        ...row.vaccination,
        flockName: row.flock.batchName,
      })).sort((a, b) => (b.administeredDate || b.scheduledDate).localeCompare(a.administeredDate || a.scheduledDate));
    })
  );

  function requireVaccinationAccess(vaccId: number) {
    const vacc = db.select().from(schema.vaccinations).where(eq(schema.vaccinations.id, vaccId)).get();
    if (!vacc) throw new Error("Vaccination not found");
    if (vacc.flockId) {
      const flock = db.select().from(schema.flocks).where(eq(schema.flocks.id, vacc.flockId)).get();
      if (flock) requireFarmAccess(flock.farmId!);
    }
    return vacc;
  }

  ipcMain.handle(
    "vaccinations:update",
    wrapHandler((_e: unknown, id: number, data: Partial<{ vaccineName: string; scheduledDate: string; administeredDate: string; administeredBy: string; batchNumber: string; notes: string; status: string }>) => {
      requireVaccinationAccess(id);
      const result = db
        .update(schema.vaccinations)
        .set(data)
        .where(eq(schema.vaccinations.id, id))
        .returning()
        .get();
      if (!result) throw new Error("Vaccination not found");
      return result;
    })
  );

  ipcMain.handle(
    "vaccinations:complete",
    wrapHandler((_e: unknown, id: number, data: { administeredDate: string; administeredBy?: string; batchNumber?: string; notes?: string }) => {
      requireVaccinationAccess(id);
      const result = db.update(schema.vaccinations)
        .set({
          status: "completed",
          administeredDate: data.administeredDate,
          administeredBy: data.administeredBy || null,
          batchNumber: data.batchNumber || null,
          notes: data.notes || null,
        })
        .where(eq(schema.vaccinations.id, id))
        .returning()
        .get();
      if (!result) throw new Error("Vaccination not found");
      return result;
    })
  );

  ipcMain.handle(
    "vaccinations:skip",
    wrapHandler((_e: unknown, id: number, data: { reason: string; notes?: string; rescheduleDate?: string }) => {
      const vacc = requireVaccinationAccess(id);

      db.update(schema.vaccinations)
        .set({
          status: "skipped",
          notes: [data.reason, data.notes].filter(Boolean).join(" — "),
        })
        .where(eq(schema.vaccinations.id, id))
        .run();

      if (data.rescheduleDate) {
        const rescheduled = db.insert(schema.vaccinations).values({
          flockId: vacc.flockId,
          vaccineName: vacc.vaccineName,
          scheduledDate: data.rescheduleDate,
          status: "pending",
          notes: `Rescheduled from ${vacc.scheduledDate}`,
        }).returning().get();
        return rescheduled;
      }

      return db.select().from(schema.vaccinations).where(eq(schema.vaccinations.id, id)).get();
    })
  );

  ipcMain.handle(
    "vaccinations:reschedule",
    wrapHandler((_e: unknown, id: number, newDate: string) => {
      requireVaccinationAccess(id);
      const result = db.update(schema.vaccinations)
        .set({ scheduledDate: newDate })
        .where(eq(schema.vaccinations.id, id))
        .returning()
        .get();
      if (!result) throw new Error("Vaccination not found");
      return result;
    })
  );

  ipcMain.handle(
    "vaccinations:getHistory",
    wrapHandler((_e: unknown, farmId: number, filters: { flockId?: number; startDate?: string; endDate?: string; search?: string; status?: string; page?: number; pageSize?: number }) => {
      requireFarmAccess(farmId);
      const rows = db.select({
        vaccination: schema.vaccinations,
        flock: schema.flocks,
      })
        .from(schema.vaccinations)
        .innerJoin(schema.flocks, eq(schema.vaccinations.flockId, schema.flocks.id))
        .where(eq(schema.flocks.farmId, farmId))
        .all();

      let results = rows.map(row => ({
        ...row.vaccination,
        flockName: row.flock.batchName,
        flockBreed: row.flock.breed,
      }));

      if (filters.flockId) {
        results = results.filter(r => r.flockId === filters.flockId);
      }
      if (filters.status && filters.status !== "all") {
        if (filters.status === "overdue") {
          const today = new Date().toISOString().split("T")[0];
          results = results.filter(r => r.status === "pending" && r.scheduledDate < today);
        } else {
          results = results.filter(r => r.status === filters.status);
        }
      }
      if (filters.search) {
        const s = filters.search.toLowerCase();
        results = results.filter(r => r.vaccineName.toLowerCase().includes(s) || r.flockName.toLowerCase().includes(s));
      }
      if (filters.startDate) {
        results = results.filter(r => (r.administeredDate || r.scheduledDate) >= filters.startDate!);
      }
      if (filters.endDate) {
        results = results.filter(r => (r.administeredDate || r.scheduledDate) <= filters.endDate!);
      }

      results.sort((a, b) => (b.administeredDate || b.scheduledDate).localeCompare(a.administeredDate || a.scheduledDate));

      const total = results.length;
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 25;
      const paged = results.slice((page - 1) * pageSize, page * pageSize);

      return { items: paged, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    })
  );

  ipcMain.handle(
    "vaccinations:getByFlockDetailed",
    wrapHandler((_e: unknown, flockId: number) => {
      requireAuth();
      const flock = db.select().from(schema.flocks).where(eq(schema.flocks.id, flockId)).get();
      if (!flock) throw new Error("Flock not found");
      requireFarmAccess(flock.farmId!);

      const vaccinations = db.select().from(schema.vaccinations)
        .where(eq(schema.vaccinations.flockId, flockId))
        .all();

      const today = new Date().toISOString().split("T")[0];
      const completed = vaccinations.filter(v => v.status === "completed").length;
      const skipped = vaccinations.filter(v => v.status === "skipped").length;
      const overdue = vaccinations.filter(v => v.status === "pending" && v.scheduledDate < today).length;
      const pending = vaccinations.filter(v => v.status === "pending" && v.scheduledDate >= today).length;
      const complianceDenom = completed + skipped + overdue;
      const complianceRate = complianceDenom > 0 ? Math.round((completed / complianceDenom) * 100) : 100;

      const arrivalDate = new Date(flock.arrivalDate);
      const ageAtArrival = flock.ageAtArrivalDays || 0;

      const items = vaccinations.map(v => {
        const vaccAgeDays = Math.floor((new Date(v.scheduledDate).getTime() - arrivalDate.getTime()) / 86400000) + ageAtArrival;
        return { ...v, vaccAgeDays };
      }).sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

      return {
        flock: {
          id: flock.id,
          batchName: flock.batchName,
          breed: flock.breed,
          currentCount: flock.currentCount,
          arrivalDate: flock.arrivalDate,
          ageAtArrivalDays: flock.ageAtArrivalDays,
          status: flock.status,
        },
        vaccinations: items,
        compliance: { total: vaccinations.length, completed, skipped, overdue, pending, rate: complianceRate },
      };
    })
  );

  ipcMain.handle(
    "vaccinations:addCustom",
    wrapHandler((_e: unknown, flockId: number, data: { vaccineName: string; administeredDate: string; administeredBy: string; batchNumber?: string; route?: string; notes?: string }) => {
      requireAuth();
      if (!data.vaccineName || typeof data.vaccineName !== "string" || data.vaccineName.trim().length === 0) throw new Error("Vaccine name is required");
      if (!data.administeredDate || !/^\d{4}-\d{2}-\d{2}$/.test(data.administeredDate)) throw new Error("Valid date is required (YYYY-MM-DD)");
      if (!data.administeredBy || typeof data.administeredBy !== "string" || data.administeredBy.trim().length === 0) throw new Error("Administered by is required");
      if (data.vaccineName.length > 200) throw new Error("Vaccine name must be 200 characters or less");
      if (data.administeredBy.length > 200) throw new Error("Administered by must be 200 characters or less");
      const flock = db.select().from(schema.flocks).where(eq(schema.flocks.id, flockId)).get();
      if (!flock) throw new Error("Flock not found");
      requireFarmAccess(flock.farmId!);

      return db.insert(schema.vaccinations).values({
        flockId,
        vaccineName: data.vaccineName,
        scheduledDate: data.administeredDate,
        administeredDate: data.administeredDate,
        administeredBy: data.administeredBy,
        batchNumber: data.batchNumber || null,
        notes: [data.route ? `Route: ${data.route}` : null, data.notes].filter(Boolean).join(" — ") || null,
        status: "completed",
      }).returning().get();
    })
  );

  ipcMain.handle(
    "vaccinations:getComplianceStats",
    wrapHandler((_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      const rows = db.select({ vaccination: schema.vaccinations, flock: schema.flocks })
        .from(schema.vaccinations)
        .innerJoin(schema.flocks, eq(schema.vaccinations.flockId, schema.flocks.id))
        .where(eq(schema.flocks.farmId, farmId))
        .all();

      const today = new Date().toISOString().split("T")[0];
      const all = rows.map(r => r.vaccination);
      const completed = all.filter(v => v.status === "completed").length;
      const skipped = all.filter(v => v.status === "skipped").length;
      const overdue = all.filter(v => v.status === "pending" && v.scheduledDate < today).length;
      const pending = all.filter(v => v.status === "pending" && v.scheduledDate >= today).length;
      const complianceDenom = completed + skipped + overdue;
      const rate = complianceDenom > 0 ? Math.round((completed / complianceDenom) * 100) : 100;

      const lastCompleted = all
        .filter(v => v.status === "completed" && v.administeredDate)
        .sort((a, b) => (b.administeredDate || "").localeCompare(a.administeredDate || ""))[0];

      return { total: all.length, completed, skipped, overdue, pending, rate, lastCompletedDate: lastCompleted?.administeredDate || null, lastCompletedVaccine: lastCompleted?.vaccineName || null };
    })
  );

  ipcMain.handle(
    "vaccinations:exportHistory",
    wrapHandler((_e: unknown, farmId: number, filters: { flockId?: number; startDate?: string; endDate?: string; status?: string }) => {
      requireFarmAccess(farmId);
      const rows = db.select({ vaccination: schema.vaccinations, flock: schema.flocks })
        .from(schema.vaccinations)
        .innerJoin(schema.flocks, eq(schema.vaccinations.flockId, schema.flocks.id))
        .where(eq(schema.flocks.farmId, farmId))
        .all();

      let results = rows.map(r => ({
        date: r.vaccination.administeredDate || r.vaccination.scheduledDate,
        flock: r.flock.batchName,
        vaccine: r.vaccination.vaccineName,
        status: r.vaccination.status || "pending",
        administeredBy: r.vaccination.administeredBy || "",
        batchNumber: r.vaccination.batchNumber || "",
        notes: r.vaccination.notes || "",
      }));

      if (filters.flockId) results = results.filter(r => rows.find(row => row.flock.id === filters.flockId && row.flock.batchName === r.flock));
      if (filters.status && filters.status !== "all") results = results.filter(r => r.status === filters.status);
      if (filters.startDate) results = results.filter(r => r.date >= filters.startDate!);
      if (filters.endDate) results = results.filter(r => r.date <= filters.endDate!);

      results.sort((a, b) => b.date.localeCompare(a.date));
      return results;
    })
  );

  ipcMain.handle(
    "vaccinationSchedule:create",
    wrapHandler((_e: unknown, data: { vaccineName: string; ageDays: number; isMandatory?: number; route?: string; notes?: string }) => {
      requireAuth();
      return db
        .insert(schema.vaccinationSchedule)
        .values(data)
        .returning()
        .get();
    })
  );

  ipcMain.handle(
    "vaccinationSchedule:getAll",
    wrapHandler(() => {
      requireAuth();
      return db.select().from(schema.vaccinationSchedule).orderBy(schema.vaccinationSchedule.ageDays).all();
    })
  );

  ipcMain.handle(
    "vaccinationSchedule:update",
    wrapHandler((_e: unknown, id: number, data: Partial<{ vaccineName: string; ageDays: number; isMandatory: number; route: string; notes: string }>) => {
      requireAuth();
      const result = db
        .update(schema.vaccinationSchedule)
        .set(data)
        .where(eq(schema.vaccinationSchedule.id, id))
        .returning()
        .get();
      if (!result) throw new Error("Vaccination schedule not found");
      return result;
    })
  );

  ipcMain.handle(
    "vaccinationSchedule:delete",
    wrapHandler((_e: unknown, id: number) => {
      requireAuth();
      db.delete(schema.vaccinationSchedule)
        .where(eq(schema.vaccinationSchedule.id, id))
        .run();
      return { id };
    })
  );

  ipcMain.handle(
    "vaccinationSchedule:resetToDefaults",
    wrapHandler(() => {
      requireAuth();
      db.delete(schema.vaccinationSchedule).run();
      const defaults = [
        { vaccineName: "Marek's Disease", ageDays: 1, route: "Injection", isMandatory: 1 },
        { vaccineName: "Newcastle + IB", ageDays: 7, route: "Eye drop", isMandatory: 1 },
        { vaccineName: "Gumboro (IBD)", ageDays: 14, route: "Drinking water", isMandatory: 1 },
        { vaccineName: "Newcastle + IB", ageDays: 21, route: "Drinking water", isMandatory: 1 },
        { vaccineName: "Gumboro (IBD)", ageDays: 28, route: "Drinking water", isMandatory: 1 },
        { vaccineName: "Fowl Pox", ageDays: 35, route: "Wing web", isMandatory: 1 },
        { vaccineName: "Newcastle", ageDays: 42, route: "Drinking water", isMandatory: 1 },
        { vaccineName: "Infectious Coryza", ageDays: 56, route: "Injection", isMandatory: 0 },
        { vaccineName: "Newcastle + IB", ageDays: 70, route: "Drinking water", isMandatory: 1 },
        { vaccineName: "Newcastle + IB + EDS", ageDays: 112, route: "Injection", isMandatory: 1 },
      ];
      for (const d of defaults) {
        db.insert(schema.vaccinationSchedule).values(d).run();
      }
      return db.select().from(schema.vaccinationSchedule).orderBy(schema.vaccinationSchedule.ageDays).all();
    })
  );

  ipcMain.handle(
    "vaccinationSchedule:generateForFlock",
    wrapHandler((_e: unknown, flockId: number) => {
      requireAuth();
      const flock = db.select().from(schema.flocks).where(eq(schema.flocks.id, flockId)).get();
      if (!flock) throw new Error("Flock not found");
      requireFarmAccess(flock.farmId!);

      db.delete(schema.vaccinations)
        .where(and(
          eq(schema.vaccinations.flockId, flockId),
          eq(schema.vaccinations.status, "pending")
        ))
        .run();

      const schedules = db.select().from(schema.vaccinationSchedule).all();
      const arrivalMs = new Date(flock.arrivalDate).getTime();
      const ageAtArrival = flock.ageAtArrivalDays || 0;
      const generated = [];

      for (const sched of schedules) {
        const daysUntilVacc = sched.ageDays - ageAtArrival;
        if (daysUntilVacc >= 0) {
          const scheduledDate = new Date(arrivalMs + daysUntilVacc * 86400000).toISOString().split("T")[0];
          const v = db.insert(schema.vaccinations).values({
            flockId,
            vaccineName: sched.vaccineName,
            scheduledDate,
            status: "pending",
          }).returning().get();
          generated.push(v);
        }
      }

      return generated;
    })
  );

  ipcMain.handle(
    "dashboard:getFarmStats",
    wrapHandler((_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      const activeFlocks = db.select().from(schema.flocks)
        .where(and(eq(schema.flocks.farmId, farmId), eq(schema.flocks.status, "active")))
        .all();
      const totalBirds = activeFlocks.reduce((s, f) => s + (f.currentCount || 0), 0);
      const totalInitialBirds = activeFlocks.reduce((s, f) => s + (f.initialCount || 0), 0);
      const today = new Date().toISOString().split("T")[0];
      const todayEntries = db.select().from(schema.dailyEntries)
        .innerJoin(schema.flocks, eq(schema.dailyEntries.flockId, schema.flocks.id))
        .where(and(eq(schema.flocks.farmId, farmId), eq(schema.dailyEntries.entryDate, today), eq(schema.flocks.status, "active")))
        .all();
      const todayEggs = todayEntries.reduce((s, r) => s + (r.daily_entries.eggsGradeA || 0) + (r.daily_entries.eggsGradeB || 0) + (r.daily_entries.eggsCracked || 0), 0);
      const todayDeaths = todayEntries.reduce((s, r) => s + (r.daily_entries.deaths || 0), 0);
      const todayFeed = todayEntries.reduce((s, r) => s + (r.daily_entries.feedConsumedKg || 0), 0);
      const flocksWithEntry = new Set(todayEntries.map(r => r.daily_entries.flockId));
      const flocksCompleted = flocksWithEntry.size;
      const flocksTotal = activeFlocks.length;
      return {
        totalBirds,
        totalInitialBirds,
        activeFlockCount: activeFlocks.length,
        todayEggs,
        todayDeaths,
        todayFeed: Math.round(todayFeed * 100) / 100,
        flocksCompleted,
        flocksTotal,
        flocks: activeFlocks.map(f => ({
          id: f.id,
          batchName: f.batchName,
          breed: f.breed,
          currentCount: f.currentCount,
          initialCount: f.initialCount,
          arrivalDate: f.arrivalDate,
          ageAtArrivalDays: f.ageAtArrivalDays || 0,
          hasEntryToday: flocksWithEntry.has(f.id),
        })),
      };
    })
  );

  ipcMain.handle(
    "dashboard:getWeeklyTrends",
    wrapHandler((_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      function dateOffset(d: Date, offset: number): string {
        const nd = new Date(d);
        nd.setDate(nd.getDate() + offset);
        return nd.toISOString().split("T")[0];
      }
      const thisWeekStart = dateOffset(today, -6);
      const lastWeekStart = dateOffset(today, -13);
      const lastWeekEnd = dateOffset(today, -7);

      function getWeekData(startDate: string, endDate: string) {
        const entries = db.select().from(schema.dailyEntries)
          .innerJoin(schema.flocks, eq(schema.dailyEntries.flockId, schema.flocks.id))
          .where(and(
            eq(schema.flocks.farmId, farmId),
            gte(schema.dailyEntries.entryDate, startDate),
            lte(schema.dailyEntries.entryDate, endDate)
          ))
          .all();
        const eggs = entries.reduce((s, r) => s + (r.daily_entries.eggsGradeA || 0) + (r.daily_entries.eggsGradeB || 0) + (r.daily_entries.eggsCracked || 0), 0);
        const deaths = entries.reduce((s, r) => s + (r.daily_entries.deaths || 0), 0);
        const feed = entries.reduce((s, r) => s + (r.daily_entries.feedConsumedKg || 0), 0);
        const daysWithData = new Set(entries.map(r => r.daily_entries.entryDate)).size;
        return { eggs, deaths, feed: Math.round(feed * 100) / 100, daysWithData };
      }

      const thisWeek = getWeekData(thisWeekStart, todayStr);
      const lastWeek = getWeekData(lastWeekStart, lastWeekEnd);

      const activeFlocks = db.select().from(schema.flocks)
        .where(and(eq(schema.flocks.farmId, farmId), eq(schema.flocks.status, "active")))
        .all();
      const totalBirds = activeFlocks.reduce((s, f) => s + (f.currentCount || 0), 0);
      const totalInitial = activeFlocks.reduce((s, f) => s + (f.initialCount || 0), 0);

      const avgEggsThisWeek = thisWeek.eggs / 7;
      const avgEggsLastWeek = lastWeek.eggs / 7;

      const productionRate = totalBirds > 0
        ? (thisWeek.eggs / (totalBirds * 7)) * 100 : 0;
      const dailyMortalityRate = totalBirds > 0
        ? (thisWeek.deaths / (totalBirds * 7)) * 100 : 0;
      const cumulativeMortality = totalInitial > 0
        ? ((totalInitial - totalBirds) / totalInitial) * 100 : 0;
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
    wrapHandler((_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      const alerts: { type: "critical" | "warning" | "info"; message: string; link?: string }[] = [];

      const inventoryItems = db.select().from(schema.inventory)
        .where(eq(schema.inventory.farmId, farmId))
        .all();
      for (const item of inventoryItems) {
        if (item.minThreshold && item.quantity <= item.minThreshold) {
          alerts.push({
            type: item.quantity <= 0 ? "critical" : "warning",
            message: `${item.itemName}: ${item.quantity <= 0 ? "Out of stock" : `Low stock (${item.quantity} ${item.unit} remaining)`}`,
            link: "/farm/inventory",
          });
        }
      }

      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      const todayStr = today.toISOString().split("T")[0];
      const nextWeekStr = nextWeek.toISOString().split("T")[0];

      const activeFlocks = db.select().from(schema.flocks)
        .where(and(eq(schema.flocks.farmId, farmId), eq(schema.flocks.status, "active")))
        .all();

      for (const flock of activeFlocks) {
        const pendingVax = db.select().from(schema.vaccinations)
          .where(and(
            eq(schema.vaccinations.flockId, flock.id),
            eq(schema.vaccinations.status, "pending"),
            lte(schema.vaccinations.scheduledDate, nextWeekStr)
          ))
          .all();
        for (const v of pendingVax) {
          if (v.scheduledDate < todayStr) {
            alerts.push({
              type: "critical",
              message: `${flock.batchName}: ${v.vaccineName} overdue (was due ${new Date(v.scheduledDate + "T00:00:00").toLocaleDateString()})`,
              link: `/farm/flocks/${flock.id}`,
            });
          } else {
            alerts.push({
              type: "warning",
              message: `${flock.batchName}: ${v.vaccineName} due on ${new Date(v.scheduledDate + "T00:00:00").toLocaleDateString()}`,
              link: `/farm/flocks/${flock.id}`,
            });
          }
        }
      }

      const yesterdayDate = new Date(today);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayStr = yesterdayDate.toISOString().split("T")[0];
      for (const flock of activeFlocks) {
        const yesterdayEntry = db.select().from(schema.dailyEntries)
          .where(and(eq(schema.dailyEntries.flockId, flock.id), eq(schema.dailyEntries.entryDate, yesterdayStr)))
          .get();
        if (yesterdayEntry && yesterdayEntry.deaths && flock.currentCount > 0) {
          const mortalityPct = (yesterdayEntry.deaths / (flock.currentCount + yesterdayEntry.deaths)) * 100;
          if (mortalityPct > 0.3) {
            alerts.push({
              type: "critical",
              message: `${flock.batchName}: High mortality yesterday (${mortalityPct.toFixed(1)}%, ${yesterdayEntry.deaths} deaths)`,
              link: `/farm/flocks/${flock.id}`,
            });
          }
        }
      }

      const eggPriceRecord = db.select().from(schema.eggPrices)
        .where(eq(schema.eggPrices.farmId, farmId))
        .orderBy(sql`${schema.eggPrices.effectiveDate} DESC`)
        .limit(1)
        .get();
      if (!eggPriceRecord) {
        alerts.push({
          type: "info",
          message: "No egg prices configured. Set prices to track revenue.",
          link: "/farm/pricing",
        });
      } else {
        const daysSince = Math.floor((today.getTime() - new Date(eggPriceRecord.effectiveDate).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince > 30) {
          alerts.push({
            type: "info",
            message: `Egg prices haven't been updated in ${daysSince} days.`,
            link: "/farm/pricing",
          });
        }
      }

      alerts.sort((a, b) => {
        const priority = { critical: 0, warning: 1, info: 2 };
        return priority[a.type] - priority[b.type];
      });

      return alerts;
    })
  );

  ipcMain.handle(
    "alerts:getAll",
    wrapHandler((_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      const dismissed = db.select().from(schema.dismissedAlerts)
        .where(eq(schema.dismissedAlerts.farmId, farmId))
        .all();
      const dismissedKeys = new Set(dismissed.map(d => `${d.alertType}:${d.referenceId}`));

      const alerts: { id: string; type: string; severity: string; title: string; message: string; referenceId: number; createdAt: string; isDismissed: boolean; actionUrl: string }[] = [];

      const inventoryItems = db.select().from(schema.inventory)
        .where(eq(schema.inventory.farmId, farmId))
        .all();

      for (const item of inventoryItems) {
        if (item.minThreshold !== null && item.quantity <= item.minThreshold) {
          const key = `low_stock:${item.id}`;
          const isDismissed = dismissedKeys.has(key);
          let severity = "warning";
          if (item.quantity <= 0) severity = "critical";
          else if (item.minThreshold > 0 && item.quantity < item.minThreshold * 0.25) severity = "critical";

          alerts.push({
            id: key,
            type: "low_stock",
            severity,
            title: `Low Stock: ${item.itemName}`,
            message: `${item.quantity} ${item.unit} remaining (threshold: ${item.minThreshold} ${item.unit})`,
            referenceId: item.id,
            createdAt: item.lastUpdated ?? todayStr,
            isDismissed,
            actionUrl: "/farm/inventory",
          });
        }

        if (item.expiryDate) {
          const daysUntilExpiry = Math.floor((new Date(item.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntilExpiry <= 30) {
            const key = `expiring:${item.id}`;
            const isDismissed = dismissedKeys.has(key);
            let severity = "info";
            if (daysUntilExpiry <= 0) severity = "critical";
            else if (daysUntilExpiry <= 7) severity = "warning";

            alerts.push({
              id: key,
              type: "expiring",
              severity,
              title: daysUntilExpiry <= 0 ? `Expired: ${item.itemName}` : `Expiring Soon: ${item.itemName}`,
              message: daysUntilExpiry <= 0
                ? `Expired ${Math.abs(daysUntilExpiry)} day(s) ago`
                : `Expires in ${daysUntilExpiry} day(s) — ${item.expiryDate}`,
              referenceId: item.id,
              createdAt: item.lastUpdated ?? todayStr,
              isDismissed,
              actionUrl: "/farm/inventory",
            });
          }
        }
      }

      const pendingVacc = db.select().from(schema.vaccinations)
        .innerJoin(schema.flocks, eq(schema.vaccinations.flockId, schema.flocks.id))
        .where(and(
          eq(schema.flocks.farmId, farmId),
          eq(schema.flocks.status, "active"),
          eq(schema.vaccinations.status, "pending"),
          lte(schema.vaccinations.scheduledDate, todayStr)
        ))
        .all();

      for (const row of pendingVacc) {
        const v = row.vaccinations;
        const f = row.flocks;
        const key = `vaccination_due:${v.id}`;
        const isDismissed = dismissedKeys.has(key);
        const daysOverdue = Math.floor((today.getTime() - new Date(v.scheduledDate).getTime()) / (1000 * 60 * 60 * 24));
        const severity = daysOverdue > 7 ? "critical" : daysOverdue > 0 ? "warning" : "info";

        alerts.push({
          id: key,
          type: "vaccination_due",
          severity,
          title: `Vaccination Due: ${v.vaccineName}`,
          message: `${f.batchName} — scheduled ${v.scheduledDate}${daysOverdue > 0 ? ` (${daysOverdue} day(s) overdue)` : ""}`,
          referenceId: v.id,
          createdAt: v.scheduledDate,
          isDismissed,
          actionUrl: "/farm/vaccinations",
        });
      }

      const priorityMap: Record<string, number> = { critical: 0, warning: 1, info: 2 };
      alerts.sort((a, b) => priorityMap[a.severity] - priorityMap[b.severity]);

      return alerts;
    })
  );

  ipcMain.handle(
    "alerts:dismiss",
    wrapHandler((_e: unknown, farmId: number, alertType: string, referenceId: number) => {
      requireFarmAccess(farmId);
      const existing = db.select().from(schema.dismissedAlerts)
        .where(and(
          eq(schema.dismissedAlerts.farmId, farmId),
          eq(schema.dismissedAlerts.alertType, alertType),
          eq(schema.dismissedAlerts.referenceId, referenceId)
        ))
        .get();
      if (!existing) {
        db.insert(schema.dismissedAlerts).values({ farmId, alertType, referenceId }).run();
      }
      return { success: true };
    })
  );

  ipcMain.handle(
    "alerts:undismiss",
    wrapHandler((_e: unknown, farmId: number, alertType: string, referenceId: number) => {
      requireFarmAccess(farmId);
      db.delete(schema.dismissedAlerts)
        .where(and(
          eq(schema.dismissedAlerts.farmId, farmId),
          eq(schema.dismissedAlerts.alertType, alertType),
          eq(schema.dismissedAlerts.referenceId, referenceId)
        ))
        .run();
      return { success: true };
    })
  );

  ipcMain.handle(
    "alerts:clearDismissed",
    wrapHandler((_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      db.delete(schema.dismissedAlerts)
        .where(eq(schema.dismissedAlerts.farmId, farmId))
        .run();
      return { success: true };
    })
  );

  ipcMain.handle(
    "reports:getDailySummary",
    wrapHandler((_e: unknown, farmId: number, date: string) => {
      requireFarmAccess(farmId);
      const farm = db.select().from(schema.farms).where(eq(schema.farms.id, farmId)).get();
      const farmFlocks = db.select().from(schema.flocks).where(eq(schema.flocks.farmId, farmId)).all();

      const flockSummaries = farmFlocks.map(flock => {
        const entry = db.select().from(schema.dailyEntries)
          .where(and(eq(schema.dailyEntries.flockId, flock.id), eq(schema.dailyEntries.entryDate, date)))
          .get();
        return {
          flockId: flock.id,
          batchName: flock.batchName,
          breed: flock.breed,
          currentCount: flock.currentCount,
          eggsGradeA: entry?.eggsGradeA || 0,
          eggsGradeB: entry?.eggsGradeB || 0,
          eggsCracked: entry?.eggsCracked || 0,
          deaths: entry?.deaths || 0,
          deathCause: entry?.deathCause || null,
          feedConsumedKg: entry?.feedConsumedKg || 0,
          waterConsumedLiters: entry?.waterConsumedLiters || null,
          notes: entry?.notes || null,
        };
      });

      const totalBirds = farmFlocks.reduce((s, f) => s + (f.currentCount || 0), 0);
      const totalEggsA = flockSummaries.reduce((s, f) => s + f.eggsGradeA, 0);
      const totalEggsB = flockSummaries.reduce((s, f) => s + f.eggsGradeB, 0);
      const totalCracked = flockSummaries.reduce((s, f) => s + f.eggsCracked, 0);
      const totalDeaths = flockSummaries.reduce((s, f) => s + f.deaths, 0);
      const totalFeed = flockSummaries.reduce((s, f) => s + f.feedConsumedKg, 0);

      const prices = db.select().from(schema.eggPrices)
        .where(and(eq(schema.eggPrices.farmId, farmId), lte(schema.eggPrices.effectiveDate, date)))
        .all();
      const getPrice = (grade: string) => {
        const matching = prices.filter(p => p.grade === grade).sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
        return matching[0]?.pricePerEgg || 0;
      };
      const revenue = totalEggsA * getPrice("A") + totalEggsB * getPrice("B") + totalCracked * getPrice("Cracked");

      const dayExpenses = db.select().from(schema.expenses)
        .where(and(eq(schema.expenses.farmId, farmId), eq(schema.expenses.expenseDate, date)))
        .all();
      const totalExpenses = dayExpenses.reduce((s, e) => s + (e.amount || 0), 0);

      const notes = flockSummaries.map(f => f.notes).filter(Boolean) as string[];

      return {
        date,
        farm: { id: farm!.id, name: farm!.name, location: farm!.location },
        flocks: flockSummaries,
        totals: { birds: totalBirds, eggsGradeA: totalEggsA, eggsGradeB: totalEggsB, eggsCracked: totalCracked, eggsTotal: totalEggsA + totalEggsB + totalCracked, deaths: totalDeaths, feedKg: Math.round(totalFeed * 100) / 100, revenue: Math.round(revenue * 100) / 100, expenses: Math.round(totalExpenses * 100) / 100 },
        notes,
      };
    })
  );

  ipcMain.handle(
    "reports:getWeeklySummary",
    wrapHandler((_e: unknown, farmId: number, startDate: string, endDate: string) => {
      requireFarmAccess(farmId);
      const farm = db.select().from(schema.farms).where(eq(schema.farms.id, farmId)).get();
      const farmFlocks = db.select().from(schema.flocks).where(eq(schema.flocks.farmId, farmId)).all();
      const flockIds = farmFlocks.map(f => f.id);

      const entries = flockIds.length > 0 ? db.select().from(schema.dailyEntries)
        .where(and(gte(schema.dailyEntries.entryDate, startDate), lte(schema.dailyEntries.entryDate, endDate)))
        .all()
        .filter(e => e.flockId && flockIds.includes(e.flockId)) : [];

      const dateMap: Record<string, { eggsGradeA: number; eggsGradeB: number; eggsCracked: number; deaths: number; feedKg: number }> = {};
      const d = new Date(startDate);
      const end = new Date(endDate);
      while (d <= end) {
        const ds = d.toISOString().split("T")[0];
        dateMap[ds] = { eggsGradeA: 0, eggsGradeB: 0, eggsCracked: 0, deaths: 0, feedKg: 0 };
        d.setDate(d.getDate() + 1);
      }

      for (const e of entries) {
        const dm = dateMap[e.entryDate];
        if (dm) {
          dm.eggsGradeA += e.eggsGradeA || 0;
          dm.eggsGradeB += e.eggsGradeB || 0;
          dm.eggsCracked += e.eggsCracked || 0;
          dm.deaths += e.deaths || 0;
          dm.feedKg += e.feedConsumedKg || 0;
        }
      }

      const dailyData = Object.entries(dateMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, data]) => ({
        date, ...data, eggsTotal: data.eggsGradeA + data.eggsGradeB + data.eggsCracked,
      }));

      const totalBirds = farmFlocks.reduce((s, f) => s + (f.currentCount || 0), 0);
      const weeklyTotals = dailyData.reduce((acc, d) => ({
        eggsGradeA: acc.eggsGradeA + d.eggsGradeA, eggsGradeB: acc.eggsGradeB + d.eggsGradeB,
        eggsCracked: acc.eggsCracked + d.eggsCracked, eggsTotal: acc.eggsTotal + d.eggsTotal,
        deaths: acc.deaths + d.deaths, feedKg: acc.feedKg + d.feedKg,
      }), { eggsGradeA: 0, eggsGradeB: 0, eggsCracked: 0, eggsTotal: 0, deaths: 0, feedKg: 0 });

      const daysWithData = dailyData.filter(d => d.eggsTotal > 0 || d.deaths > 0 || d.feedKg > 0).length || 1;
      const totalInitial = farmFlocks.reduce((s, f) => s + (f.initialCount || 0), 0);

      const exps = db.select().from(schema.expenses)
        .where(and(eq(schema.expenses.farmId, farmId), gte(schema.expenses.expenseDate, startDate), lte(schema.expenses.expenseDate, endDate)))
        .all();
      const totalExpenses = exps.reduce((s, e) => s + (e.amount || 0), 0);

      const prices = db.select().from(schema.eggPrices)
        .where(and(eq(schema.eggPrices.farmId, farmId), lte(schema.eggPrices.effectiveDate, endDate)))
        .all();
      const getPrice = (grade: string) => {
        const matching = prices.filter(p => p.grade === grade).sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
        return matching[0]?.pricePerEgg || 0;
      };
      const totalRevenue = weeklyTotals.eggsGradeA * getPrice("A") + weeklyTotals.eggsGradeB * getPrice("B") + weeklyTotals.eggsCracked * getPrice("Cracked");

      return {
        startDate, endDate,
        farm: { id: farm!.id, name: farm!.name, location: farm!.location },
        dailyData,
        weeklyTotals: { ...weeklyTotals, birds: totalBirds, feedKg: Math.round(weeklyTotals.feedKg * 100) / 100 },
        averages: {
          eggsPerDay: Math.round(weeklyTotals.eggsTotal / daysWithData),
          mortalityRate: totalInitial > 0 ? Math.round((weeklyTotals.deaths / totalInitial) * 10000) / 100 : 0,
          feedPerBird: totalBirds > 0 ? Math.round((weeklyTotals.feedKg / daysWithData / totalBirds) * 1000) / 1000 : 0,
        },
        financial: { revenue: Math.round(totalRevenue * 100) / 100, expenses: Math.round(totalExpenses * 100) / 100, profit: Math.round((totalRevenue - totalExpenses) * 100) / 100 },
      };
    })
  );

  ipcMain.handle(
    "reports:getMonthlySummary",
    wrapHandler((_e: unknown, farmId: number, month: number, year: number) => {
      requireFarmAccess(farmId);
      const farm = db.select().from(schema.farms).where(eq(schema.farms.id, farmId)).get();
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      const farmFlocks = db.select().from(schema.flocks).where(eq(schema.flocks.farmId, farmId)).all();
      const flockIds = farmFlocks.map(f => f.id);

      const entries = flockIds.length > 0 ? db.select().from(schema.dailyEntries)
        .where(and(gte(schema.dailyEntries.entryDate, startDate), lte(schema.dailyEntries.entryDate, endDate)))
        .all()
        .filter(e => e.flockId && flockIds.includes(e.flockId)) : [];

      const weeklyData: { weekStart: string; weekEnd: string; eggsTotal: number; deaths: number; feedKg: number; revenue: number; expenses: number }[] = [];
      let wStart = new Date(startDate);
      while (wStart <= new Date(endDate)) {
        const wEnd = new Date(wStart);
        wEnd.setDate(wEnd.getDate() + 6);
        if (wEnd > new Date(endDate)) wEnd.setTime(new Date(endDate).getTime());
        const ws = wStart.toISOString().split("T")[0];
        const we = wEnd.toISOString().split("T")[0];
        const weekEntries = entries.filter(e => e.entryDate >= ws && e.entryDate <= we);
        const eggs = weekEntries.reduce((s, e) => s + (e.eggsGradeA || 0) + (e.eggsGradeB || 0) + (e.eggsCracked || 0), 0);
        const deaths = weekEntries.reduce((s, e) => s + (e.deaths || 0), 0);
        const feed = weekEntries.reduce((s, e) => s + (e.feedConsumedKg || 0), 0);

        const weekExp = db.select().from(schema.expenses)
          .where(and(eq(schema.expenses.farmId, farmId), gte(schema.expenses.expenseDate, ws), lte(schema.expenses.expenseDate, we)))
          .all().reduce((s, e) => s + (e.amount || 0), 0);

        weeklyData.push({ weekStart: ws, weekEnd: we, eggsTotal: eggs, deaths, feedKg: Math.round(feed * 100) / 100, revenue: 0, expenses: Math.round(weekExp * 100) / 100 });
        wStart = new Date(wEnd);
        wStart.setDate(wStart.getDate() + 1);
      }

      const totalEggsA = entries.reduce((s, e) => s + (e.eggsGradeA || 0), 0);
      const totalEggsB = entries.reduce((s, e) => s + (e.eggsGradeB || 0), 0);
      const totalCracked = entries.reduce((s, e) => s + (e.eggsCracked || 0), 0);
      const totalEggs = totalEggsA + totalEggsB + totalCracked;
      const totalDeaths = entries.reduce((s, e) => s + (e.deaths || 0), 0);
      const totalFeed = entries.reduce((s, e) => s + (e.feedConsumedKg || 0), 0);
      const totalBirds = farmFlocks.reduce((s, f) => s + (f.currentCount || 0), 0);

      const prices = db.select().from(schema.eggPrices)
        .where(and(eq(schema.eggPrices.farmId, farmId), lte(schema.eggPrices.effectiveDate, endDate)))
        .all();
      const getPrice = (grade: string) => {
        const matching = prices.filter(p => p.grade === grade).sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
        return matching[0]?.pricePerEgg || 0;
      };
      const totalRevenue = totalEggsA * getPrice("A") + totalEggsB * getPrice("B") + totalCracked * getPrice("Cracked");

      const totalExpenses = db.select().from(schema.expenses)
        .where(and(eq(schema.expenses.farmId, farmId), gte(schema.expenses.expenseDate, startDate), lte(schema.expenses.expenseDate, endDate)))
        .all().reduce((s, e) => s + (e.amount || 0), 0);

      const expByCategory = db.select().from(schema.expenses)
        .where(and(eq(schema.expenses.farmId, farmId), gte(schema.expenses.expenseDate, startDate), lte(schema.expenses.expenseDate, endDate)))
        .all().reduce<Record<string, number>>((acc, e) => { acc[e.category] = (acc[e.category] || 0) + (e.amount || 0); return acc; }, {});

      const inventoryItems = db.select().from(schema.inventory)
        .where(eq(schema.inventory.farmId, farmId)).all();
      const lowStockCount = inventoryItems.filter(i => i.minThreshold && i.quantity <= i.minThreshold).length;
      const today = new Date().toISOString().split("T")[0];
      const soon = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
      const expiringCount = inventoryItems.filter(i => i.expiryDate && i.expiryDate >= today && i.expiryDate <= soon).length;

      const allVacc = db.select().from(schema.vaccinations)
        .all().filter(v => v.flockId && flockIds.includes(v.flockId));
      const vaccCompleted = allVacc.filter(v => v.status === "completed").length;
      const vaccTotal = allVacc.filter(v => v.status !== "pending" || v.scheduledDate < today).length;
      const vaccRate = vaccTotal > 0 ? Math.round((vaccCompleted / vaccTotal) * 100) : 100;

      const daysInMonth = lastDay;
      const daysWithData = new Set(entries.map(e => e.entryDate)).size || 1;

      return {
        month, year, startDate, endDate,
        farm: { id: farm!.id, name: farm!.name, location: farm!.location },
        weeklyData,
        totals: { birds: totalBirds, eggsGradeA: totalEggsA, eggsGradeB: totalEggsB, eggsCracked: totalCracked, eggsTotal: totalEggs, deaths: totalDeaths, feedKg: Math.round(totalFeed * 100) / 100 },
        averages: { eggsPerDay: Math.round(totalEggs / daysWithData), productionRate: totalBirds > 0 ? Math.round((totalEggs / daysWithData / totalBirds) * 10000) / 100 : 0 },
        financial: { revenue: Math.round(totalRevenue * 100) / 100, expenses: Math.round(totalExpenses * 100) / 100, profit: Math.round((totalRevenue - totalExpenses) * 100) / 100, expensesByCategory: Object.entries(expByCategory).map(([category, amount]) => ({ category, amount: Math.round(amount * 100) / 100 })) },
        inventory: { totalItems: inventoryItems.length, lowStock: lowStockCount, expiringSoon: expiringCount },
        vaccination: { complianceRate: vaccRate, completed: vaccCompleted, total: vaccTotal },
      };
    })
  );

  ipcMain.handle(
    "reports:getFlockReport",
    wrapHandler((_e: unknown, flockId: number) => {
      requireAuth();
      const flock = db.select().from(schema.flocks).where(eq(schema.flocks.id, flockId)).get();
      if (!flock) throw new Error("Flock not found");
      requireFarmAccess(flock.farmId!);
      const farm = db.select().from(schema.farms).where(eq(schema.farms.id, flock.farmId!)).get();

      const entries = db.select().from(schema.dailyEntries)
        .where(eq(schema.dailyEntries.flockId, flockId))
        .all()
        .sort((a, b) => a.entryDate.localeCompare(b.entryDate));

      const totalEggsA = entries.reduce((s, e) => s + (e.eggsGradeA || 0), 0);
      const totalEggsB = entries.reduce((s, e) => s + (e.eggsGradeB || 0), 0);
      const totalCracked = entries.reduce((s, e) => s + (e.eggsCracked || 0), 0);
      const totalEggs = totalEggsA + totalEggsB + totalCracked;
      const totalDeaths = entries.reduce((s, e) => s + (e.deaths || 0), 0);
      const totalFeed = entries.reduce((s, e) => s + (e.feedConsumedKg || 0), 0);

      const arrivalDate = new Date(flock.arrivalDate);
      const ageDays = Math.floor((Date.now() - arrivalDate.getTime()) / 86400000) + (flock.ageAtArrivalDays || 0);
      const mortalityRate = flock.initialCount > 0 ? Math.round((totalDeaths / flock.initialCount) * 10000) / 100 : 0;
      const daysActive = entries.length || 1;
      const productionRate = (flock.currentCount || 0) > 0 ? Math.round((totalEggs / daysActive / (flock.currentCount || 1)) * 10000) / 100 : 0;
      const feedConversionRatio = totalEggs > 0 ? Math.round((totalFeed / totalEggs) * 1000) / 1000 : 0;

      const productionCurve = entries.map(e => ({
        date: e.entryDate,
        eggs: (e.eggsGradeA || 0) + (e.eggsGradeB || 0) + (e.eggsCracked || 0),
        deaths: e.deaths || 0,
        feedKg: e.feedConsumedKg || 0,
      }));

      const vaccs = db.select().from(schema.vaccinations)
        .where(eq(schema.vaccinations.flockId, flockId)).all();
      const vaccCompleted = vaccs.filter(v => v.status === "completed").length;
      const today = new Date().toISOString().split("T")[0];
      const vaccDenom = vaccs.filter(v => v.status !== "pending" || v.scheduledDate < today).length;

      return {
        farm: { id: farm!.id, name: farm!.name, location: farm!.location },
        flock: { id: flock.id, batchName: flock.batchName, breed: flock.breed, initialCount: flock.initialCount, currentCount: flock.currentCount, arrivalDate: flock.arrivalDate, ageAtArrivalDays: flock.ageAtArrivalDays, ageDays, status: flock.status },
        stats: { totalEggs, totalEggsA, totalEggsB, totalCracked, totalDeaths, totalFeed: Math.round(totalFeed * 100) / 100, mortalityRate, productionRate, feedConversionRatio, daysTracked: entries.length },
        productionCurve,
        vaccinations: { total: vaccs.length, completed: vaccCompleted, complianceRate: vaccDenom > 0 ? Math.round((vaccCompleted / vaccDenom) * 100) : 100, records: vaccs.map(v => ({ vaccineName: v.vaccineName, scheduledDate: v.scheduledDate, administeredDate: v.administeredDate, status: v.status })) },
      };
    })
  );

  ipcMain.handle(
    "reports:getFinancialReport",
    wrapHandler((_e: unknown, farmId: number, startDate: string, endDate: string) => {
      requireFarmAccess(farmId);
      const farm = db.select().from(schema.farms).where(eq(schema.farms.id, farmId)).get();
      const farmFlocks = db.select().from(schema.flocks).where(eq(schema.flocks.farmId, farmId)).all();
      const flockIds = farmFlocks.map(f => f.id);
      const totalBirds = farmFlocks.reduce((s, f) => s + (f.currentCount || 0), 0);

      const entries = flockIds.length > 0 ? db.select().from(schema.dailyEntries)
        .where(and(gte(schema.dailyEntries.entryDate, startDate), lte(schema.dailyEntries.entryDate, endDate)))
        .all().filter(e => e.flockId && flockIds.includes(e.flockId)) : [];

      const totalEggsA = entries.reduce((s, e) => s + (e.eggsGradeA || 0), 0);
      const totalEggsB = entries.reduce((s, e) => s + (e.eggsGradeB || 0), 0);
      const totalCracked = entries.reduce((s, e) => s + (e.eggsCracked || 0), 0);
      const totalEggs = totalEggsA + totalEggsB + totalCracked;

      const prices = db.select().from(schema.eggPrices)
        .where(and(eq(schema.eggPrices.farmId, farmId), lte(schema.eggPrices.effectiveDate, endDate)))
        .all();
      const getPrice = (grade: string) => {
        const matching = prices.filter(p => p.grade === grade).sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
        return matching[0]?.pricePerEgg || 0;
      };

      const revenueA = totalEggsA * getPrice("A");
      const revenueB = totalEggsB * getPrice("B");
      const revenueCracked = totalCracked * getPrice("Cracked");
      const totalRevenue = revenueA + revenueB + revenueCracked;

      const exps = db.select().from(schema.expenses)
        .where(and(eq(schema.expenses.farmId, farmId), gte(schema.expenses.expenseDate, startDate), lte(schema.expenses.expenseDate, endDate)))
        .all();
      const totalExpenses = exps.reduce((s, e) => s + (e.amount || 0), 0);
      const expByCategory = exps.reduce<Record<string, number>>((acc, e) => { acc[e.category] = (acc[e.category] || 0) + (e.amount || 0); return acc; }, {});

      const dailyFinancial: { date: string; revenue: number; expenses: number }[] = [];
      const d = new Date(startDate);
      const endD = new Date(endDate);
      while (d <= endD) {
        const ds = d.toISOString().split("T")[0];
        const dayEntries = entries.filter(e => e.entryDate === ds);
        const dayEggsA = dayEntries.reduce((s, e) => s + (e.eggsGradeA || 0), 0);
        const dayEggsB = dayEntries.reduce((s, e) => s + (e.eggsGradeB || 0), 0);
        const dayCracked = dayEntries.reduce((s, e) => s + (e.eggsCracked || 0), 0);
        const dayRev = dayEggsA * getPrice("A") + dayEggsB * getPrice("B") + dayCracked * getPrice("Cracked");
        const dayExp = exps.filter(e => e.expenseDate === ds).reduce((s, e) => s + (e.amount || 0), 0);
        if (dayRev > 0 || dayExp > 0) dailyFinancial.push({ date: ds, revenue: Math.round(dayRev * 100) / 100, expenses: Math.round(dayExp * 100) / 100 });
        d.setDate(d.getDate() + 1);
      }

      const profit = totalRevenue - totalExpenses;
      const margin = totalRevenue > 0 ? Math.round((profit / totalRevenue) * 10000) / 100 : 0;

      return {
        startDate, endDate,
        farm: { id: farm!.id, name: farm!.name, location: farm!.location },
        revenue: {
          total: Math.round(totalRevenue * 100) / 100,
          byGrade: [
            { grade: "A", eggs: totalEggsA, revenue: Math.round(revenueA * 100) / 100, pricePerEgg: getPrice("A") },
            { grade: "B", eggs: totalEggsB, revenue: Math.round(revenueB * 100) / 100, pricePerEgg: getPrice("B") },
            { grade: "Cracked", eggs: totalCracked, revenue: Math.round(revenueCracked * 100) / 100, pricePerEgg: getPrice("Cracked") },
          ],
        },
        expenses: {
          total: Math.round(totalExpenses * 100) / 100,
          byCategory: Object.entries(expByCategory).map(([category, amount]) => ({ category, amount: Math.round(amount * 100) / 100 })),
        },
        profitLoss: { profit: Math.round(profit * 100) / 100, margin },
        metrics: {
          revenuePerBird: totalBirds > 0 ? Math.round((totalRevenue / totalBirds) * 100) / 100 : 0,
          expensePerBird: totalBirds > 0 ? Math.round((totalExpenses / totalBirds) * 100) / 100 : 0,
          profitPerBird: totalBirds > 0 ? Math.round((profit / totalBirds) * 100) / 100 : 0,
          revenuePerEgg: totalEggs > 0 ? Math.round((totalRevenue / totalEggs) * 100) / 100 : 0,
          costPerEgg: totalEggs > 0 ? Math.round((totalExpenses / totalEggs) * 100) / 100 : 0,
          totalBirds, totalEggs,
        },
        dailyTrend: dailyFinancial,
      };
    })
  );

  function getOwnerFarms(ownerId: number) {
    return db.select().from(schema.farms).where(and(eq(schema.farms.ownerId, ownerId), eq(schema.farms.isActive, 1))).all();
  }

  function getFarmStats(farmId: number, today: string, monthStart: string, monthEnd: string) {
    const activeFlocks = db.select().from(schema.flocks).where(and(eq(schema.flocks.farmId, farmId), eq(schema.flocks.status, "active"))).all();
    const totalBirds = activeFlocks.reduce((s, f) => s + (f.currentCount || 0), 0);
    const totalFlocks = activeFlocks.length;
    const initialBirds = activeFlocks.reduce((s, f) => s + (f.initialCount || 0), 0);

    const todayEntries = db.select().from(schema.dailyEntries)
      .where(and(eq(schema.dailyEntries.entryDate, today)))
      .all()
      .filter(e => activeFlocks.some(f => f.id === e.flockId));

    const eggsToday = todayEntries.reduce((s, e) => s + (e.eggsGradeA || 0) + (e.eggsGradeB || 0) + (e.eggsCracked || 0), 0);
    const flocksWithEntriesToday = new Set(todayEntries.map(e => e.flockId)).size;

    const allEntries = db.select().from(schema.dailyEntries)
      .where(and(gte(schema.dailyEntries.entryDate, monthStart), lte(schema.dailyEntries.entryDate, monthEnd)))
      .all()
      .filter(e => activeFlocks.some(f => f.id === e.flockId));

    const totalDeaths = allEntries.reduce((s, e) => s + (e.deaths || 0), 0);
    const mortalityRate = initialBirds > 0 ? Math.round((totalDeaths / initialBirds) * 10000) / 100 : 0;

    const totalEggsMonth = allEntries.reduce((s, e) => s + (e.eggsGradeA || 0) + (e.eggsGradeB || 0) + (e.eggsCracked || 0), 0);
    const daysInMonth = allEntries.length > 0 ? new Set(allEntries.map(e => e.entryDate)).size : 1;
    const avgEggsPerDay = Math.round(totalEggsMonth / daysInMonth);
    const productionRate = totalBirds > 0 ? Math.round((avgEggsPerDay / totalBirds) * 10000) / 100 : 0;

    const monthExpenses = db.select({ total: sql<number>`COALESCE(SUM(${schema.expenses.amount}), 0)` })
      .from(schema.expenses)
      .where(and(eq(schema.expenses.farmId, farmId), gte(schema.expenses.expenseDate, monthStart), lte(schema.expenses.expenseDate, monthEnd)))
      .get();

    const totalEggsA = allEntries.reduce((s, e) => s + (e.eggsGradeA || 0), 0);
    const totalEggsB = allEntries.reduce((s, e) => s + (e.eggsGradeB || 0), 0);
    const totalCracked = allEntries.reduce((s, e) => s + (e.eggsCracked || 0), 0);

    const prices = db.select().from(schema.eggPrices)
      .where(and(eq(schema.eggPrices.farmId, farmId), lte(schema.eggPrices.effectiveDate, monthEnd)))
      .all();
    const getPrice = (grade: string) => {
      const sorted = [...prices].filter(p => p.grade === grade).sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
      return sorted.length > 0 ? sorted[0].pricePerEgg : 0;
    };
    const revenueMonth = Math.round((totalEggsA * getPrice("A") + totalEggsB * getPrice("B") + totalCracked * getPrice("Cracked")) * 100) / 100;
    const expensesMonth = monthExpenses?.total || 0;
    const profitMonth = Math.round((revenueMonth - expensesMonth) * 100) / 100;
    const profitMargin = revenueMonth > 0 ? Math.round((profitMonth / revenueMonth) * 10000) / 100 : 0;

    let performance: "good" | "warning" | "critical" = "good";
    if (productionRate < 70 || mortalityRate > 1 || profitMargin < 10) performance = "critical";
    else if (productionRate < 85 || mortalityRate > 0.5 || profitMargin < 20) performance = "warning";

    return {
      totalBirds, totalFlocks, eggsToday, flocksWithEntriesToday, productionRate, mortalityRate,
      profitMargin, revenueMonth, expensesMonth, profitMonth, performance, avgEggsPerDay,
      totalEggsA, totalEggsB, totalCracked, initialBirds,
    };
  }

  ipcMain.handle("owner:getDashboardStats",
    wrapHandler((_e: unknown, ownerId: number) => {
      const session = requireOwner();
      if (session.id !== ownerId) throw new Error("Access denied");

      const today = new Date().toISOString().split("T")[0];
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const monthEnd = today;

      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const prevMonthStart = `${prevMonthEnd.getFullYear()}-${String(prevMonthEnd.getMonth() + 1).padStart(2, "0")}-01`;
      const prevMonthEndStr = prevMonthEnd.toISOString().split("T")[0];

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      const ownerFarms = getOwnerFarms(ownerId);

      let totalBirds = 0, totalEggsToday = 0, revenueMonth = 0, profitMonth = 0;
      let prevRevenueMonth = 0, prevProfitMonth = 0, totalEggsYesterday = 0;
      let totalInitialBirds = 0;

      for (const farm of ownerFarms) {
        const stats = getFarmStats(farm.id, today, monthStart, monthEnd);
        totalBirds += stats.totalBirds;
        totalEggsToday += stats.eggsToday;
        revenueMonth += stats.revenueMonth;
        profitMonth += stats.profitMonth;
        totalInitialBirds += stats.initialBirds;

        const prevStats = getFarmStats(farm.id, yesterdayStr, prevMonthStart, prevMonthEndStr);
        prevRevenueMonth += prevStats.revenueMonth;
        prevProfitMonth += prevStats.profitMonth;
        totalEggsYesterday += prevStats.eggsToday;
      }

      const totalBirdsChange = totalInitialBirds > 0 ? Math.round(((totalBirds - totalInitialBirds) / totalInitialBirds) * 10000) / 100 : 0;

      return {
        totalBirds,
        totalEggsToday,
        revenueMonth: Math.round(revenueMonth * 100) / 100,
        profitMonth: Math.round(profitMonth * 100) / 100,
        totalFarms: ownerFarms.length,
        totalBirdsChange,
        totalEggsTrend: totalEggsYesterday > 0 ? Math.round(((totalEggsToday - totalEggsYesterday) / totalEggsYesterday) * 10000) / 100 : 0,
        revenueTrend: prevRevenueMonth > 0 ? Math.round(((revenueMonth - prevRevenueMonth) / prevRevenueMonth) * 10000) / 100 : 0,
        profitTrend: prevProfitMonth > 0 ? Math.round(((profitMonth - prevProfitMonth) / prevProfitMonth) * 10000) / 100 : 0,
      };
    })
  );

  ipcMain.handle("owner:getFarmsOverview",
    wrapHandler((_e: unknown, ownerId: number) => {
      const session = requireOwner();
      if (session.id !== ownerId) throw new Error("Access denied");

      const today = new Date().toISOString().split("T")[0];
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

      const ownerFarms = getOwnerFarms(ownerId);
      return ownerFarms.map(farm => {
        const stats = getFarmStats(farm.id, today, monthStart, today);
        return {
          id: farm.id,
          name: farm.name,
          location: farm.location,
          capacity: farm.capacity,
          isActive: farm.isActive ?? 1,
          ...stats,
        };
      });
    })
  );

  ipcMain.handle("owner:getFarmComparison",
    wrapHandler((_e: unknown, ownerId: number, farmIds: number[], startDate: string, endDate: string) => {
      const session = requireOwner();
      if (session.id !== ownerId) throw new Error("Access denied");

      const ownerFarms = getOwnerFarms(ownerId);
      const validFarmIds = farmIds.length > 0 ? farmIds : ownerFarms.map(f => f.id);

      return validFarmIds.map(farmId => {
        const farm = ownerFarms.find(f => f.id === farmId);
        if (!farm) return null;

        const stats = getFarmStats(farmId, endDate, startDate, endDate);
        return {
          farmId: farm.id,
          farmName: farm.name,
          totalBirds: stats.totalBirds,
          avgEggsPerDay: stats.avgEggsPerDay,
          productionRate: stats.productionRate,
          mortalityRate: stats.mortalityRate,
          revenue: stats.revenueMonth,
          expenses: stats.expensesMonth,
          profit: stats.profitMonth,
          profitMargin: stats.profitMargin,
        };
      }).filter(Boolean);
    })
  );

  ipcMain.handle("owner:getConsolidatedAlerts",
    wrapHandler((_e: unknown, ownerId: number) => {
      const session = requireOwner();
      if (session.id !== ownerId) throw new Error("Access denied");

      const ownerFarms = getOwnerFarms(ownerId);
      const today = new Date().toISOString().split("T")[0];
      const alerts: Array<{ farmId: number; farmName: string; type: string; severity: "critical" | "warning" | "info"; message: string; referenceId: number; date: string }> = [];

      for (const farm of ownerFarms) {
        const activeFlocks = db.select().from(schema.flocks).where(and(eq(schema.flocks.farmId, farm.id), eq(schema.flocks.status, "active"))).all();

        for (const flock of activeFlocks) {
          const recentEntries = db.select().from(schema.dailyEntries)
            .where(and(eq(schema.dailyEntries.flockId, flock.id), gte(schema.dailyEntries.entryDate, (() => { const d = new Date(); d.setDate(d.getDate() - 3); return d.toISOString().split("T")[0]; })())))
            .all();
          const recentDeaths = recentEntries.reduce((s, e) => s + (e.deaths || 0), 0);
          if (recentDeaths > 0) {
            alerts.push({ farmId: farm.id, farmName: farm.name, type: "mortality", severity: recentDeaths > 5 ? "critical" : "warning", message: `${flock.batchName}: ${recentDeaths} deaths in last 3 days`, referenceId: flock.id, date: today });
          }
        }

        const lowStock = db.select().from(schema.inventory)
          .where(and(eq(schema.inventory.farmId, farm.id)))
          .all()
          .filter(i => i.minThreshold != null && i.quantity <= i.minThreshold);
        for (const item of lowStock) {
          alerts.push({ farmId: farm.id, farmName: farm.name, type: "low_stock", severity: item.quantity <= 0 ? "critical" : "warning", message: `${item.itemName}: ${item.quantity} ${item.unit} remaining`, referenceId: item.id, date: today });
        }

        const upcomingVax = db.select().from(schema.vaccinations)
          .innerJoin(schema.flocks, eq(schema.vaccinations.flockId, schema.flocks.id))
          .where(and(eq(schema.flocks.farmId, farm.id), eq(schema.vaccinations.status, "pending"), lte(schema.vaccinations.scheduledDate, today)))
          .all();
        for (const v of upcomingVax) {
          alerts.push({ farmId: farm.id, farmName: farm.name, type: "vaccination_overdue", severity: "critical", message: `${v.vaccinations.vaccineName} overdue for ${v.flocks.batchName}`, referenceId: v.vaccinations.id, date: v.vaccinations.scheduledDate });
        }
      }

      alerts.sort((a, b) => {
        const sev = { critical: 0, warning: 1, info: 2 };
        return sev[a.severity] - sev[b.severity];
      });

      return alerts;
    })
  );

  ipcMain.handle("owner:getRecentActivity",
    wrapHandler((_e: unknown, ownerId: number, limit: number = 20) => {
      const session = requireOwner();
      if (session.id !== ownerId) throw new Error("Access denied");

      const ownerFarms = getOwnerFarms(ownerId);
      const farmIds = ownerFarms.map(f => f.id);
      const farmMap = Object.fromEntries(ownerFarms.map(f => [f.id, f.name]));
      if (farmIds.length === 0) return [];

      const activities: Array<{ id: number; farmId: number; farmName: string; type: "entry" | "expense" | "vaccination"; description: string; date: string; amount?: number }> = [];

      const recentEntries = db.select({
        id: schema.dailyEntries.id,
        flockId: schema.dailyEntries.flockId,
        entryDate: schema.dailyEntries.entryDate,
        eggsA: schema.dailyEntries.eggsGradeA,
        eggsB: schema.dailyEntries.eggsGradeB,
        cracked: schema.dailyEntries.eggsCracked,
        deaths: schema.dailyEntries.deaths,
        farmId: schema.flocks.farmId,
        batchName: schema.flocks.batchName,
      })
        .from(schema.dailyEntries)
        .innerJoin(schema.flocks, eq(schema.dailyEntries.flockId, schema.flocks.id))
        .where(inArray(schema.flocks.farmId, farmIds))
        .orderBy(desc(schema.dailyEntries.entryDate))
        .limit(limit)
        .all();

      for (const e of recentEntries) {
        const eggs = (e.eggsA || 0) + (e.eggsB || 0) + (e.cracked || 0);
        activities.push({
          id: e.id,
          farmId: e.farmId!,
          farmName: farmMap[e.farmId!] || "Unknown",
          type: "entry",
          description: `${e.batchName}: ${eggs} eggs, ${e.deaths || 0} deaths`,
          date: e.entryDate,
        });
      }

      const recentExpenses = db.select()
        .from(schema.expenses)
        .where(inArray(schema.expenses.farmId, farmIds))
        .orderBy(desc(schema.expenses.expenseDate))
        .limit(limit)
        .all();

      for (const e of recentExpenses) {
        activities.push({
          id: e.id,
          farmId: e.farmId!,
          farmName: farmMap[e.farmId!] || "Unknown",
          type: "expense",
          description: `${e.category}: ${e.description || "Expense"}`,
          date: e.expenseDate,
          amount: e.amount,
        });
      }

      const recentVax = db.select({
        id: schema.vaccinations.id,
        vaccineName: schema.vaccinations.vaccineName,
        administeredDate: schema.vaccinations.administeredDate,
        scheduledDate: schema.vaccinations.scheduledDate,
        status: schema.vaccinations.status,
        farmId: schema.flocks.farmId,
        batchName: schema.flocks.batchName,
      })
        .from(schema.vaccinations)
        .innerJoin(schema.flocks, eq(schema.vaccinations.flockId, schema.flocks.id))
        .where(and(inArray(schema.flocks.farmId, farmIds), eq(schema.vaccinations.status, "completed")))
        .orderBy(desc(schema.vaccinations.administeredDate))
        .limit(limit)
        .all();

      for (const v of recentVax) {
        activities.push({
          id: v.id,
          farmId: v.farmId!,
          farmName: farmMap[v.farmId!] || "Unknown",
          type: "vaccination",
          description: `${v.vaccineName} completed for ${v.batchName}`,
          date: v.administeredDate || v.scheduledDate,
        });
      }

      activities.sort((a, b) => b.date.localeCompare(a.date));
      return activities.slice(0, limit);
    })
  );

  ipcMain.handle("backup:create",
    wrapHandler(async () => {
      requireAuth();
      const result = await dialog.showSaveDialog({
        title: "Save Backup",
        defaultPath: join(app.getPath("documents"), generateBackupFilename()),
        filters: [{ name: "Database Backup", extensions: ["db"] }],
      });
      if (result.canceled || !result.filePath) throw new Error("Backup cancelled");
      return createBackup(result.filePath);
    })
  );

  ipcMain.handle("backup:createToPath",
    wrapHandler((_e: unknown, destinationPath: string) => {
      requireAuth();
      validateBackupPath(destinationPath);
      return createBackup(destinationPath);
    })
  );

  ipcMain.handle("backup:restore",
    wrapHandler(async () => {
      requireAuth();
      const result = await dialog.showOpenDialog({
        title: "Select Backup File",
        filters: [{ name: "Database Backup", extensions: ["db"] }],
        properties: ["openFile"],
      });
      if (result.canceled || result.filePaths.length === 0) throw new Error("Restore cancelled");
      const backupPath = result.filePaths[0];
      const validation = validateBackup(backupPath);
      if (!validation.valid) throw new Error(validation.error || "Invalid backup file");
      return { backupPath, metadata: validation.metadata };
    })
  );

  ipcMain.handle("backup:confirmRestore",
    wrapHandler((_e: unknown, backupPath: string) => {
      requireAuth();
      const result = restoreBackup(backupPath);
      if (!result.success) throw new Error(result.error || "Restore failed");
      return { success: true };
    })
  );

  ipcMain.handle("backup:validate",
    wrapHandler((_e: unknown, backupPath: string) => {
      requireAuth();
      return validateBackup(backupPath);
    })
  );

  ipcMain.handle("backup:getHistory",
    wrapHandler(() => {
      requireAuth();
      const settings = getAutoBackupSettings();
      const dir = settings.location || join(app.getPath("userData"), "backups");
      return listBackupsInDirectory(dir);
    })
  );

  ipcMain.handle("backup:delete",
    wrapHandler((_e: unknown, backupPath: string) => {
      requireAuth();
      validateBackupPath(backupPath);
      deleteBackupFile(backupPath);
      return { success: true };
    })
  );

  ipcMain.handle("backup:openFolder",
    wrapHandler(async () => {
      requireAuth();
      const settings = getAutoBackupSettings();
      const dir = settings.location || join(app.getPath("userData"), "backups");
      await shell.openPath(dir);
      return { success: true };
    })
  );

  ipcMain.handle("backup:getSettings",
    wrapHandler(() => {
      requireAuth();
      return getAutoBackupSettings();
    })
  );

  ipcMain.handle("backup:saveSettings",
    wrapHandler((_e: unknown, settings: Record<string, unknown>) => {
      requireAuth();
      return saveAutoBackupSettings(settings);
    })
  );

  ipcMain.handle("backup:runAutoBackup",
    wrapHandler(() => {
      requireAuth();
      return runAutoBackup();
    })
  );

  ipcMain.handle("backup:selectDirectory",
    wrapHandler(async () => {
      requireAuth();
      const result = await dialog.showOpenDialog({
        title: "Select Backup Directory",
        properties: ["openDirectory"],
      });
      if (result.canceled || result.filePaths.length === 0) throw new Error("Selection cancelled");
      return result.filePaths[0];
    })
  );

  ipcMain.handle("settings:getAll",
    wrapHandler(() => {
      requireAuth();
      return getAllSettings();
    })
  );

  ipcMain.handle("settings:update",
    wrapHandler((_e: unknown, partial: Partial<AppSettings>) => {
      requireAuth();
      return updateSettings(partial);
    })
  );

  ipcMain.handle("settings:reset",
    wrapHandler(() => {
      requireAuth();
      return resetSettings();
    })
  );

  ipcMain.handle("profile:changePassword",
    wrapHandler((_e: unknown, currentPassword: string, newPassword: string) => {
      const session = requireAuth();
      if (session.type === "owner") {
        const owner = db.select().from(schema.owners).where(eq(schema.owners.id, session.id)).get();
        if (!owner) throw new Error("Owner not found");
        if (!bcrypt.compareSync(currentPassword, owner.passwordHash)) throw new Error("Current password is incorrect");
        const hash = bcrypt.hashSync(newPassword, 10);
        db.update(schema.owners).set({ passwordHash: hash, updatedAt: new Date().toISOString() }).where(eq(schema.owners.id, session.id)).run();
        return { success: true };
      } else if (session.type === "farm") {
        const farm = db.select().from(schema.farms).where(eq(schema.farms.id, session.farmId!)).get();
        if (!farm) throw new Error("Farm not found");
        if (!bcrypt.compareSync(currentPassword, farm.loginPasswordHash)) throw new Error("Current password is incorrect");
        const hash = bcrypt.hashSync(newPassword, 10);
        db.update(schema.farms).set({ loginPasswordHash: hash }).where(eq(schema.farms.id, session.farmId!)).run();
        return { success: true };
      }
      throw new Error("Password change not supported for this account type");
    })
  );

  ipcMain.handle("profile:getOwnerProfile",
    wrapHandler(() => {
      const session = requireOwner();
      const owner = db.select().from(schema.owners).where(eq(schema.owners.id, session.id)).get();
      if (!owner) throw new Error("Owner not found");
      const { passwordHash: _, ...safe } = owner;
      return safe;
    })
  );

  ipcMain.handle("profile:getFarmProfile",
    wrapHandler(() => {
      const session = requireAuth();
      if (!session.farmId) throw new Error("No farm associated");
      const farm = db.select().from(schema.farms).where(eq(schema.farms.id, session.farmId)).get();
      if (!farm) throw new Error("Farm not found");
      const { loginPasswordHash: _, ...safe } = farm;
      return safe;
    })
  );

  ipcMain.handle("data:getSystemInfo",
    wrapHandler(() => {
      requireAuth();
      const dbPath = getDatabasePath();
      let dbSize = 0;
      try { dbSize = statSync(dbPath).size; } catch {}
      return {
        dbPath,
        dbSize,
        electronVersion: process.versions.electron || "N/A",
        nodeVersion: process.versions.node || "N/A",
        chromeVersion: process.versions.chrome || "N/A",
        appVersion: app.getVersion(),
        platform: process.platform,
      };
    })
  );

  ipcMain.handle("data:exportAllData",
    wrapHandler((_e: unknown, farmId: number, options: { startDate?: string; endDate?: string; includeFlocks?: boolean; includeEntries?: boolean; includeExpenses?: boolean; includeInventory?: boolean; includeVaccinations?: boolean }) => {
      requireFarmAccess(farmId);
      const result: Record<string, unknown[]> = {};

      if (options.includeFlocks !== false) {
        result.flocks = db.select().from(schema.flocks).where(eq(schema.flocks.farmId, farmId)).all();
      }
      if (options.includeEntries !== false) {
        let q = db.select().from(schema.dailyEntries)
          .innerJoin(schema.flocks, eq(schema.dailyEntries.flockId, schema.flocks.id))
          .where(eq(schema.flocks.farmId, farmId));
        if (options.startDate) q = q.where(gte(schema.dailyEntries.entryDate, options.startDate)) as typeof q;
        if (options.endDate) q = q.where(lte(schema.dailyEntries.entryDate, options.endDate)) as typeof q;
        result.dailyEntries = q.all();
      }
      if (options.includeExpenses !== false) {
        let conditions = [eq(schema.expenses.farmId, farmId)];
        if (options.startDate) conditions.push(gte(schema.expenses.expenseDate, options.startDate));
        if (options.endDate) conditions.push(lte(schema.expenses.expenseDate, options.endDate));
        result.expenses = db.select().from(schema.expenses).where(and(...conditions)).all();
      }
      if (options.includeInventory !== false) {
        result.inventory = db.select().from(schema.inventory).where(eq(schema.inventory.farmId, farmId)).all();
      }
      if (options.includeVaccinations !== false) {
        result.vaccinations = db.select().from(schema.vaccinations)
          .innerJoin(schema.flocks, eq(schema.vaccinations.flockId, schema.flocks.id))
          .where(eq(schema.flocks.farmId, farmId)).all();
      }
      return result;
    })
  );

  ipcMain.handle("data:clearDismissedAlerts",
    wrapHandler((_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      db.delete(schema.dismissedAlerts).where(eq(schema.dismissedAlerts.farmId, farmId)).run();
      return { success: true };
    })
  );

  ipcMain.handle("data:resetFarmData",
    wrapHandler((_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      const flockIds = db.select({ id: schema.flocks.id }).from(schema.flocks).where(eq(schema.flocks.farmId, farmId)).all().map(f => f.id);
      if (flockIds.length > 0) {
        for (const fid of flockIds) {
          db.delete(schema.dailyEntries).where(eq(schema.dailyEntries.flockId, fid)).run();
          db.delete(schema.vaccinations).where(eq(schema.vaccinations.flockId, fid)).run();
        }
        db.delete(schema.flocks).where(eq(schema.flocks.farmId, farmId)).run();
      }
      const saleIds = db.select({ id: schema.sales.id }).from(schema.sales).where(eq(schema.sales.farmId, farmId)).all().map(s => s.id);
      if (saleIds.length > 0) {
        for (const sid of saleIds) {
          db.delete(schema.salePayments).where(eq(schema.salePayments.saleId, sid)).run();
          db.delete(schema.saleItems).where(eq(schema.saleItems.saleId, sid)).run();
        }
        db.delete(schema.sales).where(eq(schema.sales.farmId, farmId)).run();
      }
      db.delete(schema.customers).where(eq(schema.customers.farmId, farmId)).run();
      db.delete(schema.expenses).where(eq(schema.expenses.farmId, farmId)).run();
      db.delete(schema.inventory).where(eq(schema.inventory.farmId, farmId)).run();
      db.delete(schema.eggPrices).where(eq(schema.eggPrices.farmId, farmId)).run();
      db.delete(schema.dismissedAlerts).where(eq(schema.dismissedAlerts.farmId, farmId)).run();
      return { success: true };
    })
  );

  ipcMain.handle("data:deleteOwnerAccount",
    wrapHandler((_e: unknown, ownerId: number, password: string) => {
      const session = requireOwner();
      if (session.id !== ownerId) throw new Error("Access denied");
      const owner = db.select().from(schema.owners).where(eq(schema.owners.id, ownerId)).get();
      if (!owner) throw new Error("Owner not found");
      if (!bcrypt.compareSync(password, owner.passwordHash)) throw new Error("Incorrect password");

      const ownerFarms = db.select().from(schema.farms).where(eq(schema.farms.ownerId, ownerId)).all();
      for (const farm of ownerFarms) {
        const flockIds = db.select({ id: schema.flocks.id }).from(schema.flocks).where(eq(schema.flocks.farmId, farm.id)).all().map(f => f.id);
        for (const fid of flockIds) {
          db.delete(schema.dailyEntries).where(eq(schema.dailyEntries.flockId, fid)).run();
          db.delete(schema.vaccinations).where(eq(schema.vaccinations.flockId, fid)).run();
        }
        db.delete(schema.flocks).where(eq(schema.flocks.farmId, farm.id)).run();
        const farmSaleIds = db.select({ id: schema.sales.id }).from(schema.sales).where(eq(schema.sales.farmId, farm.id)).all().map(s => s.id);
        if (farmSaleIds.length > 0) {
          for (const sid of farmSaleIds) {
            db.delete(schema.salePayments).where(eq(schema.salePayments.saleId, sid)).run();
            db.delete(schema.saleItems).where(eq(schema.saleItems.saleId, sid)).run();
          }
          db.delete(schema.sales).where(eq(schema.sales.farmId, farm.id)).run();
        }
        db.delete(schema.customers).where(eq(schema.customers.farmId, farm.id)).run();
        db.delete(schema.expenses).where(eq(schema.expenses.farmId, farm.id)).run();
        db.delete(schema.inventory).where(eq(schema.inventory.farmId, farm.id)).run();
        db.delete(schema.eggPrices).where(eq(schema.eggPrices.farmId, farm.id)).run();
        db.delete(schema.dismissedAlerts).where(eq(schema.dismissedAlerts.farmId, farm.id)).run();
        db.delete(schema.users).where(eq(schema.users.farmId, farm.id)).run();
      }
      db.delete(schema.farms).where(eq(schema.farms.ownerId, ownerId)).run();
      db.delete(schema.owners).where(eq(schema.owners.id, ownerId)).run();

      currentSession = null;
      store.set("session", null);
      return { success: true };
    })
  );

  ipcMain.handle(
    "customers:create",
    wrapHandler(async (_e: unknown, data: {
      farmId: number; name: string; phone?: string; address?: string;
      businessName?: string; category: string; paymentTermsDays?: number;
      defaultPricePerEgg?: number; defaultPricePerTray?: number; notes?: string;
    }) => {
      requireFarmAccess(data.farmId);
      if (!data.name || data.name.trim().length < 2) throw new Error("Name is required (min 2 characters)");
      if (!data.category) throw new Error("Category is required");

      const result = db.insert(schema.customers).values({
        farmId: data.farmId,
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
        businessName: data.businessName?.trim() || null,
        category: data.category,
        paymentTermsDays: data.paymentTermsDays ?? 0,
        defaultPricePerEgg: data.defaultPricePerEgg !== undefined && data.defaultPricePerEgg !== null ? data.defaultPricePerEgg : null,
        defaultPricePerTray: data.defaultPricePerTray !== undefined && data.defaultPricePerTray !== null ? data.defaultPricePerTray : null,
        notes: data.notes?.trim() || null,
      }).run();

      return db.select().from(schema.customers)
        .where(eq(schema.customers.id, Number(result.lastInsertRowid))).get();
    })
  );

  ipcMain.handle(
    "customers:getByFarm",
    wrapHandler(async (_e: unknown, farmId: number, filters?: {
      search?: string; category?: string; status?: string;
    }) => {
      requireFarmAccess(farmId);
      const conditions = [eq(schema.customers.farmId, farmId)];

      if (filters?.category && filters.category !== "all") {
        conditions.push(eq(schema.customers.category, filters.category));
      }
      if (filters?.status === "active") {
        conditions.push(eq(schema.customers.isActive, 1));
      } else if (filters?.status === "inactive") {
        conditions.push(eq(schema.customers.isActive, 0));
      }

      let results = db.select().from(schema.customers)
        .where(and(...conditions))
        .orderBy(desc(schema.customers.createdAt))
        .all();

      if (filters?.search) {
        const q = filters.search.toLowerCase();
        results = results.filter(c =>
          c.name.toLowerCase().includes(q) ||
          (c.phone && c.phone.toLowerCase().includes(q)) ||
          (c.businessName && c.businessName.toLowerCase().includes(q))
        );
      }

      return results;
    })
  );

  ipcMain.handle(
    "customers:getById",
    wrapHandler(async (_e: unknown, customerId: number) => {
      requireAuth();
      const customer = db.select().from(schema.customers)
        .where(eq(schema.customers.id, customerId)).get();
      if (!customer) throw new Error("Customer not found");
      requireFarmAccess(customer.farmId);

      const customerSales = db.select().from(schema.sales)
        .where(and(
          eq(schema.sales.customerId, customerId),
          eq(schema.sales.isDeleted, 0)
        ))
        .orderBy(desc(schema.sales.saleDate))
        .all();

      let totalPurchases = 0;
      let totalPaid = 0;
      let balanceDue = 0;
      for (const s of customerSales) {
        totalPurchases += s.totalAmount ?? 0;
        totalPaid += s.paidAmount ?? 0;
        balanceDue += s.balanceDue ?? 0;
      }

      const stats = {
        totalPurchases: Math.round(totalPurchases * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        balanceDue: Math.round(balanceDue * 100) / 100,
        lastPurchaseDate: customerSales.length > 0 ? customerSales[0].saleDate : null,
        totalOrders: customerSales.length,
      };

      return { ...customer, stats };
    })
  );

  ipcMain.handle(
    "customers:update",
    wrapHandler(async (_e: unknown, customerId: number, data: {
      name?: string; phone?: string; address?: string; businessName?: string;
      category?: string; paymentTermsDays?: number; defaultPricePerEgg?: number | null;
      defaultPricePerTray?: number | null; notes?: string; isActive?: number;
    }) => {
      requireAuth();
      const existing = db.select().from(schema.customers)
        .where(eq(schema.customers.id, customerId)).get();
      if (!existing) throw new Error("Customer not found");
      requireFarmAccess(existing.farmId);

      if (data.name !== undefined && data.name.trim().length < 2) {
        throw new Error("Name must be at least 2 characters");
      }

      const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
      if (data.name !== undefined) updateData.name = data.name.trim();
      if (data.phone !== undefined) updateData.phone = data.phone.trim() || null;
      if (data.address !== undefined) updateData.address = data.address.trim() || null;
      if (data.businessName !== undefined) updateData.businessName = data.businessName.trim() || null;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.paymentTermsDays !== undefined) updateData.paymentTermsDays = data.paymentTermsDays;
      if (data.defaultPricePerEgg !== undefined) updateData.defaultPricePerEgg = data.defaultPricePerEgg !== null ? data.defaultPricePerEgg : null;
      if (data.defaultPricePerTray !== undefined) updateData.defaultPricePerTray = data.defaultPricePerTray !== null ? data.defaultPricePerTray : null;
      if (data.notes !== undefined) updateData.notes = data.notes.trim() || null;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      db.update(schema.customers).set(updateData)
        .where(eq(schema.customers.id, customerId)).run();

      return db.select().from(schema.customers)
        .where(eq(schema.customers.id, customerId)).get();
    })
  );

  ipcMain.handle(
    "customers:delete",
    wrapHandler(async (_e: unknown, customerId: number) => {
      requireAuth();
      const existing = db.select().from(schema.customers)
        .where(eq(schema.customers.id, customerId)).get();
      if (!existing) throw new Error("Customer not found");
      requireFarmAccess(existing.farmId);

      db.update(schema.customers).set({ isActive: 0, updatedAt: new Date().toISOString() })
        .where(eq(schema.customers.id, customerId)).run();

      return { success: true };
    })
  );

  ipcMain.handle(
    "customers:search",
    wrapHandler(async (_e: unknown, farmId: number, query: string) => {
      requireFarmAccess(farmId);
      const allCustomers = db.select().from(schema.customers)
        .where(and(
          eq(schema.customers.farmId, farmId),
          eq(schema.customers.isActive, 1)
        ))
        .orderBy(desc(schema.customers.createdAt))
        .all();

      if (!query || !query.trim()) return allCustomers;

      const q = query.toLowerCase().trim();
      return allCustomers.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.businessName && c.businessName.toLowerCase().includes(q))
      );
    })
  );

  ipcMain.handle(
    "sales:getNextInvoiceNumber",
    wrapHandler(async (_e: unknown, farmId: number) => {
      requireFarmAccess(farmId);
      const year = new Date().getFullYear();
      const prefix = `INV-${year}-`;
      const lastSale = db.select({ invoiceNumber: schema.sales.invoiceNumber })
        .from(schema.sales)
        .where(and(
          eq(schema.sales.farmId, farmId),
          like(schema.sales.invoiceNumber, `${prefix}%`)
        ))
        .orderBy(desc(schema.sales.id))
        .limit(1)
        .get();

      let nextSeq = 1;
      if (lastSale) {
        const lastNum = parseInt(lastSale.invoiceNumber.replace(prefix, ""), 10);
        if (!isNaN(lastNum)) nextSeq = lastNum + 1;
      }
      return `${prefix}${String(nextSeq).padStart(3, "0")}`;
    })
  );

  ipcMain.handle(
    "sales:create",
    wrapHandler(async (_e: unknown, data: {
      farmId: number; customerId: number; saleDate: string; dueDate?: string;
      items: { itemType: string; grade: string; quantity: number; unitPrice: number; lineTotal: number }[];
      discountType?: string; discountValue?: number; amountPaid?: number;
      paymentMethod?: string; notes?: string;
    }) => {
      requireFarmAccess(data.farmId);
      if (!data.customerId) throw new Error("Customer is required");
      if (!data.items || data.items.length === 0) throw new Error("At least one item is required");

      const validItems = data.items.filter(i => i.quantity > 0 && i.unitPrice > 0);
      if (validItems.length === 0) throw new Error("At least one item with quantity > 0 is required");

      const customer = db.select().from(schema.customers)
        .where(eq(schema.customers.id, data.customerId)).get();
      if (!customer) throw new Error("Customer not found");
      requireFarmAccess(customer.farmId);

      const year = new Date().getFullYear();
      const prefix = `INV-${year}-`;
      const lastSale = db.select({ invoiceNumber: schema.sales.invoiceNumber })
        .from(schema.sales)
        .where(and(
          eq(schema.sales.farmId, data.farmId),
          like(schema.sales.invoiceNumber, `${prefix}%`)
        ))
        .orderBy(desc(schema.sales.id))
        .limit(1)
        .get();
      let nextSeq = 1;
      if (lastSale) {
        const lastNum = parseInt(lastSale.invoiceNumber.replace(prefix, ""), 10);
        if (!isNaN(lastNum)) nextSeq = lastNum + 1;
      }
      const invoiceNumber = `${prefix}${String(nextSeq).padStart(3, "0")}`;

      const subtotal = validItems.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
      const discountType = data.discountType || "none";
      const discountValue = Math.max(0, data.discountValue || 0);
      let discountAmount = 0;
      if (discountType === "percentage") {
        discountAmount = Math.round(subtotal * (Math.min(discountValue, 100) / 100) * 100) / 100;
      } else if (discountType === "fixed") {
        discountAmount = Math.min(discountValue, subtotal);
      }
      const totalAmount = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);
      if ((data.amountPaid || 0) < 0) throw new Error("Amount paid cannot be negative");
      const paidAmount = Math.min(Math.max(0, data.amountPaid || 0), totalAmount);
      const balanceDue = Math.max(0, Math.round((totalAmount - paidAmount) * 100) / 100);
      const paymentStatus = paidAmount >= totalAmount ? "paid" : paidAmount > 0 ? "partial" : "unpaid";

      const dueDate = data.dueDate || (customer.paymentTermsDays
        ? (() => { const d = new Date(data.saleDate); d.setDate(d.getDate() + (customer.paymentTermsDays || 0)); return d.toISOString().split("T")[0]; })()
        : data.saleDate);

      const result = db.insert(schema.sales).values({
        farmId: data.farmId,
        customerId: data.customerId,
        invoiceNumber,
        saleDate: data.saleDate,
        dueDate,
        subtotal,
        discountType,
        discountValue,
        discountAmount,
        totalAmount,
        paidAmount,
        balanceDue,
        paymentStatus,
        notes: data.notes?.trim() || null,
      }).run();

      const saleId = Number(result.lastInsertRowid);

      for (const item of validItems) {
        db.insert(schema.saleItems).values({
          saleId,
          itemType: item.itemType,
          grade: item.grade,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: Math.round(item.quantity * item.unitPrice * 100) / 100,
        }).run();
      }

      if (paidAmount > 0) {
        db.insert(schema.salePayments).values({
          saleId,
          amount: paidAmount,
          paymentDate: data.saleDate,
          paymentMethod: data.paymentMethod || "cash",
          notes: "Initial payment",
        }).run();
      }

      return db.select().from(schema.sales).where(eq(schema.sales.id, saleId)).get();
    })
  );

  ipcMain.handle(
    "sales:getByFarm",
    wrapHandler(async (_e: unknown, farmId: number, filters?: {
      startDate?: string; endDate?: string; customerId?: number;
      paymentStatus?: string; search?: string;
    }) => {
      requireFarmAccess(farmId);
      const conditions: ReturnType<typeof eq>[] = [
        eq(schema.sales.farmId, farmId),
        eq(schema.sales.isDeleted, 0),
      ];

      if (filters?.startDate) conditions.push(gte(schema.sales.saleDate, filters.startDate));
      if (filters?.endDate) conditions.push(lte(schema.sales.saleDate, filters.endDate));
      if (filters?.customerId) conditions.push(eq(schema.sales.customerId, filters.customerId));
      if (filters?.paymentStatus && filters.paymentStatus !== "all") {
        conditions.push(eq(schema.sales.paymentStatus, filters.paymentStatus));
      }

      const salesRows = db.select({
        id: schema.sales.id,
        farmId: schema.sales.farmId,
        customerId: schema.sales.customerId,
        invoiceNumber: schema.sales.invoiceNumber,
        saleDate: schema.sales.saleDate,
        dueDate: schema.sales.dueDate,
        subtotal: schema.sales.subtotal,
        discountType: schema.sales.discountType,
        discountValue: schema.sales.discountValue,
        discountAmount: schema.sales.discountAmount,
        totalAmount: schema.sales.totalAmount,
        paidAmount: schema.sales.paidAmount,
        balanceDue: schema.sales.balanceDue,
        paymentStatus: schema.sales.paymentStatus,
        notes: schema.sales.notes,
        isDeleted: schema.sales.isDeleted,
        createdAt: schema.sales.createdAt,
        updatedAt: schema.sales.updatedAt,
        customerName: schema.customers.name,
        customerPhone: schema.customers.phone,
        customerBusinessName: schema.customers.businessName,
      })
        .from(schema.sales)
        .innerJoin(schema.customers, eq(schema.sales.customerId, schema.customers.id))
        .where(and(...conditions))
        .orderBy(desc(schema.sales.saleDate), desc(schema.sales.id))
        .all();

      let results = salesRows;
      if (filters?.search) {
        const q = filters.search.toLowerCase().trim();
        results = results.filter(s =>
          s.invoiceNumber.toLowerCase().includes(q) ||
          s.customerName.toLowerCase().includes(q)
        );
      }

      return results;
    })
  );

  ipcMain.handle(
    "sales:getById",
    wrapHandler(async (_e: unknown, saleId: number) => {
      requireAuth();
      const sale = db.select().from(schema.sales).where(eq(schema.sales.id, saleId)).get();
      if (!sale) throw new Error("Sale not found");
      requireFarmAccess(sale.farmId);

      const customer = db.select().from(schema.customers)
        .where(eq(schema.customers.id, sale.customerId)).get();
      const items = db.select().from(schema.saleItems)
        .where(eq(schema.saleItems.saleId, saleId)).all();
      const payments = db.select().from(schema.salePayments)
        .where(eq(schema.salePayments.saleId, saleId))
        .orderBy(desc(schema.salePayments.paymentDate))
        .all();

      return { ...sale, customer, items, payments };
    })
  );

  ipcMain.handle(
    "sales:update",
    wrapHandler(async (_e: unknown, saleId: number, data: {
      farmId: number; customerId: number; saleDate: string; dueDate?: string;
      items: { itemType: string; grade: string; quantity: number; unitPrice: number; lineTotal: number }[];
      discountType?: string; discountValue?: number; notes?: string;
    }) => {
      requireAuth();
      const existing = db.select().from(schema.sales).where(eq(schema.sales.id, saleId)).get();
      if (!existing) throw new Error("Sale not found");
      requireFarmAccess(existing.farmId);

      const payments = db.select().from(schema.salePayments)
        .where(eq(schema.salePayments.saleId, saleId)).all();
      if (payments.length > 0) throw new Error("Cannot edit a sale that has payments recorded");

      const validItems = data.items.filter(i => i.quantity > 0 && i.unitPrice > 0);
      if (validItems.length === 0) throw new Error("At least one item with quantity > 0 is required");

      const updCustomer = db.select().from(schema.customers)
        .where(eq(schema.customers.id, data.customerId)).get();
      if (!updCustomer) throw new Error("Customer not found");
      requireFarmAccess(updCustomer.farmId);
      if (updCustomer.farmId !== existing.farmId) throw new Error("Customer does not belong to this farm");

      const subtotal = validItems.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
      const discountType = data.discountType || "none";
      const discountValue = Math.max(0, data.discountValue || 0);
      let discountAmount = 0;
      if (discountType === "percentage") {
        discountAmount = Math.round(subtotal * (Math.min(discountValue, 100) / 100) * 100) / 100;
      } else if (discountType === "fixed") {
        discountAmount = Math.min(discountValue, subtotal);
      }
      const totalAmount = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

      db.update(schema.sales).set({
        customerId: data.customerId,
        saleDate: data.saleDate,
        dueDate: data.dueDate || existing.dueDate,
        subtotal,
        discountType,
        discountValue,
        discountAmount,
        totalAmount,
        paidAmount: 0,
        balanceDue: totalAmount,
        paymentStatus: "unpaid",
        notes: data.notes?.trim() || null,
        updatedAt: new Date().toISOString(),
      }).where(eq(schema.sales.id, saleId)).run();

      db.delete(schema.saleItems).where(eq(schema.saleItems.saleId, saleId)).run();
      for (const item of validItems) {
        db.insert(schema.saleItems).values({
          saleId,
          itemType: item.itemType,
          grade: item.grade,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: Math.round(item.quantity * item.unitPrice * 100) / 100,
        }).run();
      }

      return db.select().from(schema.sales).where(eq(schema.sales.id, saleId)).get();
    })
  );

  ipcMain.handle(
    "sales:delete",
    wrapHandler(async (_e: unknown, saleId: number) => {
      requireAuth();
      const existing = db.select().from(schema.sales).where(eq(schema.sales.id, saleId)).get();
      if (!existing) throw new Error("Sale not found");
      requireFarmAccess(existing.farmId);

      const payments = db.select().from(schema.salePayments)
        .where(eq(schema.salePayments.saleId, saleId)).all();
      if (payments.length > 0) throw new Error("Cannot delete a sale that has payments recorded");

      db.update(schema.sales).set({
        isDeleted: 1,
        updatedAt: new Date().toISOString(),
      }).where(eq(schema.sales.id, saleId)).run();

      return { success: true };
    })
  );

  ipcMain.handle(
    "sales:getSummary",
    wrapHandler(async (_e: unknown, farmId: number, startDate: string, endDate: string) => {
      requireFarmAccess(farmId);
      const salesInRange = db.select().from(schema.sales)
        .where(and(
          eq(schema.sales.farmId, farmId),
          eq(schema.sales.isDeleted, 0),
          gte(schema.sales.saleDate, startDate),
          lte(schema.sales.saleDate, endDate)
        ))
        .all();

      let totalSales = 0;
      let totalReceived = 0;
      let totalOutstanding = 0;
      for (const s of salesInRange) {
        totalSales += s.totalAmount ?? 0;
        totalReceived += s.paidAmount ?? 0;
        totalOutstanding += s.balanceDue ?? 0;
      }

      return {
        totalSales: Math.round(totalSales * 100) / 100,
        totalReceived: Math.round(totalReceived * 100) / 100,
        totalOutstanding: Math.round(totalOutstanding * 100) / 100,
        salesCount: salesInRange.length,
      };
    })
  );

  ipcMain.handle(
    "sales:recordPayment",
    wrapHandler(async (_e: unknown, data: {
      saleId: number; amount: number; paymentDate: string;
      paymentMethod: string; notes?: string;
    }) => {
      requireAuth();
      const sale = db.select().from(schema.sales).where(eq(schema.sales.id, data.saleId)).get();
      if (!sale) throw new Error("Sale not found");
      if (sale.isDeleted === 1) throw new Error("Cannot record payment on a deleted sale");
      requireFarmAccess(sale.farmId);

      if (data.amount <= 0) throw new Error("Payment amount must be positive");
      const currentBalance = sale.balanceDue ?? 0;
      if (data.amount > currentBalance + 0.01) throw new Error("Payment amount exceeds balance due");

      const result = db.insert(schema.salePayments).values({
        saleId: data.saleId,
        amount: data.amount,
        paymentDate: data.paymentDate,
        paymentMethod: data.paymentMethod || "cash",
        notes: data.notes?.trim() || null,
      }).run();

      const newPaid = (sale.paidAmount ?? 0) + data.amount;
      const newBalance = Math.max(0, Math.round(((sale.totalAmount ?? 0) - newPaid) * 100) / 100);
      const newStatus = newPaid >= (sale.totalAmount ?? 0) ? "paid" : newPaid > 0 ? "partial" : "unpaid";

      db.update(schema.sales).set({
        paidAmount: Math.round(newPaid * 100) / 100,
        balanceDue: newBalance,
        paymentStatus: newStatus,
        updatedAt: new Date().toISOString(),
      }).where(eq(schema.sales.id, data.saleId)).run();

      return db.select().from(schema.salePayments)
        .where(eq(schema.salePayments.id, Number(result.lastInsertRowid))).get();
    })
  );
}
