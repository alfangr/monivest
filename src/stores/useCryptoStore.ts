import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SerializedCryptoStore {
  encryptionKey: number[] | null;
  isSetupComplete: boolean;
}

interface CryptoStore {
  encryptionKey: Uint8Array | null;
  isSetupComplete: boolean;
  setEncryptionKey: (key: Uint8Array | null) => void;
  setSetupComplete: (complete: boolean) => void;
  clearAll: () => void;
}

export const useCryptoStore = create<CryptoStore>()(
  persist(
    (set) => ({
      encryptionKey: null,
      isSetupComplete: false,
      setEncryptionKey: (key) => set({ encryptionKey: key }),
      setSetupComplete: (complete) => set({ isSetupComplete: complete }),
      clearAll: () => set({ encryptionKey: null, isSetupComplete: false }),
    }),
    {
      name: "monivest-crypto-storage",
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str) as SerializedCryptoStore;
          return {
            state: {
              ...parsed,
              encryptionKey: parsed.encryptionKey
                ? new Uint8Array(parsed.encryptionKey)
                : null,
            },
          };
        },
        setItem: (name, value) => {
          const { encryptionKey, ...rest } = value.state as CryptoStore;
          const serialized: SerializedCryptoStore = {
            ...rest,
            encryptionKey: encryptionKey ? Array.from(encryptionKey) : null,
          };
          localStorage.setItem(name, JSON.stringify(serialized));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
