import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAlerts } from "@/hooks/useAlerts";
import { LogOut, User, Building2, ChevronDown, Menu } from "lucide-react";
import AlertsDropdown from "@/components/alerts/AlertsDropdown";

const routeTitles: Record<string, string> = {
  "/owner/dashboard": "Dashboard",
  "/owner/farms": "All Farms",
  "/owner/compare": "Compare Farms",
  "/owner/reports": "Reports",
  "/owner/backup": "Backup & Restore",
  "/owner/settings": "Settings",
  "/farm/dashboard": "Dashboard",
  "/farm/daily-entry": "Daily Entry",
  "/farm/daily-entry/history": "Entry History",
  "/farm/flocks": "Flocks",
  "/farm/flocks/new": "Add Flock",
  "/farm/inventory": "Inventory",
  "/farm/inventory/new": "Add Inventory Item",
  "/farm/vaccinations": "Vaccination Management",
  "/farm/vaccinations/template": "Vaccination Schedule Template",
  "/farm/vaccinations/history": "Vaccination History",
  "/farm/expenses": "Expenses",
  "/farm/expenses/new": "Add Expense",
  "/farm/revenue": "Revenue",
  "/farm/finances": "Financial Overview",
  "/farm/finances/report": "P&L Report",
  "/farm/alerts": "Alerts & Notifications",
  "/farm/pricing": "Egg Pricing",
  "/farm/reports": "Reports",
  "/farm/backup": "Backup & Restore",
  "/farm/settings": "Settings",
};

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export default function Header({ onMenuClick, showMenuButton }: HeaderProps): React.ReactElement {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { alerts, activeCount, criticalCount, dismiss } = useAlerts();

  let pageTitle = routeTitles[location.pathname] || "";
  if (!pageTitle) {
    if (location.pathname.match(/\/farm\/inventory\/\d+\/edit/)) pageTitle = "Edit Inventory Item";
    else if (location.pathname.match(/\/farm\/expenses\/\d+\/edit/)) pageTitle = "Edit Expense";
    else if (location.pathname.match(/\/farm\/flocks\/\d+\/edit/)) pageTitle = "Edit Flock";
    else if (location.pathname.match(/\/farm\/flocks\/\d+\/vaccinations/)) pageTitle = "Flock Vaccinations";
    else if (location.pathname.match(/\/farm\/flocks\/\d+/)) pageTitle = "Flock Details";
    else pageTitle = "Dashboard";
  }

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const isFarmUser = user?.type === "farm" || user?.type === "user";

  return (
    <header className="flex h-[60px] items-center justify-between border-b bg-white px-4 sm:px-6 no-print">
      <div className="flex items-center gap-3">
        {showMenuButton && (
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-lg font-semibold text-gray-900 truncate">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {isFarmUser && (
          <AlertsDropdown
            alerts={alerts}
            activeCount={activeCount}
            criticalCount={criticalCount}
            onDismiss={dismiss}
          />
        )}

        <div className="hidden sm:block h-6 w-px bg-gray-200" />

        <div className="hidden sm:flex items-center gap-2 text-sm">
          {user?.type === "owner" ? (
            <User className="h-4 w-4 text-gray-400" />
          ) : (
            <Building2 className="h-4 w-4 text-gray-400" />
          )}
          <span className="font-medium text-gray-700 max-w-[120px] truncate">{user?.name}</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 capitalize">
            {user?.type}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 sm:px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          aria-label="Logout"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
