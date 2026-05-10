import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { supabase } from "@/lib/supabase";

export function useAuthListener() {
  const setUser = useAuthStore((state) => state.setUser);
  const loading = useAuthStore((state) => state.loading);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  return loading;
}
