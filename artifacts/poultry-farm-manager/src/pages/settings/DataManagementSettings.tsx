import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { data as dataApi, isElectron } from "@/lib/api";
import SettingSection from "@/components/settings/SettingSection";
import DangerZoneCard from "@/components/settings/DangerZoneCard";
import { HardDrive, Download, Trash2, CheckCircle, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

export default function DataManagementSettings(): React.ReactElement {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const farmId = user?.farmId ?? null;
  const [isExporting, setIsExporting] = useState(false);
  const [exportStart, setExportStart] = useState("");
  const [exportEnd, setExportEnd] = useState("");
  const [exportOptions, setExportOptions] = useState({
    includeFlocks: true,
    includeEntries: true,
    includeExpenses: true,
    includeInventory: true,
    includeVaccinations: true,
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleExport = async () => {
    if (!farmId) return;
    setIsExporting(true);
    try {
      const result = await dataApi.exportAllData(farmId, {
        startDate: exportStart || undefined,
        endDate: exportEnd || undefined,
        ...exportOptions,
      });

      const wb = XLSX.utils.book_new();
      for (const [key, rows] of Object.entries(result)) {
        if (Array.isArray(rows) && rows.length > 0) {
          const ws = XLSX.utils.json_to_sheet(rows as Record<string, unknown>[]);
          XLSX.utils.book_append_sheet(wb, ws, key.charAt(0).toUpperCase() + key.slice(1));
        }
      }
      XLSX.writeFile(wb, `farm_data_export_${new Date().toISOString().split("T")[0]}.xlsx`);
      showMessage("success", "Data exported successfully");
    } catch (err) {
      showMessage("error", err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearAlerts = async () => {
    if (!farmId) return;
    await dataApi.clearDismissedAlerts(farmId);
    showMessage("success", "Dismissed alerts cleared");
  };

  const handleResetFarm = async () => {
    if (!farmId) return;
    await dataApi.resetFarmData(farmId);
    showMessage("success", "Farm data has been reset");
  };

  const handleDeleteAccount = async () => {
    if (!user || user.type !== "owner") return;
    await dataApi.deleteOwnerAccount(user.id, "");
    await logout();
    navigate("/login");
  };

  const backupPath = user?.type === "owner" ? "/owner/backup" : "/farm/backup";

  return (
    <div className="space-y-6">
      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
          message.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {message.text}
        </div>
      )}

      <SettingSection title="Backup & Restore" description="Protect your data with backups">
        <div className="px-6 py-4">
          <button
            onClick={() => navigate(backupPath)}
            className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors w-full text-left"
          >
            <HardDrive className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-sm font-medium text-emerald-900">Go to Backup & Restore</p>
              <p className="text-xs text-emerald-700">Create backups, restore data, and configure auto-backups</p>
            </div>
          </button>
        </div>
      </SettingSection>

      {farmId && (
        <SettingSection title="Data Export" description="Export your farm data">
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Date (optional)</label>
                <input type="date" value={exportStart} onChange={(e) => setExportStart(e.target.value)} className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">End Date (optional)</label>
                <input type="date" value={exportEnd} onChange={(e) => setExportEnd(e.target.value)} className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Include in export:</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(exportOptions).map(([key, val]) => (
                  <label key={key} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={val}
                      onChange={(e) => setExportOptions({ ...exportOptions, [key]: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded border-gray-300"
                    />
                    {key.replace("include", "").replace(/([A-Z])/g, " $1").trim()}
                  </label>
                ))}
              </div>
            </div>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {isExporting ? "Exporting..." : "Export to Excel"}
            </button>
          </div>
        </SettingSection>
      )}

      <SettingSection title="Data Cleanup" description="Clean up old or unnecessary data">
        <div className="px-6 py-4">
          {farmId && (
            <button
              onClick={handleClearAlerts}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Trash2 className="h-4 w-4" />
              Clear Dismissed Alerts
            </button>
          )}
        </div>
      </SettingSection>

      <div className="space-y-4">
        <h3 className="text-base font-semibold text-red-900 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Danger Zone
        </h3>

        {farmId && (
          <DangerZoneCard
            title="Reset Farm Data"
            description="This will permanently delete all flocks, daily entries, expenses, inventory, vaccinations, and pricing data for this farm. This action cannot be undone."
            buttonText="Reset Farm Data"
            onConfirm={handleResetFarm}
            confirmMessage="RESET"
          />
        )}

        {user?.type === "owner" && (
          <DangerZoneCard
            title="Delete Account"
            description="This will permanently delete your owner account, all associated farms, and all farm data. This action cannot be undone."
            buttonText="Delete My Account"
            onConfirm={handleDeleteAccount}
            confirmMessage="DELETE"
            requirePassword
          />
        )}
      </div>
    </div>
  );
}
