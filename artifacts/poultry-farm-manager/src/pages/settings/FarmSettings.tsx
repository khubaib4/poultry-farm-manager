import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { profile as profileApi, farms, isElectron } from "@/lib/api";
import type { FarmProfile } from "@/types/electron";
import SettingSection from "@/components/settings/SettingSection";
import SettingRow from "@/components/settings/SettingRow";
import { CheckCircle, AlertTriangle, Syringe, X, Plus, Egg } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFarmId } from "@/hooks/useFarmId";

export default function FarmSettings(): React.ReactElement {
  const { user } = useAuth();
  const { settings, updateSettings } = useSettings();
  const navigate = useNavigate();
  const [farm, setFarm] = useState<FarmProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editCapacity, setEditCapacity] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [newCause, setNewCause] = useState("");

  const farmId = useFarmId();

  useEffect(() => {
    if (!isElectron() || !farmId) { setIsLoading(false); return; }
    profileApi.getFarmProfile()
      .then((p) => {
        setFarm(p);
        setEditName(p.name);
        setEditLocation(p.location || "");
        setEditCapacity(p.capacity?.toString() || "");
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [farmId]);

  const handleSaveFarm = async () => {
    if (!farmId) return;
    setIsSaving(true);
    try {
      await farms.update(farmId, {
        name: editName,
        location: editLocation,
        capacity: editCapacity ? parseInt(editCapacity) : undefined,
      });
      setMessage({ type: "success", text: "Farm settings updated" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Update failed" });
    } finally { setIsSaving(false); }
  };

  const handleAddCause = () => {
    if (!newCause.trim()) return;
    const causes = [...settings.defaultDeathCauses, newCause.trim()];
    updateSettings({ defaultDeathCauses: causes });
    setNewCause("");
  };

  const handleRemoveCause = (index: number) => {
    const causes = settings.defaultDeathCauses.filter((_, i) => i !== index);
    updateSettings({ defaultDeathCauses: causes });
  };

  if (!farmId) {
    return <p className="text-gray-500 text-sm">Farm settings are only available for farm users.</p>;
  }

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>;
  }

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

      <SettingSection title="Farm Information" description="Update your farm details">
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Farm Name</label>
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input type="text" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Enter location" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (birds)</label>
            <input type="number" value={editCapacity} onChange={(e) => setEditCapacity(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Maximum capacity" />
          </div>
          <button onClick={handleSaveFarm} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </SettingSection>

      {farm && (
        <SettingSection title="Farm Credentials" description="Login credentials for this farm">
          <SettingRow label="Username" description="Farm login username">
            <span className="text-sm text-gray-700 font-mono bg-gray-50 px-3 py-1 rounded">{farm.loginUsername}</span>
          </SettingRow>
        </SettingSection>
      )}

      <SettingSection title="Default Values" description="Default values for data entry">
        <SettingRow label="Feed Bag Weight" description="Default weight of a feed bag in kg">
          <input
            type="number"
            value={settings.defaultFeedBagWeight}
            onChange={(e) => updateSettings({ defaultFeedBagWeight: parseFloat(e.target.value) || 50 })}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-20 text-center"
            min={1}
          />
        </SettingRow>
        <div className="px-6 py-4">
          <p className="text-sm font-medium text-gray-700 mb-1">Default Death Causes</p>
          <p className="text-xs text-gray-500 mb-3">Predefined causes shown in daily entry forms</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {settings.defaultDeathCauses.map((cause, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                {cause}
                <button onClick={() => handleRemoveCause(i)} className="text-gray-400 hover:text-red-500"><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCause}
              onChange={(e) => setNewCause(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCause()}
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              placeholder="Add new cause"
            />
            <button onClick={handleAddCause} className="px-3 py-1.5 text-sm font-medium text-emerald-700 border border-emerald-300 rounded-lg hover:bg-emerald-50 flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
        </div>
      </SettingSection>

      <SettingSection title="Vaccination" description="Vaccination automation settings">
        <SettingRow label="Auto-Generate Vaccinations" description="Automatically create vaccination schedule for new flocks">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoGenerateVaccinations}
              onChange={(e) => updateSettings({ autoGenerateVaccinations: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
          </label>
        </SettingRow>
        <div className="px-6 py-3 space-y-2">
          <button
            onClick={() => navigate("/farm/settings/vaccines")}
            className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5"
          >
            <Syringe className="h-4 w-4" /> Manage Vaccine Names
          </button>
          <button
            onClick={() => navigate("/farm/settings/egg-categories")}
            className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5"
          >
            <Egg className="h-4 w-4" /> Manage Egg Categories (Sales)
          </button>
          <button
            onClick={() => navigate("/farm/vaccinations/template")}
            className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5"
          >
            <Syringe className="h-4 w-4" /> Manage Vaccination Templates
          </button>
        </div>
      </SettingSection>
    </div>
  );
}
