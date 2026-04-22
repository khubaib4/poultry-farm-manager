import {
  FarmModel,
  FlockModel,
  DailyEntryModel,
  SaleModel,
  ExpenseModel,
  CustomerModel,
} from "./models";

export type OwnerReportType = "summary" | "financial" | "production" | "sales";

export interface OwnerReportParams {
  type: OwnerReportType;
  startDate: string;
  endDate: string;
  farmId?: number;
}

export interface OwnerReportSummaryItem {
  label: string;
  value: string;
}

export interface OwnerReportSection {
  title: string;
  columns: string[];
  rows: Record<string, string>[];
}

export interface OwnerReportResult {
  type: OwnerReportType;
  startDate: string;
  endDate: string;
  scopeLabel: string;
  summary: OwnerReportSummaryItem[];
  columns: string[];
  rows: Record<string, string>[];
  sections: OwnerReportSection[];
}

function ownerFmtPkr(n: number): string {
  const v = Math.round(n * 100) / 100;
  return `PKR ${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function eggSum(e: { totalEggs?: number | null }): number {
  return Number(e.totalEggs ?? 0);
}

export async function generateOwnerReportMongo(
  ownerId: number,
  params: OwnerReportParams
): Promise<OwnerReportResult> {
  const { type, startDate, endDate, farmId } = params;

  const farmQuery: Record<string, unknown> = { ownerId, isActive: { $ne: 0 } };
  if (farmId != null) farmQuery.id = farmId;

  const farmsRaw = await FarmModel.find(farmQuery).lean();
  const farmRows = (farmsRaw as { id?: number; name?: string }[])
    .filter((f) => typeof f.id === "number")
    .map((f) => ({ id: f.id as number, name: f.name }));
  const farmIds = farmRows.map((f) => f.id);

  const scopeLabel =
    farmId != null && farmRows.length === 1
      ? String(farmRows[0].name ?? "Farm")
      : farmId != null && farmRows.length === 0
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

  const activeFlocks = await FlockModel.find({
    farmId: { $in: farmIds },
    status: "active",
  }).lean();

  const allFlocks = await FlockModel.find({ farmId: { $in: farmIds } }).lean();
  const activeFlocksAny = activeFlocks as { farmId?: number; currentCount?: number | null }[];
  const allFlocksAny = allFlocks as { id?: number; farmId?: number }[];
  const flockIds = allFlocksAny
    .map((f) => f.id)
    .filter((id: unknown): id is number => typeof id === "number");

  const entries =
    flockIds.length === 0
      ? []
      : await DailyEntryModel.find({
          flockId: { $in: flockIds },
          entryDate: { $gte: startDate, $lte: endDate },
        }).lean();

  const sales = await SaleModel.find({
    farmId: { $in: farmIds },
    saleDate: { $gte: startDate, $lte: endDate },
    isDeleted: { $ne: 1 },
  }).lean();

  const expenses = await ExpenseModel.find({
    farmId: { $in: farmIds },
    expenseDate: { $gte: startDate, $lte: endDate },
  }).lean();

  switch (type) {
    case "summary": {
      const totalBirds = activeFlocksAny.reduce((s, f) => s + Number(f.currentCount ?? 0), 0);
      const totalEggs = entries.reduce((s, e) => s + eggSum(e as { totalEggs?: number | null }), 0);
      const totalDeaths = entries.reduce((s, e) => s + Number((e as { deaths?: number }).deaths ?? 0), 0);
      const totalRevenue = sales.reduce((s, x) => s + Number((x as { totalAmount?: number }).totalAmount ?? 0), 0);
      const totalExpenses = expenses.reduce((s, x) => s + Number((x as { amount?: number }).amount ?? 0), 0);
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
      const rows: Record<string, string>[] = farmRows.map((farm) => {
        const farmActive = activeFlocksAny.filter((f) => f.farmId === farm.id);
        const birds = farmActive.reduce((s, f) => s + Number(f.currentCount ?? 0), 0);
        const ff = allFlocksAny.filter((f) => f.farmId === farm.id).map((f) => f.id as number);
        const farmEntries = entries.filter((e: { flockId?: number }) => ff.includes(e.flockId!));
        const eggs = farmEntries.reduce((s, e) => s + eggSum(e as { totalEggs?: number | null }), 0);
        const deaths = farmEntries.reduce((s, e) => s + Number((e as { deaths?: number }).deaths ?? 0), 0);
        const rev = sales
          .filter((s: { farmId?: number }) => (s as { farmId: number }).farmId === farm.id)
          .reduce((s, x) => s + Number((x as { totalAmount?: number }).totalAmount ?? 0), 0);
        const exp = expenses
          .filter((e: { farmId?: number }) => (e as { farmId: number }).farmId === farm.id)
          .reduce((s, x) => s + Number((x as { amount?: number }).amount ?? 0), 0);
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
      const totalRevenue = sales.reduce((s, x) => s + Number((x as { totalAmount?: number }).totalAmount ?? 0), 0);
      const totalExpenses = expenses.reduce((s, x) => s + Number((x as { amount?: number }).amount ?? 0), 0);
      const profit = totalRevenue - totalExpenses;
      const margin = totalRevenue > 0 ? `${((profit / totalRevenue) * 100).toFixed(1)}%` : "—";

      const summary: OwnerReportSummaryItem[] = [
        { label: "Total revenue", value: ownerFmtPkr(totalRevenue) },
        { label: "Total expenses", value: ownerFmtPkr(totalExpenses) },
        { label: "Net profit", value: ownerFmtPkr(profit) },
        { label: "Margin", value: margin },
      ];

      const columns = ["Farm", "Revenue", "Expenses", "Net profit", "Margin %"];
      const rows: Record<string, string>[] = farmRows.map((farm) => {
        const rev = sales
          .filter((s: { farmId?: number }) => (s as { farmId: number }).farmId === farm.id)
          .reduce((s, x) => s + Number((x as { totalAmount?: number }).totalAmount ?? 0), 0);
        const exp = expenses
          .filter((e: { farmId?: number }) => (e as { farmId: number }).farmId === farm.id)
          .reduce((s, x) => s + Number((x as { amount?: number }).amount ?? 0), 0);
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
        const ex = e as { category?: string; amount?: number };
        const c = String(ex.category ?? "Other");
        catMap.set(c, (catMap.get(c) ?? 0) + Number(ex.amount ?? 0));
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
      const totalEggs = entries.reduce((s, e) => s + eggSum(e as { totalEggs?: number | null }), 0);
      const totalDeaths = entries.reduce((s, e) => s + Number((e as { deaths?: number }).deaths ?? 0), 0);
      const totalFeed = entries.reduce((s, e) => s + Number((e as { feedConsumedKg?: number }).feedConsumedKg ?? 0), 0);
      const totalBirds = activeFlocksAny.reduce((s, f) => s + Number(f.currentCount ?? 0), 0);

      const summary: OwnerReportSummaryItem[] = [
        { label: "Active birds", value: totalBirds.toLocaleString() },
        { label: "Total eggs", value: totalEggs.toLocaleString() },
        { label: "Total deaths", value: totalDeaths.toLocaleString() },
        { label: "Feed used (kg)", value: totalFeed.toLocaleString(undefined, { maximumFractionDigits: 1 }) },
      ];

      const columns = ["Farm", "Eggs", "Deaths", "Feed (kg)"];
      const rows: Record<string, string>[] = farmRows.map((farm) => {
        const ff = allFlocksAny.filter((f) => f.farmId === farm.id).map((f) => f.id as number);
        const fe = entries.filter((e: { flockId?: number }) => ff.includes(e.flockId!));
        const eggs = fe.reduce((s, e) => s + eggSum(e as { totalEggs?: number | null }), 0);
        const deaths = fe.reduce((s, e) => s + Number((e as { deaths?: number }).deaths ?? 0), 0);
        const feed = fe.reduce((s, e) => s + Number((e as { feedConsumedKg?: number }).feedConsumedKg ?? 0), 0);
        return {
          Farm: farm.name ?? `Farm ${farm.id}`,
          Eggs: eggs.toLocaleString(),
          Deaths: deaths.toLocaleString(),
          "Feed (kg)": feed.toLocaleString(undefined, { maximumFractionDigits: 1 }),
        };
      });

      const dayMap = new Map<string, number>();
      for (const e of entries) {
        const d = String((e as { entryDate: string }).entryDate);
        dayMap.set(d, (dayMap.get(d) ?? 0) + eggSum(e as { totalEggs?: number | null }));
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
      const totalRevenue = sales.reduce((s, x) => s + Number((x as { totalAmount?: number }).totalAmount ?? 0), 0);
      const saleCount = sales.length;
      const avg = saleCount > 0 ? totalRevenue / saleCount : 0;

      const summary: OwnerReportSummaryItem[] = [
        { label: "Total revenue", value: ownerFmtPkr(totalRevenue) },
        { label: "Invoices", value: saleCount.toLocaleString() },
        { label: "Average invoice", value: ownerFmtPkr(avg) },
      ];

      const columns = ["Farm", "Invoices", "Revenue", "Paid", "Balance due"];
      const rows: Record<string, string>[] = farmRows.map((farm) => {
        const fs = sales.filter((s: { farmId?: number }) => (s as { farmId: number }).farmId === farm.id);
        const rev = fs.reduce((s, x) => s + Number((x as { totalAmount?: number }).totalAmount ?? 0), 0);
        const paid = fs.reduce((s, x) => s + Number((x as { paidAmount?: number }).paidAmount ?? 0), 0);
        const bal = fs.reduce((s, x) => s + Number((x as { balanceDue?: number }).balanceDue ?? 0), 0);
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
        const sale = s as { farmId: number; customerId: number; totalAmount?: number };
        const key = `${sale.farmId}:${sale.customerId}`;
        custTotals.set(key, (custTotals.get(key) ?? 0) + Number(sale.totalAmount ?? 0));
      }

      const customerIds = [...new Set(sales.map((s: { customerId?: number }) => (s as { customerId: number }).customerId))];
      const customers =
        customerIds.length === 0
          ? []
          : await CustomerModel.find({
              farmId: { $in: farmIds },
              id: { $in: customerIds },
            }).lean();

      const nameByKey = new Map<string, string>();
      for (const c of customers) {
        const cc = c as { farmId: number; id: number; name?: string };
        nameByKey.set(`${cc.farmId}:${cc.id}`, cc.name ?? `Customer #${cc.id}`);
      }

      const topRows = [...custTotals.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 25)
        .map(([key, amt]) => {
          const [fid] = key.split(":");
          const fname = farmRows.find((f) => f.id === Number(fid))?.name ?? "";
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
