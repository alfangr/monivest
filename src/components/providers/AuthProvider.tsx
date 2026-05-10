"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthListener } from "@/hooks/useAuthListener";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCryptoStore } from "@/stores/useCryptoStore";
import { supabase } from "@/lib/supabase";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import EncryptionSetupModal from "@/components/EncryptionSetupModal";
import PasswordLoginModal from "@/components/PasswordLoginModal";
import RecoveryModal from "@/components/RecoveryModal";
import type { User as CustomUser } from "@/types";

type ModalType = "setup" | "password" | "recovery" | null;

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const loading = useAuthListener();
  const user = useAuthStore((state) => state.user);
  const encryptionKey = useCryptoStore((state) => state.encryptionKey);
  const isSetupComplete = useCryptoStore((state) => state.isSetupComplete);
  
  const [userData, setUserData] = useState<CustomUser | null>(null);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [checking, setChecking] = useState(true);
  
  const checkedUserIdRef = useRef<string | null>(null);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    async function checkUserSetup() {
      if (!user) {
        setChecking(false);
        setUserData(null);
        setModalType(null);
        checkedUserIdRef.current = null;
        isCheckingRef.current = false;
        return;
      }

      if (isCheckingRef.current) {
        return;
      }

      isCheckingRef.current = true;

      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching user data:", error);
          setChecking(false);
          return;
        }

        const customUser = data as CustomUser;
        setUserData(customUser);

        if (checkedUserIdRef.current !== user.id) {
          const { data: categories, error: categoriesError } = await supabase
            .from("categories")
            .select("id, name, created_at")
            .eq("user_id", user.id);

          if (!categoriesError) {
            const existingNames = new Set(categories?.map((c: any) => c.name) || []);
            const missingCategories = DEFAULT_CATEGORIES.filter((cat) => !existingNames.has(cat.name));
            
            if (missingCategories.length > 0) {
              const categoriesToInsert = missingCategories.map((cat) => ({
                user_id: user.id,
                name: cat.name,
                color: cat.color,
              }));

              await supabase
                .from("categories")
                .insert(categoriesToInsert);
            }
          }
          
          checkedUserIdRef.current = user.id;
        }

        if (!modalType) {
          if (!customUser.encryption_salt) {
            setModalType("setup");
          } else if (!encryptionKey || !isSetupComplete) {
            setModalType("password");
          } else {
            setModalType(null);
          }
        }
      } catch (err) {
        console.error("Error in checkUserSetup:", err);
      } finally {
        setChecking(false);
        isCheckingRef.current = false;
      }
    }

    checkUserSetup();
  }, [user, encryptionKey, isSetupComplete, modalType]);

  const handleSetupComplete = () => {
    setModalType(null);
  };

  const handlePasswordLoginSuccess = () => {
    setModalType(null);
  };

  const handleUseRecoveryKey = () => {
    setModalType("recovery");
  };

  const handleRecoverySuccess = () => {
    setModalType(null);
  };

  const handleCloseModal = () => {
    setModalType(null);
  };

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {children}
      {modalType === "setup" && (
        <EncryptionSetupModal onComplete={handleSetupComplete} />
      )}
      {modalType === "password" && userData?.encryption_salt && (
        <PasswordLoginModal
          salt={userData.encryption_salt}
          onClose={handleCloseModal}
          onSuccess={handlePasswordLoginSuccess}
          onUseRecoveryKey={handleUseRecoveryKey}
        />
      )}
      {modalType === "recovery" && (
        <RecoveryModal
          onClose={handleCloseModal}
          onSuccess={handleRecoverySuccess}
        />
      )}
    </>
  );
}
