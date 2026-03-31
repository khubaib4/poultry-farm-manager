import React from "react";

const CATEGORY_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  retailer: { label: "Retailer", bg: "bg-blue-100", text: "text-blue-700" },
  wholesaler: { label: "Wholesaler", bg: "bg-purple-100", text: "text-purple-700" },
  restaurant: { label: "Restaurant/Hotel", bg: "bg-orange-100", text: "text-orange-700" },
  individual: { label: "Individual", bg: "bg-green-100", text: "text-green-700" },
  other: { label: "Other", bg: "bg-gray-100", text: "text-gray-700" },
};

interface CategoryBadgeProps {
  category: string;
  size?: "sm" | "md";
}

export default function CategoryBadge({ category, size = "sm" }: CategoryBadgeProps): React.ReactElement {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${config.bg} ${config.text} ${sizeClasses}`}>
      {config.label}
    </span>
  );
}

export function getCategoryLabel(category: string): string {
  return CATEGORY_CONFIG[category]?.label || "Other";
}

export const CUSTOMER_CATEGORIES = [
  { value: "retailer", label: "Retailer" },
  { value: "wholesaler", label: "Wholesaler" },
  { value: "restaurant", label: "Restaurant/Hotel" },
  { value: "individual", label: "Individual" },
  { value: "other", label: "Other" },
];
