import React from "react";

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

export default function SettingRow({ label, description, children }: SettingRowProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between px-6 py-4 gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">
        {children}
      </div>
    </div>
  );
}
