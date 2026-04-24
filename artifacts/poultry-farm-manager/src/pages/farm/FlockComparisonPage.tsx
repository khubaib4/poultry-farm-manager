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
} from "recharts";
import { ArrowLeftRight, TrendingUp } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { flocks as flocksApi, isElectron } from "@/lib/api";
import { useFarmId } from "@/hooks/useFarmId";
import type { FlockComparisonResult } from "@/types/electron";

type FlockListItem = { id: number; batchName: string; breed?: string | null; farmId?: number | null };

const FLOCK_COLORS = ["#2563eb", "#f97316", "#22c55e", "#a855f7"]; // blue, orange, green, purple
const STANDARD_COLOR = "#9ca3af";

function pct(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return `${v.toFixed(1)}%`;
}

function num(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return Math.round(v).toLocaleString();
}

function fmt(v: number | null | undefined, unit: string, decimals = 1): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return `${v.toFixed(decimals)}${unit}`;
}

function lastStandard(result: FlockComparisonResult): {
  weekAge: number | null;
  standardLay: number | null;
  standardFeed: number | null;
  standardCumEggs: number | null;
  standardLivability: number | null;
} {
  if (!result.standardCurve.length) {
    return { weekAge: null, standardLay: null, standardFeed: null, standardCumEggs: null, standardLivability: null };
  }
  const s = result.standardCurve[result.standardCurve.length - 1]!;
  return {
    weekAge: s.weekAge,
    standardLay: s.standardLayPercent ?? null,
    standardFeed: s.standardFeedIntake ?? null,
    standardCumEggs: s.standardEggsCumPerHenHoused ?? null,
    standardLivability: s.standardLivability ?? null,
  };
}

