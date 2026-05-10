"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/useAuthStore";
import { useInvestmentStore } from "@/stores/useInvestmentStore";
import { useCategoryStore } from "@/stores/useCategoryStore";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton, SkeletonInvestmentList } from "@/components/ui/skeleton";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatCurrency, formatPercentage } from "@/lib/format";
import InvestmentModal from "@/components/InvestmentModal";
import { Edit, Trash2, Plus, TrendingUp, TrendingDown } from "lucide-react";
import type { Database } from "@/types/supabase";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

export default function InvestmentsPage() {
  const user = useAuthStore((state) => state.user);
  const { investments, loading, fetchInvestments, deleteInvestment } = useInvestmentStore();
  const { categories, fetchCategories } = useCategoryStore();
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingInvestment, setDeletingInvestment] = useState<Database["public"]["Tables"]["investments"]["Row"] | null>(null);
  const [editingInvestment, setEditingInvestment] = useState<Database["public"]["Tables"]["investments"]["Row"] | null>(null);

  useEffect(() => {
    if (user) {
      fetchInvestments(user.id);
      fetchCategories(user.id);
    }
  }, [user, fetchInvestments, fetchCategories]);

  const filteredInvestments =
    filterCategory === "all"
      ? investments
      : investments.filter((inv) => inv.category === filterCategory);

  const openDeleteModal = (investment: Database["public"]["Tables"]["investments"]["Row"]) => {
    setDeletingInvestment(investment);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deletingInvestment) return;
    setDeletingId(deletingInvestment.id);
    try {
      await deleteInvestment(deletingInvestment.id);
      setShowDeleteModal(false);
      setDeletingInvestment(null);
    } catch (error) {
      console.error("Error deleting investment:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const openEditModal = (investment: Database["public"]["Tables"]["investments"]["Row"]) => {
    setEditingInvestment(investment);
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-48 mt-2" />
              </div>
              <Skeleton className="h-10 w-40 rounded-lg" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-9 w-24 rounded-md" />
              ))}
            </div>
            <SkeletonInvestmentList />
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Investasi</h1>
              <p className="text-gray-500">
                Kelola semua investasi Anda
              </p>
            </div>
            <Button onClick={() => setShowAddModal(true)} disabled={!!deletingId}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Investasi
            </Button>
          </motion.div>

          {/* Filter */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 100, damping: 15 }}
            className="flex gap-2 overflow-x-auto pb-2"
          >
            <Button
              variant={filterCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterCategory("all")}
            >
              Semua
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={filterCategory === category.name ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterCategory(category.name)}
              >
                {category.name}
              </Button>
            ))}
          </motion.div>

          {filteredInvestments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100, damping: 15 }}
            >
              <Card className="border-0 shadow">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <TrendingUp className="h-16 w-16 text-gray-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">
                    {investments.length === 0
                      ? "Belum ada investasi"
                      : "Tidak ada investasi di kategori ini"}
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-md">
                    {investments.length === 0
                      ? "Mulai catat investasi Anda pertama"
                      : "Coba pilih kategori lain atau tambah investasi baru"}
                  </p>
                  <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Investasi
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            /* Investment List */
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-4"
            >
              {filteredInvestments.map((investment) => {
                const profit = investment.current_value - investment.initial_amount;
                const profitPercentage =
                  investment.initial_amount > 0
                    ? (profit / investment.initial_amount) * 100
                    : 0;

                return (
                  <motion.div
                    key={investment.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.01, y: -2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <Card className="border-0 shadow hover:shadow-xl transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{investment.name}</h3>
                              <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-900">
                                {investment.category}
                              </span>
                            </div>
                            {investment.notes && (
                              <p className="text-sm text-gray-500 mb-2">
                                {investment.notes}
                              </p>
                            )}
                            {investment.platform && (
                              <p className="text-sm text-gray-500">
                                Platform: {investment.platform}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-900">
                              {formatCurrency(investment.current_value)}
                            </p>
                            <div
                              className={`flex items-center justify-end gap-1 text-sm font-medium ${
                                profit >= 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {profit >= 0 ? (
                                <TrendingUp className="h-4 w-4" />
                              ) : (
                                <TrendingDown className="h-4 w-4" />
                              )}
                              <span>
                                {profit >= 0 ? "+" : ""}
                                {formatCurrency(profit)} ({formatPercentage(profitPercentage)})
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              Modal: {formatCurrency(investment.initial_amount)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => openEditModal(investment)}
                              disabled={!!deletingId}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => openDeleteModal(investment)}
                              disabled={!!deletingId}
                            >
                              {deletingId === investment.id ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* Add Investment Modal */}
        {showAddModal && (
          <InvestmentModal
            onClose={() => setShowAddModal(false)}
            onSuccess={() => setShowAddModal(false)}
          />
        )}

        {/* Edit Investment Modal */}
        {showEditModal && editingInvestment && (
          <InvestmentModal
            investment={editingInvestment}
            onClose={() => {
              setShowEditModal(false);
              setEditingInvestment(null);
            }}
            onSuccess={() => {
              setShowEditModal(false);
              setEditingInvestment(null);
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && deletingInvestment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/50"
              onClick={() => setShowDeleteModal(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
            >
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 mx-auto">
                <Trash2 className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Hapus Investasi?</h3>
              <p className="text-gray-600 mb-8">
                Apakah Anda yakin ingin menghapus investasi <strong className="text-gray-900">{deletingInvestment.name}</strong>?
                Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingInvestment(null);
                  }}
                >
                  Batal
                </Button>
                <Button
                  variant="default"
                  className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleDelete}
                  disabled={!!deletingId}
                >
                  {deletingId ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" className="text-white" />
                      <span>Menghapus...</span>
                    </div>
                  ) : (
                    "Hapus"
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
