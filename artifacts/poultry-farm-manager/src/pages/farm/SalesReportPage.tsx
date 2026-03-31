import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isElectron, customers as customersApi } from "@/lib/api";
import { useSalesReports } from "@/hooks/useSalesReports";
import { useToast } from "@/components/ui/Toast";
import {
  BarChart3, Calendar, Download, FileSpreadsheet, FileText,
  Users, TrendingUp, Trophy, Search,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import SalesSummaryReport from "@/components/reports/SalesSummaryReport";
import CustomerSalesReport from "@/components/reports/CustomerSalesReport";
import TopCustomersReport from "@/components/reports/TopCustomersReport";
import {
  generateSalesSummaryPDF,
  generateCustomerReportPDF,
  generateTopCustomersPDF,
} from "@/lib/salesReportPdf";
import {
  exportSalesSummaryExcel,
  exportCustomerHistoryExcel,
  exportTopCustomersExcel,
} from "@/lib/salesReportExcel";
import type { Customer } from "@/types/electron";

type ReportType = "daily" | "weekly" | "monthly" | "customer" | "top_customers";

const REPORT_TYPES: { id: ReportType; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "daily", label: "Daily Sales", icon: <Calendar className="h-5 w-5" />, desc: "Day-by-day breakdown" },
  { id: "weekly", label: "Weekly Sales", icon: <BarChart3 className="h-5 w-5" />, desc: "Week-by-week analysis" },
  { id: "monthly", label: "Monthly Sales", icon: <TrendingUp className="h-5 w-5" />, desc: "Monthly overview" },
  { id: "customer", label: "Customer Report", icon: <Users className="h-5 w-5" />, desc: "Customer purchase history" },
  { id: "top_customers", label: "Top Customers", icon: <Trophy className="h-5 w-5" />, desc: "Customer rankings" },
];

function getDefaultDateRange(type: ReportType): { start: string; end: string } {
  const today = new Date();
  const end = today.toISOString().split("T")[0];
  if (type === "daily") {
    const start = new Date(today);
    start.setDate(start.getDate() - 30);
    return { start: start.toISOString().split("T")[0], end };
  }
  if (type === "weekly") {
    const start = new Date(today);
    start.setDate(start.getDate() - 90);
    return { start: start.toISOString().split("T")[0], end };
  }
  const start = new Date(today.getFullYear(), 0, 1);
  return { start: start.toISOString().split("T")[0], end };
}

