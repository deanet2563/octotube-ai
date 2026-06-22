import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import * as authService from "../services/auth";

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initialize: () => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: true,
  initialize: () => {
    authService
      .getSession()
      .then((session) => {
        set({ session, user: session?.user ?? null, loading: false });
      })
      .catch(() => {
        set({ session: null, user: null, loading: false });
      });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, loading: false });
    });
  },
  signInWithGoogle: async () => {
    await authService.signInWithGoogle();
  },
  signOut: async () => {
    await authService.signOut();
    set({ session: null, user: null });
  },
}));
