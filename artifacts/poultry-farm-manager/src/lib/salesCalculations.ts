export interface SaleItemInput {
  itemType: "egg" | "tray";
  grade: "A" | "B" | "cracked";
  quantity: number;
  unitPrice: number;
}

export function calculateLineTotal(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100) / 100;
}

export function calculateSubtotal(items: SaleItemInput[]): number {
  return items.reduce((sum, item) => {
    if (item.quantity > 0 && item.unitPrice > 0) {
      return sum + calculateLineTotal(item.quantity, item.unitPrice);
    }
    return sum;
  }, 0);
}

export function calculateDiscount(
  subtotal: number,
  discountType: "none" | "percentage" | "fixed",
  discountValue: number
): number {
  if (discountType === "none" || discountValue <= 0) return 0;
  if (discountType === "percentage") {
    const capped = Math.min(discountValue, 100);
    return Math.round(subtotal * (capped / 100) * 100) / 100;
  }
  return Math.min(discountValue, subtotal);
}

export function calculateTotal(subtotal: number, discountAmount: number): number {
  return Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);
}

export function calculateBalanceDue(total: number, paidAmount: number): number {
  return Math.max(0, Math.round((total - paidAmount) * 100) / 100);
}

export function getPaymentStatus(total: number, paidAmount: number): "paid" | "partial" | "unpaid" {
  if (total <= 0) return "paid";
  if (paidAmount >= total) return "paid";
  if (paidAmount > 0) return "partial";
  return "unpaid";
}

export function calculateDueDate(saleDate: string, paymentTermsDays: number): string {
  const date = new Date(saleDate);
  date.setDate(date.getDate() + paymentTermsDays);
  return date.toISOString().split("T")[0];
}

export function isOverdue(dueDate: string | null, paymentStatus: string): boolean {
  if (!dueDate || paymentStatus === "paid") return false;
  const today = new Date().toISOString().split("T")[0];
  return dueDate < today;
}

export function filterValidItems(items: SaleItemInput[]): SaleItemInput[] {
  return items.filter(item => item.quantity > 0 && item.unitPrice > 0);
}
