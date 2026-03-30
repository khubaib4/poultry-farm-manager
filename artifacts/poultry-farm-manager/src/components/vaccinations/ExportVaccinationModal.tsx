import { useState, useEffect } from "react";
import { vaccinations } from "@/lib/api";
import { flocks as flocksApi } from "@/lib/api";
import { generateVaccinationCSV, generateVaccinationPDFContent, downloadFile, downloadPDFViaWindow } from "@/lib/exportUtils";

interface Props {
  farmId: number;
  farmName: string;
  onClose: () => void;
}

export default function ExportVaccinationModal({ farmId, farmName, onClose }: Props) {
  const [format, setFormat] = useState<"csv" | "pdf">("csv");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [flockId, setFlockId] = useState<number | undefined>();
  const [status, setStatus] = useState("all");
  const [includeNotes, setIncludeNotes] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");
  const [flocksList, setFlocksList] = useState<{ id: number; batchName: string }[]>([]);

  useEffect(() => {
    flocksApi.getByFarm(farmId).then((data: unknown) => {
      if (Array.isArray(data)) {
        setFlocksList(data.map((f: { id: number; batchName: string }) => ({ id: f.id, batchName: f.batchName })));
      }
    }).catch(() => {});
  }, [farmId]);

  async function handleExport() {
    setError("");
    setIsExporting(true);
    try {
      let data = await vaccinations.exportHistory(farmId, {
        flockId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: status !== "all" ? status : undefined,
      });

      if (!includeNotes) {
        data = data.map(d => ({ ...d, notes: "" }));
      }

      const dateStr = new Date().toISOString().split("T")[0];
      const dateRange = startDate && endDate ? `${startDate} to ${endDate}` : startDate ? `From ${startDate}` : endDate ? `Until ${endDate}` : "All time";

      if (format === "csv") {
        const csv = generateVaccinationCSV(data);
        downloadFile(csv, `vaccination-report-${dateStr}.csv`, "text/csv;charset=utf-8;");
      } else {
        const html = generateVaccinationPDFContent(data, {
          farmName,
          dateRange,
          generatedDate: new Date().toLocaleDateString(),
        });
        downloadPDFViaWindow(html, `vaccination-report-${dateStr}.pdf`);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    }
    setIsExporting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Export Vaccination Records</h3>
          <p className="text-sm text-gray-500 mt-1">Download vaccination data for {farmName}</p>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat("csv")}
                className={`px-4 py-2 rounded-lg border text-sm font-medium ${
                  format === "csv" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                CSV Spreadsheet
              </button>
              <button
                type="button"
                onClick={() => setFormat("pdf")}
                className={`px-4 py-2 rounded-lg border text-sm font-medium ${
                  format === "pdf" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                PDF Report
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Flock</label>
            <select
              value={flockId || ""}
              onChange={e => setFlockId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Flocks</option>
              {flocksList.map(f => (
                <option key={f.id} value={f.id}>{f.batchName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="skipped">Skipped</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeNotes}
              onChange={e => setIncludeNotes(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Include notes</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isExporting ? "Exporting..." : `Export ${format.toUpperCase()}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
