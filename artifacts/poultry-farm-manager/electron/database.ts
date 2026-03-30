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
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS daily_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      flock_id INTEGER REFERENCES flocks(id),
      entry_date TEXT NOT NULL,
      deaths INTEGER DEFAULT 0,
      death_cause TEXT,
      eggs_grade_a INTEGER DEFAULT 0,
      eggs_grade_b INTEGER DEFAULT 0,
      eggs_cracked INTEGER DEFAULT 0,
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
  `);
  console.log("Database initialized successfully (tables created manually)");

  try { sqlite.exec("ALTER TABLE expenses ADD COLUMN notes TEXT"); } catch { /* column already exists */ }

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
