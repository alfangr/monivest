import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Category, CategoryInsert, CategoryUpdate } from "@/types";

interface CategoryState {
  categories: Category[];
  loading: boolean;
  lastFetchUserId: string | null;
  fetchCategories: (userId: string, force?: boolean) => Promise<void>;
  addCategory: (category: CategoryInsert) => Promise<void>;
  updateCategory: (id: string, category: CategoryUpdate) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

function deduplicateCategories(categories: Category[]): Category[] {
  const seen = new Set<string>();
  return categories.filter((cat) => {
    if (seen.has(cat.id)) return false;
    seen.add(cat.id);
    return true;
  });
}

export const useCategoryStore = create<CategoryState>((set, get) => {
  return {
    categories: [],
    loading: false,
    lastFetchUserId: null,
    fetchCategories: async (userId: string, force = false) => {
      const { loading, lastFetchUserId, categories } = get();
      
      if (loading) return;
      if (!force && lastFetchUserId === userId && categories.length > 0) return;
      
      set({ loading: true, lastFetchUserId: userId });
      
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      
      if (error) {
        set({ loading: false });
        throw error;
      }
      
      const uniqueCategories = deduplicateCategories(data as Category[]);
      set({ categories: uniqueCategories, loading: false });
    },
    addCategory: async (category: CategoryInsert) => {
      const { data, error } = await supabase
        .from("categories")
        .insert(category)
        .select()
        .single();
      
      if (error) throw error;
      
      set((state) => {
        const newCategories = [...state.categories, data as Category];
        return { categories: deduplicateCategories(newCategories) };
      });
    },
    updateCategory: async (id: string, category: CategoryUpdate) => {
      const updateData = { 
        ...category,
        updated_at: new Date().toISOString() 
      };

      const { data, error } = await supabase
        .from("categories")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      
      set((state) => ({
        categories: state.categories.map((cat) => cat.id === id ? (data as Category) : cat),
      }));
    },
    deleteCategory: async (id: string) => {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      set((state) => ({
        categories: state.categories.filter((cat) => cat.id !== id),
      }));
    },
  };
});
