"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/stores/useAuthStore";
import { useActivityLogStore } from "@/stores/useActivityLogStore";
import { useUserStore } from "@/stores/useUserStore";
import { History, Clock, Search, Filter, User } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { ActivityLog, ActivityAction, EntityType } from "@/types";

function getActionIcon(action: string) {
  switch (action) {
    case "create":
      return <span className="text-green-600 font-bold">+</span>;
    case "update":
      return <span className="text-yellow-600 font-bold">✏️</span>;
    case "delete":
      return <span className="text-red-600 font-bold">🗑️</span>;
    case "login":
      return <span className="text-blue-600 font-bold">🔑</span>;
    case "logout":
      return <span className="text-gray-600 font-bold">👋</span>;
    default:
      return <span className="text-gray-600 font-bold">•</span>;
  }
}

function getActionText(action: string) {
  switch (action) {
    case "create":
      return "Membuat";
    case "update":
      return "Memperbarui";
    case "delete":
      return "Menghapus";
    case "login":
      return "Login";
    case "logout":
      return "Logout";
    default:
      return action;
  }
}

function getEntityText(entityType: string) {
  switch (entityType) {
    case "investment":
      return "Investasi";
    case "category":
      return "Kategori";
    case "user":
      return "Pengguna";
    default:
      return entityType;
  }
}

export default function ActivityLogsPage() {
  const { user } = useAuthStore();
  const { logs, loading: logsLoading, fetchLogs } = useActivityLogStore();
  const { users, loading: usersLoading, fetchAllUsers } = useUserStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterEntity, setFilterEntity] = useState<string>("all");
  const [filterUser, setFilterUser] = useState<string>("all");

  useEffect(() => {
    fetchLogs();
    fetchAllUsers();
  }, [fetchLogs, fetchAllUsers]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const logUser = users[log.user_id];
      const lowerQuery = searchQuery.toLowerCase();
      
      const matchesSearch = searchQuery.trim() === "" 
        ? true 
        : (() => {
            if (log.metadata && typeof log.metadata === "object" && "name" in log.metadata && log.metadata.name) {
              if (String(log.metadata.name).toLowerCase().includes(lowerQuery)) return true;
            }
            if (getActionText(log.action).toLowerCase().includes(lowerQuery)) return true;
            if (getEntityText(log.entity_type).toLowerCase().includes(lowerQuery)) return true;
            if (logUser?.email?.toLowerCase().includes(lowerQuery)) return true;
            if (logUser?.full_name?.toLowerCase().includes(lowerQuery)) return true;
            return false;
          })();

      const matchesAction = filterAction === "all" || log.action === filterAction;
      const matchesEntity = filterEntity === "all" || log.entity_type === filterEntity;
      const matchesUser = filterUser === "all" || log.user_id === filterUser;

      return matchesSearch && matchesAction && matchesEntity && matchesUser;
    });
  }, [logs, users, searchQuery, filterAction, filterEntity, filterUser]);

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Riwayat Aktivitas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="relative md:col-span-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Cari aktivitas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <Select value={filterAction} onValueChange={setFilterAction}>
                    <SelectTrigger>
                      <SelectValue placeholder="Aksi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Aksi</SelectItem>
                      <SelectItem value="create">Membuat</SelectItem>
                      <SelectItem value="update">Memperbarui</SelectItem>
                      <SelectItem value="delete">Menghapus</SelectItem>
                      <SelectItem value="login">Login</SelectItem>
                      <SelectItem value="logout">Logout</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <Select value={filterEntity} onValueChange={setFilterEntity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Entitas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Entitas</SelectItem>
                      <SelectItem value="investment">Investasi</SelectItem>
                      <SelectItem value="category">Kategori</SelectItem>
                      <SelectItem value="user">Pengguna</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <Select value={filterUser} onValueChange={setFilterUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pengguna" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Pengguna</SelectItem>
                      {Object.values(users).map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {logsLoading || usersLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>{logs.length === 0 ? "Belum ada aktivitas yang tercatat" : "Tidak ada aktivitas yang sesuai filter"}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredLogs.map((log) => {
                    const logUser = users[log.user_id];
                    return (
                      <div
                        key={log.id}
                        className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100"
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-200">
                          {getActionIcon(log.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">
                            {getActionText(log.action)}
                            {log.entity_type !== "user" && (
                              <>
                                {" "}
                                {getEntityText(log.entity_type)}
                                {log.metadata && typeof log.metadata === "object" && "name" in log.metadata && log.metadata.name && (
                                  <span className="font-semibold text-gray-800">
                                    {" "}
                                    &quot;{String(log.metadata.name)}&quot;
                                  </span>
                                )}
                              </>
                            )}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 gap-y-1 mt-1 text-sm text-gray-500">
                            {logUser && (
                              <>
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span>{logUser.full_name || logUser.email}</span>
                                </span>
                                <span className="text-gray-300">•</span>
                              </>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {format(new Date(log.created_at), "dd MMMM yyyy HH:mm", {
                                  locale: id,
                                })}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
