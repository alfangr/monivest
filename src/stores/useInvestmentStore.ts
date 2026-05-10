import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { encryptNumber, decryptNumber, encrypt, decrypt } from "@/lib/crypto";
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
    },
    updateInvestment: async (id: string, investment: InvestmentUpdate) => {
      const encryptionKey = useCryptoStore.getState().encryptionKey;
      if (!encryptionKey) throw new Error("Encryption key not found");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: Record<string, any> = { 
        updated_at: new Date().toISOString() 
      };
      
      if (investment.name !== undefined) updateData.name = investment.name;
      if (investment.category !== undefined) updateData.category = investment.category;
      if (investment.platform !== undefined) updateData.platform = investment.platform;
      if (investment.start_date !== undefined) updateData.start_date = investment.start_date;
      
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
    },
    deleteInvestment: async (id: string) => {
      const { error } = await supabase
        .from("investments")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      
      if (error) throw error;
      
      set((state) => ({
        investments: state.investments.filter((inv) => inv.id !== id),
      }));
    },
  };
});
