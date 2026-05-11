"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUserStore } from "@/stores/useUserStore";
import { useAuthListener } from "@/hooks/useAuthListener";
import type { User } from "@/types";

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user: authUser } = useAuthStore();
  const { fetchUser } = useUserStore();
  const loading = useAuthListener();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (authUser) {
        const user = await fetchUser(authUser.id);
        setCurrentUser(user);
      }
      setCheckingAdmin(false);
    };

    if (!loading) {
      checkAdmin();
    }
  }, [authUser, loading, fetchUser]);

  useEffect(() => {
    if (!loading && !checkingAdmin) {
      if (!authUser) {
        router.push("/");
      } else if (currentUser?.role !== "admin") {
        router.push("/dashboard");
      }
    }
  }, [authUser, currentUser, loading, checkingAdmin, router]);

  if (loading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-gray-900"></div>
      </div>
    );
  }

  if (!authUser || currentUser?.role !== "admin") {
    return null;
  }

  return <>{children}</>;
}
