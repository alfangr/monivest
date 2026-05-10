"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCategoryStore } from "@/stores/useCategoryStore";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Edit, Trash2, Plus, X } from "lucide-react";
import type { Category } from "@/types";

const categorySchema = z.object({
  name: z.string().min(1, "Nama kategori harus diisi"),
  color: z.string().min(1, "Warna harus dipilih"),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

const PRESET_COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#6366f1",
];

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

export default function CategoriesPage() {
  const user = useAuthStore((state) => state.user);
  const { categories, loading, fetchCategories, addCategory, updateCategory, deleteCategory } = useCategoryStore();
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCategories(user.id);
    }
  }, [user, fetchCategories]);

  const openAddModal = () => {
    setEditingCategory(null);
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  const openDeleteModal = (category: Category) => {
    setDeletingCategory(category);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    setDeletingId(deletingCategory.id);
    try {
      await deleteCategory(deletingCategory.id);
      setShowDeleteModal(false);
      setDeletingCategory(null);
    } catch (error) {
      console.error("Error deleting category:", error);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-10 w-40 rounded-lg" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kategori</h1>
              <p className="text-gray-500">
                Kelola kategori investasi Anda
              </p>
            </div>
            <Button onClick={openAddModal}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Kategori
            </Button>
          </motion.div>

          {categories.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100, damping: 15 }}
            >
              <Card className="border-0 shadow">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-16 w-16 text-gray-500 mb-4 flex items-center justify-center bg-gray-100 rounded-full">
                    <Edit className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">
                    Belum ada kategori
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-md">
                    Mulai buat kategori untuk mengelompokkan investasi Anda
                  </p>
                  <Button onClick={openAddModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Kategori
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {categories.map((category) => (
                <motion.div
                  key={category.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <Card className="border-0 shadow hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {category.name}
                            </h3>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditModal(category)}
                            disabled={!!deletingId}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => openDeleteModal(category)}
                            disabled={!!deletingId}
                          >
                            {deletingId === category.id ? (
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
              ))}
            </motion.div>
          )}
        </div>

        {showModal && (
          <CategoryModal
            category={editingCategory}
            onClose={() => setShowModal(false)}
            onSuccess={() => setShowModal(false)}
          />
        )}

        {showDeleteModal && deletingCategory && (
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
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Hapus Kategori?
              </h3>
              <p className="text-gray-600 mb-8">
                Apakah Anda yakin ingin menghapus kategori{" "}
                <strong className="text-gray-900">{deletingCategory.name}</strong>?
                Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingCategory(null);
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

interface CategoryModalProps {
  category?: Category | null;
  onClose: () => void;
  onSuccess: () => void;
}

function CategoryModal({ category, onClose, onSuccess }: CategoryModalProps) {
  const user = useAuthStore((state) => state.user);
  const { addCategory, updateCategory } = useCategoryStore();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const isEdit = !!category;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: isEdit
      ? {
          name: category.name,
          color: category.color,
        }
      : {
          color: PRESET_COLORS[0],
        },
  });

  const watchColor = watch("color");

  if (!user) {
    return null;
  }

  const onSubmit = async (data: CategoryFormValues) => {
    setIsLoading(true);
    setError("");
    try {
      if (isEdit) {
        await updateCategory(category.id, data);
      } else {
        await addCategory({
          user_id: user.id,
          name: data.name,
          color: data.color,
        });
      }
      onSuccess();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Gagal menyimpan kategori");
      } else {
        setError("Gagal menyimpan kategori");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900">
            {isEdit ? "Edit Kategori" : "Tambah Kategori Baru"}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-900">
                Nama Kategori *
              </Label>
              <Input
                id="name"
                placeholder="Contoh: Obligasi"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-red-600">
                  {errors.name.message as string}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-gray-900">Warna *</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setValue("color", color)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      watchColor === color
                        ? "border-gray-900 scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-gray-600 text-sm">Custom:</Label>
                <Input
                  type="color"
                  value={watchColor}
                  onChange={(e) => setValue("color", e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <span className="text-sm text-gray-600 font-mono">{watchColor}</span>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span>Menyimpan...</span>
                  </div>
                ) : (
                  "Simpan"
                )}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
