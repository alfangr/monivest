import type { Database } from "./supabase";

export type User = Database["public"]["Tables"]["users"]["Row"] & {
  encryption_salt?: string | null;
};

export type UserInsert = Database["public"]["Tables"]["users"]["Insert"] & {
  encryption_salt?: string | null;
};

export type UserUpdate = Database["public"]["Tables"]["users"]["Update"] & {
  encryption_salt?: string | null;
};

export type ReturnType = "monthly" | "annual";

export type Investment = Database["public"]["Tables"]["investments"]["Row"] & {
  auto_calculate?: boolean | null;
  return_type?: ReturnType | null;
  tax_rate?: number | null;
};

export type InvestmentInsert = Database["public"]["Tables"]["investments"]["Insert"] & {
  auto_calculate?: boolean | null;
  return_type?: ReturnType | null;
  tax_rate?: number | null;
};

export type InvestmentUpdate = Database["public"]["Tables"]["investments"]["Update"] & {
  auto_calculate?: boolean | null;
  return_type?: ReturnType | null;
  tax_rate?: number | null;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
};

export type CategoryInsert = {
  user_id: string;
  name: string;
  color?: string;
  created_at?: string;
  updated_at?: string;
};

export type CategoryUpdate = {
  name?: string;
  color?: string;
  updated_at?: string;
};

export type EncryptedInvestment = Omit<
  Database["public"]["Tables"]["investments"]["Row"],
  "initial_amount" | "current_value" | "monthly_return" | "notes"
> & {
  initial_amount: string;
  current_value: string;
  monthly_return: string | null;
  notes: string | null;
};

export type EncryptedInvestmentInsert = Omit<
  Database["public"]["Tables"]["investments"]["Insert"],
  "initial_amount" | "current_value" | "monthly_return" | "notes"
> & {
  initial_amount: string;
  current_value: string;
  monthly_return: string | null;
  notes: string | null;
};

export type ActivityLog = Database["public"]["Tables"]["activity_logs"]["Row"];

export type ActivityLogInsert = Database["public"]["Tables"]["activity_logs"]["Insert"];

export type ActivityAction = "create" | "update" | "delete" | "login" | "logout";

export type EntityType = "investment" | "category" | "user";
