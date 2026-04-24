import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Egg, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/Toast";
import { eggCategories, isElectron } from "@/lib/api";
import { useFarmId } from "@/hooks/useFarmId";
import type { EggCategory } from "@/types/electron";

const UNIT_OPTIONS: Array<EggCategory["unit"]> = ["tray", "dozen", "piece", "crate"];

function normalizeUnit(unit: unknown): EggCategory["unit"] {
  const u = String(unit ?? "tray") as EggCategory["unit"];
  return UNIT_OPTIONS.includes(u) ? u : "tray";
}

export default function EggCategoriesSettings(): React.ReactElement {
  const navigate = useNavigate();
  const toast = useToast();
  const farmId = useFarmId();

  const [list, setList] = useState<EggCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formUnit, setFormUnit] = useState<EggCategory["unit"]>("tray");
  const [formDescription, setFormDescription] = useState("");
  const [formSortOrder, setFormSortOrder] = useState("0");
  const [formIsActive, setFormIsActive] = useState(true);

  const activeCount = useMemo(() => list.filter((c) => (c.isActive ?? 1) !== 0).length, [list]);

  const resetForm = () => {
    setFormName("");
    setFormPrice("");
    setFormUnit("tray");
    setFormDescription("");
    setFormSortOrder("0");
    setFormIsActive(true);
    setShowAdd(false);
    setEditingId(null);
    setDeleteId(null);
  };

  const load = async () => {
    if (!isElectron() || !farmId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await eggCategories.getAll(farmId);
      setList(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load egg categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId]);

  const startAdd = () => {
    resetForm();
    setShowAdd(true);
  };

  const startEdit = (c: EggCategory) => {
    setEditingId(c.id);
    setShowAdd(false);
    setDeleteId(null);
    setFormName(c.name ?? "");
    setFormPrice(String(c.defaultPrice ?? 0));
    setFormUnit(normalizeUnit(c.unit));
    setFormDescription(c.description ?? "");
    setFormSortOrder(String(c.sortOrder ?? 0));
    setFormIsActive((c.isActive ?? 1) !== 0);
  };

  const submitAdd = async () => {
    if (!farmId) return;
    if (!formName.trim()) return;
    setSaving(true);
    try {
      await eggCategories.create({
        farmId,
        name: formName.trim(),
        description: formDescription.trim() || "",
        defaultPrice: Math.max(0, Number(formPrice || 0)),
        unit: formUnit,
        sortOrder: Math.trunc(Number(formSortOrder || 0)),
        isActive: 1,
      });
      toast.success("Category added");
      resetForm();
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add category");
    } finally {
      setSaving(false);
    }
  };

  const submitUpdate = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      await eggCategories.update(editingId, {
        name: formName.trim(),
        description: formDescription.trim() || "",
        defaultPrice: Math.max(0, Number(formPrice || 0)),
        unit: formUnit,
        sortOrder: Math.trunc(Number(formSortOrder || 0)),
        isActive: formIsActive ? 1 : 0,
      });
      toast.success("Category updated");
      resetForm();
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update category");
    } finally {
      setSaving(false);
    }
  };

  const submitDelete = async (id: number) => {
    setSaving(true);
    try {
      await eggCategories.delete(id);
      toast.success("Category deactivated");
      setDeleteId(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete category");
    } finally {
      setSaving(false);
    }
  };

  const seedDefaults = async () => {
    if (!farmId) return;
    setSeeding(true);
    try {
      const res = await eggCategories.seedDefaults(farmId);
      const msg = (res as any)?.message as string | undefined;
      if (msg) toast.success(msg);
      else if ((res as any)?.skipped) toast.success("Defaults already exist");
      else toast.success(`Seeded ${(res as any)?.seeded ?? 0} categories`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to seed defaults");
    } finally {
      setSeeding(false);
    }
  };

  if (!farmId) {
    return <div className="p-6 text-gray-500">Farm access required.</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Egg className="h-5 w-5 text-amber-600" />
            Egg Categories
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage the categories shown in Sales (default unit & price per item).
          </p>
        </div>
        <button
          onClick={seedDefaults}
          disabled={seeding}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 disabled:opacity-50"
        >
          <RotateCcw className="h-3.5 w-3.5" /> {seeding ? "Seeding..." : "Load Defaults"}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">
              {activeCount} active / {list.length} total
            </span>
            <button
              onClick={startAdd}
              className="px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Add Category
            </button>
          </div>

          {(showAdd || editingId) && (
            <div className={`px-4 py-3 border-b border-gray-200 ${editingId ? "bg-blue-50" : "bg-emerald-50"}`}>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Name *"
                  className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  autoFocus
                />
                <input
                  type="number"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="Default price"
                  className="md:col-span-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  min={0}
                />
                <select
                  value={formUnit}
                  onChange={(e) => setFormUnit(normalizeUnit(e.target.value))}
                  className="md:col-span-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={formSortOrder}
                  onChange={(e) => setFormSortOrder(e.target.value)}
                  placeholder="Sort"
                  className="md:col-span-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <label className="md:col-span-1 flex items-center gap-2 px-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Active
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Description (optional)"
                  className="md:col-span-6 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex gap-2 mt-3">
                {editingId ? (
                  <button
                    onClick={submitUpdate}
                    disabled={saving || !formName.trim()}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    <Check className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Update"}
                  </button>
                ) : (
                  <button
                    onClick={submitAdd}
                    disabled={saving || !formName.trim()}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    <Check className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save"}
                  </button>
                )}
                <button
                  onClick={resetForm}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-1"
                >
                  <X className="h-3.5 w-3.5" /> Cancel
                </button>
              </div>
            </div>
          )}

          {list.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-gray-500 space-y-2">
              <div>No egg categories yet.</div>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={seedDefaults}
                  disabled={seeding}
                  className="px-3 py-1.5 text-sm font-medium text-emerald-700 border border-emerald-300 rounded-lg hover:bg-emerald-50 disabled:opacity-50"
                >
                  Load Defaults
                </button>
                <button
                  onClick={startAdd}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
                >
                  Add manually
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Name</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Unit</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-700">Default price</th>
                    <th className="px-4 py-2 text-center font-medium text-gray-700">Active</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {list
                    .slice()
                    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name))
                    .map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <div className="font-medium text-gray-900">{c.name}</div>
                          {c.description ? <div className="text-xs text-gray-500">{c.description}</div> : null}
                        </td>
                        <td className="px-4 py-2 text-gray-700">{normalizeUnit(c.unit)}</td>
                        <td className="px-4 py-2 text-right text-gray-700">{Number(c.defaultPrice ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-2 text-center">
                          {(c.isActive ?? 1) !== 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                              <Check className="h-3 w-3" /> Active
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">Inactive</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => startEdit(c)}
                              className="p-1.5 hover:bg-gray-100 rounded-lg"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => setDeleteId(c.id)}
                              className="p-1.5 hover:bg-red-50 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {deleteId != null && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trash2 className="h-4 w-4 text-red-600" />
              <h3 className="font-semibold text-gray-900">Delete category?</h3>
            </div>
            <p className="text-sm text-gray-600">
              This will disable the category (soft delete). Existing sales will keep their item names.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setDeleteId(null)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => submitDelete(deleteId)}
                disabled={saving}
                className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

