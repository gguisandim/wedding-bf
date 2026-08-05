"use server";

import { revalidatePath } from "next/cache";

import { requireWeddingRole } from "@/lib/auth/require-wedding-role";
import { createClient } from "@/lib/supabase/server";
import {
  type CreateCeremonyBlockInput,
  type CreateCeremonyChecklistItemInput,
  type ReorderCeremonyBlocksInput,
  type UpdateCeremonyBlockInput,
  type UpdateCeremonyChecklistItemInput,
  createCeremonyBlockSchema,
  createCeremonyChecklistItemSchema,
  reorderCeremonyBlocksSchema,
  updateCeremonyBlockSchema,
  updateCeremonyChecklistItemSchema,
} from "@/lib/validations/ceremony";

export type CeremonyActionResult =
  | { success: true; message: string; id?: string }
  | { success: false; message: string };

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function revalidateCeremonyPages() {
  revalidatePath("/painel");
  revalidatePath("/painel/cerimonia");
  revalidatePath("/painel/checklist");
  revalidatePath("/painel/cronograma");
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(value: number) {
  const normalized = ((value % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )}:00`;
}

async function requireCeremonyManager() {
  return requireWeddingRole(["owner", "admin"]);
}

async function verifyBlock(
  supabase: SupabaseServerClient,
  weddingId: string,
  blockId: string,
) {
  return supabase
    .from("ceremony_blocks")
    .select()
    .eq("id", blockId)
    .eq("wedding_id", weddingId)
    .maybeSingle();
}

async function recalculateTimeline(
  supabase: SupabaseServerClient,
  weddingId: string,
): Promise<CeremonyActionResult> {
  const blocksResult = await supabase
    .from("ceremony_blocks")
    .select()
    .eq("wedding_id", weddingId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (blocksResult.error) {
    console.error("Erro ao recalcular cerimônia:", blocksResult.error);
    return { success: false, message: "Não foi possível recalcular os horários." };
  }

  const blocks = blocksResult.data ?? [];

  if (blocks.length === 0) {
    return { success: true, message: "Horários atualizados." };
  }

  let currentTime = timeToMinutes(blocks[0].start_time);

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];

    const updateResult = await supabase
      .from("ceremony_blocks")
      .update({
        start_time: minutesToTime(currentTime),
        sort_order: index,
        updated_at: new Date().toISOString(),
      })
      .eq("id", block.id)
      .eq("wedding_id", weddingId);

    if (updateResult.error) {
      console.error("Erro ao atualizar horário:", updateResult.error);
      return {
        success: false,
        message: "Não foi possível recalcular todos os horários.",
      };
    }

    currentTime += block.duration_minutes;
  }

  return { success: true, message: "Horários atualizados." };
}

async function ensureCeremonyChecklistGroup(
  supabase: SupabaseServerClient,
  weddingId: string,
): Promise<
  | { success: true; groupId: string }
  | { success: false; message: string }
> {
  const existingResult = await supabase
    .from("checklist_groups")
    .select()
    .eq("wedding_id", weddingId)
    .eq("title", "Cerimônia")
    .maybeSingle();

  if (existingResult.error) {
    console.error("Erro ao localizar etapa da cerimônia:", existingResult.error);
    return {
      success: false,
      message: "Não foi possível localizar a etapa da cerimônia no checklist.",
    };
  }

  if (existingResult.data) {
    return { success: true, groupId: existingResult.data.id };
  }

  const lastGroupResult = await supabase
    .from("checklist_groups")
    .select()
    .eq("wedding_id", weddingId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastGroupResult.error) {
    return {
      success: false,
      message: "Não foi possível preparar a etapa da cerimônia.",
    };
  }

  const insertResult = await supabase
    .from("checklist_groups")
    .insert({
      wedding_id: weddingId,
      title: "Cerimônia",
      description:
        "Pendências ligadas aos momentos e à execução da cerimônia.",
      tone: "terracotta",
      sort_order: (lastGroupResult.data?.sort_order ?? -1) + 1,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertResult.error?.code === "23505") {
    const retryResult = await supabase
      .from("checklist_groups")
      .select()
      .eq("wedding_id", weddingId)
      .eq("title", "Cerimônia")
      .maybeSingle();

    if (retryResult.data) {
      return { success: true, groupId: retryResult.data.id };
    }
  }

  if (insertResult.error || !insertResult.data) {
    console.error("Erro ao criar etapa da cerimônia:", insertResult.error);
    return {
      success: false,
      message: "Não foi possível criar a etapa da cerimônia no checklist.",
    };
  }

  return { success: true, groupId: insertResult.data.id };
}

export async function initializeCeremonyAction(): Promise<CeremonyActionResult> {
  const wedding = await requireCeremonyManager();
  const supabase = await createClient();

  const countResult = await supabase
    .from("ceremony_blocks")
    .select("id", { count: "exact", head: true })
    .eq("wedding_id", wedding.id);

  if (countResult.error) {
    return { success: false, message: "Não foi possível verificar o roteiro." };
  }

  if ((countResult.count ?? 0) > 0) {
    return {
      success: false,
      message: "A cerimônia já possui momentos cadastrados.",
    };
  }

  const initialBlocks = [
    ["16:30:00", 30, "Recepção dos convidados", "reception"],
    ["17:00:00", 8, "Entrada dos padrinhos", "entrance"],
    ["17:08:00", 4, "Entrada do noivo", "entrance"],
    ["17:12:00", 5, "Entrada da noiva", "entrance"],
    ["17:17:00", 10, "Boas-vindas e celebração", "speech"],
    ["17:27:00", 10, "Leitura dos votos", "vows"],
    ["17:37:00", 6, "Troca das alianças", "ritual"],
    ["17:43:00", 7, "Assinaturas", "signing"],
    ["17:50:00", 5, "Saída dos noivos", "exit"],
  ] as const;

  const insertResult = await supabase.from("ceremony_blocks").insert(
    initialBlocks.map(([startTime, duration, title, blockType], index) => ({
      wedding_id: wedding.id,
      start_time: startTime,
      duration_minutes: duration,
      title,
      block_type: blockType,
      status: "planned",
      sort_order: index,
      updated_at: new Date().toISOString(),
    })),
  );

  if (insertResult.error) {
    console.error("Erro ao criar roteiro inicial:", insertResult.error);
    return { success: false, message: "Não foi possível criar o roteiro inicial." };
  }

  revalidateCeremonyPages();
  return { success: true, message: "Roteiro inicial criado." };
}

export async function createCeremonyBlockAction(
  input: CreateCeremonyBlockInput,
): Promise<CeremonyActionResult> {
  const validation = createCeremonyBlockSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message ?? "Revise os dados.",
    };
  }

  const wedding = await requireCeremonyManager();
  const supabase = await createClient();

  const blocksResult = await supabase
    .from("ceremony_blocks")
    .select()
    .eq("wedding_id", wedding.id)
    .order("sort_order", { ascending: true });

  if (blocksResult.error) {
    return { success: false, message: "Não foi possível calcular a posição." };
  }

  const blocks = blocksResult.data ?? [];
  let startTime = `${validation.data.startTime}:00`;

  if (blocks.length > 0) {
    const lastBlock = blocks[blocks.length - 1];
    startTime = minutesToTime(
      timeToMinutes(lastBlock.start_time) + lastBlock.duration_minutes,
    );
  }

  const insertResult = await supabase
    .from("ceremony_blocks")
    .insert({
      wedding_id: wedding.id,
      start_time: startTime,
      duration_minutes: validation.data.durationMinutes,
      title: validation.data.title,
      description: validation.data.description || null,
      responsible: validation.data.responsible || null,
      participants: validation.data.participants || null,
      instructions: validation.data.instructions || null,
      block_type: validation.data.type,
      status: validation.data.status,
      sort_order: blocks.length,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertResult.error || !insertResult.data) {
    console.error("Erro ao criar momento:", insertResult.error);
    return { success: false, message: "Não foi possível criar o momento." };
  }

  const recalculated = await recalculateTimeline(supabase, wedding.id);
  if (!recalculated.success) {
    return recalculated;
  }

  revalidateCeremonyPages();
  return {
    success: true,
    message: "Momento adicionado à cerimônia.",
    id: insertResult.data.id,
  };
}

export async function updateCeremonyBlockAction(
  input: UpdateCeremonyBlockInput,
): Promise<CeremonyActionResult> {
  const validation = updateCeremonyBlockSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message ?? "Revise os dados.",
    };
  }

  const wedding = await requireCeremonyManager();
  const supabase = await createClient();

  const currentResult = await verifyBlock(supabase, wedding.id, validation.data.id);
  if (currentResult.error || !currentResult.data) {
    return { success: false, message: "Momento não encontrado." };
  }

  const firstResult = await supabase
    .from("ceremony_blocks")
    .select()
    .eq("wedding_id", wedding.id)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (firstResult.error) {
    return { success: false, message: "Não foi possível verificar o início." };
  }

  const isFirst = firstResult.data?.id === validation.data.id;

  const updateResult = await supabase
    .from("ceremony_blocks")
    .update({
      start_time: isFirst
        ? `${validation.data.startTime}:00`
        : currentResult.data.start_time,
      duration_minutes: validation.data.durationMinutes,
      title: validation.data.title,
      description: validation.data.description || null,
      responsible: validation.data.responsible || null,
      participants: validation.data.participants || null,
      instructions: validation.data.instructions || null,
      block_type: validation.data.type,
      status: validation.data.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", validation.data.id)
    .eq("wedding_id", wedding.id)
    .select()
    .maybeSingle();

  if (updateResult.error || !updateResult.data) {
    return { success: false, message: "Não foi possível atualizar o momento." };
  }

  const recalculated = await recalculateTimeline(supabase, wedding.id);
  if (!recalculated.success) {
    return recalculated;
  }

  revalidateCeremonyPages();
  return { success: true, message: "Momento atualizado.", id: updateResult.data.id };
}

export async function deleteCeremonyBlockAction(
  blockId: string,
): Promise<CeremonyActionResult> {
  const wedding = await requireCeremonyManager();
  const supabase = await createClient();

  const currentResult = await verifyBlock(supabase, wedding.id, blockId);
  if (currentResult.error || !currentResult.data) {
    return { success: false, message: "Momento não encontrado." };
  }

  const tasksDeleteResult = await supabase
    .from("checklist_tasks")
    .delete()
    .eq("wedding_id", wedding.id)
    .eq("source_type", "ceremony")
    .eq("source_id", blockId);

  if (tasksDeleteResult.error) {
    return {
      success: false,
      message: "Não foi possível excluir as tarefas deste momento.",
    };
  }

  const deleteResult = await supabase
    .from("ceremony_blocks")
    .delete()
    .eq("id", blockId)
    .eq("wedding_id", wedding.id)
    .select()
    .maybeSingle();

  if (deleteResult.error || !deleteResult.data) {
    return { success: false, message: "Não foi possível excluir o momento." };
  }

  const recalculated = await recalculateTimeline(supabase, wedding.id);
  if (!recalculated.success) {
    return recalculated;
  }

  revalidateCeremonyPages();
  return { success: true, message: "Momento e suas tarefas foram excluídos." };
}

export async function duplicateCeremonyBlockAction(
  blockId: string,
): Promise<CeremonyActionResult> {
  const wedding = await requireCeremonyManager();
  const supabase = await createClient();

  const currentResult = await verifyBlock(supabase, wedding.id, blockId);
  if (currentResult.error || !currentResult.data) {
    return { success: false, message: "Momento não encontrado." };
  }

  const current = currentResult.data;
  const blocksResult = await supabase
    .from("ceremony_blocks")
    .select()
    .eq("wedding_id", wedding.id)
    .order("sort_order", { ascending: false });

  if (blocksResult.error) {
    return { success: false, message: "Não foi possível duplicar o momento." };
  }

  for (const block of blocksResult.data ?? []) {
    if (block.sort_order <= current.sort_order) {
      continue;
    }

    const shiftResult = await supabase
      .from("ceremony_blocks")
      .update({
        sort_order: block.sort_order + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", block.id)
      .eq("wedding_id", wedding.id);

    if (shiftResult.error) {
      return { success: false, message: "Não foi possível reorganizar os momentos." };
    }
  }

  const insertResult = await supabase
    .from("ceremony_blocks")
    .insert({
      wedding_id: wedding.id,
      start_time: current.start_time,
      duration_minutes: current.duration_minutes,
      title: `${current.title} — cópia`,
      description: current.description,
      responsible: current.responsible,
      participants: current.participants,
      instructions: current.instructions,
      block_type: current.block_type,
      status: "planned",
      sort_order: current.sort_order + 1,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertResult.error || !insertResult.data) {
    return { success: false, message: "Não foi possível duplicar o momento." };
  }

  const tasksResult = await supabase
    .from("checklist_tasks")
    .select()
    .eq("wedding_id", wedding.id)
    .eq("source_type", "ceremony")
    .eq("source_id", blockId)
    .order("sort_order", { ascending: true });

  if (!tasksResult.error && (tasksResult.data ?? []).length > 0) {
    const newBlockId = insertResult.data.id;

    const tasksInsertResult = await supabase.from("checklist_tasks").insert(
      (tasksResult.data ?? []).map((task, index) => ({
        wedding_id: wedding.id,
        group_id: task.group_id,
        title: task.title,
        description: task.description,
        due_date: task.due_date,
        responsible_type: task.responsible_type,
        responsible_name: task.responsible_name,
        status: "pending",
        priority: task.priority,
        completed_at: null,
        source_type: "ceremony",
        source_id: newBlockId,
        sort_order: index,
        updated_at: new Date().toISOString(),
      })),
    );

    if (tasksInsertResult.error) {
      console.error("Erro ao duplicar tarefas:", tasksInsertResult.error);
    }
  }

  const recalculated = await recalculateTimeline(supabase, wedding.id);
  if (!recalculated.success) {
    return recalculated;
  }

  revalidateCeremonyPages();
  return { success: true, message: "Momento duplicado.", id: insertResult.data.id };
}

export async function reorderCeremonyBlocksAction(
  input: ReorderCeremonyBlocksInput,
): Promise<CeremonyActionResult> {
  const validation = reorderCeremonyBlocksSchema.safeParse(input);

  if (!validation.success) {
    return { success: false, message: "A nova ordem é inválida." };
  }

  const wedding = await requireCeremonyManager();
  const supabase = await createClient();

  const currentResult = await supabase
    .from("ceremony_blocks")
    .select("id")
    .eq("wedding_id", wedding.id);

  if (currentResult.error) {
    return { success: false, message: "Não foi possível verificar a ordem atual." };
  }

  const currentIds = (currentResult.data ?? []).map((block) => block.id).sort();
  const orderedIds = validation.data.orderedIds;
  const nextIds = [...orderedIds].sort();

  if (
    currentIds.length !== nextIds.length ||
    currentIds.some((id, index) => id !== nextIds[index])
  ) {
    return {
      success: false,
      message: "A ordem enviada não corresponde aos momentos cadastrados.",
    };
  }

  for (let index = 0; index < orderedIds.length; index += 1) {
    const updateResult = await supabase
      .from("ceremony_blocks")
      .update({ sort_order: index, updated_at: new Date().toISOString() })
      .eq("id", orderedIds[index])
      .eq("wedding_id", wedding.id);

    if (updateResult.error) {
      return { success: false, message: "Não foi possível salvar a nova ordem." };
    }
  }

  const recalculated = await recalculateTimeline(supabase, wedding.id);
  if (!recalculated.success) {
    return recalculated;
  }

  revalidateCeremonyPages();
  return { success: true, message: "Ordem e horários atualizados." };
}

export async function createCeremonyChecklistItemAction(
  input: CreateCeremonyChecklistItemInput,
): Promise<CeremonyActionResult> {
  const validation = createCeremonyChecklistItemSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message ?? "Revise os dados da tarefa.",
    };
  }

  const wedding = await requireCeremonyManager();
  const supabase = await createClient();

  const blockResult = await verifyBlock(supabase, wedding.id, validation.data.blockId);
  if (blockResult.error || !blockResult.data) {
    return { success: false, message: "O momento selecionado não existe." };
  }

  const groupResult = await ensureCeremonyChecklistGroup(supabase, wedding.id);
  if (!groupResult.success) {
    return groupResult;
  }

  const countResult = await supabase
    .from("checklist_tasks")
    .select("id", { count: "exact", head: true })
    .eq("wedding_id", wedding.id)
    .eq("source_type", "ceremony")
    .eq("source_id", validation.data.blockId);

  if (countResult.error) {
    return { success: false, message: "Não foi possível calcular a posição da tarefa." };
  }

  const insertResult = await supabase
    .from("checklist_tasks")
    .insert({
      wedding_id: wedding.id,
      group_id: groupResult.groupId,
      title: validation.data.title,
      description: null,
      due_date: validation.data.dueDate || null,
      responsible_type: validation.data.responsibleType,
      responsible_name:
        validation.data.responsibleType === "other"
          ? validation.data.responsibleName
          : null,
      status: "pending",
      priority: validation.data.priority,
      completed_at: null,
      source_type: "ceremony",
      source_id: validation.data.blockId,
      sort_order: countResult.count ?? 0,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertResult.error || !insertResult.data) {
    console.error("Erro ao criar tarefa da cerimônia:", insertResult.error);
    return { success: false, message: "Não foi possível criar a tarefa." };
  }

  revalidateCeremonyPages();
  return {
    success: true,
    message: "Tarefa adicionada à cerimônia e ao checklist geral.",
    id: insertResult.data.id,
  };
}

export async function updateCeremonyChecklistItemAction(
  input: UpdateCeremonyChecklistItemInput,
): Promise<CeremonyActionResult> {
  const validation = updateCeremonyChecklistItemSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message ?? "Revise os dados da tarefa.",
    };
  }

  const wedding = await requireCeremonyManager();
  const supabase = await createClient();

  const updateResult = await supabase
    .from("checklist_tasks")
    .update({
      title: validation.data.title,
      due_date: validation.data.dueDate || null,
      priority: validation.data.priority,
      responsible_type: validation.data.responsibleType,
      responsible_name:
        validation.data.responsibleType === "other"
          ? validation.data.responsibleName
          : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", validation.data.id)
    .eq("wedding_id", wedding.id)
    .eq("source_type", "ceremony")
    .eq("source_id", validation.data.blockId)
    .select()
    .maybeSingle();

  if (updateResult.error || !updateResult.data) {
    return { success: false, message: "Não foi possível atualizar a tarefa." };
  }

  revalidateCeremonyPages();
  return { success: true, message: "Tarefa atualizada.", id: updateResult.data.id };
}

export async function toggleCeremonyChecklistItemAction(
  taskId: string,
): Promise<CeremonyActionResult> {
  const wedding = await requireCeremonyManager();
  const supabase = await createClient();

  const currentResult = await supabase
    .from("checklist_tasks")
    .select()
    .eq("id", taskId)
    .eq("wedding_id", wedding.id)
    .eq("source_type", "ceremony")
    .maybeSingle();

  if (currentResult.error || !currentResult.data) {
    return { success: false, message: "Tarefa não encontrada." };
  }

  const completed = currentResult.data.status === "completed";

  const updateResult = await supabase
    .from("checklist_tasks")
    .update({
      status: completed ? "pending" : "completed",
      completed_at: completed ? null : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .eq("wedding_id", wedding.id)
    .select()
    .maybeSingle();

  if (updateResult.error || !updateResult.data) {
    return { success: false, message: "Não foi possível alterar a tarefa." };
  }

  revalidateCeremonyPages();
  return {
    success: true,
    message: completed ? "Tarefa reaberta." : "Tarefa concluída.",
  };
}

export async function deleteCeremonyChecklistItemAction(
  taskId: string,
): Promise<CeremonyActionResult> {
  const wedding = await requireCeremonyManager();
  const supabase = await createClient();

  const deleteResult = await supabase
    .from("checklist_tasks")
    .delete()
    .eq("id", taskId)
    .eq("wedding_id", wedding.id)
    .eq("source_type", "ceremony")
    .select()
    .maybeSingle();

  if (deleteResult.error || !deleteResult.data) {
    return { success: false, message: "Não foi possível excluir a tarefa." };
  }

  revalidateCeremonyPages();
  return { success: true, message: "Tarefa excluída." };
}
