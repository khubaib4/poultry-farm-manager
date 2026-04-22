import React, { useState, useEffect, useCallback, useRef } from "react";
import { cn, convertBagsToKg, calculateProductionRate, calculateFeedPerBird } from "@/lib/utils";
import { Skull, Egg, Wheat, Droplets, AlertTriangle, ChevronDown, ChevronUp, Save, RotateCcw } from "lucide-react";

interface EntryData {
  id: number;
  flockId: number;
  entryDate: string;
  deaths: number;
  deathCause?: string | null;
  totalEggs: number;
  feedConsumedKg: number;
  waterConsumedLiters?: number | null;
  notes?: string | null;
}

interface DailyEntryFormProps {
  flockId: number;
  flockName: string;
  date: string;
  openingStock: number;
  existingEntry?: EntryData | null;
  onSave: (data: FormPayload) => Promise<void>;
  onSaveAndNext?: () => void;
  hasNextFlock?: boolean;
  isSaving: boolean;
}

export interface FormPayload {
  flockId: number;
  entryDate: string;
  deaths: number;
  deathCause: string;
  totalEggs: number;
  feedConsumedKg: number;
  waterConsumedLiters: number | null;
  notes: string;
}

const DEATH_CAUSES = ["Disease", "Heat stress", "Predator", "Injury", "Unknown", "Other"];

