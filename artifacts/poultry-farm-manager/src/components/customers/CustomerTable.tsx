import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Edit, ChevronUp, ChevronDown } from "lucide-react";
import type { Customer } from "@/types/electron";
import CategoryBadge from "./CategoryBadge";

interface CustomerTableProps {
  customers: Customer[];
}

type SortKey = "name" | "category" | "phone" | "businessName" | "createdAt";
type SortDir = "asc" | "desc";

export default function CustomerTable({ customers }: CustomerTableProps): React.ReactElement {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = [...customers].sort((a, b) => {
    const valA = (a[sortKey] ?? "") as string;
    const valB = (b[sortKey] ?? "") as string;
    const cmp = valA.localeCompare(valB);
    return sortDir === "asc" ? cmp : -cmp;
  });

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return null;
    return sortDir === "asc" ? (
      <ChevronUp className="h-3.5 w-3.5" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5" />
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th
                className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-1">
                  Name <SortIcon column="name" />
                </div>
              </th>
              <th
                className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                onClick={() => handleSort("businessName")}
              >
                <div className="flex items-center gap-1">
                  Business <SortIcon column="businessName" />
                </div>
              </th>
              <th
                className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                onClick={() => handleSort("phone")}
              >
                <div className="flex items-center gap-1">
                  Phone <SortIcon column="phone" />
                </div>
              </th>
              <th
                className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                onClick={() => handleSort("category")}
              >
                <div className="flex items-center gap-1">
                  Category <SortIcon column="category" />
                </div>
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr
                key={c.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/farm/customers/${c.id}`)}
              >
                <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-3 text-gray-600">{c.businessName || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{c.phone || "—"}</td>
                <td className="px-4 py-3">
                  <CategoryBadge category={c.category} />
                </td>
                <td className="px-4 py-3">
                  {c.isActive === 0 ? (
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
                      Inactive
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/farm/customers/${c.id}`)}
                      className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/farm/customers/${c.id}/edit`)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
