import { and, eq, gte, lte, inArray } from "drizzle-orm";
import * as schema from "../drizzle/schema";
import type { getDatabase } from "./database";
import type { OwnerReportParams, OwnerReportResult, OwnerReportSection, OwnerReportSummaryItem } from "./ownerReportMongo";

type SqliteDb = ReturnType<typeof getDatabase>;

function ownerFmtPkr(n: number): string {
  const v = Math.round(n * 100) / 100;
  return `PKR ${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function eggSum(e: {
  totalEggs: number | null;
}): number {
  return e.totalEggs || 0;
}

export function generateOwnerReportSqlite(
  db: SqliteDb,
  ownerId: number,
  getOwnerFarms: (oid: number) => { id: number; name: string | null }[],
  params: OwnerReportParams
): OwnerReportResult {
  const { type, startDate, endDate, farmId } = params;

  let farms = getOwnerFarms(ownerId);
  if (farmId != null) farms = farms.filter((f) => f.id === farmId);
  const farmIds = farms.map((f) => f.id);

  const scopeLabel =
    farmId != null && farms.length === 1
      ? farms[0].name ?? "Farm"
      : farmId != null && farms.length === 0
        ? "No farms"
        : "All farms";

  const empty = (): OwnerReportResult => ({
    type,
    startDate,
    endDate,
    scopeLabel,
    summary: [],
    columns: [],
    rows: [],
    sections: [],
  });

  if (farmIds.length === 0) return empty();

  const allFlocks = db
    .select()
    .from(schema.flocks)
    .where(inArray(schema.flocks.farmId, farmIds))
    .all();

  const activeFlocks = allFlocks.filter((f) => f.status === "active");
  const flockIds = allFlocks.map((f) => f.id);

  const entries =
    flockIds.length === 0
      ? []
      : db
          .select()
          .from(schema.dailyEntries)
          .where(
            and(
              gte(schema.dailyEntries.entryDate, startDate),
              lte(schema.dailyEntries.entryDate, endDate)
            )
          )
          .all()
          .filter((e) => e.flockId != null && flockIds.includes(e.flockId));

  const sales = db
    .select()
    .from(schema.sales)
    .where(
      and(
        inArray(schema.sales.farmId, farmIds),
        eq(schema.sales.isDeleted, 0),
        gte(schema.sales.saleDate, startDate),
        lte(schema.sales.saleDate, endDate)
      )
    )
    .all();

  const expenses = db
    .select()
    .from(schema.expenses)
    .where(
      and(
        inArray(schema.expenses.farmId, farmIds),
        gte(schema.expenses.expenseDate, startDate),
        lte(schema.expenses.expenseDate, endDate)
      )
    )
    .all();

  switch (type) {
    case "summary": {
      const totalBirds = activeFlocks.reduce((s, f) => s + (f.currentCount || 0), 0);
      const totalEggs = entries.reduce((s, e) => s + eggSum(e), 0);
      const totalDeaths = entries.reduce((s, e) => s + (e.deaths || 0), 0);
      const totalRevenue = sales.reduce((s, x) => s + x.totalAmount, 0);
      const totalExpenses = expenses.reduce((s, x) => s + x.amount, 0);
      const profit = totalRevenue - totalExpenses;

      const summary: OwnerReportSummaryItem[] = [
        { label: "Total birds (active)", value: totalBirds.toLocaleString() },
        { label: "Total eggs", value: totalEggs.toLocaleString() },
        { label: "Total deaths", value: totalDeaths.toLocaleString() },
        { label: "Revenue", value: ownerFmtPkr(totalRevenue) },
        { label: "Expenses", value: ownerFmtPkr(totalExpenses) },
        { label: "Profit / (loss)", value: ownerFmtPkr(profit) },
      ];

      const columns = ["Farm", "Birds", "Eggs", "Deaths", "Revenue", "Expenses", "Profit"];
      const rows: Record<string, string>[] = farms.map((farm) => {
        const farmActive = activeFlocks.filter((f) => f.farmId === farm.id);
        const birds = farmActive.reduce((s, f) => s + (f.currentCount || 0), 0);
        const ff = allFlocks.filter((f) => f.farmId === farm.id).map((f) => f.id);
        const farmEntries = entries.filter((e) => e.flockId != null && ff.includes(e.flockId));
        const eggs = farmEntries.reduce((s, e) => s + eggSum(e), 0);
        const deaths = farmEntries.reduce((s, e) => s + (e.deaths || 0), 0);
        const rev = sales.filter((s) => s.farmId === farm.id).reduce((s, x) => s + x.totalAmount, 0);
        const exp = expenses.filter((e) => e.farmId === farm.id).reduce((s, x) => s + x.amount, 0);
        const p = rev - exp;
        return {
          Farm: farm.name ?? `Farm ${farm.id}`,
          Birds: birds.toLocaleString(),
          Eggs: eggs.toLocaleString(),
          Deaths: deaths.toLocaleString(),
          Revenue: ownerFmtPkr(rev),
          Expenses: ownerFmtPkr(exp),
          Profit: ownerFmtPkr(p),
        };
      });

      return {
        type,
        startDate,
        endDate,
        scopeLabel,
        summary,
        columns,
        rows,
        sections: [],
      };
    }

    case "financial": {
      const totalRevenue = sales.reduce((s, x) => s + x.totalAmount, 0);
      const totalExpenses = expenses.reduce((s, x) => s + x.amount, 0);
      const profit = totalRevenue - totalExpenses;
      const margin = totalRevenue > 0 ? `${((profit / totalRevenue) * 100).toFixed(1)}%` : "—";

      const summary: OwnerReportSummaryItem[] = [
        { label: "Total revenue", value: ownerFmtPkr(totalRevenue) },
        { label: "Total expenses", value: ownerFmtPkr(totalExpenses) },
        { label: "Net profit", value: ownerFmtPkr(profit) },
        { label: "Margin", value: margin },
      ];

      const columns = ["Farm", "Revenue", "Expenses", "Net profit", "Margin %"];
      const rows: Record<string, string>[] = farms.map((farm) => {
        const rev = sales.filter((s) => s.farmId === farm.id).reduce((s, x) => s + x.totalAmount, 0);
        const exp = expenses.filter((e) => e.farmId === farm.id).reduce((s, x) => s + x.amount, 0);
        const p = rev - exp;
        const m = rev > 0 ? `${((p / rev) * 100).toFixed(1)}` : "—";
        return {
          Farm: farm.name ?? `Farm ${farm.id}`,
          Revenue: ownerFmtPkr(rev),
          Expenses: ownerFmtPkr(exp),
          "Net profit": ownerFmtPkr(p),
          "Margin %": m,
        };
      });

      const catMap = new Map<string, number>();
      for (const e of expenses) {
        const c = e.category || "Other";
        catMap.set(c, (catMap.get(c) ?? 0) + e.amount);
      }
      const expenseByCategory = [...catMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([cat, amt]) => ({
          Category: cat,
          Amount: ownerFmtPkr(amt),
        }));

      const sections: OwnerReportSection[] = [
        {
          title: "Expenses by category",
          columns: ["Category", "Amount"],
          rows: expenseByCategory,
        },
      ];

      return { type, startDate, endDate, scopeLabel, summary, columns, rows, sections };
    }

    case "production": {
      const totalEggs = entries.reduce((s, e) => s + eggSum(e), 0);
      const totalDeaths = entries.reduce((s, e) => s + (e.deaths || 0), 0);
      const totalFeed = entries.reduce((s, e) => s + (e.feedConsumedKg || 0), 0);
      const totalBirds = activeFlocks.reduce((s, f) => s + (f.currentCount || 0), 0);

      const summary: OwnerReportSummaryItem[] = [
        { label: "Active birds", value: totalBirds.toLocaleString() },
        { label: "Total eggs", value: totalEggs.toLocaleString() },
        { label: "Total deaths", value: totalDeaths.toLocaleString() },
        { label: "Feed used (kg)", value: totalFeed.toLocaleString(undefined, { maximumFractionDigits: 1 }) },
      ];

      const columns = ["Farm", "Eggs", "Deaths", "Feed (kg)"];
      const rows: Record<string, string>[] = farms.map((farm) => {
        const ff = allFlocks.filter((f) => f.farmId === farm.id).map((f) => f.id);
        const fe = entries.filter((e) => e.flockId != null && ff.includes(e.flockId));
        const eggs = fe.reduce((s, e) => s + eggSum(e), 0);
        const deaths = fe.reduce((s, e) => s + (e.deaths || 0), 0);
        const feed = fe.reduce((s, e) => s + (e.feedConsumedKg || 0), 0);
        return {
          Farm: farm.name ?? `Farm ${farm.id}`,
          Eggs: eggs.toLocaleString(),
          Deaths: deaths.toLocaleString(),
          "Feed (kg)": feed.toLocaleString(undefined, { maximumFractionDigits: 1 }),
        };
      });

      const dayMap = new Map<string, number>();
      for (const e of entries) {
        dayMap.set(e.entryDate, (dayMap.get(e.entryDate) ?? 0) + eggSum(e));
      }
      const dailyRows = [...dayMap.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, eggs]) => ({
          Date: date,
          Eggs: eggs.toLocaleString(),
        }));

      const sections: OwnerReportSection[] = [
        {
          title: "Daily eggs (all selected farms)",
          columns: ["Date", "Eggs"],
          rows: dailyRows,
        },
      ];

      return { type, startDate, endDate, scopeLabel, summary, columns, rows, sections };
    }

    case "sales": {
      const totalRevenue = sales.reduce((s, x) => s + x.totalAmount, 0);
      const saleCount = sales.length;
      const avg = saleCount > 0 ? totalRevenue / saleCount : 0;

      const summary: OwnerReportSummaryItem[] = [
        { label: "Total revenue", value: ownerFmtPkr(totalRevenue) },
        { label: "Invoices", value: saleCount.toLocaleString() },
        { label: "Average invoice", value: ownerFmtPkr(avg) },
      ];

      const columns = ["Farm", "Invoices", "Revenue", "Paid", "Balance due"];
      const rows: Record<string, string>[] = farms.map((farm) => {
        const fs = sales.filter((s) => s.farmId === farm.id);
        const rev = fs.reduce((s, x) => s + x.totalAmount, 0);
        const paid = fs.reduce((s, x) => s + (x.paidAmount || 0), 0);
        const bal = fs.reduce((s, x) => s + (x.balanceDue || 0), 0);
        return {
          Farm: farm.name ?? `Farm ${farm.id}`,
          Invoices: fs.length.toLocaleString(),
          Revenue: ownerFmtPkr(rev),
          Paid: ownerFmtPkr(paid),
          "Balance due": ownerFmtPkr(bal),
        };
      });

      const custTotals = new Map<string, number>();
      for (const s of sales) {
        const key = `${s.farmId}:${s.customerId}`;
        custTotals.set(key, (custTotals.get(key) ?? 0) + s.totalAmount);
      }

      const customerRows = db
        .select()
        .from(schema.customers)
        .where(inArray(schema.customers.farmId, farmIds))
        .all();

      const nameByKey = new Map<string, string>();
      for (const c of customerRows) {
        nameByKey.set(`${c.farmId}:${c.id}`, c.name ?? `Customer #${c.id}`);
      }

      const topRows = [...custTotals.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 25)
        .map(([key, amt]) => {
          const [fid] = key.split(":");
          const fname = farms.find((f) => f.id === Number(fid))?.name ?? "";
          return {
            Farm: fname,
            Customer: nameByKey.get(key) ?? key,
            Revenue: ownerFmtPkr(amt),
          };
        });

      const sections: OwnerReportSection[] = [
        {
          title: "Top customers by revenue",
          columns: ["Farm", "Customer", "Revenue"],
          rows: topRows,
        },
      ];

      return { type, startDate, endDate, scopeLabel, summary, columns, rows, sections };
    }

    default:
      throw new Error("Unknown report type");
  }
}
