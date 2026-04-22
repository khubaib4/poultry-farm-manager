import React, { lazy, Suspense, useEffect } from "react";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/ui/Toast";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import "@/styles/print.css";

const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterOwnerPage = lazy(() => import("@/pages/RegisterOwnerPage"));
const OwnerDashboardPage = lazy(() => import("@/pages/owner/OwnerDashboardPage"));
const FarmComparisonPage = lazy(() => import("@/pages/owner/FarmComparisonPage"));
const FarmDashboard = lazy(() => import("@/pages/FarmDashboard"));
const AddFarmPage = lazy(() => import("@/pages/owner/AddFarmPage"));
const FarmsListPage = lazy(() => import("@/pages/owner/FarmsListPage"));
const OwnerFarmViewShell = lazy(() => import("@/pages/owner/OwnerFarmViewShell"));
const FlocksPage = lazy(() => import("@/pages/farm/FlocksPage"));
const AddFlockPage = lazy(() => import("@/pages/farm/AddFlockPage"));
const FlockDetailPage = lazy(() => import("@/pages/farm/FlockDetailPage"));
const EditFlockPage = lazy(() => import("@/pages/farm/EditFlockPage"));
const DailyEntryPage = lazy(() => import("@/pages/farm/DailyEntryPage"));
const DailyEntryHistoryPage = lazy(() => import("@/pages/farm/DailyEntryHistoryPage"));
const ExpensesPage = lazy(() => import("@/pages/farm/ExpensesPage"));
const AddExpensePage = lazy(() => import("@/pages/farm/AddExpensePage"));
const EditExpensePage = lazy(() => import("@/pages/farm/EditExpensePage"));
const RevenuePage = lazy(() => import("@/pages/farm/RevenuePage"));
const FinancialDashboard = lazy(() => import("@/pages/farm/FinancialDashboard"));
const ProfitLossReport = lazy(() => import("@/pages/farm/ProfitLossReport"));
const InventoryPage = lazy(() => import("@/pages/farm/InventoryPage"));
const AddInventoryItemPage = lazy(() => import("@/pages/farm/AddInventoryItemPage"));
const EditInventoryItemPage = lazy(() => import("@/pages/farm/EditInventoryItemPage"));
const AlertsPage = lazy(() => import("@/pages/farm/AlertsPage"));
const VaccineSettingsPage = lazy(() => import("@/pages/farm/VaccineSettingsPage"));
const EggCategoriesSettings = lazy(() => import("@/pages/settings/EggCategoriesSettings"));
const VaccinationSchedulePage = lazy(() => import("@/pages/farm/VaccinationSchedulePage"));
const VaccinationTemplatePage = lazy(() => import("@/pages/farm/VaccinationTemplatePage"));
const VaccinationHistoryPage = lazy(() => import("@/pages/farm/VaccinationHistoryPage"));
const FlockVaccinationPage = lazy(() => import("@/pages/farm/FlockVaccinationPage"));
const AddVaccinationPage = lazy(() => import("@/pages/farm/AddVaccinationPage"));
const EditVaccinationPage = lazy(() => import("@/pages/farm/EditVaccinationPage"));
const ReportsPage = lazy(() => import("@/pages/farm/ReportsPage"));
const SalesReportPage = lazy(() => import("@/pages/farm/SalesReportPage"));
const BackupRestorePage = lazy(() => import("@/pages/BackupRestorePage"));
const SettingsPage = lazy(() => import("@/pages/settings/SettingsPage"));
const CustomersPage = lazy(() => import("@/pages/farm/CustomersPage"));
const AddCustomerPage = lazy(() => import("@/pages/farm/AddCustomerPage"));
const EditCustomerPage = lazy(() => import("@/pages/farm/EditCustomerPage"));
const CustomerDetailPage = lazy(() => import("@/pages/farm/CustomerDetailPage"));
const SalesPage = lazy(() => import("@/pages/farm/SalesPage"));
const NewSalePage = lazy(() => import("@/pages/farm/NewSalePage"));
const SaleDetailPage = lazy(() => import("@/pages/farm/SaleDetailPage"));
const EditSalePage = lazy(() => import("@/pages/farm/EditSalePage"));
const PaymentsPage = lazy(() => import("@/pages/farm/PaymentsPage"));
const ReceivablesPage = lazy(() => import("@/pages/farm/ReceivablesPage"));
const PlaceholderPage = lazy(() => import("@/pages/PlaceholderPage"));
const OwnerReportsPage = lazy(() => import("@/pages/owner/OwnerReportsPage"));
const SyncSettingsPage = lazy(() => import("@/pages/SyncSettingsPage"));

function PageLoader(): React.ReactElement {
  return <LoadingSpinner size="lg" text="Loading..." />;
}

