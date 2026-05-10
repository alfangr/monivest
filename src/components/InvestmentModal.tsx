"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuthStore } from "@/stores/useAuthStore";
import { useInvestmentStore } from "@/stores/useInvestmentStore";
import { useCategoryStore } from "@/stores/useCategoryStore";
import { X } from "lucide-react";
import type { Database } from "@/types/supabase";

const investmentSchema = z.object({
  name: z.string().min(1, "Nama investasi harus diisi"),
  category: z.string().min(1, "Kategori harus dipilih"),
  initial_amount: z.string().min(1, "Modal awal harus diisi"),
  current_value: z.string().min(1, "Nilai saat ini harus diisi"),
  start_date: z.string().min(1, "Tanggal mulai harus diisi"),
  platform: z.string().optional(),
  monthly_return: z.string().optional(),
  notes: z.string().optional(),
});

type InvestmentFormValues = z.infer<typeof investmentSchema>;

interface InvestmentModalProps {
  investment?: Database["public"]["Tables"]["investments"]["Row"];
  onClose: () => void;
  onSuccess: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { y: 10, opacity: 0 },
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

export default function InvestmentModal({
  investment,
  onClose,
  onSuccess,
}: InvestmentModalProps) {
  const user = useAuthStore((state) => state.user);
  const { addInvestment, updateInvestment } = useInvestmentStore();
  const { categories } = useCategoryStore();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const isEdit = !!investment;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentSchema),
    defaultValues: isEdit
      ? {
          name: investment.name,
          category: investment.category,
          initial_amount: investment.initial_amount.toString(),
          current_value: investment.current_value.toString(),
          start_date: investment.start_date,
          platform: investment.platform || "",
          monthly_return: investment.monthly_return?.toString() || "",
          notes: investment.notes || "",
        }
      : {
          start_date: new Date().toISOString().split("T")[0],
        },
  });

  if (!user) {
    return null;
  }

  const onSubmit = async (data: InvestmentFormValues) => {
    setIsLoading(true);
    setError("");
    try {
      const initialAmount = parseFloat(data.initial_amount.replace(/[^0-9]/g, ""));
      const currentValue = parseFloat(data.current_value.replace(/[^0-9]/g, ""));
      const monthlyReturn = data.monthly_return ? parseFloat(data.monthly_return) : null;

      if (isNaN(initialAmount) || initialAmount <= 0) {
        throw new Error("Modal awal harus lebih dari 0");
      }
      if (isNaN(currentValue) || currentValue <= 0) {
        throw new Error("Nilai saat ini harus lebih dari 0");
      }

      if (isEdit) {
        await updateInvestment(investment.id, {
          name: data.name,
          category: data.category,
          initial_amount: initialAmount,
          current_value: currentValue,
          start_date: data.start_date,
          platform: data.platform || null,
          monthly_return: monthlyReturn,
          notes: data.notes || null,
        });
      } else {
        await addInvestment({
          user_id: user.id,
          name: data.name,
          category: data.category,
          initial_amount: initialAmount,
          current_value: currentValue,
          start_date: data.start_date,
          platform: data.platform || null,
          monthly_return: monthlyReturn,
          notes: data.notes || null,
        });
      }
      onSuccess();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Gagal menyimpan investasi");
      } else {
        setError("Gagal menyimpan investasi");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumberInput = (value: string) => {
    const number = value.replace(/[^0-9]/g, "");
    if (!number) return "";
    return new Intl.NumberFormat("id-ID").format(parseInt(number));
  };

  const watchInitialAmount = watch("initial_amount");
  const watchCurrentValue = watch("current_value");

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
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring" as const, stiffness: 200, damping: 20 }}
        className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900">
            {isEdit ? "Edit Investasi" : "Tambah Investasi Baru"}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {error && (
              <motion.div
                variants={itemVariants}
                className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
              >
                {error}
              </motion.div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="name" className="text-gray-900">Nama Investasi *</Label>
                <Input
                  id="name"
                  placeholder="Contoh: Saham BBCA"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message as string}</p>
                )}
              </motion.div>
              <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-gray-900">Kategori *</Label>
                  <Select
                    onValueChange={(value) => setValue("category", value)}
                    defaultValue={isEdit ? investment.category : undefined}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-red-600">{errors.category.message as string}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_date" className="text-gray-900">Tanggal Mulai *</Label>
                  <Input id="start_date" type="date" {...register("start_date")} />
                  {errors.start_date && (
                    <p className="text-sm text-red-600">{errors.start_date.message as string}</p>
                  )}
                </div>
              </motion.div>
              <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="initial_amount" className="text-gray-900">Modal Awal (Rp) *</Label>
                  <Input
                    id="initial_amount"
                    placeholder="0"
                    value={
                      watchInitialAmount
                        ? formatNumberInput(watchInitialAmount.toString())
                        : ""
                    }
                    onChange={(e) => setValue("initial_amount", e.target.value)}
                  />
                  {errors.initial_amount && (
                    <p className="text-sm text-red-600">{errors.initial_amount.message as string}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_value" className="text-gray-900">Nilai Saat Ini (Rp) *</Label>
                  <Input
                    id="current_value"
                    placeholder="0"
                    value={
                      watchCurrentValue
                        ? formatNumberInput(watchCurrentValue.toString())
                        : ""
                    }
                    onChange={(e) => setValue("current_value", e.target.value)}
                  />
                  {errors.current_value && (
                    <p className="text-sm text-red-600">{errors.current_value.message as string}</p>
                  )}
                </div>
              </motion.div>
              <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platform" className="text-gray-900">Platform (Opsional)</Label>
                  <Input
                    id="platform"
                    placeholder="Contoh: BCA Sekuritas, Binance"
                    {...register("platform")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly_return" className="text-gray-900">Return Bulanan (%) (Opsional)</Label>
                  <Input
                    id="monthly_return"
                    type="number"
                    step="0.01"
                    placeholder="0"
                    {...register("monthly_return")}
                  />
                </div>
              </motion.div>
              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="notes" className="text-gray-900">Catatan (Opsional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Catatan tambahan tentang investasi ini"
                  {...register("notes")}
                />
              </motion.div>
              <motion.div variants={itemVariants} className="flex gap-4 pt-4">
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
              </motion.div>
            </form>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
