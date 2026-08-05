"use server";

import { revalidatePath } from "next/cache";

import { requireWeddingRole } from "@/lib/auth/require-wedding-role";
import { createClient } from "@/lib/supabase/server";

import {
  type CreateCronogramaEventInput,
  type UpdateCronogramaEventInput,
  createCronogramaEventSchema,
  updateCronogramaEventSchema,
} from "@/lib/validations/cronograma";

export type CronogramaActionResult =
  | {
      success: true;
      message: string;
      id?: string;
    }
  | {
      success: false;
      message: string;
    };

function revalidateCronograma() {
  revalidatePath("/painel");
  revalidatePath(
    "/painel/cronograma",
  );
}

function normalizeTime(
  value: string | undefined,
  allDay: boolean,
) {
  if (allDay || !value) {
    return null;
  }

  return `${value}:00`;
}

export async function createCronogramaEventAction(
  input: CreateCronogramaEventInput,
): Promise<CronogramaActionResult> {
  const validation =
    createCronogramaEventSchema.safeParse(
      input,
    );

  if (!validation.success) {
    return {
      success: false,
      message:
        validation.error.issues[0]?.message ??
        "Revise os dados do compromisso.",
    };
  }

  const wedding =
    await requireWeddingRole([
      "owner",
      "admin",
    ]);

  const supabase =
    await createClient();

  const { data, error } =
    await supabase
      .from("calendar_events")
      .insert({
        wedding_id: wedding.id,

        title:
          validation.data.title,

        description:
          validation.data.description ||
          null,

        event_date:
          validation.data.eventDate,

        start_time:
          normalizeTime(
            validation.data.startTime,
            validation.data.allDay,
          ),

        end_time:
          normalizeTime(
            validation.data.endTime,
            validation.data.allDay,
          ),

        all_day:
          validation.data.allDay,

        category:
          validation.data.category,

        location:
          validation.data.location ||
          null,

        responsible_type:
          validation.data
            .responsibleType,

        responsible_name:
          validation.data
            .responsibleType ===
          "other"
            ? validation.data
                .responsibleName
            : null,

        status: "planned",

        priority:
          validation.data.priority,

        updated_at:
          new Date().toISOString(),
      })
      .select()
      .single();

  if (error) {
    console.error(
      "Erro ao criar compromisso:",
      error,
    );

    return {
      success: false,
      message:
        "Não foi possível criar o compromisso.",
    };
  }

  revalidateCronograma();

  return {
    success: true,
    message:
      "Compromisso adicionado ao cronograma.",
    id: data.id,
  };
}

export async function updateCronogramaEventAction(
  input: UpdateCronogramaEventInput,
): Promise<CronogramaActionResult> {
  const validation =
    updateCronogramaEventSchema.safeParse(
      input,
    );

  if (!validation.success) {
    return {
      success: false,
      message:
        validation.error.issues[0]?.message ??
        "Revise os dados do compromisso.",
    };
  }

  const wedding =
    await requireWeddingRole([
      "owner",
      "admin",
    ]);

  const supabase =
    await createClient();

  const { data, error } =
    await supabase
      .from("calendar_events")
      .update({
        title:
          validation.data.title,

        description:
          validation.data.description ||
          null,

        event_date:
          validation.data.eventDate,

        start_time:
          normalizeTime(
            validation.data.startTime,
            validation.data.allDay,
          ),

        end_time:
          normalizeTime(
            validation.data.endTime,
            validation.data.allDay,
          ),

        all_day:
          validation.data.allDay,

        category:
          validation.data.category,

        location:
          validation.data.location ||
          null,

        responsible_type:
          validation.data
            .responsibleType,

        responsible_name:
          validation.data
            .responsibleType ===
          "other"
            ? validation.data
                .responsibleName
            : null,

        priority:
          validation.data.priority,

        updated_at:
          new Date().toISOString(),
      })
      .eq("id", validation.data.id)
      .eq("wedding_id", wedding.id)
      .select()
      .maybeSingle();

  if (error) {
    console.error(
      "Erro ao atualizar compromisso:",
      error,
    );

    return {
      success: false,
      message:
        "Não foi possível atualizar o compromisso.",
    };
  }

  if (!data) {
    return {
      success: false,
      message:
        "Compromisso não encontrado.",
    };
  }

  revalidateCronograma();

  return {
    success: true,
    message:
      "Compromisso atualizado.",
    id: data.id,
  };
}

export async function setCronogramaEventCompletedAction(
  eventId: string,
  completed: boolean,
): Promise<CronogramaActionResult> {
  const wedding =
    await requireWeddingRole([
      "owner",
      "admin",
    ]);

  const supabase =
    await createClient();

  const { data, error } =
    await supabase
      .from("calendar_events")
      .update({
        status: completed
          ? "completed"
          : "planned",

        completed_at: completed
          ? new Date().toISOString()
          : null,

        updated_at:
          new Date().toISOString(),
      })
      .eq("id", eventId)
      .eq("wedding_id", wedding.id)
      .select()
      .maybeSingle();

  if (error || !data) {
    return {
      success: false,
      message:
        "Não foi possível alterar a situação do compromisso.",
    };
  }

  revalidateCronograma();

  return {
    success: true,
    message: completed
      ? "Compromisso concluído."
      : "Compromisso reaberto.",
  };
}

export async function deleteCronogramaEventAction(
  eventId: string,
): Promise<CronogramaActionResult> {
  const wedding =
    await requireWeddingRole([
      "owner",
      "admin",
    ]);

  const supabase =
    await createClient();

  const { data, error } =
    await supabase
      .from("calendar_events")
      .delete()
      .eq("id", eventId)
      .eq("wedding_id", wedding.id)
      .select()
      .maybeSingle();

  if (error || !data) {
    return {
      success: false,
      message:
        "Não foi possível excluir o compromisso.",
    };
  }

  revalidateCronograma();

  return {
    success: true,
    message:
      "Compromisso excluído.",
  };
}