export default function DailyEntryForm({
  flockId, flockName, date, openingStock, existingEntry, onSave, onSaveAndNext, hasNextFlock, isSaving
}: DailyEntryFormProps): React.ReactElement {
  const [deaths, setDeaths] = useState(existingEntry?.deaths ?? 0);
  const [deathCause, setDeathCause] = useState(existingEntry?.deathCause || "");
  const [otherCause, setOtherCause] = useState("");
  const [totalEggs, setTotalEggs] = useState(existingEntry?.totalEggs ?? 0);
  const [feedValue, setFeedValue] = useState(existingEntry?.feedConsumedKg ?? 0);
  const [feedUnit, setFeedUnit] = useState<"kg" | "bags">("kg");
  const [bagWeight, setBagWeight] = useState(50);
  const [waterLiters, setWaterLiters] = useState(existingEntry?.waterConsumedLiters ?? 0);
  const [notes, setNotes] = useState(existingEntry?.notes || "");
  const [showAdditional, setShowAdditional] = useState(!!(existingEntry?.waterConsumedLiters || existingEntry?.notes));
  const [saveAndNext, setSaveAndNext] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDeaths(existingEntry?.deaths ?? 0);
    setDeathCause(existingEntry?.deathCause || "");
    setOtherCause("");
    setTotalEggs(existingEntry?.totalEggs ?? 0);
    setFeedValue(existingEntry?.feedConsumedKg ?? 0);
    setFeedUnit("kg");
    setWaterLiters(existingEntry?.waterConsumedLiters ?? 0);
    setNotes(existingEntry?.notes || "");
    setShowAdditional(!!(existingEntry?.waterConsumedLiters || existingEntry?.notes));
    if (!existingEntry && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [existingEntry, flockId, date]);

  const closingStock = Math.max(0, openingStock - deaths);

  const feedKg = feedUnit === "bags" ? convertBagsToKg(feedValue, bagWeight) : feedValue;
  const prodRate = calculateProductionRate(totalEggs, closingStock);
  const feedPerBird = calculateFeedPerBird(feedKg, closingStock);

  const warnings: string[] = [];
  if (openingStock > 0 && (deaths / openingStock) > 0.005) warnings.push(`High mortality: ${((deaths / openingStock) * 100).toFixed(1)}%`);
  if (closingStock > 0 && prodRate < 70 && totalEggs > 0) warnings.push(`Low production rate: ${prodRate}%`);
  if (closingStock > 0 && feedPerBird > 0.2) warnings.push(`High feed: ${(feedPerBird * 1000).toFixed(0)}g/bird`);
  if (closingStock > 0 && feedPerBird > 0 && feedPerBird < 0.05) warnings.push(`Low feed: ${(feedPerBird * 1000).toFixed(0)}g/bird`);

  const handleClear = useCallback(() => {
    setDeaths(0);
    setDeathCause("");
    setOtherCause("");
    setTotalEggs(0);
    setFeedValue(0);
    setWaterLiters(0);
    setNotes("");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cause = deathCause === "Other" ? otherCause : deathCause;
    await onSave({
      flockId,
      entryDate: date,
      deaths,
      deathCause: deaths > 0 ? cause : "",
      totalEggs,
      feedConsumedKg: Math.round(feedKg * 100) / 100,
      waterConsumedLiters: waterLiters > 0 ? waterLiters : null,
      notes: notes.trim(),
    });
    if (saveAndNext && onSaveAndNext) onSaveAndNext();
  };

  const numInput = (label: string, value: number, onChange: (v: number) => void, opts?: { max?: number; step?: string; suffix?: string; ref?: React.Ref<HTMLInputElement> }) => (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <input
          ref={opts?.ref}
          type="number"
          min={0}
          max={opts?.max}
          step={opts?.step || "1"}
          value={value || ""}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
          className="w-full h-12 px-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          placeholder="0"
        />
        {opts?.suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">{opts.suffix}</span>}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div>
          <div className="text-sm text-gray-500">Opening Stock</div>
          <div className="text-2xl font-bold text-gray-900">{openingStock.toLocaleString()}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Closing Stock</div>
          <div className={cn("text-2xl font-bold", deaths > 0 ? "text-amber-600" : "text-green-700")}>{closingStock.toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center gap-2 text-gray-800 font-semibold">
          <Skull className="w-5 h-5 text-red-500" />
          <span>Mortality</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {numInput("Deaths", deaths, (v) => setDeaths(Math.min(v, openingStock)), { max: openingStock, ref: firstInputRef })}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Cause (optional)</label>
            <select
              value={deathCause}
              onChange={(e) => setDeathCause(e.target.value)}
              className="w-full h-12 px-4 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
              disabled={deaths === 0}
            >
              <option value="">Select cause...</option>
              {DEATH_CAUSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        {deathCause === "Other" && (
          <input
            type="text"
            value={otherCause}
            onChange={(e) => setOtherCause(e.target.value)}
            placeholder="Describe cause..."
            className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-800 font-semibold">
            <Egg className="w-5 h-5 text-amber-500" />
            <span>Egg Production</span>
          </div>
        </div>
        {numInput("Total Eggs Collected", totalEggs, (v) => setTotalEggs(v), { suffix: "eggs" })}
        <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-4 py-2">
          <span className="text-gray-600">Total: <span className="font-bold text-gray-900">{totalEggs.toLocaleString()} eggs</span></span>
          <span className="text-gray-600">Rate: <span className={cn("font-bold", prodRate >= 70 ? "text-green-700" : prodRate > 0 ? "text-amber-600" : "text-gray-400")}>{prodRate}%</span></span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-800 font-semibold">
            <Wheat className="w-5 h-5 text-yellow-600" />
            <span>Feed Consumption</span>
          </div>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button type="button" onClick={() => setFeedUnit("kg")} className={cn("px-3 py-1.5 text-sm font-medium transition-colors", feedUnit === "kg" ? "bg-green-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50")}>
              Kg
            </button>
            <button type="button" onClick={() => setFeedUnit("bags")} className={cn("px-3 py-1.5 text-sm font-medium transition-colors", feedUnit === "bags" ? "bg-green-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50")}>
              Bags
            </button>
          </div>
        </div>
        <div className={cn("grid gap-4", feedUnit === "bags" ? "grid-cols-2" : "grid-cols-1")}>
          {numInput("Feed consumed", feedValue, setFeedValue, { step: "0.1", suffix: feedUnit })}
          {feedUnit === "bags" && numInput("Bag weight", bagWeight, setBagWeight, { suffix: "kg" })}
        </div>
        <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-4 py-2">
          <span className="text-gray-600">Total: <span className="font-bold text-gray-900">{feedKg.toFixed(1)} kg</span></span>
          <span className="text-gray-600">Per bird: <span className="font-bold text-gray-900">{(feedPerBird * 1000).toFixed(0)}g</span></span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdditional(!showAdditional)}
          className="w-full flex items-center justify-between px-5 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-500" />
            <span>Additional Info</span>
          </div>
          {showAdditional ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showAdditional && (
          <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
            {numInput("Water consumed (liters)", waterLiters, setWaterLiters, { step: "0.1", suffix: "L" })}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none text-base"
                placeholder="Any observations for today..."
              />
            </div>
          </div>
        )}
      </div>

      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-amber-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSaving}
          onClick={() => setSaveAndNext(false)}
          className="flex-1 h-12 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {isSaving ? "Saving..." : existingEntry ? "Update Entry" : "Save Entry"}
        </button>
        {hasNextFlock && onSaveAndNext && (
          <button
            type="submit"
            disabled={isSaving}
            onClick={() => setSaveAndNext(true)}
            className="h-12 px-5 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            Save & Next
          </button>
        )}
        <button
          type="button"
          onClick={handleClear}
          className="h-12 px-4 flex items-center gap-2 text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
