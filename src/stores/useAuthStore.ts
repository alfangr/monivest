import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/activity-logger";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) throw error;
  },
  signInWithEmail: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  },
  signUpWithEmail: async (email: string, password: string, fullName: string) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (authError) throw authError;
    
    if (authData.user) {
      const userId = authData.user.id;
      
      const { error: profileError } = await supabase
        .from("users")
        .insert({
          id: userId,
          email,
          full_name: fullName,
          role: "pengguna",
        });
      if (profileError) throw profileError;

      const defaultCategories = DEFAULT_CATEGORIES.map((cat) => ({
        user_id: userId,
        name: cat.name,
        color: cat.color,
      }));

      const { error: categoryError } = await supabase
        .from("categories")
        .insert(defaultCategories);
      if (categoryError) throw categoryError;
    }
  },
  signOut: async () => {
    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      await logActivity(currentUser.id, "logout", "user");
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    if (typeof window !== "undefined") {
      localStorage.removeItem("monivest_last_login_id");
    }
    set({ user: null });
  },
  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },
}));
