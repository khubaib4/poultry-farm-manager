import React, { useState, useEffect, useCallback } from "react";
import { backup as backupApi, isElectron } from "@/lib/api";
import type { BackupInfo, AutoBackupSettings, BackupMetadata } from "@/types/electron";
import {
  HardDrive,
  Download,
  Upload,
  Trash2,
  FolderOpen,
  Clock,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Shield,
  Settings,
  Database,
  Calendar,
  X,
} from "lucide-react";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

function MetadataStats({ metadata }: { metadata: BackupMetadata }) {
  const items = [
    { label: "Farms", value: metadata.stats.farms },
    { label: "Flocks", value: metadata.stats.flocks },
    { label: "Daily Entries", value: metadata.stats.dailyEntries },
    { label: "Expenses", value: metadata.stats.expenses },
    { label: "Vaccinations", value: metadata.stats.vaccinations },
    { label: "Inventory Items", value: metadata.stats.inventory },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 mt-2">
      {items.map((item) => (
        <div key={item.label} className="bg-gray-50 rounded px-2 py-1 text-center">
          <div className="text-xs text-gray-500">{item.label}</div>
          <div className="text-sm font-semibold text-gray-700">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function RestoreConfirmModal({
  backupPath,
  metadata,
  onConfirm,
  onCancel,
  isRestoring,
}: {
  backupPath: string;
  metadata: BackupMetadata | null;
  onConfirm: () => void;
  onCancel: () => void;
  isRestoring: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Confirm Restore</h3>
          </div>
          <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded" disabled={isRestoring}>
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-sm text-gray-600">
            This will replace your current database with the selected backup. A safety backup of your current data will be created automatically.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800 font-medium">Warning: This action cannot be easily undone.</p>
            <p className="text-xs text-amber-700 mt-1">All current data will be replaced with the backup data. You will need to log in again after restore.</p>
          </div>

          {metadata && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Backup Contents</p>
              <p className="text-sm text-gray-700">Created: {formatDate(metadata.createdAt)}</p>
              <MetadataStats metadata={metadata} />
            </div>
          )}

          <p className="text-xs text-gray-500 break-all">File: {backupPath}</p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isRestoring}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isRestoring}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isRestoring ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Restoring...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Restore Backup
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BackupRestorePage(): React.ReactElement {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [settings, setSettings] = useState<AutoBackupSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [restorePreview, setRestorePreview] = useState<{ path: string; metadata: BackupMetadata | null } | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);

  const [settingsForm, setSettingsForm] = useState({
    enabled: false,
    frequency: "daily" as "daily" | "weekly",
    time: "02:00",
    retention: 7,
  });

  const showMessage = useCallback((type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }, []);

  const loadData = useCallback(async () => {
    if (!isElectron()) return;
    setIsLoading(true);
    try {
      const [historyRes, settingsRes] = await Promise.all([
        backupApi.getHistory(),
        backupApi.getSettings(),
      ]);
      setBackups(historyRes);
      setSettings(settingsRes);
      setSettingsForm({
        enabled: settingsRes.enabled,
        frequency: settingsRes.frequency,
        time: settingsRes.time,
        retention: settingsRes.retention,
      });
    } catch {
      showMessage("error", "Failed to load backup data");
    } finally {
      setIsLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateBackup = async () => {
    setIsCreating(true);
    try {
      const result = await backupApi.create();
      showMessage("success", `Backup created: ${result.filename} (${formatBytes(result.size)})`);
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Backup failed";
      if (!msg.includes("cancelled")) {
        showMessage("error", msg);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectRestore = async () => {
    try {
      const result = await backupApi.restore();
      setRestorePreview({ path: result.backupPath, metadata: result.metadata });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to select backup";
      if (!msg.includes("cancelled")) {
        showMessage("error", msg);
      }
    }
  };

  const handleConfirmRestore = async () => {
    if (!restorePreview) return;
    setIsRestoring(true);
    try {
      await backupApi.confirmRestore(restorePreview.path);
      showMessage("success", "Database restored successfully. Please log in again.");
      setRestorePreview(null);
      setTimeout(() => {
        window.location.hash = "#/login";
        window.location.reload();
      }, 2000);
    } catch (err) {
      showMessage("error", err instanceof Error ? err.message : "Restore failed");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteBackup = async (path: string) => {
    setDeletingPath(path);
    try {
      await backupApi.delete(path);
      showMessage("success", "Backup deleted");
      loadData();
    } catch (err) {
      showMessage("error", err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingPath(null);
    }
  };

  const handleOpenFolder = async () => {
    try {
      await backupApi.openFolder();
    } catch {}
  };

  const handleSaveSettings = async () => {
    try {
      const result = await backupApi.saveSettings(settingsForm);
      setSettings(result);
      showMessage("success", "Backup settings saved");
      setShowSettings(false);
    } catch (err) {
      showMessage("error", err instanceof Error ? err.message : "Failed to save settings");
    }
  };

  const handleRunAutoBackup = async () => {
    setIsCreating(true);
    try {
      await backupApi.runAutoBackup();
      showMessage("success", "Auto backup completed successfully");
      loadData();
    } catch (err) {
      showMessage("error", err instanceof Error ? err.message : "Auto backup failed");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectDirectory = async () => {
    try {
      const dir = await backupApi.selectDirectory();
      await backupApi.saveSettings({ location: dir });
      loadData();
    } catch {}
  };

  if (!isElectron()) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Backup features are only available in the desktop application.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {message && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          )}
          {message.text}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-7 w-7 text-emerald-600" />
            Backup & Restore
          </h1>
          <p className="text-gray-500 mt-1">Protect your farm data with regular backups</p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="px-3 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Auto-Backup Settings
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={handleCreateBackup}
          disabled={isCreating}
          className="flex items-center gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all text-left disabled:opacity-50"
        >
          <div className="p-3 bg-emerald-100 rounded-lg">
            <Download className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {isCreating ? "Creating..." : "Create Backup"}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Save database to a file</p>
          </div>
        </button>

        <button
          onClick={handleSelectRestore}
          className="flex items-center gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
        >
          <div className="p-3 bg-blue-100 rounded-lg">
            <Upload className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Restore Backup</p>
            <p className="text-xs text-gray-500 mt-0.5">Load data from a backup file</p>
          </div>
        </button>

        <button
          onClick={handleRunAutoBackup}
          disabled={isCreating}
          className="flex items-center gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all text-left disabled:opacity-50"
        >
          <div className="p-3 bg-purple-100 rounded-lg">
            <RefreshCw className={`h-6 w-6 text-purple-600 ${isCreating ? "animate-spin" : ""}`} />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Quick Backup</p>
            <p className="text-xs text-gray-500 mt-0.5">Backup to auto-backup folder</p>
          </div>
        </button>
      </div>

      {showSettings && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-500" />
            Automatic Backup Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={settingsForm.enabled}
                onChange={(e) => setSettingsForm({ ...settingsForm, enabled: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded border-gray-300"
              />
              <div>
                <p className="text-sm font-medium text-gray-700">Enable Auto-Backup</p>
                <p className="text-xs text-gray-500">Automatically backup your database</p>
              </div>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
              <select
                value={settingsForm.frequency}
                onChange={(e) => setSettingsForm({ ...settingsForm, frequency: e.target.value as "daily" | "weekly" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Backup Time</label>
              <input
                type="time"
                value={settingsForm.time}
                onChange={(e) => setSettingsForm({ ...settingsForm, time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Keep Last N Backups</label>
              <input
                type="number"
                min={1}
                max={30}
                value={settingsForm.retention}
                onChange={(e) => setSettingsForm({ ...settingsForm, retention: parseInt(e.target.value) || 7 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Backup Location</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings?.location || "Default location"}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-600"
                />
                <button
                  onClick={handleSelectDirectory}
                  className="px-3 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Browse
                </button>
              </div>
            </div>
          </div>

          {settings?.lastBackup && (
            <p className="text-xs text-gray-500 mt-3">
              Last auto-backup: {formatDate(settings.lastBackup)}
            </p>
          )}

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSettings}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Database className="h-5 w-5 text-gray-500" />
            Backup History
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleOpenFolder}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1.5"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              Open Folder
            </button>
            <button
              onClick={loadData}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading backups...</p>
          </div>
        ) : backups.length === 0 ? (
          <div className="p-8 text-center">
            <HardDrive className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No backups found</p>
            <p className="text-xs text-gray-400 mt-1">Create your first backup to protect your data</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {backups.map((b) => (
              <div key={b.path} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <p className="text-sm font-medium text-gray-900 truncate">{b.filename}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(b.createdAt)}
                      </span>
                      <span>{formatBytes(b.size)}</span>
                    </div>
                    {b.metadata && <MetadataStats metadata={b.metadata} />}
                  </div>
                  <button
                    onClick={() => handleDeleteBackup(b.path)}
                    disabled={deletingPath === b.path}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 ml-3 flex-shrink-0"
                    title="Delete backup"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {restorePreview && (
        <RestoreConfirmModal
          backupPath={restorePreview.path}
          metadata={restorePreview.metadata}
          onConfirm={handleConfirmRestore}
          onCancel={() => setRestorePreview(null)}
          isRestoring={isRestoring}
        />
      )}
    </div>
  );
}
