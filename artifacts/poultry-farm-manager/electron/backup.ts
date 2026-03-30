import { app } from "electron";
import { join, basename, resolve, normalize } from "path";
import { copyFileSync, existsSync, statSync, mkdirSync, unlinkSync, readdirSync } from "fs";
import { readFileSync, writeFileSync } from "fs";
import Database from "better-sqlite3";
import { getDatabasePath, closeDatabase, reconnectDatabase } from "./database";

export interface BackupMetadata {
  version: string;
  createdAt: string;
  dbVersion: number;
  appName: string;
  stats: {
    farms: number;
    flocks: number;
    dailyEntries: number;
    expenses: number;
    vaccinations: number;
    owners: number;
    inventory: number;
  };
}

export interface BackupInfo {
  path: string;
  filename: string;
  size: number;
  createdAt: string;
  metadata: BackupMetadata | null;
}

export interface AutoBackupSettings {
  enabled: boolean;
  frequency: "daily" | "weekly";
  time: string;
  location: string;
  retention: number;
  lastBackup: string | null;
  nextBackup: string | null;
}

function getTableCount(dbInstance: Database.Database, table: string): number {
  try {
    const row = dbInstance.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
    return row?.count ?? 0;
  } catch {
    return 0;
  }
}

function generateMetadata(dbPath: string): BackupMetadata {
  const tempDb = new Database(dbPath, { readonly: true });
  try {
    return {
      version: app.getVersion(),
      createdAt: new Date().toISOString(),
      dbVersion: 1,
      appName: "Poultry Farm Manager",
      stats: {
        farms: getTableCount(tempDb, "farms"),
        flocks: getTableCount(tempDb, "flocks"),
        dailyEntries: getTableCount(tempDb, "daily_entries"),
        expenses: getTableCount(tempDb, "expenses"),
        vaccinations: getTableCount(tempDb, "vaccinations"),
        owners: getTableCount(tempDb, "owners"),
        inventory: getTableCount(tempDb, "inventory"),
      },
    };
  } finally {
    tempDb.close();
  }
}

export function createBackup(destinationPath: string): BackupInfo {
  const sourcePath = getDatabasePath();
  if (!existsSync(sourcePath)) {
    throw new Error("Database file not found");
  }

  const dir = join(destinationPath, "..");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  copyFileSync(sourcePath, destinationPath);

  const walPath = sourcePath + "-wal";
  const shmPath = sourcePath + "-shm";
  if (existsSync(walPath)) {
    try { copyFileSync(walPath, destinationPath + "-wal"); } catch {}
  }
  if (existsSync(shmPath)) {
    try { copyFileSync(shmPath, destinationPath + "-shm"); } catch {}
  }

  const consolidatedDb = new Database(destinationPath);
  try {
    consolidatedDb.pragma("wal_checkpoint(TRUNCATE)");
  } catch {}
  consolidatedDb.close();

  try { if (existsSync(destinationPath + "-wal")) unlinkSync(destinationPath + "-wal"); } catch {}
  try { if (existsSync(destinationPath + "-shm")) unlinkSync(destinationPath + "-shm"); } catch {}

  const metadata = generateMetadata(destinationPath);
  const metadataPath = destinationPath.replace(/\.db$/, "_metadata.json");
  writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

  const stat = statSync(destinationPath);

  return {
    path: destinationPath,
    filename: basename(destinationPath),
    size: stat.size,
    createdAt: metadata.createdAt,
    metadata,
  };
}

export function validateBackup(backupPath: string): { valid: boolean; metadata: BackupMetadata | null; error?: string } {
  if (!existsSync(backupPath)) {
    return { valid: false, metadata: null, error: "Backup file not found" };
  }

  try {
    const testDb = new Database(backupPath, { readonly: true });
    try {
      const tables = testDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
      const tableNames = tables.map((t) => t.name);
      const required = ["owners", "farms", "flocks", "daily_entries"];
      const missing = required.filter((t) => !tableNames.includes(t));
      if (missing.length > 0) {
        return { valid: false, metadata: null, error: `Invalid backup: missing tables (${missing.join(", ")})` };
      }

      const metadata = generateMetadata(backupPath);
      return { valid: true, metadata };
    } finally {
      testDb.close();
    }
  } catch (err) {
    return { valid: false, metadata: null, error: `Invalid database file: ${err instanceof Error ? err.message : "Unknown error"}` };
  }
}

