import React from "react";
import { PAKISTANI_BANKS } from "@/data/pakistaniBanks";

interface ChequeFieldsProps {
  chequeNumber: string;
  chequeDate: string; // Cash date (encashment date)
  chequeBank: string;
  onChequeNumberChange: (value: string) => void;
  onChequeDateChange: (value: string) => void;
  onChequeBankChange: (value: string) => void;
}

export default function ChequeFields({
  chequeNumber,
  chequeDate,
  chequeBank,
  onChequeNumberChange,
  onChequeDateChange,
  onChequeBankChange,
}: ChequeFieldsProps): React.ReactElement {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cheque Number</label>
        <input
          type="text"
          value={chequeNumber}
          onChange={(e) => onChequeNumberChange(e.target.value)}
          placeholder="e.g. 001234"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cash Date</label>
        <input
          type="date"
          value={chequeDate}
          onChange={(e) => onChequeDateChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
        <select
          value={chequeBank}
          onChange={(e) => onChequeBankChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
        >
          <option value="">Select bank...</option>
          {PAKISTANI_BANKS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

