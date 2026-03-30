import { app } from "electron";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import Store from "electron-store";
import { createBackup, cleanOldBackups, generateBackupFilename } from "./backup";
import type { AutoBackupSettings } from "./backup";

const store = new Store<{ autoBackup: AutoBackupSettings }>({
  defaults: {
    autoBackup: {
      enabled: false,
      frequency: "daily",
      time: "02:00",
      location: join(app.getPath("userData"), "backups"),
      retention: 7,
      lastBackup: null,
      nextBackup: null,
    },
  },
});

let backupTimer: ReturnType<typeof setTimeout> | null = null;

export function getAutoBackupSettings(): AutoBackupSettings {
  return store.get("autoBackup");
}

function persistSettings(settings: Partial<AutoBackupSettings>): AutoBackupSettings {
  const current = getAutoBackupSettings();
  const updated = { ...current, ...settings };
  store.set("autoBackup", updated);
  return updated;
}

export function saveAutoBackupSettings(settings: Partial<AutoBackupSettings>): AutoBackupSettings {
  const updated = persistSettings(settings);

  if (backupTimer) {
    clearTimeout(backupTimer);
    backupTimer = null;
  }

  if (updated.enabled) {
    scheduleNextBackup();
  }

  return updated;
}

export function runAutoBackup(): { success: boolean; path?: string; error?: string } {
  const settings = getAutoBackupSettings();
  const dir = settings.location || join(app.getPath("userData"), "backups");

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const filename = generateBackupFilename();
  const destPath = join(dir, filename);

  try {
    const result = createBackup(destPath);
    cleanOldBackups(dir, settings.retention);

    persistSettings({ lastBackup: new Date().toISOString() });

    console.log(`Auto-backup completed: ${result.path}`);
    return { success: true, path: result.path };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    console.error("Auto-backup failed:", error);
    throw new Error(error);
  }
}

function getNextBackupTime(settings: AutoBackupSettings): Date {
  const now = new Date();
  const [hours, minutes] = (settings.time || "02:00").split(":").map(Number);
  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);

  if (next <= now) {
    if (settings.frequency === "daily") {
      next.setDate(next.getDate() + 1);
    } else {
      next.setDate(next.getDate() + 7);
    }
  }

  return next;
}

export function scheduleNextBackup(): void {
  const settings = getAutoBackupSettings();
  if (!settings.enabled) return;

  const nextTime = getNextBackupTime(settings);
  const delay = nextTime.getTime() - Date.now();

  persistSettings({ nextBackup: nextTime.toISOString() });

  if (backupTimer) clearTimeout(backupTimer);

  backupTimer = setTimeout(() => {
    try { runAutoBackup(); } catch {}
    scheduleNextBackup();
  }, Math.max(delay, 60000));
}

export function initAutoBackup(): void {
  const settings = getAutoBackupSettings();
  if (settings.enabled) {
    scheduleNextBackup();
    console.log("Auto-backup scheduler initialized");
  }
}
