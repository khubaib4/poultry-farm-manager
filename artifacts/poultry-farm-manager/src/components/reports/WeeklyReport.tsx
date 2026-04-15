import type { WeeklyReportData } from "@/types/electron";
import ReportHeader from "./ReportHeader";
import ReportFooter from "./ReportFooter";

interface Props {
  data: WeeklyReportData;
}

export default function WeeklyReport({ data }: Props) {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-white p-6 print:p-4">
      <ReportHeader
        farmName={data.farm.name}
        farmLocation={data.farm.location}
        title="Weekly Performance Report"
        subtitle={`${data.startDate} to ${data.endDate}`}
        generatedDate={new Date().toLocaleString()}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-700">{Number(data.weeklyTotals.birds ?? 0).toLocaleString()}</div>
          <div className="text-xs text-blue-600">Total Birds</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-amber-700">{Number(data.weeklyTotals.eggsTotal ?? 0).toLocaleString()}</div>
          <div className="text-xs text-amber-600">Total Eggs</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-700">{data.averages.eggsPerDay}</div>
          <div className="text-xs text-purple-600">Avg Eggs/Day</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-700">Rs {Number(data.financial.profit ?? 0).toLocaleString()}</div>
          <div className="text-xs text-green-600">Net Profit</div>
        </div>
      </div>

      <h3 className="font-semibold text-gray-800 mb-2">Daily Breakdown</h3>
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-left font-medium text-gray-700 border border-gray-200">Day</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700 border border-gray-200">Grade A</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700 border border-gray-200">Grade B</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700 border border-gray-200">Cracked</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700 border border-gray-200">Total Eggs</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700 border border-gray-200">Deaths</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700 border border-gray-200">Feed (kg)</th>
            </tr>
          </thead>
          <tbody>
            {data.dailyData.map(d => {
              const dayName = dayNames[new Date(d.date).getDay()];
              return (
                <tr key={d.date} className="hover:bg-gray-50">
                  <td className="px-3 py-2 border border-gray-200">
                    <span className="font-medium">{dayName}</span>
                    <span className="text-gray-500 ml-1">{d.date}</span>
                  </td>
                  <td className="px-3 py-2 text-right border border-gray-200">{d.eggsGradeA}</td>
                  <td className="px-3 py-2 text-right border border-gray-200">{d.eggsGradeB}</td>
                  <td className="px-3 py-2 text-right border border-gray-200">{d.eggsCracked}</td>
                  <td className="px-3 py-2 text-right border border-gray-200 font-medium">{d.eggsTotal}</td>
                  <td className="px-3 py-2 text-right border border-gray-200">{d.deaths > 0 ? <span className="text-red-600">{d.deaths}</span> : "0"}</td>
                  <td className="px-3 py-2 text-right border border-gray-200">{Number(d.feedKg ?? 0).toFixed(1)}</td>
                </tr>
              );
            })}
            <tr className="bg-gray-100 font-semibold">
              <td className="px-3 py-2 border border-gray-200">Totals</td>
              <td className="px-3 py-2 text-right border border-gray-200">{data.weeklyTotals.eggsGradeA}</td>
              <td className="px-3 py-2 text-right border border-gray-200">{data.weeklyTotals.eggsGradeB}</td>
              <td className="px-3 py-2 text-right border border-gray-200">{data.weeklyTotals.eggsCracked}</td>
              <td className="px-3 py-2 text-right border border-gray-200">{data.weeklyTotals.eggsTotal}</td>
              <td className="px-3 py-2 text-right border border-gray-200">{data.weeklyTotals.deaths}</td>
              <td className="px-3 py-2 text-right border border-gray-200">{Number(data.weeklyTotals.feedKg ?? 0).toFixed(1)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Production Averages</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Eggs/Day</span><span className="font-semibold">{data.averages.eggsPerDay}</span></div>
            <div className="flex justify-between"><span>Mortality Rate</span><span className="font-semibold">{data.averages.mortalityRate}%</span></div>
            <div className="flex justify-between"><span>Feed/Bird/Day</span><span className="font-semibold">{(data.averages.feedPerBird * 1000).toFixed(0)}g</span></div>
          </div>
        </div>
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Feed Summary</h4>
          <div className="text-2xl font-bold text-gray-900">{Number(data.weeklyTotals.feedKg ?? 0).toFixed(1)} kg</div>
          <div className="text-xs text-gray-500 mt-1">
            Avg {(Number(data.weeklyTotals.feedKg ?? 0) / 7).toFixed(1)} kg/day
          </div>
        </div>
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Financial Summary</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span>Revenue</span><span className="text-green-600 font-medium">Rs {Number(data.financial.revenue ?? 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Expenses</span><span className="text-red-600 font-medium">Rs {Number(data.financial.expenses ?? 0).toLocaleString()}</span></div>
            <div className="flex justify-between border-t pt-1 mt-1">
              <span className="font-medium">Profit/Loss</span>
              <span className={`font-bold ${data.financial.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                Rs {Number(data.financial.profit ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {data.weeklyTotals.deaths > 0 && (
        <div className="mb-6 p-3 bg-red-50 rounded-lg border border-red-200">
          <h4 className="text-sm font-medium text-red-700 mb-1">Mortality Summary</h4>
          <p className="text-sm text-red-600">
            {data.weeklyTotals.deaths} deaths recorded this week ({data.averages.mortalityRate}% mortality rate).
          </p>
        </div>
      )}

      <ReportFooter />
    </div>
  );
}
