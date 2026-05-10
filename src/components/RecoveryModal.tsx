"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { recoveryKeyToKey } from "@/lib/crypto";
import { useCryptoStore } from "@/stores/useCryptoStore";
import { Key, AlertTriangle, X } from "lucide-react";

interface RecoveryModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function RecoveryModal({ onClose, onSuccess }: RecoveryModalProps) {
  const setEncryptionKey = useCryptoStore((state) => state.setEncryptionKey);
  const setSetupComplete = useCryptoStore((state) => state.setSetupComplete);
  
  const [recoveryKeyInput, setRecoveryKeyInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmitRecovery = async () => {
    setError("");
    setLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
      const key = await recoveryKeyToKey(recoveryKeyInput);
      setEncryptionKey(key);
      setSetupComplete(true);
      onSuccess();
    } catch {
      setError("Recovery key tidak valid");
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
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
            <Key className="h-8 w-8 text-purple-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Pulihkan Akses
          </CardTitle>
          <p className="text-gray-500 mt-2">
            Masukkan recovery key untuk memulihkan akses ke data Anda
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recoveryKey">Recovery Key</Label>
            <textarea
              id="recoveryKey"
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-25"
              placeholder="Masukkan 24 kata recovery key"
              value={recoveryKeyInput}
              onChange={(e) => setRecoveryKeyInput(e.target.value)}
              disabled={loading}
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              Pastikan recovery key dimasukkan dengan benar, termasuk semua kata dan spasi.
            </p>
          </div>
          <Button
            className="w-full h-12 text-base"
            onClick={onSubmitRecovery}
            disabled={loading || !recoveryKeyInput.trim()}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" className="text-white" />
                <span>Memproses (mungkin butuh beberapa detik)...</span>
              </div>
            ) : (
              "Pulihkan Akses"
            )}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={onClose}
            disabled={loading}
          >
            Batal
          </Button>
        </CardContent>
      </motion.div>
    </div>
  );
}
