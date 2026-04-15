import { app } from "electron";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import Store from "electron-store";
import { createBackup, deleteBackupFile, getBackupDirectory, listBackups } from "./backup-mongo";
import type { AutoBackupSettings } from "./backup-sqlite.ts.bak";

const store = new Store<{ autoBackup: AutoBackupSettings }>({
  defaults: {
    autoBackup: {
      enabled: false,
      frequency: "daily",
      time: "02:00",
      location: getBackupDirectory(),
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

export async function runAutoBackup(): Promise<{ success: boolean; path?: string; error?: string }> {
  const settings = getAutoBackupSettings();
  const dir = settings.location || getBackupDirectory();

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const destPath = join(dir, `backup-${ts}.zip`);

  const result = await createBackup(destPath);
  if (!result.success || !result.path) throw new Error(result.error || "Auto-backup failed");

  // Retention: keep newest N zip files in the backup directory
  const backups = await listBackups();
  const retention = Math.max(0, Number(settings.retention ?? 0));
  if (retention > 0 && backups.length > retention) {
    const toDelete = backups.filter((b) => b.path?.startsWith(dir)).slice(retention);
    for (const b of toDelete) {
      try {
        await deleteBackupFile(b.path);
      } catch {}
    }
  }

  persistSettings({ lastBackup: new Date().toISOString() });
  console.log(`Auto-backup completed: ${result.path}`);
  return { success: true, path: result.path };
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
    void runAutoBackup().catch(() => {});
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
