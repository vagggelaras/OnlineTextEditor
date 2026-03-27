import { create } from "zustand";
import type { User } from "@/types/user";
import { api } from "@/lib/api";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  login: async (email, password) => {
    set({ error: null });
    try {
      const { user } = await api.post<{ user: User }>("/auth/login", { email, password });
      set({ user, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  register: async (email, password, name) => {
    set({ error: null });
    try {
      const { user } = await api.post<{ user: User }>("/auth/register", { email, password, name });
      set({ user, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      set({ user: null, loading: false });
    }
  },

  checkAuth: async () => {
    set({ loading: true });
    try {
      const { user } = await api.get<{ user: User }>("/auth/me");
      set({ user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
