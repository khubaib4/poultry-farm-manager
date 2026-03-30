import React, { useState } from "react";

const COMMON_BREEDS = [
  "Lohmann Brown",
  "Hy-Line Brown",
  "ISA Brown",
  "Bovans Brown",
  "Novogen Brown",
  "Dekalb White",
  "Hy-Line W-36",
];

interface BreedSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function BreedSelector({
  value,
  onChange,
  disabled,
  className,
}: BreedSelectorProps): React.ReactElement {
  const [isCustom, setIsCustom] = useState(
    value !== "" && !COMMON_BREEDS.includes(value)
  );

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === "__custom__") {
      setIsCustom(true);
      onChange("");
    } else {
      setIsCustom(false);
      onChange(selected);
    }
  };

  if (isCustom) {
    return (
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter breed name"
          disabled={disabled}
          className={className}
          autoFocus
        />
        <button
          type="button"
          onClick={() => {
            setIsCustom(false);
            onChange(COMMON_BREEDS[0]);
          }}
          disabled={disabled}
          className="shrink-0 rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-500 hover:bg-slate-50"
        >
          List
        </button>
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={handleSelectChange}
      disabled={disabled}
      className={className}
    >
      <option value="">Select breed</option>
      {COMMON_BREEDS.map((breed) => (
        <option key={breed} value={breed}>
          {breed}
        </option>
      ))}
      <option value="__custom__">Custom breed...</option>
    </select>
  );
}
