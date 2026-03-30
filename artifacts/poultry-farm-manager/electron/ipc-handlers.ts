import { ipcMain } from "electron";
import { eq, and, gte, lte, sql, sum, like, desc, isNotNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import Store from "electron-store";
import { getDatabase } from "./database";
import * as schema from "../drizzle/schema";

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
}
