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
    totalEggs: integer("total_eggs").default(0),
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

export const eggCategories = sqliteTable(
  "egg_categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    farmId: integer("farm_id").notNull().references(() => farms.id),
    name: text("name").notNull(),
    description: text("description").default(""),
    defaultPrice: real("default_price").notNull().default(0),
    unit: text("unit").notNull().default("tray"),
    isActive: integer("is_active").notNull().default(1),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("egg_categories_farm_name_unique").on(table.farmId, table.name),
  ]
);

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

export const inventoryTransactions = sqliteTable("inventory_transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  inventoryId: integer("inventory_id").references(() => inventory.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  quantity: real("quantity").notNull(),
  date: text("date").notNull(),
  reason: text("reason"),
  supplier: text("supplier"),
  cost: real("cost"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const dismissedAlerts = sqliteTable("dismissed_alerts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  farmId: integer("farm_id").references(() => farms.id),
  alertType: text("alert_type").notNull(),
  referenceId: integer("reference_id").notNull(),
  dismissedAt: text("dismissed_at").default(sql`CURRENT_TIMESTAMP`),
});

export const vaccinations = sqliteTable("vaccinations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  flockId: integer("flock_id").references(() => flocks.id),
  vaccineName: text("vaccine_name").notNull(),
  scheduledDate: text("scheduled_date").notNull(),
  administeredDate: text("administered_date"),
  administeredBy: text("administered_by"),
  batchNumber: text("batch_number"),
  dosage: text("dosage"),
  route: text("route"),
  notes: text("notes"),
  status: text("status").default("pending"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  farmId: integer("farm_id").notNull().references(() => farms.id),
  name: text("name").notNull(),
  phone: text("phone"),
  address: text("address"),
  businessName: text("business_name"),
  category: text("category").notNull().default("individual"),
  paymentTermsDays: integer("payment_terms_days").default(0),
  defaultPricePerEgg: real("default_price_per_egg"),
  defaultPricePerTray: real("default_price_per_tray"),
  notes: text("notes"),
  isActive: integer("is_active").default(1),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const sales = sqliteTable("sales", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  farmId: integer("farm_id").notNull().references(() => farms.id),
  customerId: integer("customer_id").references(() => customers.id),
  walkInCustomerName: text("walk_in_customer_name").default(""),
  invoiceNumber: text("invoice_number").notNull(),
  saleDate: text("sale_date").notNull(),
  dueDate: text("due_date"),
  subtotal: real("subtotal").notNull().default(0),
  discountType: text("discount_type").default("none"),
  discountValue: real("discount_value").default(0),
  discountAmount: real("discount_amount").default(0),
  totalAmount: real("total_amount").notNull().default(0),
  paidAmount: real("paid_amount").default(0),
  balanceDue: real("balance_due").default(0),
  paymentStatus: text("payment_status").default("unpaid"),
  notes: text("notes"),
  isDeleted: integer("is_deleted").default(0),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const saleItems = sqliteTable("sale_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  saleId: integer("sale_id").notNull().references(() => sales.id, { onDelete: "cascade" }),
  itemType: text("item_type").notNull(),
  grade: text("grade").notNull(),
  unitType: text("unit_type").notNull().default("tray"),
  quantity: real("quantity").notNull().default(0),
  unitPrice: real("unit_price").notNull().default(0),
  totalEggs: integer("total_eggs").notNull().default(0),
  lineTotal: real("line_total").notNull().default(0),
});

export const salePayments = sqliteTable("sale_payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  saleId: integer("sale_id").notNull().references(() => sales.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  paymentDate: text("payment_date").notNull(),
  paymentMethod: text("payment_method").default("cash"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const vaccines = sqliteTable("vaccines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  farmId: integer("farm_id").notNull().references(() => farms.id),
  name: text("name").notNull(),
  defaultRoute: text("default_route"),
  notes: text("notes"),
  isDefault: integer("is_default").default(0),
  isActive: integer("is_active").default(1),
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
