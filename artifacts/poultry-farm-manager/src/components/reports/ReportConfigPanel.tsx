import { useState, useEffect } from "react";
import { flocks as flocksApi } from "@/lib/api";

export type ReportType = "daily" | "weekly" | "monthly" | "flock" | "financial";

interface Props {
  reportType: ReportType;
  farmId: number;
  onGenerate: (config: ReportConfig) => void;
  isGenerating: boolean;
}

export interface ReportConfig {
  reportType: ReportType;
  date?: string;
  startDate?: string;
  endDate?: string;
  month?: number;
  year?: number;
  flockId?: number;
}

export default function ReportConfigPanel({ reportType, farmId, onGenerate, isGenerating }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(today);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [flockId, setFlockId] = useState<number | undefined>();
  const [flocksList, setFlocksList] = useState<{ id: number; batchName: string }[]>([]);

  useEffect(() => {
    if (reportType === "flock") {
      flocksApi.getByFarm(farmId).then((data: unknown) => {
        if (Array.isArray(data)) {
          setFlocksList(data.map((f: { id: number; batchName: string }) => ({ id: f.id, batchName: f.batchName })));
          if (data.length > 0 && !flockId) setFlockId(data[0].id);
        }
      }).catch((err: unknown) => { console.error("Failed to load flocks:", err); });
    }
  }, [farmId, reportType]);

  function handleGenerate() {
    const config: ReportConfig = { reportType };
    if (reportType === "daily") config.date = date;
    else if (reportType === "weekly" || reportType === "financial") { config.startDate = startDate; config.endDate = endDate; }
    else if (reportType === "monthly") { config.month = month; config.year = year; }
    else if (reportType === "flock") config.flockId = flockId;
    onGenerate(config);
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 mb-4">Report Configuration</h3>
      <div className="space-y-4">
        {reportType === "daily" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} max={today}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        )}

        {(reportType === "weekly" || reportType === "financial") && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} max={today}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} max={today}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
        )}

        {reportType === "monthly" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select value={month} onChange={e => setMonth(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select value={year} onChange={e => setYear(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {reportType === "flock" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Flock</label>
            <select value={flockId || ""} onChange={e => setFlockId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              {flocksList.length === 0 && <option value="">No flocks available</option>}
              {flocksList.map(f => (
                <option key={f.id} value={f.id}>{f.batchName}</option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating || (reportType === "flock" && !flockId)}
          className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate Report
            </>
          )}
        </button>
      </div>
    </div>
  );
}
