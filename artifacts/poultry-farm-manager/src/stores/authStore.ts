import { create } from "zustand";
import type { AuthSession } from "@/types/electron";

interface AuthState {
  user: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (session: AuthSession) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: (session) => {
    set({ user: session, isAuthenticated: true, error: null });
  },

  logout: async () => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.auth.logout();
      }
    } catch {
      // ignore logout errors
    }
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.auth.getCurrentUser();
        if (result.success && result.data) {
          set({ user: result.data, isAuthenticated: true, isLoading: false });
          return;
        }
      }
    } catch {
      // ignore
    }
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
