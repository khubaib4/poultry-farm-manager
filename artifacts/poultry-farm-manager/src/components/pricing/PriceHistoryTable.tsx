import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface EggPriceRecord {
  grade: string;
  pricePerEgg: number;
  pricePerTray: number;
}

interface HistoryGroup {
  effectiveDate: string;
  prices: EggPriceRecord[];
}

interface PriceHistoryTableProps {
  history: HistoryGroup[];
}

const PAGE_SIZE = 10;

export default function PriceHistoryTable({ history }: PriceHistoryTableProps): React.ReactElement {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(history.length / PAGE_SIZE);
  const paginated = history.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function findGrade(prices: EggPriceRecord[], grade: string) {
    return prices.find(p => p.grade === grade);
  }

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-xl border shadow-sm p-8 text-center">
        <p className="text-gray-500">No price history yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm">
      <div className="px-5 py-4 border-b">
        <h3 className="text-lg font-semibold">Price History</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="py-3 px-4 text-left font-medium text-gray-600">Effective Date</th>
              <th className="py-3 px-4 text-right font-medium text-gray-600">Grade A (egg / tray)</th>
              <th className="py-3 px-4 text-right font-medium text-gray-600">Grade B (egg / tray)</th>
              <th className="py-3 px-4 text-right font-medium text-gray-600">Cracked (egg / tray)</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((group, idx) => {
              const a = findGrade(group.prices, "A");
              const b = findGrade(group.prices, "B");
              const c = findGrade(group.prices, "cracked");
              return (
                <tr key={idx} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-medium">{new Date(group.effectiveDate + "T00:00:00").toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-right">
                    {a ? `${formatCurrency(a.pricePerEgg)} / ${formatCurrency(a.pricePerTray)}` : "—"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {b ? `${formatCurrency(b.pricePerEgg)} / ${formatCurrency(b.pricePerTray)}` : "—"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {c ? `${formatCurrency(c.pricePerEgg)} / ${formatCurrency(c.pricePerTray)}` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t">
          <span className="text-sm text-gray-500">Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page === 0}
              className="inline-flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages - 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
