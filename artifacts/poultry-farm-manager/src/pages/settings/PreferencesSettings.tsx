import React from "react";
import { useSettings } from "@/contexts/SettingsContext";
import SettingSection from "@/components/settings/SettingSection";
import SettingRow from "@/components/settings/SettingRow";
import { Moon } from "lucide-react";

export default function PreferencesSettings(): React.ReactElement {
  const { settings, updateSettings } = useSettings();

  return (
    <div className="space-y-6">
      <SettingSection title="Display Preferences" description="Customize how data is displayed">
        <SettingRow label="Date Format" description="Choose your preferred date format">
          <select
            value={settings.dateFormat}
            onChange={(e) => updateSettings({ dateFormat: e.target.value as typeof settings.dateFormat })}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm min-w-[160px]"
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </SettingRow>
        <SettingRow label="Currency Symbol" description="Currency symbol for financial displays">
          <select
            value={settings.currencySymbol}
            onChange={(e) => updateSettings({ currencySymbol: e.target.value as typeof settings.currencySymbol })}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm min-w-[120px]"
          >
            <option value="PKR">PKR</option>
            <option value="Rs">Rs</option>
            <option value="Rs.">Rs.</option>
          </select>
        </SettingRow>
        <SettingRow label="Number Format" description="Thousands separator style">
          <select
            value={settings.numberFormat}
            onChange={(e) => updateSettings({ numberFormat: e.target.value as typeof settings.numberFormat })}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm min-w-[160px]"
          >
            <option value="comma">1,000.00 (Comma)</option>
            <option value="dot">1.000,00 (Dot)</option>
          </select>
        </SettingRow>
      </SettingSection>

      <SettingSection title="Egg Counting" description="Default units for egg counting">
        <SettingRow label="Default Unit" description="How eggs are counted by default">
          <select
            value={settings.defaultEggUnit}
            onChange={(e) => updateSettings({ defaultEggUnit: e.target.value as typeof settings.defaultEggUnit })}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm min-w-[120px]"
          >
            <option value="eggs">Eggs</option>
            <option value="trays">Trays</option>
          </select>
        </SettingRow>
        <SettingRow label="Tray Size" description="Number of eggs per tray">
          <input
            type="number"
            value={settings.traySize}
            onChange={(e) => updateSettings({ traySize: parseInt(e.target.value) || 30 })}
            min={1}
            max={100}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-20 text-center"
          />
        </SettingRow>
      </SettingSection>

      <SettingSection title="Dashboard" description="Dashboard display preferences">
        <SettingRow label="Default Date Range" description="Default time period shown on dashboards">
          <select
            value={settings.defaultDateRange}
            onChange={(e) => updateSettings({ defaultDateRange: e.target.value as typeof settings.defaultDateRange })}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm min-w-[140px]"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </SettingRow>
        <SettingRow label="Auto-Refresh Interval" description="How often dashboard data refreshes">
          <select
            value={settings.autoRefreshInterval}
            onChange={(e) => updateSettings({ autoRefreshInterval: parseInt(e.target.value) })}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm min-w-[140px]"
          >
            <option value={1}>Every 1 minute</option>
            <option value={5}>Every 5 minutes</option>
            <option value={10}>Every 10 minutes</option>
            <option value={0}>Off</option>
          </select>
        </SettingRow>
      </SettingSection>

      <SettingSection title="Theme" description="Appearance settings">
        <SettingRow label="Color Theme" description="Choose your preferred color scheme">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-500 bg-gray-50 flex items-center gap-2">
              <Moon className="h-4 w-4" />
              Coming Soon
            </span>
          </div>
        </SettingRow>
      </SettingSection>
    </div>
  );
}
