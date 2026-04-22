import type { DailyReportData } from "@/types/electron";
import ReportHeader from "./ReportHeader";
import ReportFooter from "./ReportFooter";

interface Props {
  data: DailyReportData;
}

export default function DailySummaryReport({ data }: Props) {
  return (
    <div className="bg-white p-6 print:p-4">
      <ReportHeader
        farmName={data.farm.name}
        farmLocation={data.farm.location}
        title="Daily Summary Report"
        subtitle={new Date(data.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        generatedDate={new Date().toLocaleString()}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-700">{Number(data.totals.birds ?? 0).toLocaleString()}</div>
          <div className="text-xs text-blue-600">Total Birds</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-amber-700">{Number(data.totals.eggsTotal ?? 0).toLocaleString()}</div>
          <div className="text-xs text-amber-600">Total Eggs</div>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-700">{data.totals.deaths}</div>
          <div className="text-xs text-red-600">Deaths</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-700">Rs {Number(data.totals.revenue ?? 0).toLocaleString()}</div>
          <div className="text-xs text-green-600">Revenue</div>
        </div>
      </div>

      <h3 className="font-semibold text-gray-800 mb-2">Flock Breakdown</h3>
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-left font-medium text-gray-700 border border-gray-200">Flock</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700 border border-gray-200">Birds</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700 border border-gray-200">Eggs</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700 border border-gray-200">Deaths</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700 border border-gray-200">Feed (kg)</th>
            </tr>
          </thead>
          <tbody>
            {data.flocks.map(f => (
              <tr key={f.flockId} className="hover:bg-gray-50">
                <td className="px-3 py-2 border border-gray-200">
                  <div className="font-medium">{f.batchName}</div>
                  {f.breed && <div className="text-xs text-gray-500">{f.breed}</div>}
                </td>
                <td className="px-3 py-2 text-right border border-gray-200">{f.currentCount}</td>
                <td className="px-3 py-2 text-right border border-gray-200 font-medium">{Number(f.totalEggs ?? 0)}</td>
                <td className="px-3 py-2 text-right border border-gray-200">{f.deaths > 0 ? <span className="text-red-600">{f.deaths}</span> : "0"}</td>
                <td className="px-3 py-2 text-right border border-gray-200">{f.feedConsumedKg}</td>
              </tr>
            ))}
            <tr className="bg-gray-100 font-semibold">
              <td className="px-3 py-2 border border-gray-200">Totals</td>
              <td className="px-3 py-2 text-right border border-gray-200">{data.totals.birds}</td>
              <td className="px-3 py-2 text-right border border-gray-200">{data.totals.eggsTotal}</td>
              <td className="px-3 py-2 text-right border border-gray-200">{data.totals.deaths}</td>
              <td className="px-3 py-2 text-right border border-gray-200">{data.totals.feedKg}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="border border-gray-200 rounded-lg p-3">
          <h4 className="text-xs font-medium text-gray-500 mb-1">Feed</h4>
          <div className="text-lg font-bold text-gray-900">{data.totals.feedKg} kg</div>
          <div className="text-xs text-gray-500">
            {data.totals.birds > 0 ? `${(data.totals.feedKg / data.totals.birds * 1000).toFixed(0)}g per bird` : "—"}
          </div>
        </div>
        <div className="border border-gray-200 rounded-lg p-3">
          <h4 className="text-xs font-medium text-gray-500 mb-1">Financial</h4>
          <div className="text-sm">
            <div className="flex justify-between"><span>Revenue</span><span className="font-medium text-green-600">Rs {Number(data.totals.revenue ?? 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Expenses</span><span className="font-medium text-red-600">Rs {Number(data.totals.expenses ?? 0).toLocaleString()}</span></div>
            <div className="flex justify-between border-t border-gray-200 mt-1 pt-1">
              <span className="font-medium">Net</span>
              <span className={`font-bold ${data.totals.revenue - data.totals.expenses >= 0 ? "text-green-600" : "text-red-600"}`}>
                Rs {(Number(data.totals.revenue ?? 0) - Number(data.totals.expenses ?? 0)).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {data.notes.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-2">Notes & Observations</h3>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            {data.notes.map((note, i) => <li key={i}>{note}</li>)}
          </ul>
        </div>
      )}

      <ReportFooter />
    </div>
  );
}
