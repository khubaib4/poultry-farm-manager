import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { sales as salesApi, profile as profileApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { generateInvoicePDF, getInvoiceFilename } from "@/lib/invoicePdf";
import type { InvoiceFarmInfo } from "@/lib/invoicePdf";

interface Props {
  saleId: number;
  invoiceNumber?: string;
  customerName?: string;
  size?: "sm" | "md";
  variant?: "primary" | "outline";
}

export default function DownloadInvoiceButton({
  saleId, invoiceNumber, customerName, size = "md", variant = "primary",
}: Props): React.ReactElement {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleDownload(e: React.MouseEvent) {
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
      const filename = getInvoiceFilename(
        invoiceNumber || sale.invoiceNumber,
        customerName || sale.customer.name
      );
      doc.save(filename);
      showToast("Invoice downloaded", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to generate invoice", "error");
    } finally {
      setLoading(false);
    }
  }

  const sizeClasses = size === "sm"
    ? "px-2.5 py-1.5 text-xs gap-1.5"
    : "px-4 py-2 text-sm gap-2";

  const variantClasses = variant === "primary"
    ? "text-white bg-blue-600 hover:bg-blue-700"
    : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50";

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={`inline-flex items-center font-medium rounded-lg transition-colors disabled:opacity-50 ${sizeClasses} ${variantClasses}`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      {size === "md" && (loading ? "Generating..." : "Download PDF")}
    </button>
  );
}
