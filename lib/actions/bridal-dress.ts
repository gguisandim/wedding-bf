"use server";

import { revalidatePath } from "next/cache";

import { requireWeddingRole } from "@/lib/auth/require-wedding-role";
import { createClient } from "@/lib/supabase/server";

import {
  type CreateBridalDressAppointmentInput,
  type CreateBridalDressOptionInput,
  type UpdateBridalDressAppointmentInput,
  type UpdateBridalDressOptionInput,
  createBridalDressAppointmentSchema,
  createBridalDressOptionSchema,
  updateBridalDressAppointmentSchema,
  updateBridalDressOptionSchema,
} from "@/lib/validations/bridal-dress";

export type BridalDressActionResult =
  | {
      success: true;
      message: string;
      id?: string;
    }
  | {
      success: false;
      message: string;
    };

function revalidatePrivatePage() {
  revalidatePath(
    "/painel/fornecedores",
  );
}

function hasBridePrivateAccess(
  memberType: string,
): boolean {
  return (
    memberType === "bride" ||
    memberType === "developer"
  );
}

async function requireBridePrivateAccess() {
  const wedding =
    await requireWeddingRole([
      "owner",
      "admin",
    ]);

  if (
    !hasBridePrivateAccess(
      wedding.memberType,
    )
  ) {
    throw new Error(
      "Acesso restrito à área privada da noiva.",
    );
  }

  return wedding;
}

export async function createBridalDressOptionAction(
  input: CreateBridalDressOptionInput,
): Promise<BridalDressActionResult> {
  const validation =
    createBridalDressOptionSchema.safeParse(
      input,
    );

  if (!validation.success) {
    return {
      success: false,
      message:
        validation.error.issues[0]?.message ??
        "Revise os dados do vestido.",
    };
  }

  const wedding =
    await requireBridePrivateAccess();

  const supabase =
    await createClient();

  const { data, error } =
    await supabase
      .from("bridal_dress_options")
      .insert({
        wedding_id: wedding.id,
        title:
          validation.data.title,
        atelier_name:
          validation.data.atelierName ||
          null,
        status:
          validation.data.status,
        estimated_amount:
          validation.data.estimatedAmount,
        final_amount:
          validation.data.finalAmount,
        image_url:
          validation.data.imageUrl ||
          null,
        is_favorite:
          validation.data.isFavorite,
        notes:
          validation.data.notes ||
          null,
        updated_at:
          new Date().toISOString(),
      })
      .select()
      .single();

  if (error) {
    console.error(
      "Erro ao criar opção de vestido:",
      error,
    );

    return {
      success: false,
      message:
        "Não foi possível salvar o vestido.",
    };
  }

  revalidatePrivatePage();

  return {
    success: true,
    message:
      "Vestido adicionado à área privada.",
    id: data.id,
  };
}

export async function updateBridalDressOptionAction(
  input: UpdateBridalDressOptionInput,
): Promise<BridalDressActionResult> {
  const validation =
    updateBridalDressOptionSchema.safeParse(
      input,
    );

  if (!validation.success) {
    return {
      success: false,
      message:
        validation.error.issues[0]?.message ??
        "Revise os dados do vestido.",
    };
  }

  const wedding =
    await requireBridePrivateAccess();

  const supabase =
    await createClient();

  const { data, error } =
    await supabase
      .from("bridal_dress_options")
      .update({
        title:
          validation.data.title,
        atelier_name:
          validation.data.atelierName ||
          null,
        status:
          validation.data.status,
        estimated_amount:
          validation.data.estimatedAmount,
        final_amount:
          validation.data.finalAmount,
        image_url:
          validation.data.imageUrl ||
          null,
        is_favorite:
          validation.data.isFavorite,
        notes:
          validation.data.notes ||
          null,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", validation.data.id)
      .eq("wedding_id", wedding.id)
      .select()
      .maybeSingle();

  if (error || !data) {
    return {
      success: false,
      message:
        "Não foi possível atualizar o vestido.",
    };
  }

  revalidatePrivatePage();

  return {
    success: true,
    message: "Vestido atualizado.",
    id: data.id,
  };
}

export async function deleteBridalDressOptionAction(
  optionId: string,
): Promise<BridalDressActionResult> {
  const wedding =
    await requireBridePrivateAccess();

  const supabase =
    await createClient();

  const { data, error } =
    await supabase
      .from("bridal_dress_options")
      .delete()
      .eq("id", optionId)
      .eq("wedding_id", wedding.id)
      .select()
      .maybeSingle();

  if (error || !data) {
    return {
      success: false,
      message:
        "Não foi possível excluir o vestido.",
    };
  }

  revalidatePrivatePage();

  return {
    success: true,
    message: "Vestido excluído.",
  };
}

export async function createBridalDressAppointmentAction(
  input: CreateBridalDressAppointmentInput,
): Promise<BridalDressActionResult> {
  const validation =
    createBridalDressAppointmentSchema.safeParse(
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
    await requireBridePrivateAccess();

  const supabase =
    await createClient();

  const { data, error } =
    await supabase
      .from(
        "bridal_dress_appointments",
      )
      .insert({
        wedding_id: wedding.id,
        dress_option_id:
          validation.data.dressOptionId ||
          null,
        title:
          validation.data.title,
        appointment_at:
          validation.data.appointmentAt,
        location:
          validation.data.location ||
          null,
        completed:
          validation.data.completed,
        notes:
          validation.data.notes ||
          null,
        updated_at:
          new Date().toISOString(),
      })
      .select()
      .single();

  if (error) {
    console.error(
      "Erro ao criar compromisso do vestido:",
      error,
    );

    return {
      success: false,
      message:
        "Não foi possível salvar o compromisso.",
    };
  }

  revalidatePrivatePage();

  return {
    success: true,
    message:
      "Compromisso adicionado.",
    id: data.id,
  };
}

export async function updateBridalDressAppointmentAction(
  input: UpdateBridalDressAppointmentInput,
): Promise<BridalDressActionResult> {
  const validation =
    updateBridalDressAppointmentSchema.safeParse(
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
    await requireBridePrivateAccess();

  const supabase =
    await createClient();

  const { data, error } =
    await supabase
      .from(
        "bridal_dress_appointments",
      )
      .update({
        dress_option_id:
          validation.data.dressOptionId ||
          null,
        title:
          validation.data.title,
        appointment_at:
          validation.data.appointmentAt,
        location:
          validation.data.location ||
          null,
        completed:
          validation.data.completed,
        notes:
          validation.data.notes ||
          null,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", validation.data.id)
      .eq("wedding_id", wedding.id)
      .select()
      .maybeSingle();

  if (error || !data) {
    return {
      success: false,
      message:
        "Não foi possível atualizar o compromisso.",
    };
  }

  revalidatePrivatePage();

  return {
    success: true,
    message: "Compromisso atualizado.",
    id: data.id,
  };
}

export async function deleteBridalDressAppointmentAction(
  appointmentId: string,
): Promise<BridalDressActionResult> {
  const wedding =
    await requireBridePrivateAccess();

  const supabase =
    await createClient();

  const { data, error } =
    await supabase
      .from(
        "bridal_dress_appointments",
      )
      .delete()
      .eq("id", appointmentId)
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

  revalidatePrivatePage();

  return {
    success: true,
    message: "Compromisso excluído.",
  };
}
