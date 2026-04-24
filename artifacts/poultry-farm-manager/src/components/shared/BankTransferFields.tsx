import React from "react";
import { PAKISTANI_BANKS } from "@/data/pakistaniBanks";

interface BankTransferFieldsProps {
  fromBank: string;
  toBank: string;
  onFromBankChange: (value: string) => void;
  onToBankChange: (value: string) => void;
}

export default function BankTransferFields({
  fromBank,
  toBank,
  onFromBankChange,
  onToBankChange,
}: BankTransferFieldsProps): React.ReactElement {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">From (Customer&apos;s Bank)</label>
        <select
          value={fromBank}
          onChange={(e) => onFromBankChange(e.target.value)}
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">To (Your Bank)</label>
        <select
          value={toBank}
          onChange={(e) => onToBankChange(e.target.value)}
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

