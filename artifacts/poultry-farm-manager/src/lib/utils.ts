import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function generateUsername(farmName: string): string {
  const base = farmName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 16);
  const suffix = Math.floor(Math.random() * 900 + 100);
  return (base || "farm") + "_" + suffix;
}

export function generatePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%&*";
  const all = upper + lower + digits + symbols;

  const randomIndex = (max: number): number => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
  };

  const chars = [
    upper[randomIndex(upper.length)],
    upper[randomIndex(upper.length)],
    lower[randomIndex(lower.length)],
    lower[randomIndex(lower.length)],
    digits[randomIndex(digits.length)],
    digits[randomIndex(digits.length)],
    symbols[randomIndex(symbols.length)],
  ];

  while (chars.length < 12) {
    chars.push(all[randomIndex(all.length)]);
  }

  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

export function calculateAge(arrivalDate: string, ageAtArrival: number = 0): number {
  const arrival = new Date(arrivalDate);
  const today = new Date();
  const diffMs = today.getTime() - arrival.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays + ageAtArrival);
}

export function formatAge(days: number): string {
  if (days < 7) return `${days} day${days !== 1 ? "s" : ""}`;
  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;
  if (remainingDays === 0) return `${weeks} week${weeks !== 1 ? "s" : ""}`;
  return `${weeks}w ${remainingDays}d`;
}

export function generateBatchName(existingNames: string[]): string {
  const year = new Date().getFullYear();
  const prefix = `Batch-${year}-`;
  const existingNumbers = existingNames
    .filter((n) => n.startsWith(prefix))
    .map((n) => parseInt(n.replace(prefix, ""), 10))
    .filter((n) => !isNaN(n));
  const next = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

export function convertTraysToEggs(trays: number): number {
  return Math.round(trays * 30);
}

export function convertBagsToKg(bags: number, bagWeight: number = 50): number {
  return bags * bagWeight;
}

export function calculateProductionRate(eggs: number, birdCount: number): number {
  if (birdCount <= 0) return 0;
  return Math.round((eggs / birdCount) * 100 * 100) / 100;
}

export function calculateFeedPerBird(feedKg: number, birdCount: number): number {
  if (birdCount <= 0) return 0;
  return Math.round((feedKg / birdCount) * 1000) / 1000;
}

export function formatDateForDisplay(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

export function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function formatCurrency(amount: number): string {
  return `PKR ${amount.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function calculateEggRevenue(
  eggsA: number, eggsB: number, eggsCracked: number,
  priceA: number, priceB: number, priceCracked: number
): { revenueA: number; revenueB: number; revenueCracked: number; total: number } {
  const revenueA = eggsA * priceA;
  const revenueB = eggsB * priceB;
  const revenueCracked = eggsCracked * priceCracked;
  return { revenueA, revenueB, revenueCracked, total: revenueA + revenueB + revenueCracked };
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textArea);
    return success;
  }
}
