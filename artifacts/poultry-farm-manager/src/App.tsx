import React from "react";

export default function App(): React.ReactElement {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6 p-8">
        <div className="flex items-center justify-center w-20 h-20 bg-primary rounded-2xl mx-auto">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-10 h-10 text-primary-foreground"
          >
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
            <path d="M8 12s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Poultry Farm Manager
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Your complete poultry farm management solution
          </p>
        </div>
        <div className="bg-card border rounded-xl p-6 max-w-md mx-auto text-left space-y-3">
          <h2 className="font-semibold text-foreground">Getting Started</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
              Track your flock and bird inventory
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
              Monitor egg production and health records
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
              Manage feed schedules and expenses
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
              Generate reports and analytics
            </li>
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">
          Welcome to Poultry Farm Manager — powered by Electron + React
        </p>
      </div>
    </div>
  );
}
