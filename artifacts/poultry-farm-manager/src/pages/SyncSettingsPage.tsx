import React, { useEffect, useState } from "react";
import {
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  Settings,
} from "lucide-react";
import { sync } from "@/lib/api";
import type { SyncConfig, SyncStatus, SyncTestConnectionResult } from "@/types/electron";

export default function SyncSettingsPage(): React.ReactElement {
  const [config, setConfig] = useState<SyncConfig | null>(null);
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [atlasUri, setAtlasUri] = useState("");
  const [syncInterval, setSyncInterval] = useState(15);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<SyncTestConnectionResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    void loadConfig();
    void loadStatus();
    const interval = setInterval(() => {
      void loadStatus();
    }, 10_000);
    return () => clearInterval(interval);
  }, []);

  async function loadConfig() {
    try {
      const data = await sync.getConfig();
      setConfig(data);
      setAtlasUri(data.atlasUri || "");
      setSyncInterval(data.syncIntervalMinutes || 15);
    } catch (error) {
      console.error("Failed to load sync config:", error);
    }
  }

  async function loadStatus() {
    try {
      const data = await sync.getStatus();
      setStatus(data);
    } catch (error) {
      console.error("Failed to load sync status:", error);
    }
  }

  async function handleTestConnection() {
    if (!atlasUri.trim()) {
      setTestResult({ success: false, message: "Please enter an Atlas URI" });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await sync.testConnection(atlasUri.trim());
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, message: String(error) });
    } finally {
      setIsTesting(false);
    }
  }

  async function handleSave(enabled: boolean) {
    setIsSaving(true);
    try {
      const updated = await sync.saveConfig({
        atlasUri: atlasUri.trim(),
        syncEnabled: enabled,
        syncIntervalMinutes: syncInterval,
      });

      setConfig(updated);
      setTestResult({
        success: true,
        message: enabled ? "Sync enabled and saved!" : "Settings saved (sync disabled)",
      });
      await loadStatus();
    } catch (error) {
      setTestResult({ success: false, message: String(error) });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSyncNow() {
    setIsSyncing(true);
    try {
      const result = await sync.syncNow();
      if (result.success) {
        setTestResult({ success: true, message: "Sync completed successfully!" });
      } else {
        setTestResult({ success: false, message: result.error || "Sync failed" });
      }
      await loadStatus();
    } catch (error) {
      setTestResult({ success: false, message: String(error) });
    } finally {
      setIsSyncing(false);
    }
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString();
  }

  const lastSync = status?.lastSyncTime || config?.lastSyncTime || null;
  const isEnabled = !!config?.syncEnabled;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Cloud className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Cloud Sync Settings</h1>
          <p className="text-gray-500">Sync your farm data to MongoDB Atlas</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-4 mb-6">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Sync Status
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-center mb-1">
              {status?.isOnline ? (
                <Cloud className="w-6 h-6 text-green-500" />
              ) : (
                <CloudOff className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div className="text-sm font-medium">
              {status?.isOnline ? "Online" : "Offline"}
            </div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-center mb-1">
              {status?.isSyncing ? (
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              ) : (
                <CheckCircle className="w-6 h-6 text-green-500" />
              )}
            </div>
            <div className="text-sm font-medium">
              {status?.isSyncing ? "Syncing..." : "Idle"}
            </div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg col-span-2">
            <div className="text-xs text-gray-500">Last Sync</div>
            <div className="text-sm font-medium">{formatDate(lastSync)}</div>
          </div>
        </div>
        {status?.error && (
          <div className="mt-3 p-2 bg-red-50 text-red-600 text-sm rounded">
            Error: {status.error}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border p-4 mb-6">
        <h2 className="font-semibold mb-4">MongoDB Atlas Configuration</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Atlas Connection URI
            </label>
            <input
              type="password"
              value={atlasUri}
              onChange={(e) => setAtlasUri(e.target.value)}
              placeholder="mongodb+srv://username:password@cluster.mongodb.net/database"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
            <p className="text-xs text-gray-500 mt-1">
              Get this from MongoDB Atlas → Connect → Drivers
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Sync Interval (minutes)
            </label>
            <select
              value={syncInterval}
              onChange={(e) => setSyncInterval(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value={5}>Every 5 minutes</option>
              <option value={15}>Every 15 minutes</option>
              <option value={30}>Every 30 minutes</option>
              <option value={60}>Every hour</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Device ID</label>
            <input
              type="text"
              value={config?.deviceId || ""}
              readOnly
              className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Unique identifier for this device (auto-generated)
            </p>
          </div>
        </div>

        {testResult && (
          <div
            className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
              testResult.success
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {testResult.success ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={handleTestConnection}
            disabled={isTesting || !atlasUri.trim()}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
          >
            {isTesting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Cloud className="w-4 h-4" />
            )}
            Test Connection
          </button>

          <button
            onClick={() => handleSave(true)}
            disabled={isSaving || !atlasUri.trim()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Enable Sync &amp; Save
          </button>

          {isEnabled && (
            <button
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
            >
              Disable Sync
            </button>
          )}
        </div>
      </div>

      {isEnabled && (
        <div className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold mb-3">Manual Sync</h2>
          <p className="text-sm text-gray-500 mb-4">
            Data syncs automatically every {config?.syncIntervalMinutes ?? 15}{" "}
            minutes. Use this button to sync immediately.
          </p>
          <button
            onClick={handleSyncNow}
            disabled={isSyncing || !status?.isOnline}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
          >
            {isSyncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Sync Now
          </button>
        </div>
      )}

      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">
          How Cloud Sync Works
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>- Your data is stored locally first (works offline)</li>
          <li>- When online, data syncs to MongoDB Atlas automatically</li>
          <li>- Owner can see all farms by logging in on any device</li>
          <li>- Each device has a unique ID to track changes</li>
        </ul>
      </div>
    </div>
  );
}

