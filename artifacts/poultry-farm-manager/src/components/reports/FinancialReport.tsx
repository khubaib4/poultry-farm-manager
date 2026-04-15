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
          <div className="text-2xl font-bold text-green-700">Rs {Number(data.revenue.total ?? 0).toLocaleString()}</div>
          <div className="text-xs text-green-600">Sales Revenue</div>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-700">Rs {Number(data.expenses.total ?? 0).toLocaleString()}</div>
          <div className="text-xs text-red-600">Total Expenses</div>
        </div>
        <div className={`rounded-lg p-3 text-center ${data.profitLoss.profit >= 0 ? "bg-emerald-50" : "bg-orange-50"}`}>
          <div className={`text-2xl font-bold ${data.profitLoss.profit >= 0 ? "text-emerald-700" : "text-orange-700"}`}>
            Rs {Number(data.profitLoss.profit ?? 0).toLocaleString()}
          </div>
          <div className={`text-xs ${data.profitLoss.profit >= 0 ? "text-emerald-600" : "text-orange-600"}`}>Net Profit/Loss</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-700">{data.profitLoss.margin}%</div>
          <div className="text-xs text-blue-600">Profit Margin</div>
        </div>
      </div>

      {data.revenue.byCustomer.length > 0 && (
        <>
          <h3 className="font-semibold text-gray-800 mb-2">Top Customers by Revenue</h3>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2 text-left font-medium text-gray-700 border border-gray-200">Customer</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700 border border-gray-200">Revenue</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700 border border-gray-200">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {data.revenue.byCustomer.map(c => (
                  <tr key={c.name} className="hover:bg-gray-50">
                    <td className="px-3 py-2 border border-gray-200 font-medium">{c.name}</td>
                    <td className="px-3 py-2 text-right border border-gray-200 font-medium">Rs {Number(c.amount ?? 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right border border-gray-200">
                      {data.revenue.total > 0 ? Math.round((c.amount / data.revenue.total) * 100) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {data.revenue.byProduct.length > 0 && (
        <>
          <h3 className="font-semibold text-gray-800 mb-2">Revenue by Product</h3>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2 text-left font-medium text-gray-700 border border-gray-200">Product</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700 border border-gray-200">Revenue</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700 border border-gray-200">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {data.revenue.byProduct.map(p => (
                  <tr key={p.name} className="hover:bg-gray-50">
                    <td className="px-3 py-2 border border-gray-200 font-medium">{p.name}</td>
                    <td className="px-3 py-2 text-right border border-gray-200 font-medium">Rs {Number(p.amount ?? 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right border border-gray-200">
                      {data.revenue.total > 0 ? Math.round((p.amount / data.revenue.total) * 100) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h3 className="font-semibold text-gray-800 mb-2">Expense Breakdown by Category</h3>
      <div className="mb-6 border border-gray-200 rounded-lg p-4">
        {data.expenses.byCategory.length > 0 ? (
          <div className="space-y-3">
            {[...data.expenses.byCategory].sort((a, b) => b.amount - a.amount).map(ec => (
              <div key={ec.category}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize font-medium">{ec.category}</span>
                  <span>Rs {Number(ec.amount ?? 0).toLocaleString()} ({Number(data.expenses.total ?? 0) > 0 ? Math.round((Number(ec.amount ?? 0) / Number(data.expenses.total ?? 0)) * 100) : 0}%)</span>
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
            <span>Sales Revenue ({data.revenue.salesCount} sales)</span><span>Rs {Number(data.revenue.total ?? 0).toLocaleString()}</span>
          </div>
          {data.revenue.byProduct.map(p => (
            <div key={p.name} className="flex justify-between pl-4 text-gray-600">
              <span>{p.name}</span><span>Rs {Number(p.amount ?? 0).toLocaleString()}</span>
            </div>
          ))}
          <div className="flex justify-between font-semibold text-red-700 pt-2 pb-2 border-b border-t mt-2">
            <span>Expenses</span><span>Rs {Number(data.expenses.total ?? 0).toLocaleString()}</span>
          </div>
          {data.expenses.byCategory.map(ec => (
            <div key={ec.category} className="flex justify-between pl-4 text-gray-600 capitalize">
              <span>{ec.category}</span><span>Rs {Number(ec.amount ?? 0).toLocaleString()}</span>
            </div>
          ))}
          <div className={`flex justify-between font-bold text-lg pt-3 border-t-2 mt-2 ${data.profitLoss.profit >= 0 ? "text-green-700" : "text-red-700"}`}>
            <span>{data.profitLoss.profit >= 0 ? "Net Profit" : "Net Loss"}</span>
            <span>Rs {Math.abs(Number(data.profitLoss.profit ?? 0)).toLocaleString()}</span>
          </div>
          <div className="text-right text-xs text-gray-500">Profit Margin: {data.profitLoss.margin}%</div>
        </div>
      </div>

      <h3 className="font-semibold text-gray-800 mb-2">Collections</h3>
      <div className="mb-6 border border-gray-200 rounded-lg p-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Total Billed</span><span className="font-medium">Rs {Number(data.revenue.total ?? 0).toLocaleString()}</span></div>
          <div className="flex justify-between"><span>Total Collected</span><span className="font-medium text-green-600">Rs {Number(data.revenue.totalCollected ?? 0).toLocaleString()}</span></div>
          <div className="flex justify-between"><span>Outstanding</span><span className={`font-medium ${Number(data.revenue.outstanding ?? 0) > 0 ? "text-amber-600" : "text-green-600"}`}>Rs {Number(data.revenue.outstanding ?? 0).toLocaleString()}</span></div>
          <div className="flex justify-between border-t pt-2 mt-2 font-semibold">
            <span>Collection Rate</span>
            <span className={data.revenue.collectionRate >= 80 ? "text-green-600" : data.revenue.collectionRate >= 50 ? "text-amber-600" : "text-red-600"}>
              {data.revenue.collectionRate}%
            </span>
          </div>
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
          <div className="text-lg font-bold text-gray-900">{Number(data.metrics.totalBirds ?? 0).toLocaleString()}</div>
          <div className="text-xs text-gray-500">Total Birds</div>
        </div>
      </div>

      <ReportFooter />
    </div>
  );
}
