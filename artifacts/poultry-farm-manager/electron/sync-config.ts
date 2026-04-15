import Store from "electron-store";

export interface SyncConfig {
  atlasUri: string;
  syncEnabled: boolean;
  lastSyncTime: string | null;
  syncIntervalMinutes: number;
  deviceId: string;
}

const store = new Store<{ syncConfig: SyncConfig }>({
  defaults: {
    syncConfig: {
      atlasUri: "",
      syncEnabled: false,
      lastSyncTime: null,
      syncIntervalMinutes: 15,
      deviceId: "",
    },
  },
});

function generateDeviceId(): string {
  return `device-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function getSyncConfig(): SyncConfig {
  const current = store.get("syncConfig");
  if (!current.deviceId) {
    const updated = { ...current, deviceId: generateDeviceId() };
    store.set("syncConfig", updated);
    return updated;
  }
  return current;
}

export function saveSyncConfig(config: Partial<SyncConfig>): SyncConfig {
  const current = getSyncConfig();
  const updated: SyncConfig = { ...current, ...config };
  store.set("syncConfig", updated);
  return updated;
}

export function getAtlasUri(): string {
  return getSyncConfig().atlasUri;
}

export function isSyncEnabled(): boolean {
  const config = getSyncConfig();
  return !!config.syncEnabled && !!config.atlasUri;
}

