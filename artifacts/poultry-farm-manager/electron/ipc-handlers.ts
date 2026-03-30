import { ipcMain } from "electron";
import { eq, and, gte, lte } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getDatabase } from "./database";
import * as schema from "../drizzle/schema";

let currentSession: {
  type: "owner" | "farm" | "user";
  id: number;
  name: string;
  farmId?: number;
  role?: string;
} | null = null;

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
      return currentSession;
    })
  );

  ipcMain.handle(
    "auth:logout",
    wrapHandler(() => {
      currentSession = null;
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
    wrapHandler((_e: unknown, id: number, data: Partial<{ name: string; location: string; capacity: number; loginUsername: string; loginPassword: string; isActive: number }>) => {
      const updates: Record<string, unknown> = {};
      if (data.name !== undefined) updates.name = data.name;
      if (data.location !== undefined) updates.location = data.location;
      if (data.capacity !== undefined) updates.capacity = data.capacity;
      if (data.loginUsername !== undefined) updates.loginUsername = data.loginUsername;
      if (data.loginPassword !== undefined) updates.loginPasswordHash = bcrypt.hashSync(data.loginPassword, 10);
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
      db.update(schema.farms)
        .set({ isActive: 0 })
        .where(eq(schema.farms.id, id))
        .run();
      return { id };
    })
  );

  ipcMain.handle(
    "users:create",
    wrapHandler((_e: unknown, data: { farmId: number; name: string; role: string; password: string }) => {
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
      db.update(schema.users)
        .set({ isActive: 0 })
        .where(eq(schema.users.id, id))
        .run();
      return { id };
    })
  );

  ipcMain.handle(
    "flocks:create",
    wrapHandler((_e: unknown, data: { farmId: number; batchName: string; breed?: string; initialCount: number; currentCount: number; arrivalDate: string; ageAtArrivalDays?: number; status?: string }) => {
      return db.insert(schema.flocks).values(data).returning().get();
    })
  );

  ipcMain.handle(
    "flocks:getByFarm",
    wrapHandler((_e: unknown, farmId: number) => {
      return db
        .select()
        .from(schema.flocks)
        .where(eq(schema.flocks.farmId, farmId))
        .all();
    })
  );

  ipcMain.handle(
    "flocks:getById",
    wrapHandler((_e: unknown, id: number) => {
      const flock = db
        .select()
        .from(schema.flocks)
        .where(eq(schema.flocks.id, id))
        .get();
      if (!flock) throw new Error("Flock not found");
      return flock;
    })
  );

  ipcMain.handle(
    "flocks:update",
    wrapHandler((_e: unknown, id: number, data: Partial<{ batchName: string; breed: string; currentCount: number; status: string }>) => {
      const result = db
        .update(schema.flocks)
        .set(data)
        .where(eq(schema.flocks.id, id))
        .returning()
        .get();
      if (!result) throw new Error("Flock not found");
      return result;
    })
  );

  ipcMain.handle(
    "dailyEntries:create",
    wrapHandler((_e: unknown, data: { flockId: number; entryDate: string; deaths?: number; deathCause?: string; eggsGradeA?: number; eggsGradeB?: number; eggsCracked?: number; feedConsumedKg?: number; waterConsumedLiters?: number; notes?: string; recordedBy?: number }) => {
      return db.insert(schema.dailyEntries).values(data).returning().get();
    })
  );

  ipcMain.handle(
    "dailyEntries:getByFlock",
    wrapHandler((_e: unknown, flockId: number, startDate?: string, endDate?: string) => {
      const conditions = [eq(schema.dailyEntries.flockId, flockId)];
      if (startDate) conditions.push(gte(schema.dailyEntries.entryDate, startDate));
      if (endDate) conditions.push(lte(schema.dailyEntries.entryDate, endDate));
      return db
        .select()
        .from(schema.dailyEntries)
        .where(and(...conditions))
        .all();
    })
  );

  ipcMain.handle(
    "dailyEntries:getByDate",
    wrapHandler((_e: unknown, flockId: number, date: string) => {
      return db
        .select()
        .from(schema.dailyEntries)
        .where(
          and(
            eq(schema.dailyEntries.flockId, flockId),
            eq(schema.dailyEntries.entryDate, date)
          )
        )
        .get();
    })
  );

  ipcMain.handle(
    "dailyEntries:update",
    wrapHandler((_e: unknown, id: number, data: Partial<{ deaths: number; deathCause: string; eggsGradeA: number; eggsGradeB: number; eggsCracked: number; feedConsumedKg: number; waterConsumedLiters: number; notes: string }>) => {
      const result = db
        .update(schema.dailyEntries)
        .set(data)
        .where(eq(schema.dailyEntries.id, id))
        .returning()
        .get();
      if (!result) throw new Error("Daily entry not found");
      return result;
    })
  );

  ipcMain.handle(
    "eggPrices:create",
    wrapHandler((_e: unknown, data: { farmId: number; grade: string; pricePerEgg: number; pricePerTray: number; effectiveDate: string }) => {
      return db.insert(schema.eggPrices).values(data).returning().get();
    })
  );

  ipcMain.handle(
    "eggPrices:getByFarm",
    wrapHandler((_e: unknown, farmId: number) => {
      return db
        .select()
        .from(schema.eggPrices)
        .where(eq(schema.eggPrices.farmId, farmId))
        .all();
    })
  );

  ipcMain.handle(
    "eggPrices:update",
    wrapHandler((_e: unknown, id: number, data: Partial<{ grade: string; pricePerEgg: number; pricePerTray: number; effectiveDate: string }>) => {
      const result = db
        .update(schema.eggPrices)
        .set(data)
        .where(eq(schema.eggPrices.id, id))
        .returning()
        .get();
      if (!result) throw new Error("Egg price not found");
      return result;
    })
  );

  ipcMain.handle(
    "expenses:create",
    wrapHandler((_e: unknown, data: { farmId: number; category: string; description?: string; amount: number; expenseDate: string; supplier?: string; receiptRef?: string }) => {
      return db.insert(schema.expenses).values(data).returning().get();
    })
  );

  ipcMain.handle(
    "expenses:getByFarm",
    wrapHandler((_e: unknown, farmId: number, startDate?: string, endDate?: string) => {
      const conditions = [eq(schema.expenses.farmId, farmId)];
      if (startDate) conditions.push(gte(schema.expenses.expenseDate, startDate));
      if (endDate) conditions.push(lte(schema.expenses.expenseDate, endDate));
      return db
        .select()
        .from(schema.expenses)
        .where(and(...conditions))
        .all();
    })
  );

  ipcMain.handle(
    "expenses:update",
    wrapHandler((_e: unknown, id: number, data: Partial<{ category: string; description: string; amount: number; expenseDate: string; supplier: string; receiptRef: string }>) => {
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
      db.delete(schema.expenses).where(eq(schema.expenses.id, id)).run();
      return { id };
    })
  );

  ipcMain.handle(
    "inventory:create",
    wrapHandler((_e: unknown, data: { farmId: number; itemType: string; itemName: string; quantity: number; unit: string; minThreshold?: number; expiryDate?: string }) => {
      return db.insert(schema.inventory).values(data).returning().get();
    })
  );

  ipcMain.handle(
    "inventory:getByFarm",
    wrapHandler((_e: unknown, farmId: number) => {
      return db
        .select()
        .from(schema.inventory)
        .where(eq(schema.inventory.farmId, farmId))
        .all();
    })
  );

  ipcMain.handle(
    "inventory:update",
    wrapHandler((_e: unknown, id: number, data: Partial<{ itemType: string; itemName: string; quantity: number; unit: string; minThreshold: number; expiryDate: string }>) => {
      const updates = { ...data, lastUpdated: new Date().toISOString() };
      const result = db
        .update(schema.inventory)
        .set(updates)
        .where(eq(schema.inventory.id, id))
        .returning()
        .get();
      if (!result) throw new Error("Inventory item not found");
      return result;
    })
  );

  ipcMain.handle(
    "inventory:delete",
    wrapHandler((_e: unknown, id: number) => {
      db.delete(schema.inventory).where(eq(schema.inventory.id, id)).run();
      return { id };
    })
  );

  ipcMain.handle(
    "vaccinations:create",
    wrapHandler((_e: unknown, data: { flockId: number; vaccineName: string; scheduledDate: string; administeredDate?: string; administeredBy?: string; batchNumber?: string; notes?: string; status?: string }) => {
      return db.insert(schema.vaccinations).values(data).returning().get();
    })
  );

  ipcMain.handle(
    "vaccinations:getByFlock",
    wrapHandler((_e: unknown, flockId: number) => {
      return db
        .select()
        .from(schema.vaccinations)
        .where(eq(schema.vaccinations.flockId, flockId))
        .all();
    })
  );

  ipcMain.handle(
    "vaccinations:update",
    wrapHandler((_e: unknown, id: number, data: Partial<{ vaccineName: string; scheduledDate: string; administeredDate: string; administeredBy: string; batchNumber: string; notes: string; status: string }>) => {
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
    "vaccinationSchedule:create",
    wrapHandler((_e: unknown, data: { vaccineName: string; ageDays: number; isMandatory?: number; route?: string; notes?: string }) => {
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
      return db.select().from(schema.vaccinationSchedule).all();
    })
  );

  ipcMain.handle(
    "vaccinationSchedule:update",
    wrapHandler((_e: unknown, id: number, data: Partial<{ vaccineName: string; ageDays: number; isMandatory: number; route: string; notes: string }>) => {
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
      db.delete(schema.vaccinationSchedule)
        .where(eq(schema.vaccinationSchedule.id, id))
        .run();
      return { id };
    })
  );
}
