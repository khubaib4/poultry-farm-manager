import React, { useState, useEffect } from "react";
import { data as dataApi, isElectron } from "@/lib/api";
import type { SystemInfo } from "@/types/electron";
import SettingSection from "@/components/settings/SettingSection";
import SettingRow from "@/components/settings/SettingRow";
import { Info, Code2, Database, Globe, Shield, RefreshCw } from "lucide-react";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function AboutPage(): React.ReactElement {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isElectron()) { setIsLoading(false); return; }
    dataApi.getSystemInfo()
      .then(setSystemInfo)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-4">
          <span className="text-3xl">🐔</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Poultry Farm Manager</h2>
        <p className="text-sm text-gray-500 mt-1">Version {systemInfo?.appVersion || "2.0.0"}</p>
        <p className="text-xs text-gray-400 mt-1">Desktop Application for Farm Management</p>
      </div>

      <SettingSection title="Developer Information" description="About the development team">
        <SettingRow label="Developed By">
          <span className="text-sm font-medium text-gray-700">House of Developers</span>
        </SettingRow>
        <SettingRow label="Website">
          <span className="text-sm text-emerald-600">www.houseofdevelopers.co.uk</span>
        </SettingRow>
        <SettingRow label="Support Email">
          <span className="text-sm text-emerald-600">khubaib@houseofdevelopers.co.uk</span>
        </SettingRow>
      </SettingSection>

      <SettingSection title="System Information" description="Technical details about your installation">
        {isLoading ? (
          <div className="px-6 py-4 text-center">
            <RefreshCw className="h-5 w-5 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : systemInfo ? (
          <>
            <SettingRow label="Database Location" description="Path to the SQLite database file">
              <span className="text-xs text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded max-w-[300px] truncate block">{systemInfo.dbPath}</span>
            </SettingRow>
            <SettingRow label="Database Size">
              <span className="text-sm text-gray-700">{formatBytes(systemInfo.dbSize)}</span>
            </SettingRow>
            <SettingRow label="Electron Version">
              <span className="text-sm text-gray-700">{systemInfo.electronVersion}</span>
            </SettingRow>
            <SettingRow label="Node.js Version">
              <span className="text-sm text-gray-700">{systemInfo.nodeVersion}</span>
            </SettingRow>
            <SettingRow label="Chrome Version">
              <span className="text-sm text-gray-700">{systemInfo.chromeVersion}</span>
            </SettingRow>
            <SettingRow label="Platform">
              <span className="text-sm text-gray-700 capitalize">{systemInfo.platform}</span>
            </SettingRow>
          </>
        ) : (
          <div className="px-6 py-4">
            <p className="text-sm text-gray-500">System information is only available in the desktop application.</p>
          </div>
        )}
      </SettingSection>

      <SettingSection title="Legal" description="Terms and policies">
        <SettingRow label="Terms of Service">
          <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded">Coming Soon</span>
        </SettingRow>
        <SettingRow label="Privacy Policy">
          <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded">Coming Soon</span>
        </SettingRow>
      </SettingSection>

      <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
        <button
          disabled
          className="px-4 py-2 text-sm font-medium text-gray-500 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="h-4 w-4" />
          Check for Updates (Coming Soon)
        </button>
      </div>
    </div>
  );
}
