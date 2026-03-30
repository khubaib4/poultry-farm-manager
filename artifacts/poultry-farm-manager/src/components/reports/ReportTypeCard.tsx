import React from "react";

interface Props {
  icon: React.ReactNode;
  title: string;
  description: string;
  includes: string[];
  selected: boolean;
  onClick: () => void;
}

export default function ReportTypeCard({ icon, title, description, includes, selected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
        selected
          ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${selected ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold ${selected ? "text-blue-900" : "text-gray-900"}`}>{title}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {includes.map(item => (
              <span key={item} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{item}</span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}
