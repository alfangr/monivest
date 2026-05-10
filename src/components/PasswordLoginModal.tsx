"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { deriveKey } from "@/lib/crypto";
import { useCryptoStore } from "@/stores/useCryptoStore";
import { Shield, Key, X } from "lucide-react";

const loginSchema = z.object({
  password: z.string().min(1, "Password tidak boleh kosong"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface PasswordLoginModalProps {
  salt: string;
  onClose: () => void;
  onSuccess: () => void;
  onUseRecoveryKey: () => void;
}

export default function PasswordLoginModal({ 
  salt, 
  onClose, 
  onSuccess, 
  onUseRecoveryKey 
}: PasswordLoginModalProps) {
  const setEncryptionKey = useCryptoStore((state) => state.setEncryptionKey);
  const setSetupComplete = useCryptoStore((state) => state.setSetupComplete);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmitPassword = async (data: LoginFormValues) => {
    setError("");
    setLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
      const key = await deriveKey(data.password, salt);
      setEncryptionKey(key);
      setSetupComplete(true);
      onSuccess();
    } catch {
      setError("Password salah");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full"
      >
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-4 right-4" 
          onClick={onClose}
          disabled={loading}
        >
          <X className="h-5 w-5" />
        </Button>
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Masukkan Password
          </CardTitle>
          <p className="text-gray-500 mt-2">
            Password enkripsi untuk mengakses data investasi
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Masukkan password enkripsi"
                disabled={loading}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" className="text-white" />
                  <span>Memproses (mungkin butuh beberapa detik)...</span>
                </div>
              ) : (
                "Buka Data"
              )}
            </Button>
          </form>
          <Button
            variant="outline"
            className="w-full"
            onClick={onUseRecoveryKey}
            disabled={loading}
          >
            <Key className="h-4 w-4 mr-2" />
            Lupa Password? Gunakan Recovery Key
          </Button>
        </CardContent>
      </motion.div>
    </div>
  );
}
