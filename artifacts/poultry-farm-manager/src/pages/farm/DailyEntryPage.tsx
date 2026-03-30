import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isElectron } from "@/lib/api";
import { getTodayString, addDays, formatDateForDisplay, calculateAge, formatAge } from "@/lib/utils";
import FlockSelector from "@/components/daily-entry/FlockSelector";
import DailyEntryForm, { FormPayload } from "@/components/daily-entry/DailyEntryForm";
import ExistingEntryCard from "@/components/daily-entry/ExistingEntryCard";
import { ChevronLeft, ChevronRight, Calendar, Loader2, Bird, AlertCircle } from "lucide-react";

interface Flock {
  id: number;
  batchName: string;
  breed?: string | null;
  initialCount: number;
  currentCount: number;
  arrivalDate: string;
  ageAtArrivalDays?: number;
  status?: string | null;
}

interface EntryData {
  id: number;
  flockId: number;
  entryDate: string;
  deaths: number;
  deathCause?: string | null;
  eggsGradeA: number;
  eggsGradeB: number;
  eggsCracked: number;
  feedConsumedKg: number;
  waterConsumedLiters?: number | null;
  notes?: string | null;
}

interface StockInfo {
  openingStock: number;
  flockName: string;
  flockId: number;
  arrivalDate: string;
  currentCount: number;
}

