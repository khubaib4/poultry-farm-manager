import React from "react";
import DownloadInvoiceButton from "./DownloadInvoiceButton";
import PrintInvoiceButton from "./PrintInvoiceButton";

interface Props {
  saleId: number;
  invoiceNumber?: string;
  customerName?: string;
  size?: "sm" | "md";
}

export default function InvoiceActions({
  saleId, invoiceNumber, customerName, size = "md",
}: Props): React.ReactElement {
  return (
    <div className="flex items-center gap-2">
      <DownloadInvoiceButton
        saleId={saleId}
        invoiceNumber={invoiceNumber}
        customerName={customerName}
        size={size}
      />
      <PrintInvoiceButton saleId={saleId} size={size} />
    </div>
  );
}
