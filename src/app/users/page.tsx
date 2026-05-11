"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { User, Users, Check } from "lucide-react";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import AppShell from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type UserWithRole = {
  id: string;
  email?: string;
  role: string;
};

const ROLES = ["pengguna", "admin"] as const;

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("users").select("id, email, role");
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Gagal memuat pengguna");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUserRole = async (userId: string, role: string) => {
    try {
      setUpdatingId(userId);
      const { error } = await supabase.from("users").update({ role }).eq("id", userId);
      if (error) throw error;
      setUsers(users.map((u) => (u.id === userId ? { ...u, role } : u)));
      toast.success("Role berhasil diupdate");
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Gagal mengupdate role");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AdminProtectedRoute>
      <AppShell>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="border-0 shadow-lg rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Users className="h-6 w-6" />
                Manajemen Pengguna
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-gray-200">
                      <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
                      <div className="flex-1">
                        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mb-2" />
                        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                      </div>
                      <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-all duration-300"
                    >
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{user.email || "No email"}</p>
                        <p className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}...</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {ROLES.map((role) => (
                          <label
                            key={role}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
                              user.role === role
                                ? "bg-gray-900 text-white shadow-md"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={user.role === role}
                              onChange={() => updateUserRole(user.id, role)}
                              disabled={updatingId === user.id}
                              className="sr-only"
                            />
                            {user.role === role && <Check className="h-4 w-4" />}
                            <span className="capitalize">{role}</span>
                          </label>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AppShell>
    </AdminProtectedRoute>
  );
}
