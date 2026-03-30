import type { MonthlyReportData } from "@/types/electron";
import ReportHeader from "./ReportHeader";
import ReportFooter from "./ReportFooter";

interface Props {
  data: MonthlyReportData;
}

const MONTH_NAMES = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function MonthlyReport({ data }: Props) {
  const categoryColors: Record<string, string> = {
    feed: "bg-amber-100 text-amber-700",
    medicine: "bg-blue-100 text-blue-700",
    labor: "bg-purple-100 text-purple-700",
    utilities: "bg-cyan-100 text-cyan-700",
    equipment: "bg-gray-100 text-gray-700",
    misc: "bg-pink-100 text-pink-700",
  };

  return (
    <div className="bg-white p-6 print:p-4">
      <ReportHeader
        farmName={data.farm.name}
        farmLocation={data.farm.location}
        title="Monthly Summary Report"
        subtitle={`${MONTH_NAMES[data.month]} ${data.year}`}
        generatedDate={new Date().toLocaleString()}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-700">{data.totals.birds.toLocaleString()}</div>
          <div className="text-xs text-blue-600">Current Birds</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-amber-700">{data.totals.eggsTotal.toLocaleString()}</div>
          <div className="text-xs text-amber-600">Total Eggs</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-700">Rs {data.financial.profit.toLocaleString()}</div>
          <div className="text-xs text-green-600">Net Profit</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-700">{data.averages.productionRate}%</div>
          <div className="text-xs text-purple-600">Production Rate</div>
        </div>
      </div>

      <h3 className="font-semibold text-gray-800 mb-2">Weekly Breakdown</h3>
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-left font-medium text-gray-700 border border-gray-200">Week</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700 border border-gray-200">Eggs</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700 border border-gray-200">Deaths</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700 border border-gray-200">Feed (kg)</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700 border border-gray-200">Expenses</th>
            </tr>
          </thead>
          <tbody>
            {data.weeklyData.map((w, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-3 py-2 border border-gray-200 text-sm">{w.weekStart} — {w.weekEnd}</td>
                <td className="px-3 py-2 text-right border border-gray-200">{w.eggsTotal.toLocaleString()}</td>
                <td className="px-3 py-2 text-right border border-gray-200">{w.deaths > 0 ? <span className="text-red-600">{w.deaths}</span> : "0"}</td>
                <td className="px-3 py-2 text-right border border-gray-200">{w.feedKg.toFixed(1)}</td>
                <td className="px-3 py-2 text-right border border-gray-200">Rs {w.expenses.toLocaleString()}</td>
              </tr>
            ))}
            <tr className="bg-gray-100 font-semibold">
              <td className="px-3 py-2 border border-gray-200">Monthly Total</td>
              <td className="px-3 py-2 text-right border border-gray-200">{data.totals.eggsTotal.toLocaleString()}</td>
              <td className="px-3 py-2 text-right border border-gray-200">{data.totals.deaths}</td>
              <td className="px-3 py-2 text-right border border-gray-200">{data.totals.feedKg.toFixed(1)}</td>
              <td className="px-3 py-2 text-right border border-gray-200">Rs {data.financial.expenses.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-500 mb-3">Financial Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Total Revenue</span><span className="font-semibold text-green-600">Rs {data.financial.revenue.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Total Expenses</span><span className="font-semibold text-red-600">Rs {data.financial.expenses.toLocaleString()}</span></div>
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="font-semibold">Net Profit/Loss</span>
              <span className={`font-bold text-lg ${data.financial.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                Rs {data.financial.profit.toLocaleString()}
              </span>
            </div>
          </div>
          {data.financial.expensesByCategory.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <h5 className="text-xs font-medium text-gray-500 mb-2">Expenses by Category</h5>
              <div className="space-y-1">
                {data.financial.expensesByCategory.sort((a, b) => b.amount - a.amount).map(ec => (
                  <div key={ec.category} className="flex items-center justify-between text-sm">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryColors[ec.category] || "bg-gray-100 text-gray-700"}`}>
                      {ec.category}
                    </span>
                    <span className="font-medium">Rs {ec.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Production Summary</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><div className="text-lg font-bold">{data.totals.eggsGradeA.toLocaleString()}</div><div className="text-xs text-gray-500">Grade A</div></div>
              <div><div className="text-lg font-bold">{data.totals.eggsGradeB.toLocaleString()}</div><div className="text-xs text-gray-500">Grade B</div></div>
              <div><div className="text-lg font-bold">{data.totals.eggsCracked.toLocaleString()}</div><div className="text-xs text-gray-500">Cracked</div></div>
            </div>
            <div className="text-sm mt-2 text-gray-600">
              Avg {data.averages.eggsPerDay} eggs/day | {data.averages.productionRate}% production rate
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Inventory Status</h4>
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div><div className="font-semibold">{data.inventory.totalItems}</div><div className="text-xs text-gray-500">Items</div></div>
              <div><div className={`font-semibold ${data.inventory.lowStock > 0 ? "text-amber-600" : ""}`}>{data.inventory.lowStock}</div><div className="text-xs text-gray-500">Low Stock</div></div>
              <div><div className={`font-semibold ${data.inventory.expiringSoon > 0 ? "text-red-600" : ""}`}>{data.inventory.expiringSoon}</div><div className="text-xs text-gray-500">Expiring</div></div>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Vaccination Compliance</h4>
            <div className="flex items-center gap-3">
              <div className={`text-2xl font-bold ${data.vaccination.complianceRate >= 90 ? "text-green-600" : data.vaccination.complianceRate >= 70 ? "text-amber-600" : "text-red-600"}`}>
                {data.vaccination.complianceRate}%
              </div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${data.vaccination.complianceRate >= 90 ? "bg-green-500" : data.vaccination.complianceRate >= 70 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${data.vaccination.complianceRate}%` }} />
                </div>
                <div className="text-xs text-gray-500 mt-1">{data.vaccination.completed}/{data.vaccination.total} completed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ReportFooter />
    </div>
  );
}
