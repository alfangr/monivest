import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { ActivityLog } from "@/types";

interface ActivityLogState {
  logs: ActivityLog[];
  loading: boolean;
  fetchLogs: () => Promise<void>;
  clearLogs: () => void;
}

export const useActivityLogStore = create<ActivityLogState>((set) => ({
  logs: [],
  loading: false,
  fetchLogs: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Failed to fetch activity logs:", error);
      set({ loading: false });
      return;
    }

    set({ logs: data || [], loading: false });
  },
  clearLogs: () => set({ logs: [], loading: false }),
}));
