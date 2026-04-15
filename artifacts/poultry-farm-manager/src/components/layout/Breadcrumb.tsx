import React from "react";
import { useLocation, useNavigate, useMatch } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronRight, Home } from "lucide-react";

const segmentLabels: Record<string, string> = {
  dashboard: "Dashboard",
  farms: "All Farms",
  reports: "Reports",
  settings: "Settings",
  "daily-entry": "Daily Entry",
  flocks: "Flocks",
  inventory: "Inventory",
  vaccinations: "Vaccinations",
  expenses: "Expenses",
  customers: "Customers",
  sales: "Sales",
  payments: "Payments",
  receivables: "Receivables",
  revenue: "Revenue",
  finances: "Finances",
  alerts: "Alerts",
  backup: "Backup",
  history: "History",
  new: "New",
  edit: "Edit",
  template: "Template",
};

export default function Breadcrumb(): React.ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const pathname = location.pathname;
  const ownerFarmMatch = useMatch("/owner/farms/:farmId/*");
  const dashboardPath = user?.type === "owner" ? "/owner/dashboard" : "/farm/dashboard";

  if (ownerFarmMatch?.params.farmId) {
    const farmId = ownerFarmMatch.params.farmId;
    const base = `/owner/farms/${farmId}`;
    const rest = pathname.startsWith(base) ? pathname.slice(base.length).replace(/^\//, "") : "";
    const restSegs = rest ? rest.split("/").filter(Boolean) : [];
    if (restSegs.length <= 1) return <></>;

    const crumbs = restSegs.map((segment, index) => {
      const path = `${base}/${restSegs.slice(0, index + 1).join("/")}`;
      const label = segmentLabels[segment] || segment;
      const isLast = index === restSegs.length - 1;
      return { label, path, isLast };
    });

    return (
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-4">
        <button
          type="button"
          onClick={() => navigate(dashboardPath)}
          className="hover:text-slate-700 transition-colors"
        >
          <Home className="h-3.5 w-3.5" />
        </button>
        {crumbs.map((crumb) => (
          <React.Fragment key={crumb.path}>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            {crumb.isLast ? (
              <span className="font-medium text-slate-700">{crumb.label}</span>
            ) : (
              <button
                type="button"
                onClick={() => navigate(crumb.path)}
                className="hover:text-slate-700 transition-colors"
              >
                {crumb.label}
              </button>
            )}
          </React.Fragment>
        ))}
      </nav>
    );
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2) return <></>;

  const pageSegments = segments.slice(1);
  const crumbs = pageSegments.map((segment, index) => {
    const path = "/" + segments.slice(0, index + 2).join("/");
    const label = segmentLabels[segment] || segment;
    const isLast = index === pageSegments.length - 1;
    return { label, path, isLast };
  });

  if (crumbs.length <= 1) return <></>;

  return (
    <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-4">
      <button
        type="button"
        onClick={() => navigate(dashboardPath)}
        className="hover:text-slate-700 transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
      </button>
      {crumbs.map((crumb) => (
        <React.Fragment key={crumb.path}>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          {crumb.isLast ? (
            <span className="font-medium text-slate-700">{crumb.label}</span>
          ) : (
            <button
              type="button"
              onClick={() => navigate(crumb.path)}
              className="hover:text-slate-700 transition-colors"
            >
              {crumb.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
