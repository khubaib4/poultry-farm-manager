import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User, Building2, Bell, ChevronDown } from "lucide-react";

const routeTitles: Record<string, string> = {
  "/owner/dashboard": "Dashboard",
  "/owner/farms": "All Farms",
  "/owner/reports": "Reports",
  "/owner/settings": "Settings",
  "/farm/dashboard": "Dashboard",
  "/farm/daily-entry": "Daily Entry",
  "/farm/flocks": "Flocks",
  "/farm/inventory": "Inventory",
  "/farm/vaccinations": "Vaccinations",
  "/farm/expenses": "Expenses",
  "/farm/expenses/new": "Add Expense",
  "/farm/revenue": "Revenue",
  "/farm/reports": "Reports",
  "/farm/settings": "Settings",
};

export default function Header(): React.ReactElement {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const pageTitle = routeTitles[location.pathname] || "Dashboard";

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="flex h-[60px] items-center justify-between border-b bg-white px-6">
      <h1 className="text-lg font-semibold text-slate-900">{pageTitle}</h1>

      <div className="flex items-center gap-3">
        {user?.type === "owner" && (
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            <Building2 className="h-4 w-4 text-slate-400" />
            <span>Select Farm</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
        )}

        <button className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
          <Bell className="h-5 w-5" />
        </button>

        <div className="h-6 w-px bg-slate-200" />

        <div className="flex items-center gap-2 text-sm">
          {user?.type === "owner" ? (
            <User className="h-4 w-4 text-slate-400" />
          ) : (
            <Building2 className="h-4 w-4 text-slate-400" />
          )}
          <span className="font-medium text-slate-700">{user?.name}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 capitalize">
            {user?.type}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
