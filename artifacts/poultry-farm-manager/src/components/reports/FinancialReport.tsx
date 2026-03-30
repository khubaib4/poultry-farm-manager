import type { FinancialReportData } from "@/types/electron";
import ReportHeader from "./ReportHeader";
import ReportFooter from "./ReportFooter";

interface Props {
  data: FinancialReportData;
}

export default function FinancialReport({ data }: Props) {
  const categoryColors: Record<string, string> = {
    feed: "bg-amber-400", medicine: "bg-blue-400", labor: "bg-purple-400",
    utilities: "bg-cyan-400", equipment: "bg-gray-400", misc: "bg-pink-400",
  };

  const maxExpense = Math.max(...data.expenses.byCategory.map(c => c.amount), 1);

  return (
    <div className="bg-white p-6 print:p-4">
      <ReportHeader
        farmName={data.farm.name}
        farmLocation={data.farm.location}
        title="Financial Report"
        subtitle={`${data.startDate} to ${data.endDate}`}
        generatedDate={new Date().toLocaleString()}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-700">Rs {data.revenue.total.toLocaleString()}</div>
          <div className="text-xs text-green-600">Total Revenue</div>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-700">Rs {data.expenses.total.toLocaleString()}</div>
          <div className="text-xs text-red-600">Total Expenses</div>
        </div>
        <div className={`rounded-lg p-3 text-center ${data.profitLoss.profit >= 0 ? "bg-emerald-50" : "bg-orange-50"}`}>
          <div className={`text-2xl font-bold ${data.profitLoss.profit >= 0 ? "text-emerald-700" : "text-orange-700"}`}>
            Rs {data.profitLoss.profit.toLocaleString()}
          </div>
          <div className={`text-xs ${data.profitLoss.profit >= 0 ? "text-emerald-600" : "text-orange-600"}`}>Net Profit/Loss</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-700">{data.profitLoss.margin}%</div>
          <div className="text-xs text-blue-600">Profit Margin</div>
        </div>
      </div>

      <h3 className="font-semibold text-gray-800 mb-2">Revenue Breakdown by Egg Grade</h3>
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-left font-medium text-gray-700 border border-gray-200">Grade</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700 border border-gray-200">Eggs</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700 border border-gray-200">Price/Egg</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700 border border-gray-200">Revenue</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700 border border-gray-200">% of Total</th>
            </tr>
          </thead>
          <tbody>
            {data.revenue.byGrade.map(g => (
              <tr key={g.grade} className="hover:bg-gray-50">
                <td className="px-3 py-2 border border-gray-200 font-medium">Grade {g.grade}</td>
                <td className="px-3 py-2 text-right border border-gray-200">{g.eggs.toLocaleString()}</td>
                <td className="px-3 py-2 text-right border border-gray-200">Rs {g.pricePerEgg.toFixed(2)}</td>
                <td className="px-3 py-2 text-right border border-gray-200 font-medium">Rs {g.revenue.toLocaleString()}</td>
                <td className="px-3 py-2 text-right border border-gray-200">
                  {data.revenue.total > 0 ? Math.round((g.revenue / data.revenue.total) * 100) : 0}%
                </td>
              </tr>
            ))}
            <tr className="bg-gray-100 font-semibold">
              <td className="px-3 py-2 border border-gray-200">Total</td>
              <td className="px-3 py-2 text-right border border-gray-200">{data.metrics.totalEggs.toLocaleString()}</td>
              <td className="px-3 py-2 text-right border border-gray-200">—</td>
              <td className="px-3 py-2 text-right border border-gray-200">Rs {data.revenue.total.toLocaleString()}</td>
              <td className="px-3 py-2 text-right border border-gray-200">100%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className="font-semibold text-gray-800 mb-2">Expense Breakdown by Category</h3>
      <div className="mb-6 border border-gray-200 rounded-lg p-4">
        {data.expenses.byCategory.length > 0 ? (
          <div className="space-y-3">
            {[...data.expenses.byCategory].sort((a, b) => b.amount - a.amount).map(ec => (
              <div key={ec.category}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize font-medium">{ec.category}</span>
                  <span>Rs {ec.amount.toLocaleString()} ({data.expenses.total > 0 ? Math.round((ec.amount / data.expenses.total) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${categoryColors[ec.category] || "bg-gray-400"}`}
                    style={{ width: `${(ec.amount / maxExpense) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4">No expenses recorded in this period</p>
        )}
      </div>

      <h3 className="font-semibold text-gray-800 mb-2">Profit & Loss Statement</h3>
      <div className="mb-6 border border-gray-200 rounded-lg p-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between font-semibold text-green-700 pb-2 border-b">
            <span>Revenue</span><span>Rs {data.revenue.total.toLocaleString()}</span>
          </div>
          {data.revenue.byGrade.map(g => (
            <div key={g.grade} className="flex justify-between pl-4 text-gray-600">
              <span>Grade {g.grade}</span><span>Rs {g.revenue.toLocaleString()}</span>
            </div>
          ))}
          <div className="flex justify-between font-semibold text-red-700 pt-2 pb-2 border-b border-t mt-2">
            <span>Expenses</span><span>Rs {data.expenses.total.toLocaleString()}</span>
          </div>
          {data.expenses.byCategory.map(ec => (
            <div key={ec.category} className="flex justify-between pl-4 text-gray-600 capitalize">
              <span>{ec.category}</span><span>Rs {ec.amount.toLocaleString()}</span>
            </div>
          ))}
          <div className={`flex justify-between font-bold text-lg pt-3 border-t-2 mt-2 ${data.profitLoss.profit >= 0 ? "text-green-700" : "text-red-700"}`}>
            <span>{data.profitLoss.profit >= 0 ? "Net Profit" : "Net Loss"}</span>
            <span>Rs {Math.abs(data.profitLoss.profit).toLocaleString()}</span>
          </div>
          <div className="text-right text-xs text-gray-500">Profit Margin: {data.profitLoss.margin}%</div>
        </div>
      </div>

      <h3 className="font-semibold text-gray-800 mb-2">Per-Unit Metrics</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <div className="border border-gray-200 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-gray-900">Rs {data.metrics.revenuePerBird}</div>
          <div className="text-xs text-gray-500">Revenue/Bird</div>
        </div>
        <div className="border border-gray-200 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-gray-900">Rs {data.metrics.expensePerBird}</div>
          <div className="text-xs text-gray-500">Expense/Bird</div>
        </div>
        <div className="border border-gray-200 rounded-lg p-3 text-center">
          <div className={`text-lg font-bold ${data.metrics.profitPerBird >= 0 ? "text-green-600" : "text-red-600"}`}>Rs {data.metrics.profitPerBird}</div>
          <div className="text-xs text-gray-500">Profit/Bird</div>
        </div>
        <div className="border border-gray-200 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-gray-900">Rs {data.metrics.revenuePerEgg}</div>
          <div className="text-xs text-gray-500">Revenue/Egg</div>
        </div>
        <div className="border border-gray-200 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-gray-900">Rs {data.metrics.costPerEgg}</div>
          <div className="text-xs text-gray-500">Cost/Egg</div>
        </div>
        <div className="border border-gray-200 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-gray-900">{data.metrics.totalBirds.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Total Birds</div>
        </div>
      </div>

      <ReportFooter />
    </div>
  );
}
