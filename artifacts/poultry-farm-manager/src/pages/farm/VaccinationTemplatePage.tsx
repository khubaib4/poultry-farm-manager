import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { isElectron, vaccinationSchedule as schedApi } from "@/lib/api";
import { Syringe, Plus, ArrowLeft, RotateCcw, Pencil, Trash2, Users } from "lucide-react";
import VaccineTemplateForm from "@/components/vaccinations/VaccineTemplateForm";
import ApplyTemplateModal from "@/components/vaccinations/ApplyTemplateModal";
import type { VaccinationScheduleData } from "@/types/electron";

interface ScheduleItem extends VaccinationScheduleData {
  id: number;
}

export default function VaccinationTemplatePage(): React.ReactElement {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ScheduleItem | null>(null);
  const [resetting, setResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const loadSchedules = useCallback(async () => {
    try {
      const data = await schedApi.getAll();
      setSchedules(data as ScheduleItem[]);
    } catch {
      setSchedules([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  if (!isElectron()) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
          Vaccination templates are only available in the desktop app.
        </div>
      </div>
    );
  }

  async function handleSave(data: VaccinationScheduleData) {
    if (editing) {
      await schedApi.update(editing.id, data);
    } else {
      await schedApi.create(data);
    }
    setShowForm(false);
    setEditing(null);
    await loadSchedules();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this vaccine from the template?")) return;
    await schedApi.delete(id);
    await loadSchedules();
  }

  async function handleReset() {
    setResetting(true);
    try {
      const data = await schedApi.resetToDefaults();
      setSchedules(data as ScheduleItem[]);
      setConfirmReset(false);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/farm/vaccinations")}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Syringe className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vaccination Schedule Template</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Define the default vaccination schedule for new flocks
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {confirmReset ? (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <span className="text-xs text-red-700">Replace all with defaults?</span>
              <button onClick={handleReset} disabled={resetting} className="text-xs font-medium text-red-700 hover:text-red-800">
                {resetting ? "Resetting..." : "Yes, Reset"}
              </button>
              <button onClick={() => setConfirmReset(false)} className="text-xs text-gray-500 hover:text-gray-700">
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Defaults
            </button>
          )}
          <button
            onClick={() => setShowApplyModal(true)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
          >
            <Users className="h-4 w-4" />
            Apply to Existing Flocks
          </button>
          <button
            onClick={() => { setShowForm(true); setEditing(null); }}
            className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            Add Vaccine
          </button>
        </div>
      </div>

      {(showForm || editing) && (
        <VaccineTemplateForm
          initialData={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading template...</p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Syringe className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No vaccines in template</p>
          <p className="text-gray-400 text-sm mt-1">Add vaccines or reset to defaults to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">Age (Days)</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Vaccine Name</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Route</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Mandatory</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Notes</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {schedules.map(sched => (
                  <tr key={sched.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-10 h-7 rounded bg-purple-100 text-purple-700 text-xs font-semibold">
                        {sched.ageDays}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{sched.vaccineName}</td>
                    <td className="px-4 py-3 text-gray-600">{sched.route || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        sched.isMandatory ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {sched.isMandatory ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">{sched.notes || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditing(sched); setShowForm(false); }}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(sched.id)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-xs text-gray-500">
              {schedules.length} vaccine{schedules.length !== 1 ? "s" : ""} in template.
              New flocks will automatically have vaccinations scheduled based on this template.
            </p>
          </div>
        </div>
      )}

      <ApplyTemplateModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
