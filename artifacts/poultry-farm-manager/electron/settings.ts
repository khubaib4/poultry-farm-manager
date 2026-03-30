import Store from "electron-store";

export interface AppSettings {
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  currencySymbol: "PKR" | "Rs" | "Rs.";
  numberFormat: "comma" | "dot";
  defaultEggUnit: "eggs" | "trays";
  traySize: number;
  defaultDateRange: "today" | "week" | "month";
  autoRefreshInterval: number;
  lowStockAlerts: boolean;
  vaccinationReminders: boolean;
  vaccinationReminderDays: number;
  mortalityAlerts: boolean;
  mortalityThreshold: number;
  showDashboardAlerts: boolean;
  defaultFeedBagWeight: number;
  defaultDeathCauses: string[];
  autoGenerateVaccinations: boolean;
}

export const defaultSettings: AppSettings = {
  dateFormat: "DD/MM/YYYY",
  currencySymbol: "PKR",
  numberFormat: "comma",
  defaultEggUnit: "eggs",
  traySize: 30,
  defaultDateRange: "week",
  autoRefreshInterval: 5,
  lowStockAlerts: true,
  vaccinationReminders: true,
  vaccinationReminderDays: 3,
  mortalityAlerts: true,
  mortalityThreshold: 1,
  showDashboardAlerts: true,
  defaultFeedBagWeight: 50,
  defaultDeathCauses: ["Disease", "Predator", "Heat Stress", "Injury", "Unknown"],
  autoGenerateVaccinations: true,
};

const settingsStore = new Store<{ appSettings: AppSettings }>({
  name: "app-settings",
  defaults: {
    appSettings: defaultSettings,
  },
});

export function getAllSettings(): AppSettings {
  return settingsStore.get("appSettings");
}

export function getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
  const settings = getAllSettings();
  return settings[key];
}

export function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): AppSettings {
  const settings = getAllSettings();
  settings[key] = value;
  settingsStore.set("appSettings", settings);
  return settings;
}

export function updateSettings(partial: Partial<AppSettings>): AppSettings {
  const settings = getAllSettings();
  const updated = { ...settings, ...partial };
  settingsStore.set("appSettings", updated);
  return updated;
}

export function resetSettings(): AppSettings {
  settingsStore.set("appSettings", defaultSettings);
  return defaultSettings;
}
