import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { User } from "@/types";

interface UserState {
  users: Record<string, User>;
  loading: boolean;
  fetchUser: (userId: string) => Promise<User | null>;
  fetchAllUsers: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: {},
  loading: false,
  fetchUser: async (userId: string) => {
    const existingUsers = get().users;
    if (existingUsers[userId]) {
      return existingUsers[userId];
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Failed to fetch user:", error);
      return null;
    }

    const user = data as User;
    set((state) => ({
      users: { ...state.users, [userId]: user },
    }));
    return user;
  },
  fetchAllUsers: async () => {
    set({ loading: true });
    const { data, error } = await supabase.from("users").select("*");

    if (error) {
      console.error("Failed to fetch users:", error);
      set({ loading: false });
      return;
    }

    const usersMap = (data as User[]).reduce(
      (acc, user) => {
        acc[user.id] = user;
        return acc;
      },
      {} as Record<string, User>
    );

    set({ users: usersMap, loading: false });
  },
}));
