import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ReferenceLine,
  AreaChart,
  Area,
} from "recharts";
import { TrendingUp } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import { flocks as flocksApi, isElectron } from "@/lib/api";
import { useFarmId } from "@/hooks/useFarmId";
import type { FlockPerformanceComparison } from "@/types/electron";

type FlockListItem = { id: number; batchName: string; breed?: string | null };

const COLORS = {
  actual: "#2563eb",
  standard: "#9ca3af",
  positive: "#22c55e",
  negative: "#ef4444",
};

function pct(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return `${v.toFixed(1)}%`;
}

function num(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return Math.round(v).toLocaleString();
}

function CustomLayTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<any>;
  label?: string | number;
}): React.ReactElement | null {
  if (!active || !payload || label === undefined) return null;
  const week = Number(label);
  const actual = payload.find((p) => p.dataKey === "actualLayPercent")?.value as number | undefined;
  const standard = payload.find((p) => p.dataKey === "standardLayPercent")?.value as number | undefined;
  const variance = payload.find((p) => p.dataKey === "layVariance")?.payload?.layVariance as number | null | undefined;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-900 mb-1.5">Week {week}</p>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS.actual }} />
          <span className="text-gray-600">Actual:</span>
          <span className="font-medium text-gray-900">{pct(typeof actual === "number" ? actual : null)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS.standard }} />
          <span className="text-gray-600">Standard:</span>
          <span className="font-medium text-gray-900">{pct(typeof standard === "number" ? standard : null)}</span>
        </div>
        {variance !== null && variance !== undefined && (
          <div className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: variance >= 0 ? COLORS.positive : COLORS.negative }}
            />
            <span className="text-gray-600">Variance:</span>
            <span className={`font-medium ${variance >= 0 ? "text-green-600" : "text-red-600"}`}>
              {variance >= 0 ? "+" : ""}
              {variance.toFixed(1)} pp
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PerformanceStandardPage(): React.ReactElement {
  const farmId = useFarmId();

  const [flockOptions, setFlockOptions] = useState<FlockListItem[]>([]);
  const [selectedFlockId, setSelectedFlockId] = useState<number | null>(null);

  const [loadingFlocks, setLoadingFlocks] = useState(true);
  const [loadingPerf, setLoadingPerf] = useState(false);
  const [perf, setPerf] = useState<FlockPerformanceComparison | null>(null);
  const [perfError, setPerfError] = useState<string | null>(null);

  useEffect(() => {
    const loadFlocks = async () => {
      if (!isElectron() || !farmId) return;
      setLoadingFlocks(true);
      try {
        const all = (await flocksApi.getByFarm(farmId)) as any as FlockListItem[];
        const withBreed = (all || []).filter((f) => String(f.breed ?? "").trim() !== "");
        setFlockOptions(withBreed);
        setSelectedFlockId(withBreed.length ? withBreed[0].id : null);
      } catch {
        setFlockOptions([]);
        setSelectedFlockId(null);
      } finally {
        setLoadingFlocks(false);
      }
    };
    loadFlocks();
  }, [farmId]);

  useEffect(() => {
    const loadPerf = async () => {
      if (!isElectron() || !selectedFlockId) return;
      setLoadingPerf(true);
      setPerf(null);
      setPerfError(null);
      try {
        const res: any = await flocksApi.getPerformanceVsStandard(selectedFlockId);
        if (res?.error) {
          setPerfError(String(res.error));
          setPerf(null);
        } else {
          setPerf(res as FlockPerformanceComparison);
        }
      } catch (e) {
        setPerfError(e instanceof Error ? e.message : "Failed to load performance comparison");
      } finally {
        setLoadingPerf(false);
      }
    };
    loadPerf();
  }, [selectedFlockId]);

  const chartData = useMemo(() => {
    if (!perf) return [];
    const actualByWeek = new Map(perf.weeklyComparison.map((w) => [w.weekAge, w]));

    let cumEggs = 0;
    const initial = Math.max(1, perf.flock.initialCount || 1);

    return perf.standardCurve
      .slice()
      .sort((a, b) => a.weekAge - b.weekAge)
      .map((s) => {
        const actual = actualByWeek.get(s.weekAge);
        const hasActual = Boolean(actual);
        if (hasActual) cumEggs += actual?.actualEggCount || 0;
        const actualCumPerHenHoused = hasActual ? cumEggs / initial : null;

        return {
          weekAge: s.weekAge,
          standardLayPercent: s.standardLayPercent,
          standardFeedIntake: s.standardFeedIntake,
          standardEggsCumPerHenHoused: s.standardEggsCumPerHenHoused,

          actualLayPercent: actual?.actualLayPercent ?? null,
          actualFeedPerBird: actual?.actualFeedPerBird ?? null,
          layVariance: actual?.layVariance ?? null,

          actualCumEggsPerHenHoused:
            actualCumPerHenHoused !== null ? Math.round(actualCumPerHenHoused * 10) / 10 : null,
        };
      });
  }, [perf]);

  const overallColor = useMemo(() => {
    const v = perf?.summary.overallPerformancePercent;
    if (v === null || v === undefined) return "text-gray-500";
    if (v >= 95) return "text-green-600";
    if (v >= 90) return "text-amber-600";
    return "text-red-600";
  }, [perf]);

  if (!isElectron()) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
          Performance comparison is only available in the desktop app.
        </div>
      </div>
    );
  }

  if (loadingFlocks) {
    return (
      <div className="p-6">
        <LoadingSpinner text="Loading flocks..." />
      </div>
    );
  }

  if (flockOptions.length === 0) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <EmptyState
          icon={TrendingUp}
          title="No flocks with breed set"
          description="Set a breed on your flock (Edit Flock) to compare actual performance against standards."
        />
        <div className="mt-4 bg-white rounded-xl border p-4 text-sm text-gray-600">
          Go to <span className="font-medium">Flocks</span> → open a flock → <span className="font-medium">Edit</span> → choose a breed.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance vs Standard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {perf?.breedName ? `Breed: ${perf.breedName}` : "Compare actual flock performance against breed benchmarks"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Flock</label>
          <select
            value={selectedFlockId ?? ""}
            onChange={(e) => setSelectedFlockId(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            {flockOptions.map((f) => (
              <option key={f.id} value={f.id}>
                {f.batchName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loadingPerf ? (
        <LoadingSpinner text="Loading comparison..." />
      ) : perfError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {perfError === "no-breed-set"
            ? "No breed is set for this flock. Edit the flock and select a breed to enable benchmarking."
            : perfError === "unknown-breed"
              ? "This flock’s breed is not available in standards data."
              : perfError}
        </div>
      ) : !perf ? null : perf.weeklyComparison.length === 0 ? (
        <div className="bg-white rounded-xl border p-6 text-gray-600 text-sm">
          No production data recorded yet. Start adding daily entries to see your performance comparison.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border p-5">
              <p className="text-xs text-gray-500">Overall Performance</p>
              <p className={`text-3xl font-bold mt-1 ${overallColor}`}>
                {perf.summary.overallPerformancePercent !== null ? `${perf.summary.overallPerformancePercent.toFixed(1)}%` : "—"}
              </p>
              <p className="text-xs text-gray-500 mt-1">Actual vs standard eggs</p>
            </div>

            <div className="bg-white rounded-xl border p-5">
              <p className="text-xs text-gray-500">Actual vs Standard Eggs</p>
              <p className="text-2xl font-bold mt-1 text-gray-900">
                {num(perf.summary.totalActualEggs)} / {num(perf.summary.totalStandardEggs)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total eggs to-date</p>
            </div>

            <div className="bg-white rounded-xl border p-5">
              <p className="text-xs text-gray-500">Peak Lay Rate</p>
              <p className="text-2xl font-bold mt-1 text-gray-900">
                {pct(perf.summary.peakActualLay)}{" "}
                <span className="text-xs text-gray-500 font-medium">wk {perf.summary.peakActualLayWeek ?? "—"}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Standard: {pct(perf.summary.standardPeakLay)} (wk {perf.summary.standardPeakWeek})
              </p>
            </div>

            <div className="bg-white rounded-xl border p-5">
              <p className="text-xs text-gray-500">Current Week Age</p>
              <p className="text-2xl font-bold mt-1 text-gray-900">{perf.summary.currentWeekAge ?? "—"}</p>
              <p className="text-xs text-gray-500 mt-1">
                Avg lay: {pct(perf.summary.avgActualLay)} vs {pct(perf.summary.avgStandardLay)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Laying Rate Comparison</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="weekAge" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      label={{ value: "% Lay", angle: -90, position: "insideLeft", fill: "#6b7280" }}
                    />
                    <Tooltip content={<CustomLayTooltip />} />
                    <Legend />
                    <ReferenceLine y={97} stroke="#d1d5db" strokeDasharray="5 5" />
                    <Line
                      type="monotone"
                      dataKey="actualLayPercent"
                      name="Actual"
                      stroke={COLORS.actual}
                      strokeWidth={2.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="standardLayPercent"
                      name="Standard"
                      stroke={COLORS.standard}
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Feed Intake Comparison</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="weekAge" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      label={{ value: "g/day", angle: -90, position: "insideLeft", fill: "#6b7280" }}
                    />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="actualFeedPerBird"
                      name="Actual Feed (g/bird/day)"
                      stroke={COLORS.actual}
                      strokeWidth={2.5}
                      dot={false}
                      connectNulls={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="standardFeedIntake"
                      name="Standard Feed (g/day)"
                      stroke={COLORS.standard}
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Actual feed line appears only when daily entries include feed consumption.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Cumulative Eggs per Hen Housed</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="weekAge" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="actualCumEggsPerHenHoused"
                      name="Actual (cum eggs/hen housed)"
                      stroke={COLORS.actual}
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="standardEggsCumPerHenHoused"
                      name="Standard (cum eggs/hen housed)"
                      stroke={COLORS.standard}
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      dot={false}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Weekly Variance (Actual - Standard)</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={perf.weeklyComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="weekAge" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      label={{ value: "pp", angle: -90, position: "insideLeft", fill: "#6b7280" }}
                    />
                    <Tooltip />
                    <ReferenceLine y={0} stroke="#d1d5db" />
                    <Bar
                      dataKey="layVariance"
                      name="Variance (pp)"
                      radius={[4, 4, 0, 0]}
                      fill={COLORS.negative}
                      isAnimationActive={false}
                      shape={(props: any) => {
                        const { x, y, width, height, payload } = props;
                        const v = Number(payload.layVariance ?? 0);
                        const fill = v >= 0 ? COLORS.positive : COLORS.negative;
                        return <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} ry={4} />;
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

