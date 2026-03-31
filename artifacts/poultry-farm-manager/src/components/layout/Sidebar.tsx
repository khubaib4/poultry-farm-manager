import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAlerts } from "@/hooks/useAlerts";
import { useVaccinations } from "@/hooks/useVaccinations";
import { payments as paymentsApi, isElectron } from "@/lib/api";
import {
  LayoutDashboard,
  Building2,
  BarChart3,
  Settings,
  PlusCircle,
  Bird,
  Package,
  Syringe,
  Receipt,
  TrendingUp,
  DollarSign,
  Tag,
  Bell,
  PanelLeftClose,
  PanelLeft,
  HardDrive,
  Users,
  ShoppingCart,
} from "lucide-react";
import AlertBadge from "@/components/alerts/AlertBadge";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badgeKey?: string;
}

const ownerNavItems: NavItem[] = [
  { label: "Dashboard", path: "/owner/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "All Farms", path: "/owner/farms", icon: <Building2 className="h-5 w-5" /> },
  { label: "Compare Farms", path: "/owner/compare", icon: <BarChart3 className="h-5 w-5" /> },
  { label: "Reports", path: "/owner/reports", icon: <Receipt className="h-5 w-5" /> },
  { label: "Backup", path: "/owner/backup", icon: <HardDrive className="h-5 w-5" /> },
  { label: "Settings", path: "/owner/settings", icon: <Settings className="h-5 w-5" /> },
];

const farmNavItems: NavItem[] = [
  { label: "Dashboard", path: "/farm/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "Daily Entry", path: "/farm/daily-entry", icon: <PlusCircle className="h-5 w-5" /> },
  { label: "Flocks", path: "/farm/flocks", icon: <Bird className="h-5 w-5" /> },
  { label: "Inventory", path: "/farm/inventory", icon: <Package className="h-5 w-5" />, badgeKey: "inventory" },
  { label: "Vaccinations", path: "/farm/vaccinations", icon: <Syringe className="h-5 w-5" />, badgeKey: "vaccinations" },
  { label: "Customers", path: "/farm/customers", icon: <Users className="h-5 w-5" /> },
  { label: "Sales", path: "/farm/sales", icon: <ShoppingCart className="h-5 w-5" /> },
  { label: "Payments", path: "/farm/payments", icon: <DollarSign className="h-5 w-5" /> },
  { label: "Receivables", path: "/farm/receivables", icon: <TrendingUp className="h-5 w-5" />, badgeKey: "receivables" },
  { label: "Expenses", path: "/farm/expenses", icon: <Receipt className="h-5 w-5" /> },
  { label: "Revenue", path: "/farm/revenue", icon: <TrendingUp className="h-5 w-5" /> },
  { label: "Finances", path: "/farm/finances", icon: <DollarSign className="h-5 w-5" /> },
  { label: "Pricing", path: "/farm/pricing", icon: <Tag className="h-5 w-5" /> },
  { label: "Alerts", path: "/farm/alerts", icon: <Bell className="h-5 w-5" />, badgeKey: "alerts" },
  { label: "Reports", path: "/farm/reports", icon: <BarChart3 className="h-5 w-5" /> },
  { label: "Backup", path: "/farm/backup", icon: <HardDrive className="h-5 w-5" /> },
  { label: "Settings", path: "/farm/settings", icon: <Settings className="h-5 w-5" /> },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}

export default function Sidebar({ collapsed, onToggle, onNavigate }: SidebarProps): React.ReactElement {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { lowStock, activeCount, criticalCount } = useAlerts();
  const { overdue } = useVaccinations();
  const [overdueReceivablesCount, setOverdueReceivablesCount] = useState(0);

  const farmId = user?.farmId ?? null;
  useEffect(() => {
    if (!isElectron() || !farmId || user?.type === "owner") return;
    paymentsApi.getSummary(farmId).then(s => setOverdueReceivablesCount(s.overdueCount)).catch(() => {});
  }, [farmId, user?.type, location.pathname]);

  const navItems = user?.type === "owner" ? ownerNavItems : farmNavItems;

  const lowStockActiveCount = lowStock.filter(a => !a.isDismissed).length;
  const overdueVaccCount = overdue.length;

  function getBadge(item: NavItem): React.ReactNode {
    if (!item.badgeKey) return null;
    if (item.badgeKey === "inventory" && lowStockActiveCount > 0) {
      return <AlertBadge count={lowStockActiveCount} />;
    }
    if (item.badgeKey === "alerts" && activeCount > 0) {
      return <AlertBadge count={activeCount} hasCritical={criticalCount > 0} />;
    }
    if (item.badgeKey === "vaccinations" && overdueVaccCount > 0) {
      return <AlertBadge count={overdueVaccCount} hasCritical />;
    }
    if (item.badgeKey === "receivables" && overdueReceivablesCount > 0) {
      return <AlertBadge count={overdueReceivablesCount} hasCritical />;
    }
    return null;
  }

  return (
    <aside
      className={`flex flex-col bg-slate-900 text-white transition-all duration-300 ${
        collapsed ? "w-[60px]" : "w-[240px]"
      }`}
    >
      <div className="flex h-[60px] items-center gap-3 px-3 border-b border-slate-700">
        <div className="flex items-center justify-center w-9 h-9 bg-primary rounded-lg shrink-0">
          <Bird className="h-5 w-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold whitespace-nowrap overflow-hidden">
            Poultry Farm
          </span>
        )}
      </div>

      <nav className="flex-1 py-3 space-y-1 px-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
          const badge = getBadge(item);
          return (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); onNavigate?.(); }}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <span className="shrink-0 relative">
                {item.icon}
                {collapsed && badge && (
                  <span className="absolute -top-1.5 -right-1.5">{badge}</span>
                )}
              </span>
              {!collapsed && (
                <>
                  <span className="truncate flex-1">{item.label}</span>
                  {badge}
                </>
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-slate-700 p-2">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
      </div>
    </aside>
  );
}
