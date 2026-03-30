import React from "react";
import { useSettings } from "@/contexts/SettingsContext";
import SettingSection from "@/components/settings/SettingSection";
import SettingRow from "@/components/settings/SettingRow";
import { Volume2 } from "lucide-react";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
      <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
    </label>
  );
}

export default function NotificationSettings(): React.ReactElement {
  const { settings, updateSettings } = useSettings();

  return (
    <div className="space-y-6">
      <SettingSection title="Alert Preferences" description="Configure which alerts you receive">
        <SettingRow label="Low Stock Alerts" description="Get notified when inventory items are running low">
          <Toggle checked={settings.lowStockAlerts} onChange={(v) => updateSettings({ lowStockAlerts: v })} />
        </SettingRow>
        <SettingRow label="Vaccination Reminders" description="Get reminded about upcoming vaccinations">
          <Toggle checked={settings.vaccinationReminders} onChange={(v) => updateSettings({ vaccinationReminders: v })} />
        </SettingRow>
        {settings.vaccinationReminders && (
          <SettingRow label="Reminder Days" description="Days before vaccination to send reminder">
            <input
              type="number"
              value={settings.vaccinationReminderDays}
              onChange={(e) => updateSettings({ vaccinationReminderDays: parseInt(e.target.value) || 3 })}
              min={1}
              max={30}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-20 text-center"
            />
          </SettingRow>
        )}
        <SettingRow label="High Mortality Alerts" description="Alert when mortality rate exceeds threshold">
          <Toggle checked={settings.mortalityAlerts} onChange={(v) => updateSettings({ mortalityAlerts: v })} />
        </SettingRow>
        {settings.mortalityAlerts && (
          <SettingRow label="Mortality Threshold (%)" description="Alert when daily mortality exceeds this percentage">
            <input
              type="number"
              value={settings.mortalityThreshold}
              onChange={(e) => updateSettings({ mortalityThreshold: parseFloat(e.target.value) || 1 })}
              min={0.1}
              max={10}
              step={0.1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-20 text-center"
            />
          </SettingRow>
        )}
      </SettingSection>

      <SettingSection title="Dashboard Alerts" description="Dashboard notification display">
        <SettingRow label="Show Alerts on Dashboard" description="Display alert cards on the main dashboard">
          <Toggle checked={settings.showDashboardAlerts} onChange={(v) => updateSettings({ showDashboardAlerts: v })} />
        </SettingRow>
        <SettingRow label="Alert Sound" description="Play a sound for new alerts">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-500 bg-gray-50 flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Coming Soon
            </span>
          </div>
        </SettingRow>
      </SettingSection>
    </div>
  );
}
