import React from "react";
import { Wheat, Pill, Users, Zap, Wrench, MoreHorizontal } from "lucide-react";

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  feed: { icon: <Wheat className="h-5 w-5" />, color: "text-amber-600", bg: "bg-amber-50", label: "Feed" },
  medicine: { icon: <Pill className="h-5 w-5" />, color: "text-red-600", bg: "bg-red-50", label: "Medicine/Vaccines" },
  labor: { icon: <Users className="h-5 w-5" />, color: "text-blue-600", bg: "bg-blue-50", label: "Labor/Salaries" },
  utilities: { icon: <Zap className="h-5 w-5" />, color: "text-yellow-600", bg: "bg-yellow-50", label: "Electricity/Utilities" },
  equipment: { icon: <Wrench className="h-5 w-5" />, color: "text-purple-600", bg: "bg-purple-50", label: "Equipment/Maintenance" },
  misc: { icon: <MoreHorizontal className="h-5 w-5" />, color: "text-gray-600", bg: "bg-gray-50", label: "Miscellaneous" },
};

export function getCategoryConfig(category: string) {
  return CATEGORY_CONFIG[category] || CATEGORY_CONFIG.misc;
}

export function getCategoryLabel(category: string): string {
  return getCategoryConfig(category).label;
}

export const EXPENSE_CATEGORIES = [
  { value: "feed", label: "Feed" },
  { value: "medicine", label: "Medicine/Vaccines" },
  { value: "labor", label: "Labor/Salaries" },
  { value: "utilities", label: "Electricity/Utilities" },
  { value: "equipment", label: "Equipment/Maintenance" },
  { value: "misc", label: "Miscellaneous" },
];

interface CategoryIconProps {
  category: string;
  size?: "sm" | "md" | "lg";
}

export default function CategoryIcon({ category, size = "md" }: CategoryIconProps): React.ReactElement {
  const config = getCategoryConfig(category);
  const sizeClasses = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-11 w-11",
  };

  return (
    <div className={`${sizeClasses[size]} ${config.bg} ${config.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
      {config.icon}
    </div>
  );
}