function AuthRedirect(): React.ReactElement {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner size="lg" text="Checking authentication..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.type === "owner") return <Navigate to="/owner/dashboard" replace />;
  return <Navigate to="/farm/dashboard" replace />;
}

function OwnerLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <ProtectedRoute allowedRoles={["owner"]}>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

function FarmLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <ProtectedRoute allowedRoles={["farm", "user"]}>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

export default function App(): React.ReactElement {
  useEffect(() => {
    const preventNumberScroll = (e: WheelEvent) => {
      const target = e.target as unknown;
      if (!(target instanceof HTMLInputElement)) return;
      if (target.type !== "number") return;
      if (document.activeElement !== target) return;

      e.preventDefault();
      target.blur();
    };

    document.addEventListener("wheel", preventNumberScroll, { passive: false });
    return () => document.removeEventListener("wheel", preventNumberScroll);
  }, []);

  return (
    <ErrorBoundary>
      <HashRouter>
        <AuthProvider>
          <SettingsProvider>
            <ToastProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterOwnerPage />} />

                <Route path="/owner/dashboard" element={<OwnerLayout><OwnerDashboardPage /></OwnerLayout>} />
                <Route path="/owner/farms" element={<OwnerLayout><FarmsListPage /></OwnerLayout>} />
                <Route
                  path="/owner/farms/:farmId"
                  element={<OwnerLayout><OwnerFarmViewShell /></OwnerLayout>}
                >
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<FarmDashboard />} />
                  <Route path="daily-entry" element={<DailyEntryPage />} />
                  <Route path="daily-entry/history" element={<DailyEntryHistoryPage />} />
                  <Route path="flocks" element={<FlocksPage />} />
                  <Route path="flocks/new" element={<AddFlockPage />} />
                  <Route path="flocks/:flockId" element={<FlockDetailPage />} />
                  <Route path="flocks/:flockId/edit" element={<EditFlockPage />} />
                  <Route path="inventory" element={<InventoryPage />} />
                  <Route path="inventory/new" element={<AddInventoryItemPage />} />
                  <Route path="inventory/:itemId/edit" element={<EditInventoryItemPage />} />
                  <Route path="vaccinations" element={<VaccinationSchedulePage />} />
                  <Route path="vaccinations/new" element={<AddVaccinationPage />} />
                  <Route path="settings/vaccines" element={<VaccineSettingsPage />} />
                  <Route path="settings/egg-categories" element={<EggCategoriesSettings />} />
                  <Route path="vaccinations/template" element={<VaccinationTemplatePage />} />
                  <Route path="vaccinations/history" element={<VaccinationHistoryPage />} />
                  <Route path="vaccinations/:vaccinationId/edit" element={<EditVaccinationPage />} />
                  <Route path="flocks/:flockId/vaccinations" element={<FlockVaccinationPage />} />
                  <Route path="customers" element={<CustomersPage />} />
                  <Route path="customers/new" element={<AddCustomerPage />} />
                  <Route path="customers/:customerId" element={<CustomerDetailPage />} />
                  <Route path="customers/:customerId/edit" element={<EditCustomerPage />} />
                  <Route path="sales" element={<SalesPage />} />
                  <Route path="sales/new" element={<NewSalePage />} />
                  <Route path="sales/:id" element={<SaleDetailPage />} />
                  <Route path="sales/:id/edit" element={<EditSalePage />} />
                  <Route path="payments" element={<PaymentsPage />} />
                  <Route path="receivables" element={<ReceivablesPage />} />
                  <Route path="expenses" element={<ExpensesPage />} />
                  <Route path="expenses/new" element={<AddExpensePage />} />
                  <Route path="expenses/:expenseId/edit" element={<EditExpensePage />} />
                  <Route path="revenue" element={<RevenuePage />} />
                  <Route path="finances" element={<FinancialDashboard />} />
                  <Route path="finances/report" element={<ProfitLossReport />} />
                  <Route path="alerts" element={<AlertsPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="reports/sales" element={<SalesReportPage />} />
                  <Route path="backup" element={<BackupRestorePage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
                <Route path="/owner/add-farm" element={<OwnerLayout><AddFarmPage /></OwnerLayout>} />
                <Route path="/owner/compare" element={<OwnerLayout><FarmComparisonPage /></OwnerLayout>} />
                <Route path="/owner/reports" element={<OwnerLayout><OwnerReportsPage /></OwnerLayout>} />
                <Route path="/owner/backup" element={<OwnerLayout><BackupRestorePage /></OwnerLayout>} />
                <Route path="/owner/settings" element={<OwnerLayout><SettingsPage /></OwnerLayout>} />
                <Route path="/sync-settings" element={<OwnerLayout><SyncSettingsPage /></OwnerLayout>} />

                <Route path="/farm/dashboard" element={<FarmLayout><FarmDashboard /></FarmLayout>} />
                <Route path="/farm/daily-entry" element={<FarmLayout><DailyEntryPage /></FarmLayout>} />
                <Route path="/farm/daily-entry/history" element={<FarmLayout><DailyEntryHistoryPage /></FarmLayout>} />
                <Route path="/farm/flocks" element={<FarmLayout><FlocksPage /></FarmLayout>} />
                <Route path="/farm/flocks/new" element={<FarmLayout><AddFlockPage /></FarmLayout>} />
                <Route path="/farm/flocks/:flockId" element={<FarmLayout><FlockDetailPage /></FarmLayout>} />
                <Route path="/farm/flocks/:flockId/edit" element={<FarmLayout><EditFlockPage /></FarmLayout>} />
                <Route path="/farm/inventory" element={<FarmLayout><InventoryPage /></FarmLayout>} />
                <Route path="/farm/inventory/new" element={<FarmLayout><AddInventoryItemPage /></FarmLayout>} />
                <Route path="/farm/inventory/:itemId/edit" element={<FarmLayout><EditInventoryItemPage /></FarmLayout>} />
                <Route path="/farm/vaccinations" element={<FarmLayout><VaccinationSchedulePage /></FarmLayout>} />
                <Route path="/farm/vaccinations/new" element={<FarmLayout><AddVaccinationPage /></FarmLayout>} />
                <Route path="/farm/settings/vaccines" element={<FarmLayout><VaccineSettingsPage /></FarmLayout>} />
                <Route path="/farm/settings/egg-categories" element={<FarmLayout><EggCategoriesSettings /></FarmLayout>} />
                <Route path="/farm/vaccinations/template" element={<FarmLayout><VaccinationTemplatePage /></FarmLayout>} />
                <Route path="/farm/vaccinations/history" element={<FarmLayout><VaccinationHistoryPage /></FarmLayout>} />
                <Route path="/farm/vaccinations/:vaccinationId/edit" element={<FarmLayout><EditVaccinationPage /></FarmLayout>} />
                <Route path="/farm/flocks/:flockId/vaccinations" element={<FarmLayout><FlockVaccinationPage /></FarmLayout>} />
                <Route path="/farm/customers" element={<FarmLayout><CustomersPage /></FarmLayout>} />
                <Route path="/farm/customers/new" element={<FarmLayout><AddCustomerPage /></FarmLayout>} />
                <Route path="/farm/customers/:customerId" element={<FarmLayout><CustomerDetailPage /></FarmLayout>} />
                <Route path="/farm/customers/:customerId/edit" element={<FarmLayout><EditCustomerPage /></FarmLayout>} />
                <Route path="/farm/sales" element={<FarmLayout><SalesPage /></FarmLayout>} />
                <Route path="/farm/sales/new" element={<FarmLayout><NewSalePage /></FarmLayout>} />
                <Route path="/farm/sales/:id" element={<FarmLayout><SaleDetailPage /></FarmLayout>} />
                <Route path="/farm/sales/:id/edit" element={<FarmLayout><EditSalePage /></FarmLayout>} />
                <Route path="/farm/payments" element={<FarmLayout><PaymentsPage /></FarmLayout>} />
                <Route path="/farm/receivables" element={<FarmLayout><ReceivablesPage /></FarmLayout>} />
                <Route path="/farm/expenses" element={<FarmLayout><ExpensesPage /></FarmLayout>} />
                <Route path="/farm/expenses/new" element={<FarmLayout><AddExpensePage /></FarmLayout>} />
                <Route path="/farm/expenses/:expenseId/edit" element={<FarmLayout><EditExpensePage /></FarmLayout>} />
                <Route path="/farm/revenue" element={<FarmLayout><RevenuePage /></FarmLayout>} />
                <Route path="/farm/finances" element={<FarmLayout><FinancialDashboard /></FarmLayout>} />
                <Route path="/farm/finances/report" element={<FarmLayout><ProfitLossReport /></FarmLayout>} />
                <Route path="/farm/alerts" element={<FarmLayout><AlertsPage /></FarmLayout>} />
                <Route path="/farm/reports" element={<FarmLayout><ReportsPage /></FarmLayout>} />
                <Route path="/farm/reports/sales" element={<FarmLayout><SalesReportPage /></FarmLayout>} />
                <Route path="/farm/backup" element={<FarmLayout><BackupRestorePage /></FarmLayout>} />
                <Route path="/farm/settings" element={<FarmLayout><SettingsPage /></FarmLayout>} />

                <Route path="/dashboard" element={<AuthRedirect />} />
                <Route path="/" element={<AuthRedirect />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Suspense>
            </ToastProvider>
          </SettingsProvider>
        </AuthProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}
