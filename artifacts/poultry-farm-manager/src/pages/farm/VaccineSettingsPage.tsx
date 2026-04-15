import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { vaccinesApi, isElectron } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { useNavigate } from "react-router-dom";
import type { Vaccine } from "@/types/electron";
import { ArrowLeft, Plus, Pencil, Trash2, RotateCcw, X, Check } from "lucide-react";
import { useFarmId } from "@/hooks/useFarmId";

const routeOptions = [
  { value: "", label: "None" },
  { value: "eye_drop", label: "Eye Drop" },
  { value: "drinking_water", label: "Drinking Water" },
  { value: "injection", label: "Injection" },
  { value: "wing_web", label: "Wing Web" },
  { value: "spray", label: "Spray" },
  { value: "oral", label: "Oral" },
];

export default function VaccineSettingsPage(): React.ReactElement {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const farmId = useFarmId();

  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formRoute, setFormRoute] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const loadVaccines = async () => {
    if (!isElectron() || !farmId) { setIsLoading(false); return; }
    try {
      const list = await vaccinesApi.getByFarm(farmId);
      setVaccines(list);
    } catch {
      toast.error("Failed to load vaccines");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadVaccines(); }, [farmId]);

  const resetForm = () => {
    setFormName("");
    setFormRoute("");
    setFormNotes("");
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleAdd = async () => {
    if (!farmId || !formName.trim()) return;
    setIsSaving(true);
    try {
      await vaccinesApi.create(farmId, {
        name: formName.trim(),
        defaultRoute: formRoute || undefined,
        notes: formNotes.trim() || undefined,
      });
      resetForm();
      await loadVaccines();
      toast.success("Vaccine added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add vaccine");
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (v: Vaccine) => {
    setEditingId(v.id);
    setFormName(v.name);
    setFormRoute(v.defaultRoute || "");
    setFormNotes(v.notes || "");
    setShowAddForm(false);
  };

  const handleUpdate = async () => {
    if (!editingId || !formName.trim()) return;
    setIsSaving(true);
    try {
      await vaccinesApi.update(editingId, {
        name: formName.trim(),
        defaultRoute: formRoute || undefined,
        notes: formNotes.trim() || undefined,
      });
      resetForm();
      await loadVaccines();
      toast.success("Vaccine updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update vaccine");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await vaccinesApi.delete(id);
      setDeleteId(null);
      await loadVaccines();
      toast.success("Vaccine removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete vaccine");
    }
  };

  const handleReset = async () => {
    if (!farmId) return;
    try {
      const list = await vaccinesApi.resetToDefaults(farmId);
      setVaccines(list);
      setConfirmReset(false);
      toast.success("Vaccines reset to defaults");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset vaccines");
    }
  };

  const formatRoute = (route: string | null) => {
    if (!route) return "";
    const match = routeOptions.find(r => r.value === route);
    return match ? match.label : route;
  };

  if (!farmId) {
    return <div className="p-6 text-gray-500">Farm access required.</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Manage Vaccines</h1>
          <p className="text-sm text-gray-500 mt-0.5">Add, edit, or remove vaccine names used in vaccination records</p>
        </div>
        <button
          onClick={() => setConfirmReset(true)}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset to Defaults
        </button>
      </div>

      {confirmReset && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
          <p className="text-amber-800 font-medium">Reset all vaccines to defaults?</p>
          <p className="text-amber-700 mt-1">This will remove all custom vaccines and restore the default list.</p>
          <div className="flex gap-2 mt-2">
            <button onClick={handleReset} className="px-3 py-1 text-sm bg-amber-600 text-white rounded hover:bg-amber-700">Yes, Reset</button>
            <button onClick={() => setConfirmReset(false)} className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-700">{vaccines.length} vaccine{vaccines.length !== 1 ? "s" : ""}</span>
              <button
                onClick={() => { resetForm(); setShowAddForm(true); }}
                className="px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add Vaccine
              </button>
            </div>

            {showAddForm && (
              <div className="px-4 py-3 border-b border-gray-200 bg-emerald-50">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Vaccine name *"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  />
                  <div className="flex gap-2">
                    <select
                      value={formRoute}
                      onChange={(e) => setFormRoute(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                    >
                      {routeOptions.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="Notes (optional)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAdd} disabled={isSaving || !formName.trim()} className="px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> {isSaving ? "Saving..." : "Save"}
                    </button>
                    <button onClick={resetForm} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-1">
                      <X className="h-3.5 w-3.5" /> Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {vaccines.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No vaccines yet. Click "Add Vaccine" to get started.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {vaccines.map((v) => (
                  <li key={v.id}>
                    {editingId === v.id ? (
                      <div className="px-4 py-3 bg-blue-50 space-y-2">
                        <input
                          type="text"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          autoFocus
                          onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
                        />
                        <div className="flex gap-2">
                          <select
                            value={formRoute}
                            onChange={(e) => setFormRoute(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          >
                            {routeOptions.map(r => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={formNotes}
                            onChange={(e) => setFormNotes(e.target.value)}
                            placeholder="Notes (optional)"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleUpdate} disabled={isSaving || !formName.trim()} className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
                            <Check className="h-3.5 w-3.5" /> {isSaving ? "Saving..." : "Update"}
                          </button>
                          <button onClick={resetForm} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-1">
                            <X className="h-3.5 w-3.5" /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{v.name}</span>
                            {v.isDefault === 1 && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">Default</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            {v.defaultRoute && (
                              <span className="text-xs text-gray-500">Route: {formatRoute(v.defaultRoute)}</span>
                            )}
                            {v.notes && (
                              <span className="text-xs text-gray-400">{v.notes}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button onClick={() => startEdit(v)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {deleteId === v.id ? (
                            <div className="flex items-center gap-1 ml-1">
                              <button onClick={() => handleDelete(v.id)} className="px-2 py-1 text-xs text-red-700 bg-red-50 rounded hover:bg-red-100">Delete</button>
                              <button onClick={() => setDeleteId(null)} className="px-2 py-1 text-xs text-gray-600 rounded hover:bg-gray-100">Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteId(v.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="mt-3 text-xs text-gray-400 text-center">
            These vaccines appear in the vaccine selector when adding vaccination records. You can still type a custom name for one-time use.
          </p>
        </>
      )}
    </div>
  );
}
