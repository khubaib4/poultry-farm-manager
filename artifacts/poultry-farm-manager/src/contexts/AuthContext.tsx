import React, { createContext, useContext, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import type { AuthSession } from "@/types/electron";

interface AuthContextValue {
  user: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (session: AuthSession) => void;
  logout: () => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const store = useAuthStore();

  useEffect(() => {
    store.checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: store.user,
        isAuthenticated: store.isAuthenticated,
        isLoading: store.isLoading,
        error: store.error,
        login: store.login,
        logout: store.logout,
        setError: store.setError,
        clearError: store.clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
