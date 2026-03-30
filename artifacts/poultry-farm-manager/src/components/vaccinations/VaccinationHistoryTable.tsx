import { useState } from "react";
import type { VaccinationHistoryItem } from "@/types/electron";

interface Props {
  items: VaccinationHistoryItem[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  sortColumn: string;
  sortDirection: "asc" | "desc";
  onSort: (column: string) => void;
}

function StatusBadge({ status, scheduledDate }: { status: string | null; scheduledDate: string }) {
  const today = new Date().toISOString().split("T")[0];
  const isOverdue = status === "pending" && scheduledDate < today;

  if (status === "completed") {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Completed</span>;
  }
  if (status === "skipped") {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Skipped</span>;
  }
  if (isOverdue) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">Overdue</span>;
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Pending</span>;
}

export default function VaccinationHistoryTable({
  items,
  isLoading,
  page,
  totalPages,
  total,
  onPageChange,
  sortColumn,
  sortDirection,
  onSort,
}: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) {
      return <span className="text-gray-300 ml-1">&#8645;</span>;
    }
    return <span className="text-blue-600 ml-1">{sortDirection === "asc" ? "&#8593;" : "&#8595;"}</span>;
  };

  const columns = [
    { key: "date", label: "Date" },
    { key: "flock", label: "Flock" },
    { key: "vaccine", label: "Vaccine" },
    { key: "status", label: "Status" },
    { key: "administeredBy", label: "Administered By" },
    { key: "batchNumber", label: "Batch #" },
  ];

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
        <div className="animate-spin inline-block w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full mb-2" />
        <p>Loading vaccination history...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
        No vaccination records found matching your filters.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => onSort(col.key)}
                >
                  {col.label}
                  <SortIcon column={col.key} />
                </th>
              ))}
              <th className="px-4 py-3 text-left font-medium text-gray-600 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(item => (
              <>
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                >
                  <td className="px-4 py-3 text-gray-900">{item.administeredDate || item.scheduledDate}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{item.flockName}</div>
                    <div className="text-xs text-gray-500">{item.flockBreed}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-900">{item.vaccineName}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} scheduledDate={item.scheduledDate} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.administeredBy || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{item.batchNumber || "—"}</td>
                  <td className="px-4 py-3 text-gray-400">
                    <svg className={`w-4 h-4 transition-transform ${expandedId === item.id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </td>
                </tr>
                {expandedId === item.id && (
                  <tr key={`${item.id}-detail`} className="bg-gray-50">
                    <td colSpan={7} className="px-4 py-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 font-medium">Scheduled:</span>
                          <span className="ml-1 text-gray-700">{item.scheduledDate}</span>
                        </div>
                        {item.administeredDate && (
                          <div>
                            <span className="text-gray-500 font-medium">Administered:</span>
                            <span className="ml-1 text-gray-700">{item.administeredDate}</span>
                          </div>
                        )}
                        {item.batchNumber && (
                          <div>
                            <span className="text-gray-500 font-medium">Batch #:</span>
                            <span className="ml-1 text-gray-700">{item.batchNumber}</span>
                          </div>
                        )}
                        {item.notes && (
                          <div className="col-span-2">
                            <span className="text-gray-500 font-medium">Notes:</span>
                            <span className="ml-1 text-gray-700">{item.notes}</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-500">
          Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, total)} of {total} records
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
