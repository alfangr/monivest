import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/activity-logger";

const STORAGE_KEY_LAST_LOGIN = "monivest_last_login_id";

export function useAuthListener() {
  const setUser = useAuthStore((state) => state.setUser);
  const loading = useAuthStore((state) => state.loading);
  const hasCheckedSession = useRef(false);
  const loadingRef = useRef(loading);
  const isProcessingInitialSession = useRef(false);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    async function checkInitialSession() {
      if (hasCheckedSession.current) return;
      hasCheckedSession.current = true;
      isProcessingInitialSession.current = true;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user ?? null;
        const lastLoginId = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_LAST_LOGIN) : null;
        
        if (user && lastLoginId !== user.id) {
          await logActivity(user.id, "login", "user");
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY_LAST_LOGIN, user.id);
          }
        }
        
        setUser(user);
      } catch (error) {
        console.error("[useAuthListener] Error getting initial session:", error);
        setUser(null);
      } finally {
        isProcessingInitialSession.current = false;
      }
    }

    checkInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null;
      const lastLoginId = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_LAST_LOGIN) : null;
      
      if (isProcessingInitialSession.current) return;
      
      if (event === "SIGNED_IN" && user && lastLoginId !== user.id) {
        await logActivity(user.id, "login", "user");
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY_LAST_LOGIN, user.id);
        }
      }
      
      if (event === "SIGNED_OUT") {
        if (typeof window !== "undefined") {
          localStorage.removeItem(STORAGE_KEY_LAST_LOGIN);
        }
      }
      
      setUser(user);
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
