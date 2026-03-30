import type { FlockReportData } from "@/types/electron";
import ReportHeader from "./ReportHeader";
import ReportFooter from "./ReportFooter";

interface Props {
  data: FlockReportData;
}

export default function FlockReport({ data }: Props) {
  const maxEggs = Math.max(...data.productionCurve.map(p => p.eggs), 1);

  return (
    <div className="bg-white p-6 print:p-4">
      <ReportHeader
        farmName={data.farm.name}
        farmLocation={data.farm.location}
        title="Flock Performance Report"
        subtitle={`${data.flock.batchName} — ${data.flock.breed || "Unknown Breed"}`}
        generatedDate={new Date().toLocaleString()}
      />

      <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-500">Batch:</span> <span className="font-medium">{data.flock.batchName}</span></div>
          <div><span className="text-gray-500">Breed:</span> <span className="font-medium">{data.flock.breed || "—"}</span></div>
          <div><span className="text-gray-500">Age:</span> <span className="font-medium">{data.flock.ageDays} days</span></div>
          <div><span className="text-gray-500">Status:</span> <span className={`font-medium capitalize ${data.flock.status === "active" ? "text-green-600" : "text-gray-600"}`}>{data.flock.status}</span></div>
          <div><span className="text-gray-500">Arrived:</span> <span className="font-medium">{data.flock.arrivalDate}</span></div>
          <div><span className="text-gray-500">Initial Count:</span> <span className="font-medium">{data.flock.initialCount.toLocaleString()}</span></div>
          <div><span className="text-gray-500">Current Count:</span> <span className="font-medium">{(data.flock.currentCount || 0).toLocaleString()}</span></div>
          <div><span className="text-gray-500">Days Tracked:</span> <span className="font-medium">{data.stats.daysTracked}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-amber-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-amber-700">{data.stats.totalEggs.toLocaleString()}</div>
          <div className="text-xs text-amber-600">Total Eggs</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-700">{data.stats.productionRate}%</div>
          <div className="text-xs text-purple-600">Production Rate</div>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-700">{data.stats.mortalityRate}%</div>
          <div className="text-xs text-red-600">Mortality Rate</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-700">{data.stats.feedConversionRatio}</div>
          <div className="text-xs text-blue-600">Feed/Egg (kg)</div>
        </div>
      </div>

      <h3 className="font-semibold text-gray-800 mb-2">Production Curve</h3>
      <div className="mb-6 border border-gray-200 rounded-lg p-4 overflow-x-auto">
        {data.productionCurve.length > 0 ? (
          <div className="flex items-end gap-px h-32 min-w-[300px]">
            {data.productionCurve.slice(-60).map((p, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group relative" style={{ minWidth: "4px" }}>
                <div
                  className="w-full bg-amber-400 rounded-t-sm hover:bg-amber-500 transition-colors"
                  style={{ height: `${(p.eggs / maxEggs) * 100}%`, minHeight: p.eggs > 0 ? "2px" : "0" }}
                  title={`${p.date}: ${p.eggs} eggs`}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">No production data available</p>
        )}
        {data.productionCurve.length > 0 && (
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{data.productionCurve.slice(-60)[0]?.date}</span>
            <span>{data.productionCurve[data.productionCurve.length - 1]?.date}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-500 mb-3">Lifetime Statistics</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Grade A Eggs</span><span className="font-medium">{data.stats.totalEggsA.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Grade B Eggs</span><span className="font-medium">{data.stats.totalEggsB.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Cracked Eggs</span><span className="font-medium">{data.stats.totalCracked.toLocaleString()}</span></div>
            <div className="flex justify-between border-t pt-1"><span className="font-medium">Total Eggs</span><span className="font-bold">{data.stats.totalEggs.toLocaleString()}</span></div>
            <div className="flex justify-between mt-2"><span>Total Deaths</span><span className="font-medium text-red-600">{data.stats.totalDeaths}</span></div>
            <div className="flex justify-between"><span>Total Feed</span><span className="font-medium">{data.stats.totalFeed} kg</span></div>
          </div>
        </div>
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-500 mb-3">Vaccination Status</h4>
          <div className="flex items-center gap-3 mb-3">
            <div className={`text-2xl font-bold ${data.vaccinations.complianceRate >= 90 ? "text-green-600" : data.vaccinations.complianceRate >= 70 ? "text-amber-600" : "text-red-600"}`}>
              {data.vaccinations.complianceRate}%
            </div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full ${data.vaccinations.complianceRate >= 90 ? "bg-green-500" : data.vaccinations.complianceRate >= 70 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${data.vaccinations.complianceRate}%` }} />
              </div>
              <div className="text-xs text-gray-500 mt-1">{data.vaccinations.completed}/{data.vaccinations.total} completed</div>
            </div>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto text-xs">
            {data.vaccinations.records.map((v, i) => (
              <div key={i} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
                <span className="font-medium">{v.vaccineName}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs ${
                  v.status === "completed" ? "bg-green-100 text-green-700" :
                  v.status === "skipped" ? "bg-red-100 text-red-700" :
                  "bg-gray-100 text-gray-600"
                }`}>{v.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ReportFooter />
    </div>
  );
}
