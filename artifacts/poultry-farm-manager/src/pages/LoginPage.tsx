import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoginForm from "@/components/auth/LoginForm";
import SetupWithCode from "@/components/auth/SetupWithCode";
import { isElectron } from "@/lib/api";
import { QrCode } from "lucide-react";

type LoginMode = "owner" | "farm";

export default function LoginPage(): React.ReactElement {
  const [mode, setMode] = useState<LoginMode>("owner");
  const [showSetup, setShowSetup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (credentials: {
    identifier: string;
    password: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!isElectron()) {
        setError("Authentication is only available in the desktop app");
        setIsLoading(false);
        return;
      }

      let result;
      if (mode === "owner") {
        result = await window.electronAPI.auth.loginOwner(
          credentials.identifier,
          credentials.password
        );
      } else {
        result = await window.electronAPI.auth.loginFarm(
          credentials.identifier,
          credentials.password
        );
      }

      if (result.success && result.data) {
        login(result.data);
        const dest = result.data.type === "owner" ? "/owner/dashboard" : "/farm/dashboard";
        navigate(dest, { replace: true });
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (newMode: LoginMode) => {
    setMode(newMode);
    setError(null);
  };

  if (isElectron() && showSetup) {
    return (
      <SetupWithCode onBack={() => setShowSetup(false)} onSuccess={() => setShowSetup(false)} />
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mx-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8 text-primary-foreground"
            >
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
              <path d="M8 12s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Poultry Farm Manager
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage your farms
          </p>
        </div>

        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <div className="flex rounded-lg bg-muted p-1 mb-6">
            <button
              type="button"
              onClick={() => handleTabChange("owner")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                mode === "owner"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Owner Login
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("farm")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                mode === "farm"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Farm Login
            </button>
          </div>

          <LoginForm
            mode={mode}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
          />

          {isElectron() && (
            <div className="mt-4 text-center border-t pt-4">
              <p className="text-gray-500 text-sm mb-2">First time on this device?</p>
              <button
                type="button"
                onClick={() => setShowSetup(true)}
                className="text-purple-600 hover:text-purple-700 font-medium flex items-center justify-center gap-2 mx-auto"
              >
                <QrCode className="w-4 h-4" />
                Setup with Code
              </button>
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-medium text-primary hover:text-primary/90 underline-offset-4 hover:underline"
            >
              Register as Owner
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
