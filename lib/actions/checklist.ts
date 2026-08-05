"use server";

import { revalidatePath } from "next/cache";

import { requireWeddingRole } from "@/lib/auth/require-wedding-role";
import { createClient } from "@/lib/supabase/server";
import {
  type CreateChecklistGroupInput,
  type CreateChecklistTaskInput,
  type UpdateChecklistGroupInput,
  type UpdateChecklistTaskInput,
  createChecklistGroupSchema,
  createChecklistTaskSchema,
  updateChecklistGroupSchema,
  updateChecklistTaskSchema,
} from "@/lib/validations/checklist";

export type ChecklistActionResult =
  | {
      success: true;
      message: string;
      id?: string;
    }
  | {
      success: false;
      message: string;
    };

function revalidateChecklistPages() {
  revalidatePath("/painel");
  revalidatePath("/painel/checklist");
  revalidatePath("/painel/cronograma");
}

function databaseMessage(
  code: string | undefined,
  fallback: string,
) {
  if (code === "23505") {
    return "Já existe uma etapa com esse nome.";
  }

  if (code === "23503") {
    return "A etapa selecionada não existe.";
  }

  if (code === "23514") {
    return "Um dos dados informados é inválido.";
  }

  return fallback;
}

async function requireChecklistManager() {
  return requireWeddingRole(["owner", "admin"]);
}

async function verifyGroup(
  weddingId: string,
  groupId: string,
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("checklist_groups")
    .select()
    .eq("id", groupId)
    .eq("wedding_id", weddingId)
    .maybeSingle();

  if (error) {
    console.error(
      "Erro ao validar etapa do checklist:",
      error,
    );
  }

  return data;
}

export async function initializeChecklistAction(): Promise<ChecklistActionResult> {
  const wedding = await requireChecklistManager();
  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("checklist_groups")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("wedding_id", wedding.id);

  if (countError) {
    console.error(
      "Erro ao verificar checklist:",
      countError,
    );

    return {
      success: false,
      message:
        "Não foi possível verificar a estrutura do checklist.",
    };
  }

  if ((count ?? 0) > 0) {
    return {
      success: false,
      message:
        "O checklist já possui etapas cadastradas.",
    };
  }

  const { error } = await supabase
    .from("checklist_groups")
    .insert([
      {
        wedding_id: wedding.id,
        title: "Primeiras decisões",
        description:
          "Definições essenciais para estruturar o casamento.",
        tone: "blue",
        sort_order: 1,
        updated_at: new Date().toISOString(),
      },
      {
        wedding_id: wedding.id,
        title: "Contratações e serviços",
        description:
          "Serviços, reservas e escolhas que sustentam o evento.",
        tone: "green",
        sort_order: 2,
        updated_at: new Date().toISOString(),
      },
      {
        wedding_id: wedding.id,
        title: "Identidade e experiência",
        description:
          "Detalhes visuais e decisões que dão personalidade ao casamento.",
        tone: "yellow",
        sort_order: 3,
        updated_at: new Date().toISOString(),
      },
      {
        wedding_id: wedding.id,
        title: "Convidados e finalização",
        description:
          "Convites, confirmações e providências finais para o grande dia.",
        tone: "terracotta",
        sort_order: 4,
        updated_at: new Date().toISOString(),
      },
    ]);

  if (error) {
    console.error(
      "Erro ao criar estrutura inicial do checklist:",
      error,
    );

    return {
      success: false,
      message: databaseMessage(
        error.code,
        "Não foi possível criar as etapas iniciais.",
      ),
    };
  }

  revalidateChecklistPages();

  return {
    success: true,
    message: "Etapas iniciais criadas.",
  };
}

