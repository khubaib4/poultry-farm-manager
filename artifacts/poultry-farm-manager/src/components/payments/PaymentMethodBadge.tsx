import React from "react";
import { Banknote, Building2, FileText, Smartphone, CircleDot } from "lucide-react";

const METHOD_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  cash: { label: "Cash", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", Icon: Banknote },
  bank_transfer: { label: "Bank Transfer", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", Icon: Building2 },
  cheque: { label: "Cheque", color: "text-purple-700", bg: "bg-purple-50 border-purple-200", Icon: FileText },
  mobile_payment: { label: "Mobile Payment", color: "text-orange-700", bg: "bg-orange-50 border-orange-200", Icon: Smartphone },
  other: { label: "Other", color: "text-gray-700", bg: "bg-gray-50 border-gray-200", Icon: CircleDot },
};

interface Props {
  method: string | null;
}

export default function PaymentMethodBadge({ method }: Props): React.ReactElement {
  const config = METHOD_CONFIG[method || "other"] || METHOD_CONFIG.other;
  const { label, color, bg, Icon } = config;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${bg} ${color}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
