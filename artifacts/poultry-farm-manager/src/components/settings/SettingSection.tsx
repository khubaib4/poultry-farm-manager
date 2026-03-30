import React from "react";

interface SettingSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export default function SettingSection({ title, description, children }: SettingSectionProps): React.ReactElement {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="divide-y divide-gray-100">
        {children}
      </div>
    </div>
  );
}
