import React, { useState } from "react";
import { Printer, Loader2 } from "lucide-react";
import { sales as salesApi, profile as profileApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { generateInvoicePDF } from "@/lib/invoicePdf";
import type { InvoiceFarmInfo } from "@/lib/invoicePdf";

interface Props {
  saleId: number;
  size?: "sm" | "md";
}

export default function PrintInvoiceButton({ saleId, size = "md" }: Props): React.ReactElement {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handlePrint(e: React.MouseEvent) {
    e.stopPropagation();
    if (loading) return;
    try {
      setLoading(true);
      const sale = await salesApi.getById(saleId);

      let farmInfo: InvoiceFarmInfo = { name: "Farm", location: null, phone: null, email: null };
      try {
        const [farmProfile, ownerProfile] = await Promise.all([
          profileApi.getFarmProfile(),
          profileApi.getOwnerProfile(),
        ]);
        farmInfo = {
          name: farmProfile.name,
          location: farmProfile.location,
          phone: ownerProfile.phone,
          email: ownerProfile.email,
        };
      } catch {
        if (user?.farmName) farmInfo.name = user.farmName;
      }

      const doc = generateInvoicePDF(sale, farmInfo);
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);

      const printWindow = window.open(url, "_blank");
      if (!printWindow) {
        URL.revokeObjectURL(url);
        showToast("Popup blocked — please allow popups to print the invoice", "error");
        return;
      }

      printWindow.addEventListener("load", () => {
        printWindow.print();
      });

      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to generate invoice", "error");
    } finally {
      setLoading(false);
    }
  }

  const sizeClasses = size === "sm"
    ? "px-2.5 py-1.5 text-xs gap-1.5"
    : "px-4 py-2 text-sm gap-2";

  return (
    <button
      onClick={handlePrint}
      disabled={loading}
      className={`inline-flex items-center font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 ${sizeClasses}`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
      {size === "md" && (loading ? "Preparing..." : "Print")}
    </button>
  );
}