export default function DailyEntryPage(): React.ReactElement {
  const { user } = useAuth();
  const location = useLocation();
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialDate = queryParams.get("date") || getTodayString();
  const initialFlockId = queryParams.get("flock") ? Number(queryParams.get("flock")) : null;
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [selectedFlockId, setSelectedFlockId] = useState<number | null>(null);
  const [existingEntries, setExistingEntries] = useState<Record<number, EntryData>>({});
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const today = getTodayString();
  const isFuture = selectedDate > today;
  const activeFlocks = flocks.filter(f => f.status === "active");
  const selectedFlock = flocks.find(f => f.id === selectedFlockId);
  const currentEntry = selectedFlockId ? existingEntries[selectedFlockId] : null;

  const loadFlocks = useCallback(async () => {
    if (!isElectron() || !user?.farmId) return;
    try {
      const result = await window.electronAPI.flocks.getByFarm(user.farmId);
      if (result.success && result.data) {
        const allFlocks = result.data as Flock[];
        setFlocks(allFlocks);
        const active = allFlocks.filter(f => f.status === "active");
        if (active.length > 0 && !selectedFlockId) {
          if (initialFlockId && active.some(f => f.id === initialFlockId)) {
            setSelectedFlockId(initialFlockId);
          } else {
            setSelectedFlockId(active[0].id);
          }
        }
      }
    } catch {}
  }, [user?.farmId, selectedFlockId]);

  const loadEntriesForDate = useCallback(async () => {
    if (!isElectron() || !user?.farmId) return;
    try {
      const result = await window.electronAPI.dailyEntries.getByFarm(user.farmId, selectedDate);
      if (result.success && result.data) {
        const entries = result.data as EntryData[];
        const map: Record<number, EntryData> = {};
        for (const e of entries) {
          map[e.flockId] = e;
        }
        setExistingEntries(map);
      }
    } catch {}
  }, [user?.farmId, selectedDate]);

  const loadStockInfo = useCallback(async () => {
    if (!isElectron() || !selectedFlockId) return;
    try {
      const result = await window.electronAPI.dailyEntries.getPreviousDayStock(selectedFlockId, selectedDate);
      if (result.success && result.data) {
        setStockInfo(result.data as StockInfo);
      }
    } catch {}
  }, [selectedFlockId, selectedDate]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await loadFlocks();
      setIsLoading(false);
    };
    init();
  }, [loadFlocks]);

  useEffect(() => {
    loadEntriesForDate();
  }, [loadEntriesForDate]);

  useEffect(() => {
    loadStockInfo();
  }, [loadStockInfo]);

  useEffect(() => {
    setIsEditing(false);
  }, [selectedFlockId, selectedDate]);

  const handleDateChange = (direction: "prev" | "next" | "today" | string) => {
    setError(null);
    setSuccessMsg(null);
    if (direction === "prev") {
      setSelectedDate(addDays(selectedDate, -1));
    } else if (direction === "next") {
      const next = addDays(selectedDate, 1);
      if (next <= today) setSelectedDate(next);
    } else if (direction === "today") {
      setSelectedDate(today);
    } else {
      setSelectedDate(direction);
    }
  };

  const handleSave = async (data: FormPayload) => {
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      if (isEditing && currentEntry) {
        const result = await window.electronAPI.dailyEntries.update(currentEntry.id, {
          deaths: data.deaths,
          deathCause: data.deathCause || undefined,
          eggsGradeA: data.eggsGradeA,
          eggsGradeB: data.eggsGradeB,
          eggsCracked: data.eggsCracked,
          feedConsumedKg: data.feedConsumedKg,
          waterConsumedLiters: data.waterConsumedLiters || undefined,
          notes: data.notes || undefined,
        });
        if (!result.success) throw new Error(result.error || "Failed to update entry");
        setSuccessMsg("Entry updated successfully");
      } else {
        const result = await window.electronAPI.dailyEntries.create(data);
        if (!result.success) throw new Error(result.error || "Failed to save entry");
        setSuccessMsg("Entry saved successfully");
      }
      setIsEditing(false);
      await loadEntriesForDate();
      await loadStockInfo();
      await loadFlocks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save entry");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentEntry) return;
    setIsDeleting(true);
    setError(null);
    try {
      const result = await window.electronAPI.dailyEntries.delete(currentEntry.id);
      if (!result.success) throw new Error(result.error || "Failed to delete entry");
      setSuccessMsg("Entry deleted successfully");
      await loadEntriesForDate();
      await loadStockInfo();
      await loadFlocks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete entry");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveAndNext = () => {
    const currentIdx = activeFlocks.findIndex(f => f.id === selectedFlockId);
    const nextIdx = activeFlocks.findIndex((f, i) => i > currentIdx && !existingEntries[f.id]);
    if (nextIdx >= 0) {
      setSelectedFlockId(activeFlocks[nextIdx].id);
    }
  };

  const hasNextFlock = activeFlocks.some((f, i) => {
    const currentIdx = activeFlocks.findIndex(fl => fl.id === selectedFlockId);
    return i > currentIdx && !existingEntries[f.id];
  });

  const dateBeforeArrival = selectedFlock && selectedDate < selectedFlock.arrivalDate;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Daily Entry</h1>
        <a href="#/farm/daily-entry/history" className="text-sm text-green-600 hover:text-green-700 font-medium">
          View History
        </a>
      </div>

      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-3">
        <button onClick={() => handleDateChange("prev")} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Previous day">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-gray-400" />
          <input
            type="date"
            value={selectedDate}
            max={today}
            onChange={(e) => handleDateChange(e.target.value)}
            className="text-base font-medium text-gray-900 border-none bg-transparent focus:ring-0 cursor-pointer"
          />
          {selectedDate !== today && (
            <button onClick={() => handleDateChange("today")} className="text-xs text-green-600 font-medium px-2 py-1 bg-green-50 rounded hover:bg-green-100">
              Today
            </button>
          )}
        </div>
        <button
          onClick={() => handleDateChange("next")}
          disabled={selectedDate >= today}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next day"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {isFuture && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">Cannot create entries for future dates. Please select today or a past date.</span>
        </div>
      )}

      {activeFlocks.length === 0 ? (
        <div className="text-center py-12">
          <Bird className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No Active Flocks</h3>
          <p className="text-gray-500 mb-4">Add a flock first before recording daily entries.</p>
          <a href="#/farm/flocks/new" className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
            Add Flock
          </a>
        </div>
      ) : (
        <>
          <FlockSelector
            flocks={activeFlocks.map(f => ({ ...f, hasEntry: !!existingEntries[f.id] }))}
            selectedFlockId={selectedFlockId}
            onSelect={(id) => { setSelectedFlockId(id); setError(null); setSuccessMsg(null); }}
          />

          {successMsg && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              {successMsg}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {selectedFlock && selectedFlockId && !isFuture && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedFlock.batchName}</h2>
                  <p className="text-sm text-gray-500">
                    {selectedFlock.breed && `${selectedFlock.breed} · `}
                    Age: {formatAge(calculateAge(selectedFlock.arrivalDate, selectedFlock.ageAtArrivalDays || 0))}
                  </p>
                </div>
              </div>

              {dateBeforeArrival ? (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-700 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>Selected date is before this flock's arrival date ({formatDateForDisplay(selectedFlock.arrivalDate)}).</span>
                </div>
              ) : currentEntry && !isEditing ? (
                <ExistingEntryCard
                  entry={currentEntry}
                  openingStock={stockInfo?.openingStock ?? selectedFlock.currentCount}
                  onEdit={() => setIsEditing(true)}
                  onDelete={handleDelete}
                  isDeleting={isDeleting}
                />
              ) : (
                <DailyEntryForm
                  flockId={selectedFlockId}
                  flockName={selectedFlock.batchName}
                  date={selectedDate}
                  openingStock={stockInfo?.openingStock ?? selectedFlock.currentCount}
                  existingEntry={isEditing ? currentEntry : null}
                  onSave={handleSave}
                  onSaveAndNext={handleSaveAndNext}
                  hasNextFlock={hasNextFlock}
                  isSaving={isSaving}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
