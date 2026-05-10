import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { supabase } from "@/lib/supabase";

export function useAuthListener() {
  const setUser = useAuthStore((state) => state.setUser);
  const loading = useAuthStore((state) => state.loading);
  const hasCheckedSession = useRef(false);
  const loadingRef = useRef(loading);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    async function checkInitialSession() {
      if (hasCheckedSession.current) return;
      hasCheckedSession.current = true;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error("[useAuthListener] Error getting initial session:", error);
        setUser(null);
      }
    }

    checkInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    const timeoutId = setTimeout(() => {
      if (loadingRef.current) {
        setUser(null);
      }
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [setUser]);

  return loading;
}
