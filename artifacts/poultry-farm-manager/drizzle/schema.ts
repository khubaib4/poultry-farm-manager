import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const owners = sqliteTable("owners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").unique(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const farms = sqliteTable("farms", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerId: integer("owner_id").references(() => owners.id),
  name: text("name").notNull(),
  location: text("location"),
  capacity: integer("capacity"),
  loginUsername: text("login_username").unique().notNull(),
  loginPasswordHash: text("login_password_hash").notNull(),
  isActive: integer("is_active").default(1),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  farmId: integer("farm_id").references(() => farms.id),
  name: text("name").notNull(),
  role: text("role").notNull(),
  passwordHash: text("password_hash").notNull(),
  isActive: integer("is_active").default(1),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const flocks = sqliteTable("flocks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  farmId: integer("farm_id").references(() => farms.id),
  batchName: text("batch_name").notNull(),
  breed: text("breed"),
  initialCount: integer("initial_count").notNull(),
  currentCount: integer("current_count").notNull(),
  arrivalDate: text("arrival_date").notNull(),
  ageAtArrivalDays: integer("age_at_arrival_days").default(0),
  status: text("status").default("active"),
  statusChangedDate: text("status_changed_date"),
  statusNotes: text("status_notes"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const dailyEntries = sqliteTable(
  "daily_entries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    flockId: integer("flock_id").references(() => flocks.id),
    entryDate: text("entry_date").notNull(),
    deaths: integer("deaths").default(0),
    deathCause: text("death_cause"),
    eggsGradeA: integer("eggs_grade_a").default(0),
    eggsGradeB: integer("eggs_grade_b").default(0),
    eggsCracked: integer("eggs_cracked").default(0),
    feedConsumedKg: real("feed_consumed_kg").default(0),
    waterConsumedLiters: real("water_consumed_liters"),
    notes: text("notes"),
    recordedBy: integer("recorded_by").references(() => users.id),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("daily_entries_flock_date_unique").on(
      table.flockId,
      table.entryDate
    ),
  ]
);

export const eggPrices = sqliteTable("egg_prices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  farmId: integer("farm_id").references(() => farms.id),
  grade: text("grade").notNull(),
  pricePerEgg: real("price_per_egg").notNull(),
  pricePerTray: real("price_per_tray").notNull(),
  effectiveDate: text("effective_date").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const expenses = sqliteTable("expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  farmId: integer("farm_id").references(() => farms.id),
  category: text("category").notNull(),
  description: text("description"),
  amount: real("amount").notNull(),
  expenseDate: text("expense_date").notNull(),
  supplier: text("supplier"),
  receiptRef: text("receipt_ref"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const inventory = sqliteTable("inventory", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  farmId: integer("farm_id").references(() => farms.id),
  itemType: text("item_type").notNull(),
  itemName: text("item_name").notNull(),
  quantity: real("quantity").notNull(),
  unit: text("unit").notNull(),
  minThreshold: real("min_threshold"),
  expiryDate: text("expiry_date"),
  lastUpdated: text("last_updated").default(sql`CURRENT_TIMESTAMP`),
});

export const vaccinations = sqliteTable("vaccinations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  flockId: integer("flock_id").references(() => flocks.id),
  vaccineName: text("vaccine_name").notNull(),
  scheduledDate: text("scheduled_date").notNull(),
  administeredDate: text("administered_date"),
  administeredBy: text("administered_by"),
  batchNumber: text("batch_number"),
  notes: text("notes"),
  status: text("status").default("pending"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const vaccinationSchedule = sqliteTable("vaccination_schedule", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  vaccineName: text("vaccine_name").notNull(),
  ageDays: integer("age_days").notNull(),
  isMandatory: integer("is_mandatory").default(1),
  route: text("route"),
  notes: text("notes"),
});
