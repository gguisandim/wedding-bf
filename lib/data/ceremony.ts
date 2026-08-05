import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type CeremonyBlockRow =
  Database["public"]["Tables"]["ceremony_blocks"]["Row"];
type ChecklistTaskRow =
  Database["public"]["Tables"]["checklist_tasks"]["Row"];

export type CeremonyManagementData = {
  blocks: CeremonyBlockRow[];
  tasks: ChecklistTaskRow[];
};

export async function getCeremonyManagementData(
  weddingId: string,
): Promise<CeremonyManagementData> {
  const supabase = await createClient();

  const blocksResult = await supabase
    .from("ceremony_blocks")
    .select()
    .eq("wedding_id", weddingId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (blocksResult.error) {
    console.error("Erro ao carregar cerimônia:", blocksResult.error);
    throw new Error("Não foi possível carregar a cerimônia.");
  }

  const blocks = blocksResult.data ?? [];
  const blockIds = blocks.map((block) => block.id);

  if (blockIds.length === 0) {
    return { blocks, tasks: [] };
  }

  const tasksResult = await supabase
    .from("checklist_tasks")
    .select()
    .eq("wedding_id", weddingId)
    .eq("source_type", "ceremony")
    .in("source_id", blockIds)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (tasksResult.error) {
    console.error(
      "Erro ao carregar tarefas da cerimônia:",
      tasksResult.error,
    );
    throw new Error("Não foi possível carregar as tarefas da cerimônia.");
  }

  return {
    blocks,
    tasks: tasksResult.data ?? [],
  };
}
