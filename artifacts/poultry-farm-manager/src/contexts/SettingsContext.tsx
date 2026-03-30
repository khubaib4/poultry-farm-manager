import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { settings as settingsApi, isElectron } from "@/lib/api";
import type { AppSettings } from "@/types/electron";

const defaultSettings: AppSettings = {
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

interface SettingsContextValue {
  settings: AppSettings;
  isLoading: boolean;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [appSettings, setAppSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isElectron()) {
      setIsLoading(false);
      return;
    }
    settingsApi.getAll()
      .then(setAppSettings)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const updateSettingsFn = useCallback(async (partial: Partial<AppSettings>) => {
    if (!isElectron()) return;
    const updated = await settingsApi.update(partial);
    setAppSettings(updated);
  }, []);

  const resetSettingsFn = useCallback(async () => {
    if (!isElectron()) return;
    const reset = await settingsApi.reset();
    setAppSettings(reset);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings: appSettings, isLoading, updateSettings: updateSettingsFn, resetSettings: resetSettingsFn }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
