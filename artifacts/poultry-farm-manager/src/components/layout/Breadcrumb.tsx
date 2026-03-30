import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
};

export default function Breadcrumb(): React.ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const segments = location.pathname.split("/").filter(Boolean);
  if (segments.length < 2) return <></>;

  const dashboardPath = user?.type === "owner" ? "/owner/dashboard" : "/farm/dashboard";

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
