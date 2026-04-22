import { app } from "electron";
import { join } from "path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "../drizzle/schema";

let db: ReturnType<typeof drizzle>;
let sqlite: Database.Database;
let currentDbPath: string;

export function getDatabasePath(): string {
  if (!currentDbPath) {
    currentDbPath = join(app.getPath("userData"), "poultry-farm.db");
  }
  return currentDbPath;
}

export function reconnectDatabase(): typeof db {
  if (sqlite) {
    try { sqlite.close(); } catch {}
  }
  return initializeDatabase();
}

export function initializeDatabase(): typeof db {
  const dbPath = getDatabasePath();
  currentDbPath = dbPath;

  sqlite = new Database(dbPath);

  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  db = drizzle(sqlite, { schema });

  try {
    migrate(db, {
      migrationsFolder: join(__dirname, "../../drizzle/migrations"),
    });
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database migration failed:", error);
  }

  createTablesManually();

  return db;
}

function createTablesManually(): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS owners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS farms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER REFERENCES owners(id),
      name TEXT NOT NULL,
      location TEXT,
      capacity INTEGER,
      login_username TEXT UNIQUE NOT NULL,
      login_password_hash TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farm_id INTEGER REFERENCES farms(id),
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS flocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farm_id INTEGER REFERENCES farms(id),
      batch_name TEXT NOT NULL,
      breed TEXT,
      initial_count INTEGER NOT NULL,
      current_count INTEGER NOT NULL,
      arrival_date TEXT NOT NULL,
      age_at_arrival_days INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      status_changed_date TEXT,
      status_notes TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS daily_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      flock_id INTEGER REFERENCES flocks(id),
      entry_date TEXT NOT NULL,
      deaths INTEGER DEFAULT 0,
      death_cause TEXT,
      total_eggs INTEGER DEFAULT 0,
      feed_consumed_kg REAL DEFAULT 0,
      water_consumed_liters REAL,
      notes TEXT,
      recorded_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(flock_id, entry_date)
    );

    CREATE TABLE IF NOT EXISTS egg_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farm_id INTEGER REFERENCES farms(id),
      grade TEXT NOT NULL,
      price_per_egg REAL NOT NULL,
      price_per_tray REAL NOT NULL,
      effective_date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS egg_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farm_id INTEGER NOT NULL REFERENCES farms(id),
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      default_price REAL DEFAULT 0,
      unit TEXT DEFAULT 'tray',
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(farm_id, name)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farm_id INTEGER REFERENCES farms(id),
      category TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      expense_date TEXT NOT NULL,
      supplier TEXT,
      receipt_ref TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const safeAlter = (statement: string) => {
    try { sqlite.exec(statement); } catch { /* column already exists */ }
  };

  safeAlter("ALTER TABLE flocks ADD COLUMN status_changed_date TEXT");
  safeAlter("ALTER TABLE flocks ADD COLUMN status_notes TEXT");
  safeAlter("ALTER TABLE flocks ADD COLUMN notes TEXT");
  safeAlter("ALTER TABLE expenses ADD COLUMN notes TEXT");
  safeAlter("ALTER TABLE vaccinations ADD COLUMN dosage TEXT");
  safeAlter("ALTER TABLE vaccinations ADD COLUMN route TEXT");
  safeAlter("ALTER TABLE daily_entries ADD COLUMN total_eggs INTEGER DEFAULT 0");
  safeAlter("ALTER TABLE egg_categories ADD COLUMN description TEXT DEFAULT ''");
  safeAlter("ALTER TABLE egg_categories ADD COLUMN default_price REAL DEFAULT 0");
  safeAlter("ALTER TABLE egg_categories ADD COLUMN unit TEXT DEFAULT 'tray'");
  safeAlter("ALTER TABLE egg_categories ADD COLUMN is_active INTEGER DEFAULT 1");
  safeAlter("ALTER TABLE egg_categories ADD COLUMN sort_order INTEGER DEFAULT 0");
  safeAlter("ALTER TABLE egg_categories ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP");
  safeAlter("ALTER TABLE egg_categories ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP");
  safeAlter("ALTER TABLE sale_items ADD COLUMN unit_type TEXT DEFAULT 'tray'");
  safeAlter("ALTER TABLE sale_items ADD COLUMN total_eggs INTEGER DEFAULT 0");

  // Backfill total_eggs for older databases if egg grade columns exist
  try {
    sqlite.exec(`
      UPDATE daily_entries
      SET total_eggs =
        COALESCE(total_eggs, 0) +
        COALESCE(eggs_grade_a, 0) +
        COALESCE(eggs_grade_b, 0) +
        COALESCE(eggs_cracked, 0)
      WHERE total_eggs IS NULL OR total_eggs = 0;
    `);
  } catch {
    // Older/newer schemas may not have the grade columns; ignore.
  }

  sqlite.exec(`

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farm_id INTEGER REFERENCES farms(id),
      item_type TEXT NOT NULL,
      item_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      min_threshold REAL,
      expiry_date TEXT,
      last_updated TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vaccinations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      flock_id INTEGER REFERENCES flocks(id),
      vaccine_name TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      administered_date TEXT,
      administered_by TEXT,
      batch_number TEXT,
      dosage TEXT,
      route TEXT,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vaccination_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vaccine_name TEXT NOT NULL,
      age_days INTEGER NOT NULL,
      is_mandatory INTEGER DEFAULT 1,
      route TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS vaccines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farm_id INTEGER NOT NULL REFERENCES farms(id),
      name TEXT NOT NULL,
      default_route TEXT,
      notes TEXT,
      is_default INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("Database initialized successfully (tables created manually)");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inventory_id INTEGER REFERENCES inventory(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      quantity REAL NOT NULL,
      date TEXT NOT NULL,
      reason TEXT,
      supplier TEXT,
      cost REAL,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farm_id INTEGER NOT NULL REFERENCES farms(id),
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      business_name TEXT,
      category TEXT NOT NULL DEFAULT 'individual',
      payment_terms_days INTEGER DEFAULT 0,
      default_price_per_egg REAL,
      default_price_per_tray REAL,
      notes TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farm_id INTEGER NOT NULL REFERENCES farms(id),
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      invoice_number TEXT NOT NULL,
      sale_date TEXT NOT NULL,
      due_date TEXT,
      subtotal REAL NOT NULL DEFAULT 0,
      discount_type TEXT DEFAULT 'none',
      discount_value REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      balance_due REAL DEFAULT 0,
      payment_status TEXT DEFAULT 'unpaid',
      notes TEXT,
      is_deleted INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      item_type TEXT NOT NULL,
      grade TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 0,
      unit_price REAL NOT NULL DEFAULT 0,
      line_total REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sale_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      payment_method TEXT DEFAULT 'cash',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS dismissed_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farm_id INTEGER REFERENCES farms(id),
      alert_type TEXT NOT NULL,
      reference_id INTEGER NOT NULL,
      dismissed_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export function getDatabase(): typeof db {
  if (!db) {
    throw new Error("Database not initialized. Call initializeDatabase() first.");
  }
  return db;
}

export function closeDatabase(): void {
  if (sqlite) {
    sqlite.close();
  }
}