export async function createChecklistGroupAction(
  input: CreateChecklistGroupInput,
): Promise<ChecklistActionResult> {
  const validation =
    createChecklistGroupSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false,
      message:
        validation.error.issues[0]?.message ??
        "Revise os dados da etapa.",
    };
  }

  const wedding = await requireChecklistManager();
  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("checklist_groups")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("wedding_id", wedding.id);

  if (countError) {
    return {
      success: false,
      message:
        "Não foi possível calcular a posição da etapa.",
    };
  }

  const { data, error } = await supabase
    .from("checklist_groups")
    .insert({
      wedding_id: wedding.id,
      title: validation.data.title,
      description:
        validation.data.description || null,
      tone: validation.data.tone,
      sort_order: (count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error(
      "Erro ao criar etapa do checklist:",
      error,
    );

    return {
      success: false,
      message: databaseMessage(
        error.code,
        "Não foi possível criar a etapa.",
      ),
    };
  }

  revalidateChecklistPages();

  return {
    success: true,
    message: "Etapa criada.",
    id: data.id,
  };
}

export async function updateChecklistGroupAction(
  input: UpdateChecklistGroupInput,
): Promise<ChecklistActionResult> {
  const validation =
    updateChecklistGroupSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false,
      message:
        validation.error.issues[0]?.message ??
        "Revise os dados da etapa.",
    };
  }

  const wedding = await requireChecklistManager();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("checklist_groups")
    .update({
      title: validation.data.title,
      description:
        validation.data.description || null,
      tone: validation.data.tone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", validation.data.id)
    .eq("wedding_id", wedding.id)
    .select()
    .maybeSingle();

  if (error) {
    console.error(
      "Erro ao atualizar etapa do checklist:",
      error,
    );

    return {
      success: false,
      message: databaseMessage(
        error.code,
        "Não foi possível atualizar a etapa.",
      ),
    };
  }

  if (!data) {
    return {
      success: false,
      message: "Etapa não encontrada.",
    };
  }

  revalidateChecklistPages();

  return {
    success: true,
    message: "Etapa atualizada.",
    id: data.id,
  };
}

export async function deleteChecklistGroupAction(
  groupId: string,
): Promise<ChecklistActionResult> {
  const wedding = await requireChecklistManager();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("checklist_groups")
    .delete()
    .eq("id", groupId)
    .eq("wedding_id", wedding.id)
    .select()
    .maybeSingle();

  if (error) {
    console.error(
      "Erro ao excluir etapa do checklist:",
      error,
    );

    return {
      success: false,
      message:
        "Não foi possível excluir a etapa.",
    };
  }

  if (!data) {
    return {
      success: false,
      message: "Etapa não encontrada.",
    };
  }

  revalidateChecklistPages();

  return {
    success: true,
    message:
      "Etapa e suas tarefas foram excluídas.",
  };
}

export async function createChecklistTaskAction(
  input: CreateChecklistTaskInput,
): Promise<ChecklistActionResult> {
  const validation =
    createChecklistTaskSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false,
      message:
        validation.error.issues[0]?.message ??
        "Revise os dados da tarefa.",
    };
  }

  const wedding = await requireChecklistManager();

  const group = await verifyGroup(
    wedding.id,
    validation.data.groupId,
  );

  if (!group) {
    return {
      success: false,
      message: "A etapa selecionada não existe.",
    };
  }

  if (
    validation.data.responsibleType === "other" &&
    !validation.data.responsibleName
  ) {
    return {
      success: false,
      message:
        "Informe o nome do responsável.",
    };
  }

  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("checklist_tasks")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("wedding_id", wedding.id)
    .eq("group_id", group.id);

  if (countError) {
    return {
      success: false,
      message:
        "Não foi possível calcular a posição da tarefa.",
    };
  }

  const completedAt =
    validation.data.status === "completed"
      ? new Date().toISOString()
      : null;

  const { data, error } = await supabase
    .from("checklist_tasks")
    .insert({
      wedding_id: wedding.id,
      group_id: group.id,
      title: validation.data.title,
      description:
        validation.data.description || null,
      due_date:
        validation.data.dueDate || null,
      responsible_type:
        validation.data.responsibleType,
      responsible_name:
        validation.data.responsibleType === "other"
          ? validation.data.responsibleName
          : null,
      status: validation.data.status,
      priority: validation.data.priority,
      completed_at: completedAt,
      source_type: "manual",
      sort_order: (count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error(
      "Erro ao criar tarefa do checklist:",
      error,
    );

    return {
      success: false,
      message: databaseMessage(
        error.code,
        "Não foi possível criar a tarefa.",
      ),
    };
  }

  revalidateChecklistPages();

  return {
    success: true,
    message: "Tarefa adicionada.",
    id: data.id,
  };
}

export async function updateChecklistTaskAction(
  input: UpdateChecklistTaskInput,
): Promise<ChecklistActionResult> {
  const validation =
    updateChecklistTaskSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false,
      message:
        validation.error.issues[0]?.message ??
        "Revise os dados da tarefa.",
    };
  }

  const wedding = await requireChecklistManager();

  const group = await verifyGroup(
    wedding.id,
    validation.data.groupId,
  );

  if (!group) {
    return {
      success: false,
      message: "A etapa selecionada não existe.",
    };
  }

  if (
    validation.data.responsibleType === "other" &&
    !validation.data.responsibleName
  ) {
    return {
      success: false,
      message:
        "Informe o nome do responsável.",
    };
  }

  const supabase = await createClient();

  const completedAt =
    validation.data.status === "completed"
      ? new Date().toISOString()
      : null;

  const { data, error } = await supabase
    .from("checklist_tasks")
    .update({
      group_id: group.id,
      title: validation.data.title,
      description:
        validation.data.description || null,
      due_date:
        validation.data.dueDate || null,
      responsible_type:
        validation.data.responsibleType,
      responsible_name:
        validation.data.responsibleType === "other"
          ? validation.data.responsibleName
          : null,
      status: validation.data.status,
      priority: validation.data.priority,
      completed_at: completedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", validation.data.id)
    .eq("wedding_id", wedding.id)
    .select()
    .maybeSingle();

  if (error) {
    console.error(
      "Erro ao atualizar tarefa do checklist:",
      error,
    );

    return {
      success: false,
      message: databaseMessage(
        error.code,
        "Não foi possível atualizar a tarefa.",
      ),
    };
  }

  if (!data) {
    return {
      success: false,
      message: "Tarefa não encontrada.",
    };
  }

  revalidateChecklistPages();

  return {
    success: true,
    message: "Tarefa atualizada.",
    id: data.id,
  };
}

export async function toggleChecklistTaskAction(
  taskId: string,
  completed: boolean,
): Promise<ChecklistActionResult> {
  const wedding = await requireChecklistManager();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("checklist_tasks")
    .update({
      status: completed ? "completed" : "pending",
      completed_at: completed
        ? new Date().toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .eq("wedding_id", wedding.id)
    .select()
    .maybeSingle();

  if (error || !data) {
    console.error(
      "Erro ao alterar conclusão da tarefa:",
      error,
    );

    return {
      success: false,
      message:
        "Não foi possível alterar a tarefa.",
    };
  }

  revalidateChecklistPages();

  return {
    success: true,
    message: completed
      ? "Tarefa concluída."
      : "Tarefa reaberta.",
  };
}

export async function deleteChecklistTaskAction(
  taskId: string,
): Promise<ChecklistActionResult> {
  const wedding = await requireChecklistManager();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("checklist_tasks")
    .delete()
    .eq("id", taskId)
    .eq("wedding_id", wedding.id)
    .select()
    .maybeSingle();

  if (error) {
    console.error(
      "Erro ao excluir tarefa do checklist:",
      error,
    );

    return {
      success: false,
      message:
        "Não foi possível excluir a tarefa.",
    };
  }

  if (!data) {
    return {
      success: false,
      message: "Tarefa não encontrada.",
    };
  }

  revalidateChecklistPages();

  return {
    success: true,
    message: "Tarefa excluída.",
  };
}
