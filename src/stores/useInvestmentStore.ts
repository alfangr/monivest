import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { encryptNumber, decryptNumber, encrypt, decrypt } from "@/lib/crypto";
import { calculateAutoValue } from "@/lib/utils";
import { logActivity } from "@/lib/activity-logger";
import { useCryptoStore } from "@/stores/useCryptoStore";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Investment, InvestmentInsert, InvestmentUpdate, EncryptedInvestment, EncryptedInvestmentInsert } from "@/types";

interface InvestmentState {
  investments: Investment[];
  loading: boolean;
  fetchInvestments: (userId: string) => Promise<void>;
  addInvestment: (investment: InvestmentInsert) => Promise<void>;
  updateInvestment: (id: string, investment: InvestmentUpdate) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  getCalculatedValue: (investment: Investment) => number;
}

async function encryptInvestment(investment: InvestmentInsert, key: Uint8Array): Promise<EncryptedInvestmentInsert> {
  return {
    ...investment,
    initial_amount: await encryptNumber(investment.initial_amount, key),
    current_value: await encryptNumber(investment.current_value, key),
    monthly_return: investment.monthly_return !== null && investment.monthly_return !== undefined 
      ? await encryptNumber(investment.monthly_return, key) 
      : null,
    notes: investment.notes ? await encrypt(investment.notes, key) : null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function decryptInvestment(encrypted: Record<string, any>, key: Uint8Array): Promise<Investment> {
  let decryptedNotes = encrypted.notes;
  if (encrypted.notes && typeof encrypted.notes === "string") {
    try {
      decryptedNotes = await decrypt(encrypted.notes, key);
    } catch {
      decryptedNotes = encrypted.notes;
    }
  }

  return {
    ...(encrypted as Investment),
    initial_amount: await decryptNumber(encrypted.initial_amount, key),
    current_value: await decryptNumber(encrypted.current_value, key),
    monthly_return: encrypted.monthly_return 
      ? await decryptNumber(encrypted.monthly_return, key) 
      : null,
    notes: decryptedNotes,
    auto_calculate: encrypted.auto_calculate ?? false,
    return_type: encrypted.return_type ?? "annual",
    tax_rate: encrypted.tax_rate ?? 20,
  };
}

let unsubscribeCrypto: (() => void) | null = null;

export const useInvestmentStore = create<InvestmentState>((set, get) => {
  if (!unsubscribeCrypto) {
    unsubscribeCrypto = useCryptoStore.subscribe((state) => {
      if (state.encryptionKey && state.isSetupComplete) {
        const userId = useAuthStore.getState().user?.id;
        if (userId) {
          get().fetchInvestments(userId);
        }
      }
    });
  }

  return {
    investments: [],
    loading: false,
    fetchInvestments: async (userId: string) => {
      const encryptionKey = useCryptoStore.getState().encryptionKey;
      if (!encryptionKey) return;

      set({ loading: true });
      const { data, error } = await supabase
        .from("investments")
        .select("*")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      const decryptedInvestments = await Promise.all(
        (data as EncryptedInvestment[]).map((inv) => decryptInvestment(inv, encryptionKey))
      );
      
      set({ investments: decryptedInvestments, loading: false });
    },
    addInvestment: async (investment: InvestmentInsert) => {
      const encryptionKey = useCryptoStore.getState().encryptionKey;
      if (!encryptionKey) throw new Error("Encryption key not found");

      const encrypted = await encryptInvestment(investment, encryptionKey);
      const { data, error } = await supabase
        .from("investments")
        .insert(encrypted)
        .select()
        .single();
      
      if (error) throw error;
      
      const decrypted = await decryptInvestment(data as EncryptedInvestment, encryptionKey);
      set((state) => ({ investments: [decrypted, ...state.investments] }));
      
      logActivity(investment.user_id, "create", "investment", decrypted.id, { name: investment.name });
    },
    updateInvestment: async (id: string, investment: InvestmentUpdate) => {
      const encryptionKey = useCryptoStore.getState().encryptionKey;
      if (!encryptionKey) throw new Error("Encryption key not found");
      
      const userId = useAuthStore.getState().user?.id;
      if (!userId) throw new Error("User not authenticated");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: Record<string, any> = { 
        updated_at: new Date().toISOString() 
      };
      
      if (investment.name !== undefined) updateData.name = investment.name;
      if (investment.category !== undefined) updateData.category = investment.category;
      if (investment.platform !== undefined) updateData.platform = investment.platform;
      if (investment.start_date !== undefined) updateData.start_date = investment.start_date;
      if (investment.auto_calculate !== undefined) updateData.auto_calculate = investment.auto_calculate;
      if (investment.return_type !== undefined) updateData.return_type = investment.return_type;
      if (investment.tax_rate !== undefined) updateData.tax_rate = investment.tax_rate;
      
      if (investment.initial_amount !== undefined) {
        updateData.initial_amount = await encryptNumber(investment.initial_amount, encryptionKey);
      }
      if (investment.current_value !== undefined) {
        updateData.current_value = await encryptNumber(investment.current_value, encryptionKey);
      }
      if (investment.monthly_return !== undefined) {
        updateData.monthly_return = investment.monthly_return !== null 
          ? await encryptNumber(investment.monthly_return, encryptionKey) 
          : null;
      }
      if (investment.notes !== undefined) {
        updateData.notes = investment.notes ? await encrypt(investment.notes, encryptionKey) : null;
      }

      const { data, error } = await supabase
        .from("investments")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      
      const decrypted = await decryptInvestment(data as EncryptedInvestment, encryptionKey);
      set((state) => ({
        investments: state.investments.map((inv) => inv.id === id ? decrypted : inv),
      }));
      
      logActivity(userId, "update", "investment", id, { name: decrypted.name });
    },
    deleteInvestment: async (id: string) => {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) throw new Error("User not authenticated");
      
      const investment = get().investments.find((inv) => inv.id === id);
      
      const { error } = await supabase
        .from("investments")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      
      if (error) throw error;
      
      set((state) => ({
        investments: state.investments.filter((inv) => inv.id !== id),
      }));
      
      logActivity(userId, "delete", "investment", id, { name: investment?.name });
    },
    getCalculatedValue: (investment: Investment): number => {
      if (!investment.auto_calculate || !investment.monthly_return) {
        return investment.current_value;
      }
      return calculateAutoValue(
        investment.initial_amount,
        investment.monthly_return,
        investment.start_date,
        investment.return_type || "annual",
        investment.tax_rate ?? 20
      );
    },
  };
});
