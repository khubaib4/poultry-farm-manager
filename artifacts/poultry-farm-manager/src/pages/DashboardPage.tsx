import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Building2 } from "lucide-react";

export default function DashboardPage(): React.ReactElement {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 text-primary-foreground"
              >
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
                <path d="M8 12s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-foreground">
              Poultry Farm Manager
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {user?.type === "owner" ? (
                <User className="h-4 w-4" />
              ) : (
                <Building2 className="h-4 w-4" />
              )}
              <span>{user?.name}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
                {user?.type}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Welcome, {user?.name}
          </h2>
          <p className="text-muted-foreground mb-8">
            {user?.type === "owner"
              ? "Manage all your farms from here."
              : "Manage your farm operations."}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: "Flocks",
                description: "Manage your bird batches and inventory",
                count: "--",
              },
              {
                title: "Daily Records",
                description: "Track eggs, mortality, and feed",
                count: "--",
              },
              {
                title: "Expenses",
                description: "Monitor farm spending",
                count: "--",
              },
              {
                title: "Inventory",
                description: "Track feed, medicine, and equipment",
                count: "--",
              },
              {
                title: "Vaccinations",
                description: "Schedule and track vaccinations",
                count: "--",
              },
              {
                title: "Reports",
                description: "View analytics and reports",
                count: "--",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-card border rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground">{card.title}</h3>
                  <span className="text-2xl font-bold text-primary">
                    {card.count}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
