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
import { supabase } from "@/lib/supabase";
import { generateSalt, deriveKey, generateRecoveryKey } from "@/lib/crypto";
import { useCryptoStore } from "@/stores/useCryptoStore";
import { useAuthStore } from "@/stores/useAuthStore";
import type { UserUpdate } from "@/types";
import { Copy, Check, Shield, Key, AlertTriangle } from "lucide-react";

const setupSchema = z.object({
  password: z.string().min(8, "Password minimal 8 karakter"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

type SetupFormValues = z.infer<typeof setupSchema>;

interface EncryptionSetupModalProps {
  onComplete: () => void;
}

export default function EncryptionSetupModal({ onComplete }: EncryptionSetupModalProps) {
  const user = useAuthStore((state) => state.user);
  const setEncryptionKey = useCryptoStore((state) => state.setEncryptionKey);
  const setSetupComplete = useCryptoStore((state) => state.setSetupComplete);
  
  const [step, setStep] = useState<"password" | "recovery">("password");
  const [recoveryKey, setRecoveryKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
  });

  const onSubmitPassword = async (data: SetupFormValues) => {
    if (!user) return;
    
    setError("");
    setLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
      const salt = await generateSalt();
      const key = await deriveKey(data.password, salt);
      
      const { error: supabaseError } = await supabase
        .from("users")
        .update({ encryption_salt: salt } as UserUpdate)
        .eq("id", user.id);
      
      if (supabaseError) throw supabaseError;
      
      const newRecoveryKey = generateRecoveryKey();
      setRecoveryKey(newRecoveryKey);
      setEncryptionKey(key);
      setStep("recovery");
    } catch (err) {
      console.error("Error setting up encryption:", err);
      setError("Gagal setup enkripsi, coba lagi");
    } finally {
      setLoading(false);
    }
  };

  const copyRecoveryKey = () => {
    navigator.clipboard.writeText(recoveryKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const completeSetup = () => {
    setSetupComplete(true);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full"
      >
        {step === "password" ? (
          <>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Setup Enkripsi
              </CardTitle>
              <p className="text-gray-500 mt-2">
                Buat password untuk melindungi data investasi Anda
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="password">Password Enkripsi</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimal 8 karakter"
                    disabled={loading}
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Masukkan password lagi"
                    disabled={loading}
                    {...register("confirmPassword")}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Kenapa butuh recovery key?</strong></p>
                  <p>Semua data investasi Anda (nominal, return, catatan) di-enkripsi end-to-end. Hanya Anda yang punya kuncinya — sistem/developer tidak bisa mengakses atau memulihkan data Anda!</p>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 space-y-1">
                  <p><strong>Risiko jika hilang:</strong></p>
                  <p>Jika Anda lupa password DAN hilang recovery key, <strong>SEMUA DATA INVESTASI TIDAK BISA DIPULIHKAN SELAMANYA!</strong></p>
                </div>
              </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" className="text-white" />
                      <span>Menyimpan (mungkin butuh beberapa detik)...</span>
                    </div>
                  ) : (
                    "Lanjutkan"
                  )}
                </Button>
              </form>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                <Key className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Recovery Key Anda
              </CardTitle>
              <p className="text-gray-500 mt-2">
                Simpan key ini di tempat yang aman!
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-900 text-gray-100 rounded-xl p-4 font-mono text-sm leading-relaxed">
                {recoveryKey}
              </div>
              <Button
                variant="outline"
                className="w-full h-12"
                onClick={copyRecoveryKey}
              >
                {copied ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {copied ? "Tersalin!" : "Salin Recovery Key"}
              </Button>
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">
                    <strong>JANGAN HILANGKAN KEY INI!</strong> Tanpa recovery key, Anda tidak akan bisa memulihkan data jika lupa password.
                  </p>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2 text-sm">✅ Tempat yang Aman untuk Simpan:</h4>
                  <ul className="text-xs text-green-700 space-y-1">
                    <li>• Password Manager (1Password, Bitwarden, KeePassXC)</li>
                    <li>• Tulis di kertas, simpan di brankas</li>
                    <li>• Simpan di 2-3 lokasi berbeda</li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm">❌ Yang Harus Dihindari:</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Catatan digital plaintext (Notes app, Notepad)</li>
                    <li>• Kirim via chat/email ke diri sendiri</li>
                    <li>• Hanya simpan di satu device</li>
                    <li>• Bagikan ke orang lain</li>
                  </ul>
                </div>
              </div>
              <Button
                className="w-full h-12 text-base"
                onClick={completeSetup}
              >
                Saya Sudah Simpan Recovery Key
              </Button>
            </CardContent>
          </>
        )}
      </motion.div>
    </div>
  );
}
