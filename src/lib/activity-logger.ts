import { supabase } from "./supabase";
import type { ActivityLogInsert, ActivityAction, EntityType } from "@/types";
import type { Json } from "@/types/supabase";

export async function logActivity(
  userId: string,
  action: ActivityAction,
  entityType: EntityType,
  entityId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const log: ActivityLogInsert = {
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    metadata: metadata as Json,
  };

  const { error } = await supabase.from("activity_logs").insert(log);
  if (error) {
    console.error("Failed to log activity:", error);
  }
}
