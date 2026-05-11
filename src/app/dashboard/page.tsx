"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/useAuthStore";
import { useInvestmentStore } from "@/stores/useInvestmentStore";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonCard, SkeletonChart, SkeletonInvestmentList } from "@/components/ui/skeleton";
import { formatCurrency, formatPercentage } from "@/lib/format";
import InvestmentModal from "@/components/InvestmentModal";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Plus, TrendingUp, TrendingDown, Wallet, DollarSign, PieChart as PieChartIcon } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
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

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const { investments, loading, fetchInvestments, getCalculatedValue } = useInvestmentStore();
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchInvestments(user.id);
    }
  }, [user, fetchInvestments]);

  const totalValue = investments.reduce((sum, inv) => sum + getCalculatedValue(inv), 0);
  const totalInitial = investments.reduce((sum, inv) => sum + inv.initial_amount, 0);
  const totalProfit = totalValue - totalInitial;
  const roi = totalInitial > 0 ? (totalProfit / totalInitial) * 100 : 0;

  const categoryData = investments.reduce((acc, inv) => {
    const existing = acc.find((item) => item.name === inv.category);
    const calculatedValue = getCalculatedValue(inv);
    if (existing) {
      existing.value += calculatedValue;
    } else {
      acc.push({ name: inv.category, value: calculatedValue });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              <SkeletonChart />
              <Card className="border-0 shadow-lg rounded-xl">
                <CardHeader className="pb-4">
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <SkeletonInvestmentList />
                </CardContent>
              </Card>
            </div>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (investments.length === 0) {
    return (
      <ProtectedRoute>
        <AppShell>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="flex flex-col items-center justify-center min-h-125 text-center py-12"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
              className="mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-gray-100"
            >
              <Wallet className="h-16 w-16 text-gray-500" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold mb-4 text-gray-900"
            >
              Belum ada investasi
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-gray-600 mb-8 max-w-lg leading-relaxed"
            >
              Mulai catat investasi Anda pertama untuk melihat ringkasan portofolio dan analisis yang menarik.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button size="lg" className="h-12 px-8 text-base" onClick={() => setShowAddModal(true)}>
                <Plus className="h-5 w-5 mr-2" />
                Tambah Investasi Pertama
              </Button>
            </motion.div>
          </motion.div>

          {showAddModal && (
            <InvestmentModal
              onClose={() => setShowAddModal(false)}
              onSuccess={() => setShowAddModal(false)}
            />
          )}
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-8">
          {/* Summary Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-blue-50">
                  <CardTitle className="text-sm font-semibold text-blue-700">Total Aset</CardTitle>
                  <div className="p-2 rounded-lg bg-blue-500 text-white shadow-md">
                    <Wallet className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl font-bold text-gray-900"
                  >
                    {formatCurrency(totalValue)}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-purple-50">
                  <CardTitle className="text-sm font-semibold text-purple-700">Total Modal</CardTitle>
                  <div className="p-2 rounded-lg bg-purple-500 text-white shadow-md">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="text-3xl font-bold text-gray-900"
                  >
                    {formatCurrency(totalInitial)}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-green-50">
                  <CardTitle className="text-sm font-semibold text-green-700">Profit/Loss</CardTitle>
                  <div className={`p-2 rounded-lg shadow-md ${totalProfit >= 0 ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                    {totalProfit >= 0 ? (
                      <TrendingUp className="h-5 w-5" />
                    ) : (
                      <TrendingDown className="h-5 w-5" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className={`text-3xl font-bold ${
                      totalProfit >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {totalProfit >= 0 ? "+" : ""}
                    {formatCurrency(totalProfit)}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-amber-50">
                  <CardTitle className="text-sm font-semibold text-amber-700">ROI</CardTitle>
                  <div className="p-2 rounded-lg bg-amber-500 text-white shadow-md">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    className={`text-3xl font-bold ${
                      roi >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatPercentage(roi)}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Charts */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-8 md:grid-cols-2"
          >
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <PieChartIcon className="h-5 w-5" />
                    Distribusi Aset
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ width: "100%", height: 384, position: "relative" }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={300}>
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name} ${((percent || 0) * 100).toFixed(0)}%`
                          }
                          outerRadius={100}
                          innerRadius={40}
                          fill="#8884d8"
                          dataKey="value"
                          animationDuration={1000}
                        >
                          {categoryData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <TrendingUp className="h-5 w-5" />
                    Investasi Terbaru
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {investments.slice(0, 5).map((investment, index) => {
                    const calculatedValue = getCalculatedValue(investment);
                    const profit = calculatedValue - investment.initial_amount;
                    const profitPercentage = investment.initial_amount > 0 
                      ? (profit / investment.initial_amount) * 100 
                      : 0;
                    
                    return (
                      <motion.div
                        key={investment.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex items-center justify-between p-5 rounded-xl border border-gray-200 bg-white hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-lg text-gray-900">{investment.name}</p>
                            {investment.auto_calculate && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Auto</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {investment.category}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg text-gray-900">{formatCurrency(calculatedValue)}</p>
                          <p className={`text-sm font-medium mt-1 ${
                            profit >= 0 ? "text-green-600" : "text-red-600"
                          }`}>
                            {formatPercentage(profitPercentage)}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>

        {/* Add Investment Modal */}
        {showAddModal && (
          <InvestmentModal
            onClose={() => setShowAddModal(false)}
            onSuccess={() => setShowAddModal(false)}
          />
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
