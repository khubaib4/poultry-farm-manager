import React, { useState, useRef, useEffect } from "react";
import { vaccinesApi, isElectron } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";
import type { Vaccine } from "@/types/electron";
import { useFarmId } from "@/hooks/useFarmId";

const fallbackVaccines = [
  "Newcastle Disease",
  "Infectious Bronchitis (IB)",
  "Newcastle + IB",
  "Gumboro (IBD)",
  "Marek's Disease",
  "Fowl Pox",
  "Infectious Coryza",
  "Avian Influenza",
  "Salmonella",
  "E. coli",
  "Mycoplasma",
  "Egg Drop Syndrome (EDS)",
  "Laryngotracheitis (ILT)",
];

interface VaccineSelectorProps {
  value: string;
  onChange: (value: string, defaultRoute?: string) => void;
  error?: boolean;
}

export default function VaccineSelector({ value, onChange, error }: VaccineSelectorProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const [vaccineList, setVaccineList] = useState<Vaccine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const farmId = useFarmId();

  useEffect(() => {
    setSearch(value);
  }, [value]);

  useEffect(() => {
    if (!isElectron() || !farmId) { setLoaded(true); return; }
    vaccinesApi.getByFarm(farmId)
      .then((list) => setVaccineList(list))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [farmId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (search.trim()) {
          onChange(search.trim());
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [search, onChange]);

  const names = loaded && vaccineList.length > 0
    ? vaccineList.map(v => v.name)
    : fallbackVaccines;

  const filtered = names.filter(v =>
    v.toLowerCase().includes(search.toLowerCase())
  );

  function handleSelect(vaccineName: string) {
    const match = vaccineList.find(v => v.name === vaccineName);
    onChange(vaccineName, match?.defaultRoute || undefined);
    setSearch(vaccineName);
    setIsOpen(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    onChange(e.target.value);
    setIsOpen(true);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={search}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder="Type or select a vaccine..."
        className={`w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
          error ? "border-red-300 bg-red-50" : "border-gray-300"
        }`}
      />
      {isOpen && (filtered.length > 0 || search.trim()) && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filtered.map(vaccine => (
            <button
              key={vaccine}
              type="button"
              onClick={() => handleSelect(vaccine)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-purple-50 ${
                vaccine === value ? "bg-purple-50 text-purple-700 font-medium" : "text-gray-700"
              }`}
            >
              {vaccine}
            </button>
          ))}
          {filtered.length === 0 && search.trim() && (
            <div className="px-3 py-2 text-sm text-gray-500 italic">
              No match — press Tab or click away to use "{search.trim()}"
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              navigate("/farm/settings/vaccines");
            }}
            className="w-full text-left px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 border-t border-gray-100 flex items-center gap-1.5"
          >
            <Settings className="h-3.5 w-3.5" /> Manage Vaccines
          </button>
        </div>
      )}
    </div>
  );
}
