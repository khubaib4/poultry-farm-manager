import React, { useState, useRef, useEffect } from "react";

const commonVaccines = [
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
  onChange: (value: string) => void;
  error?: boolean;
}

export default function VaccineSelector({ value, onChange, error }: VaccineSelectorProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearch(value);
  }, [value]);

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

  const filtered = commonVaccines.filter(v =>
    v.toLowerCase().includes(search.toLowerCase())
  );

  function handleSelect(vaccine: string) {
    onChange(vaccine);
    setSearch(vaccine);
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
      {isOpen && filtered.length > 0 && (
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
        </div>
      )}
    </div>
  );
}
