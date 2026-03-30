import React from "react";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import LoginPage from "@/pages/LoginPage";
import RegisterOwnerPage from "@/pages/RegisterOwnerPage";
import OwnerDashboard from "@/pages/OwnerDashboard";
import FarmDashboard from "@/pages/FarmDashboard";
import PlaceholderPage from "@/pages/PlaceholderPage";

function AuthRedirect(): React.ReactElement {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <></>;
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
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterOwnerPage />} />

          <Route path="/owner/dashboard" element={<OwnerLayout><OwnerDashboard /></OwnerLayout>} />
          <Route path="/owner/farms" element={<OwnerLayout><PlaceholderPage title="All Farms" description="Manage all your poultry farms." /></OwnerLayout>} />
          <Route path="/owner/reports" element={<OwnerLayout><PlaceholderPage title="Reports" description="View analytics and reports across all farms." /></OwnerLayout>} />
          <Route path="/owner/settings" element={<OwnerLayout><PlaceholderPage title="Settings" description="Manage your account settings." /></OwnerLayout>} />

          <Route path="/farm/dashboard" element={<FarmLayout><FarmDashboard /></FarmLayout>} />
          <Route path="/farm/daily-entry" element={<FarmLayout><PlaceholderPage title="Daily Entry" description="Record daily egg production, mortality, and feed data." /></FarmLayout>} />
          <Route path="/farm/flocks" element={<FarmLayout><PlaceholderPage title="Flocks" description="Manage your bird batches and flock records." /></FarmLayout>} />
          <Route path="/farm/inventory" element={<FarmLayout><PlaceholderPage title="Inventory" description="Track feed, medicine, and equipment stock." /></FarmLayout>} />
          <Route path="/farm/vaccinations" element={<FarmLayout><PlaceholderPage title="Vaccinations" description="Schedule and track vaccination programs." /></FarmLayout>} />
          <Route path="/farm/expenses" element={<FarmLayout><PlaceholderPage title="Expenses" description="Monitor and categorize farm spending." /></FarmLayout>} />
          <Route path="/farm/reports" element={<FarmLayout><PlaceholderPage title="Reports" description="View farm analytics and performance reports." /></FarmLayout>} />
          <Route path="/farm/settings" element={<FarmLayout><PlaceholderPage title="Settings" description="Manage farm settings and preferences." /></FarmLayout>} />

          <Route path="/dashboard" element={<AuthRedirect />} />
          <Route path="/" element={<AuthRedirect />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}