export default function SalesReportPage(): React.ReactElement {
  const { user } = useAuth();
  const { showToast } = useToast();
  const farmId = user?.farmId ?? null;

  const [reportType, setReportType] = useState<ReportType>("daily");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [topLimit, setTopLimit] = useState(10);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [generated, setGenerated] = useState(false);

  const {
    summary, customerHistory, topCustomers, trendData, gradeBreakdown,
    isLoading, error,
    generateSummary, generateCustomerHistory, generateTopCustomers,
  } = useSalesReports();

  useEffect(() => {
    const range = getDefaultDateRange(reportType);
    setStartDate(range.start);
    setEndDate(range.end);
    setGenerated(false);
  }, [reportType]);

  useEffect(() => {
    if (!isElectron() || !farmId) return;
    customersApi.getByFarm(farmId).then(setCustomers).catch(() => {});
  }, [farmId]);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.businessName || "").toLowerCase().includes(customerSearch.toLowerCase())
  );

  async function handleGenerate() {
    if (!farmId || !startDate || !endDate) return;
    if (startDate > endDate) {
      showToast("Start date must be before end date", "error");
      return;
    }
    if (reportType === "customer") {
      if (!selectedCustomerId) {
        showToast("Please select a customer", "error");
        return;
      }
      await generateCustomerHistory(selectedCustomerId, startDate, endDate);
    } else if (reportType === "top_customers") {
      await generateTopCustomers(farmId, topLimit, startDate, endDate);
    } else {
      const period = reportType === "daily" ? "daily" : reportType === "weekly" ? "weekly" : "monthly";
      await generateSummary(farmId, startDate, endDate, period);
    }
    setGenerated(true);
  }

  function handleExportPdf() {
    try {
      if (reportType === "customer" && customerHistory) {
        const doc = generateCustomerReportPDF(customerHistory);
        doc.save(`Customer_Report_${customerHistory.customer.name.replace(/\s+/g, "_")}.pdf`);
      } else if (reportType === "top_customers" && topCustomers.length > 0) {
        const doc = generateTopCustomersPDF(topCustomers, { start: startDate, end: endDate });
        doc.save(`Top_Customers_${startDate}_${endDate}.pdf`);
      } else if (summary) {
        const doc = generateSalesSummaryPDF(summary, { start: startDate, end: endDate });
        doc.save(`Sales_Summary_${startDate}_${endDate}.pdf`);
      }
      showToast("PDF downloaded successfully", "success");
    } catch {
      showToast("Failed to generate PDF", "error");
    }
  }

  function handleExportExcel() {
    try {
      if (reportType === "customer" && customerHistory) {
        exportCustomerHistoryExcel(customerHistory);
      } else if (reportType === "top_customers" && topCustomers.length > 0) {
        exportTopCustomersExcel(topCustomers, { start: startDate, end: endDate });
      } else if (summary) {
        exportSalesSummaryExcel(summary, { start: startDate, end: endDate });
      }
      showToast("Excel downloaded successfully", "success");
    } catch {
      showToast("Failed to generate Excel", "error");
    }
  }

  if (!isElectron()) {
    return <div className="p-6 text-center text-gray-500">This feature is only available in the desktop app.</div>;
  }

  const hasData = summary || customerHistory || topCustomers.length > 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        icon={<BarChart3 className="h-7 w-7 text-green-600" />}
        title="Sales Report"
        subtitle="Generate and export comprehensive sales reports"
        actions={
          generated && hasData ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPdf}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <FileText className="h-4 w-4" />
                Export PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export Excel
              </button>
            </div>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
        {REPORT_TYPES.map(rt => (
          <button
            key={rt.id}
            onClick={() => setReportType(rt.id)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              reportType === rt.id
                ? "border-green-500 bg-green-50 text-green-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            {rt.icon}
            <span className="text-sm font-medium">{rt.label}</span>
            <span className="text-xs text-center opacity-70">{rt.desc}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {reportType === "customer" && (
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={e => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="Search customer..."
                  className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              {showCustomerDropdown && filteredCustomers.length > 0 && (
                <div className="absolute z-20 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredCustomers.slice(0, 20).map(c => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCustomerId(c.id);
                        setCustomerSearch(c.name);
                        setShowCustomerDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-green-50 ${selectedCustomerId === c.id ? "bg-green-50 text-green-700" : "text-gray-700"}`}
                    >
                      <p className="font-medium">{c.name}</p>
                      {c.businessName && <p className="text-xs text-gray-500">{c.businessName}</p>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {reportType === "top_customers" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Show Top</label>
              <select
                value={topLimit}
                onChange={e => setTopLimit(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value={10}>Top 10</option>
                <option value={20}>Top 20</option>
                <option value={50}>Top 50</option>
                <option value={1000}>All</option>
              </select>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                Generating...
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4" />
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-700">
          {error}
        </div>
      )}

      {generated && !isLoading && (
        <div>
          {(reportType === "daily" || reportType === "weekly" || reportType === "monthly") && summary && (
            <SalesSummaryReport
              data={summary}
              trendData={trendData}
              gradeData={gradeBreakdown}
              period={reportType === "daily" ? "daily" : reportType === "weekly" ? "weekly" : "monthly"}
            />
          )}

          {reportType === "customer" && customerHistory && (
            <CustomerSalesReport data={customerHistory} />
          )}

          {reportType === "top_customers" && topCustomers.length > 0 && (
            <TopCustomersReport data={topCustomers} />
          )}

          {!hasData && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
              No data found for the selected period. Try adjusting the date range.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
