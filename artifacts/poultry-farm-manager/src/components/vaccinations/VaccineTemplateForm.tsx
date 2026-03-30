import React, { useState, useEffect } from "react";
import { X, Plus, Pencil } from "lucide-react";
import type { VaccinationScheduleData } from "@/types/electron";

const ROUTES = ["Eye drop", "Drinking water", "Injection", "Wing web", "Spray"];

interface VaccineTemplateFormProps {
  initialData?: (VaccinationScheduleData & { id?: number }) | null;
  onSave: (data: VaccinationScheduleData) => Promise<void>;
  onCancel: () => void;
}

export default function VaccineTemplateForm({ initialData, onSave, onCancel }: VaccineTemplateFormProps): React.ReactElement {
  const [vaccineName, setVaccineName] = useState("");
  const [ageDays, setAgeDays] = useState<number | "">("");
  const [route, setRoute] = useState("");
  const [isMandatory, setIsMandatory] = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setVaccineName(initialData.vaccineName);
      setAgeDays(initialData.ageDays);
      setRoute(initialData.route || "");
      setIsMandatory(initialData.isMandatory !== 0);
      setNotes(initialData.notes || "");
    }
  }, [initialData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vaccineName || ageDays === "") return;
    setSaving(true);
    try {
      await onSave({
        vaccineName,
        ageDays: Number(ageDays),
        route: route || undefined,
        isMandatory: isMandatory ? 1 : 0,
        notes: notes || undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  const isEdit = !!initialData;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isEdit ? <Pencil className="h-4 w-4 text-blue-600" /> : <Plus className="h-4 w-4 text-green-600" />}
          <h3 className="text-sm font-semibold text-gray-900">{isEdit ? "Edit Vaccine" : "Add Vaccine to Template"}</h3>
        </div>
        <button onClick={onCancel} className="p-1 rounded hover:bg-gray-100">
          <X className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vaccine Name *</label>
            <input
              type="text"
              value={vaccineName}
              onChange={e => setVaccineName(e.target.value)}
              required
              placeholder="e.g., Newcastle + IB"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age (Days) *</label>
            <input
              type="number"
              value={ageDays}
              onChange={e => setAgeDays(e.target.value === "" ? "" : Number(e.target.value))}
              required
              min={0}
              placeholder="e.g., 7"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
            <select
              value={route}
              onChange={e => setRoute(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Select route...</option>
              {ROUTES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isMandatory}
                onChange={e => setIsMandatory(e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Mandatory</span>
            </label>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Optional notes"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">
            Cancel
          </button>
          <button type="submit" disabled={saving || !vaccineName || ageDays === ""} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">
            {saving ? "Saving..." : isEdit ? "Update" : "Add to Template"}
          </button>
        </div>
      </form>
    </div>
  );
}