export function restoreBackup(backupPath: string): { success: boolean; error?: string } {
  const validation = validateBackup(backupPath);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const targetPath = getDatabasePath();

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const preRestoreBackupPath = join(app.getPath("userData"), `pre_restore_backup_${timestamp}.db`);

  closeDatabase();

  try {
    if (existsSync(targetPath)) {
      copyFileSync(targetPath, preRestoreBackupPath);
      if (existsSync(targetPath + "-wal")) {
        copyFileSync(targetPath + "-wal", preRestoreBackupPath + "-wal");
      }
      if (existsSync(targetPath + "-shm")) {
        copyFileSync(targetPath + "-shm", preRestoreBackupPath + "-shm");
      }
    }
  } catch (err) {
    reconnectDatabase();
    return { success: false, error: `Failed to create safety backup: ${err instanceof Error ? err.message : "Unknown error"}` };
  }

  try {
    copyFileSync(backupPath, targetPath);

    try { if (existsSync(targetPath + "-wal")) unlinkSync(targetPath + "-wal"); } catch {}
    try { if (existsSync(targetPath + "-shm")) unlinkSync(targetPath + "-shm"); } catch {}

    reconnectDatabase();

    return { success: true };
  } catch (err) {
    try {
      copyFileSync(preRestoreBackupPath, targetPath);
      if (existsSync(preRestoreBackupPath + "-wal")) {
        copyFileSync(preRestoreBackupPath + "-wal", targetPath + "-wal");
      }
      if (existsSync(preRestoreBackupPath + "-shm")) {
        copyFileSync(preRestoreBackupPath + "-shm", targetPath + "-shm");
      }
    } catch {}
    reconnectDatabase();
    return { success: false, error: `Restore failed: ${err instanceof Error ? err.message : "Unknown error"}` };
  }
}

function isPathInAllowedDir(filePath: string): boolean {
  const resolved = resolve(normalize(filePath));
  const userDataDir = app.getPath("userData");
  const documentsDir = app.getPath("documents");
  const desktopDir = app.getPath("desktop");
  const homeDir = app.getPath("home");
  return (
    resolved.startsWith(userDataDir) ||
    resolved.startsWith(documentsDir) ||
    resolved.startsWith(desktopDir) ||
    resolved.startsWith(homeDir)
  );
}

export function validateBackupPath(filePath: string): void {
  if (!isPathInAllowedDir(filePath)) {
    throw new Error("Backup path is outside allowed directories");
  }
}

export function getBackupInfo(backupPath: string): BackupInfo | null {
  if (!existsSync(backupPath)) return null;

  const stat = statSync(backupPath);
  const metadataPath = backupPath.replace(/\.db$/, "_metadata.json");
  let metadata: BackupMetadata | null = null;

  if (existsSync(metadataPath)) {
    try {
      metadata = JSON.parse(readFileSync(metadataPath, "utf8"));
    } catch {}
  } else {
    try {
      metadata = generateMetadata(backupPath);
    } catch {}
  }

  return {
    path: backupPath,
    filename: basename(backupPath),
    size: stat.size,
    createdAt: metadata?.createdAt || stat.mtime.toISOString(),
    metadata,
  };
}

export function deleteBackupFile(backupPath: string): void {
  if (existsSync(backupPath)) {
    unlinkSync(backupPath);
  }
  const metadataPath = backupPath.replace(/\.db$/, "_metadata.json");
  if (existsSync(metadataPath)) {
    unlinkSync(metadataPath);
  }
}

export function listBackupsInDirectory(dirPath: string): BackupInfo[] {
  if (!existsSync(dirPath)) return [];
  const files = readdirSync(dirPath).filter((f) => f.startsWith("poultry_backup_") && f.endsWith(".db"));
  return files
    .map((f) => getBackupInfo(join(dirPath, f)))
    .filter((b): b is BackupInfo => b !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function cleanOldBackups(dirPath: string, retention: number): void {
  const backups = listBackupsInDirectory(dirPath);
  if (backups.length <= retention) return;
  const toDelete = backups.slice(retention);
  for (const backup of toDelete) {
    try {
      deleteBackupFile(backup.path);
    } catch {}
  }
}

export function generateBackupFilename(): string {
  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g, "-").replace("T", "_").substring(0, 19);
  return `poultry_backup_${ts}.db`;
}
