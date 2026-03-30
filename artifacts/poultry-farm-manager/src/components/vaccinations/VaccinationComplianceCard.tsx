import type { ComplianceStats } from "@/types/electron";

interface Props {
  stats: ComplianceStats;
}

export default function VaccinationComplianceCard({ stats }: Props) {
  const rateColor =
    stats.rate >= 90
      ? "text-green-600"
      : stats.rate >= 70
        ? "text-amber-600"
        : "text-red-600";
  const barColor =
    stats.rate >= 90
      ? "bg-green-500"
      : stats.rate >= 70
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h3 className="text-sm font-medium text-gray-500 mb-3">Vaccination Compliance</h3>
      <div className="flex items-end gap-3 mb-3">
        <span className={`text-3xl font-bold ${rateColor}`}>{stats.rate}%</span>
        <span className="text-sm text-gray-500 pb-1">
          {stats.completed} of {stats.completed + stats.skipped + stats.overdue} completed
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div
          className={`h-2.5 rounded-full ${barColor} transition-all`}
          style={{ width: `${stats.rate}%` }}
        />
      </div>
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <div>
          <div className="font-semibold text-green-600">{stats.completed}</div>
          <div className="text-gray-500">Completed</div>
        </div>
        <div>
          <div className="font-semibold text-gray-600">{stats.pending}</div>
          <div className="text-gray-500">Pending</div>
        </div>
        <div>
          <div className="font-semibold text-red-600">{stats.overdue}</div>
          <div className="text-gray-500">Overdue</div>
        </div>
        <div>
          <div className="font-semibold text-amber-600">{stats.skipped}</div>
          <div className="text-gray-500">Skipped</div>
        </div>
      </div>
      {stats.rate < 70 && (
        <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-700 flex items-center gap-1">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Low compliance rate. Review overdue vaccinations.
        </div>
      )}
      {stats.lastCompletedDate && (
        <div className="mt-3 text-xs text-gray-500">
          Last completed: {stats.lastCompletedVaccine} on {stats.lastCompletedDate}
        </div>
      )}
    </div>
  );
}