export default function FlockComparisonPage(): React.ReactElement {
  const farmId = useFarmId();

  const [loadingFlocks, setLoadingFlocks] = useState(true);
  const [flocks, setFlocks] = useState<FlockListItem[]>([]);
  const [selectedBreed, setSelectedBreed] = useState<string>("");
  const [selectedFlockIds, setSelectedFlockIds] = useState<string[]>([]);

  const [loadingCompare, setLoadingCompare] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [result, setResult] = useState<FlockComparisonResult | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!isElectron() || !farmId) return;
      setLoadingFlocks(true);
      try {
        const all = (await flocksApi.getByFarm(farmId)) as any as FlockListItem[];
        setFlocks(all || []);
      } catch {
        setFlocks([]);
      } finally {
        setLoadingFlocks(false);
      }
    };
    load();
  }, [farmId]);

  const breeds = useMemo(() => {
    const set = new Set<string>();
    for (const f of flocks) {
      const b = String(f.breed ?? "").trim();
      if (b) set.add(b);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [flocks]);

  useEffect(() => {
    if (!breeds.length) {
      setSelectedBreed("");
      setSelectedFlockIds([]);
      return;
    }
    if (selectedBreed && breeds.includes(selectedBreed)) return;
    // Auto-select if only one option, otherwise pick first for convenience.
    setSelectedBreed(breeds.length === 1 ? breeds[0]! : breeds[0]!);
  }, [breeds, selectedBreed]);

  const flocksForBreed = useMemo(() => {
    const b = String(selectedBreed ?? "").trim();
    if (!b) return [];
    return flocks.filter((f) => String(f.breed ?? "").trim() === b);
  }, [flocks, selectedBreed]);

  useEffect(() => {
    // When breed changes, reset selection + results.
    setSelectedFlockIds([]);
    setResult(null);
    setCompareError(null);
  }, [selectedBreed]);

  const canCompare = selectedFlockIds.length >= 2 && selectedFlockIds.length <= 4;

  const standardForTable = useMemo(() => (result ? lastStandard(result) : null), [result]);

  const summaryRows = useMemo(() => {
    if (!result) return [];
    const entries = result.flocks.map((f, i) => ({
      ...f,
      color: FLOCK_COLORS[i]!,
    }));

    const best = {
      totalEggs: Math.max(...entries.map((e) => e.summary.totalEggs)),
      avgLayPercent: Math.max(...entries.map((e) => e.summary.avgLayPercent)),
      peakLayPercent: Math.max(...entries.map((e) => e.summary.peakLayPercent)),
      mortalityPercent: Math.min(...entries.map((e) => e.summary.mortalityPercent)),
      avgFeedPerBird: Math.min(
        ...entries
          .map((e) => e.summary.avgFeedPerBird)
          .filter((v): v is number => typeof v === "number" && Number.isFinite(v))
          .concat([Number.POSITIVE_INFINITY])
      ),
    };

    return [
      { label: "Current Age (weeks)", values: entries.map((e) => String(e.currentWeekAge || "—")), standard: standardForTable?.weekAge ?? "—" },
      { label: "Initial Count", values: entries.map((e) => num(e.initialCount)), standard: "—" },
      {
        label: "Total Eggs",
        values: entries.map((e) => ({
          text: num(e.summary.totalEggs),
          isBest: e.summary.totalEggs === best.totalEggs,
        })),
        standard: "—",
      },
      {
        label: "Avg Lay %",
        values: entries.map((e) => ({
          text: pct(e.summary.avgLayPercent),
          isBest: e.summary.avgLayPercent === best.avgLayPercent,
        })),
        standard: pct(standardForTable?.standardLay ?? null),
      },
      {
        label: "Peak Lay % (week)",
        values: entries.map((e) => ({
          text: `${pct(e.summary.peakLayPercent)} (wk ${e.summary.peakLayWeek || "—"})`,
          isBest: e.summary.peakLayPercent === best.peakLayPercent,
        })),
        standard: "—",
      },
      {
        label: "Mortality %",
        values: entries.map((e) => ({
          text: pct(e.summary.mortalityPercent),
          isBest: e.summary.mortalityPercent === best.mortalityPercent,
          bestLow: true,
        })),
        standard: "—",
      },
      {
        label: "Avg Feed/Bird/Day (g)",
        values: entries.map((e) => {
          const v = e.summary.avgFeedPerBird;
          const isBest = typeof v === "number" && Number.isFinite(v) && v === best.avgFeedPerBird;
          return { text: v === null ? "—" : fmt(v, " g", 1), isBest, bestLow: true };
        }),
        standard: standardForTable?.standardFeed ? fmt(standardForTable.standardFeed, " g", 0) : "—",
      },
    ];
  }, [result, standardForTable]);

  const chartData = useMemo(() => {
    if (!result) return [];
    const allWeeks = new Set<number>();
    result.flocks.forEach((f) => f.weeklyData.forEach((w) => allWeeks.add(w.weekAge)));
    result.standardCurve.forEach((s) => allWeeks.add(s.weekAge));

    const byFlockWeek = result.flocks.map((f) => new Map(f.weeklyData.map((w) => [w.weekAge, w])));
    const byStdWeek = new Map(result.standardCurve.map((s) => [s.weekAge, s]));

    return Array.from(allWeeks)
      .sort((a, b) => a - b)
      .map((weekAge) => {
        const row: any = { weekAge };
        result.flocks.forEach((_flock, i) => {
          const w = byFlockWeek[i]!.get(weekAge);
          row[`lay_${i}`] = w?.actualLayPercent ?? null;
          row[`feed_${i}`] = w?.actualFeedPerBird ?? null;
          row[`cumEggs_${i}`] = w?.cumulativeEggsPerHen ?? null;
          row[`livability_${i}`] = w?.livabilityPercent ?? null;
        });
        const s = byStdWeek.get(weekAge);
        row.standardLay = s?.standardLayPercent ?? null;
        row.standardFeed = s?.standardFeedIntake ?? null;
        row.standardCumEggs = s?.standardEggsCumPerHenHoused ?? null;
        row.standardLivability = s?.standardLivability ?? null;
        return row;
      });
  }, [result]);

  const onToggleFlock = (id: string) => {
    setSelectedFlockIds((prev) => {
      const has = prev.includes(id);
      const next = has ? prev.filter((x) => x !== id) : [...prev, id];
      // preserve selection order for colors (first selected = color 0)
      return next;
    });
  };

  const onCompare = async () => {
    if (!isElectron()) return;
    setLoadingCompare(true);
    setCompareError(null);
    setResult(null);
    try {
      const res: any = await flocksApi.compareFlocks(selectedFlockIds);
      if (res?.error) {
        setCompareError(String(res.error));
        setResult(null);
      } else {
        setResult(res as FlockComparisonResult);
      }
    } catch (e) {
      setCompareError(e instanceof Error ? e.message : "Failed to compare flocks");
    } finally {
      setLoadingCompare(false);
    }
  };

  const errorMessage = useMemo(() => {
    if (!compareError) return null;
    if (compareError === "select-2-to-4-flocks") return "Select 2 to 4 flocks to compare.";
    if (compareError === "no-breed-set") return "No breed set on selected flocks. Edit your flocks to assign a breed.";
    if (compareError === "different-breeds") return "Selected flocks have different breeds. Please compare flocks of the same breed.";
    if (compareError === "different-farms") return "Selected flocks must belong to the same farm.";
    if (compareError === "flock-not-found") return "One or more selected flocks could not be found.";
    return compareError;
  }, [compareError]);

  if (!isElectron()) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
          Flock comparison is only available in the desktop app.
        </div>
      </div>
    );
  }

  if (loadingFlocks) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <PageHeader
          title="Compare Flocks"
          subtitle="Compare performance across flocks of the same breed"
          icon={<ArrowLeftRight className="h-6 w-6" />}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (breeds.length === 0) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <PageHeader
          title="Compare Flocks"
          subtitle="Compare performance across flocks of the same breed"
          icon={<ArrowLeftRight className="h-6 w-6" />}
        />
        <EmptyState
          icon={<TrendingUp className="h-8 w-8" />}
          title="No flocks have a breed set"
          description="Go to Flocks → Edit to assign a breed before comparing."
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Compare Flocks"
        subtitle="Compare performance across flocks of the same breed"
        icon={<ArrowLeftRight className="h-6 w-6" />}
      />

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
            <select
              value={selectedBreed}
              onChange={(e) => setSelectedBreed(e.target.value)}
              className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {breeds.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Only flocks with the same breed can be compared.
            </p>
          </div>

          <div className="lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <label className="block text-sm font-medium text-gray-700">Select 2–4 flocks</label>
              <button
                onClick={onCompare}
                disabled={!canCompare || loadingCompare}
                className={`h-10 px-4 rounded-lg text-sm font-medium transition-colors ${
                  canCompare && !loadingCompare
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {loadingCompare ? "Comparing..." : "Compare"}
              </button>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {flocksForBreed.map((f) => {
                const id = String(f.id);
                const checked = selectedFlockIds.includes(id);
                const idx = checked ? selectedFlockIds.indexOf(id) : -1;
                const color = idx >= 0 ? FLOCK_COLORS[idx] : null;
                return (
                  <label
                    key={id}
                    className={`flex items-center gap-3 border rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                      checked ? "border-emerald-300 bg-emerald-50" : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleFlock(id)}
                      disabled={!checked && selectedFlockIds.length >= 4}
                      className="h-4 w-4 accent-emerald-600"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        {color && <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />}
                        <span className="text-sm font-medium text-gray-900 truncate">{f.batchName}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Flock ID: {f.id}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            {!canCompare && (
              <p className="text-xs text-gray-500 mt-2">
                Select {selectedFlockIds.length < 2 ? "at least 2" : "no more than 4"} flocks to enable comparison.
              </p>
            )}

            {errorMessage && (
              <div className="mt-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg px-3 py-2 text-sm">
                {errorMessage}
              </div>
            )}
          </div>
        </div>
      </div>

      {loadingCompare && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <LoadingSpinner text="Loading comparison..." />
        </div>
      )}

      {!loadingCompare && result && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Summary Comparison</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Breed: <span className="font-medium text-gray-700">{result.breedName}</span>
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-gray-600 font-medium w-56">Metric</th>
                    {result.flocks.map((f, i) => (
                      <th key={f.id} className="text-left px-4 py-3 font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: FLOCK_COLORS[i] }} />
                          <span className="truncate text-gray-900">{f.name}</span>
                        </div>
                      </th>
                    ))}
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STANDARD_COLOR }} />
                        Standard
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {summaryRows.map((r) => (
                    <tr key={r.label} className="hover:bg-gray-50/40">
                      <td className="px-4 py-3 text-gray-600">{r.label}</td>
                      {result.flocks.map((f, i) => {
                        const v: any = (r as any).values[i];
                        const text = typeof v === "string" ? v : v?.text ?? "—";
                        const isBest = typeof v === "object" && Boolean(v?.isBest);
                        const bestLow = typeof v === "object" && Boolean(v?.bestLow);
                        return (
                          <td
                            key={`${r.label}-${f.id}`}
                            className={`px-4 py-3 ${
                              isBest ? (bestLow ? "font-semibold text-emerald-700 bg-emerald-50/60" : "font-semibold text-emerald-700 bg-emerald-50/60") : "text-gray-900"
                            }`}
                          >
                            {text}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-gray-700">{(r as any).standard ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Laying Rate by Week Age</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="weekAge" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <Tooltip formatter={(value: any, name: any) => [pct(typeof value === "number" ? value : null), name]} />
                    <Legend />
                    {result.flocks.map((flock, i) => (
                      <Line
                        key={flock.id}
                        type="monotone"
                        dataKey={`lay_${i}`}
                        name={flock.name}
                        stroke={FLOCK_COLORS[i]}
                        strokeWidth={2}
                        dot={false}
                        connectNulls={false}
                      />
                    ))}
                    <Line
                      type="monotone"
                      dataKey="standardLay"
                      name="Standard"
                      stroke={STANDARD_COLOR}
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Feed Intake by Week Age</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="weekAge" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <Tooltip
                      formatter={(value: any, name: any) => [value === null ? "—" : fmt(Number(value), " g", 1), name]}
                    />
                    <Legend />
                    {result.flocks.map((flock, i) => (
                      <Line
                        key={flock.id}
                        type="monotone"
                        dataKey={`feed_${i}`}
                        name={flock.name}
                        stroke={FLOCK_COLORS[i]}
                        strokeWidth={2}
                        dot={false}
                        connectNulls={false}
                      />
                    ))}
                    <Line
                      type="monotone"
                      dataKey="standardFeed"
                      name="Standard"
                      stroke={STANDARD_COLOR}
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-gray-500 mt-3">Feed lines appear only where entries include feed consumption.</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Cumulative Eggs per Hen Housed</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="weekAge" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <Tooltip
                      formatter={(value: any, name: any) => [value === null ? "—" : fmt(Number(value), "", 1), name]}
                    />
                    <Legend />
                    {result.flocks.map((flock, i) => (
                      <Line
                        key={flock.id}
                        type="monotone"
                        dataKey={`cumEggs_${i}`}
                        name={flock.name}
                        stroke={FLOCK_COLORS[i]}
                        strokeWidth={2}
                        dot={false}
                        connectNulls={false}
                      />
                    ))}
                    <Line
                      type="monotone"
                      dataKey="standardCumEggs"
                      name="Standard"
                      stroke={STANDARD_COLOR}
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Livability (%) by Week Age</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="weekAge" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <YAxis domain={[85, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <Tooltip formatter={(value: any, name: any) => [pct(typeof value === "number" ? value : null), name]} />
                    <Legend />
                    {result.flocks.map((flock, i) => (
                      <Line
                        key={flock.id}
                        type="monotone"
                        dataKey={`livability_${i}`}
                        name={flock.name}
                        stroke={FLOCK_COLORS[i]}
                        strokeWidth={2}
                        dot={false}
                        connectNulls={false}
                      />
                    ))}
                    <Line
                      type="monotone"
                      dataKey="standardLivability"
                      name="Standard"
                      stroke={STANDARD_COLOR}
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-gray-500 mt-3">Y-axis starts at 85% to make differences easier to see.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

