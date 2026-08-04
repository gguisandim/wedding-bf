"use server";

import { revalidatePath } from "next/cache";

import { requireWeddingRole } from "@/lib/auth/require-wedding-role";
import { createClient } from "@/lib/supabase/server";
import {
  type CreateGuestInput,
  type CreateInvitationGroupInput,
  type UpdateGuestInput,
  type UpdateInvitationGroupInput,
  createGuestSchema,
  createInvitationGroupSchema,
  updateGuestSchema,
  updateInvitationGroupSchema,
} from "@/lib/validations/guests";

type ActionFieldErrors = Record<
  string,
  string[] | undefined
>;

export type GuestActionResult =
  | {
      success: true;
      message: string;
      id?: string;
    }
  | {
      success: false;
      message: string;
      fieldErrors?: ActionFieldErrors;
    };

function revalidateGuestPages() {
  revalidatePath("/painel");
  revalidatePath("/painel/convidados");
  revalidatePath("/painel/rsvp");
  revalidatePath("/painel/mesas");
}

function getDatabaseErrorMessage(
  code: string | undefined,
  fallback: string,
): string {
  if (code === "23505") {
    return "Já existe um registro com esses dados.";
  }

  if (code === "23503") {
    return "O registro possui um vínculo inválido.";
  }

  if (code === "23514") {
    return "Um dos dados informados não atende às regras do sistema.";
  }

  return fallback;
}

export async function createInvitationGroupAction(
  input: CreateInvitationGroupInput,
): Promise<GuestActionResult> {
  const validation =
    createInvitationGroupSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false,
      message:
        "Revise os dados do grupo de convite.",
      fieldErrors:
        validation.error.flatten().fieldErrors,
    };
  }

  const wedding = await requireWeddingRole([
    "owner",
    "admin",
  ]);

  const supabase = await createClient();
  const data = validation.data;

  const { data: createdGroup, error } =
    await supabase
      .from("invitation_groups")
      .insert({
        wedding_id: wedding.id,

        name: data.name,
        invitation_code: data.invitationCode,
        save_the_date_status:
          data.saveTheDateStatus,

        recipient_name: data.recipientName,
        postal_code: data.postalCode,
        street: data.street,
        street_number: data.streetNumber,
        complement: data.complement,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,

        notes: data.notes,
      })
      .select("id")
      .single();

  if (error) {
    console.error(
      "Erro ao criar grupo de convite:",
      error,
    );

    return {
      success: false,
      message: getDatabaseErrorMessage(
        error.code,
        "Não foi possível criar o grupo de convite.",
      ),
    };
  }

  revalidateGuestPages();

  return {
    success: true,
    message: "Grupo de convite criado.",
    id: createdGroup.id,
  };
}

export async function updateInvitationGroupAction(
  input: UpdateInvitationGroupInput,
): Promise<GuestActionResult> {
  const validation =
    updateInvitationGroupSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false,
      message:
        "Revise os dados do grupo de convite.",
      fieldErrors:
        validation.error.flatten().fieldErrors,
    };
  }

  const wedding = await requireWeddingRole([
    "owner",
    "admin",
  ]);

  const supabase = await createClient();
  const data = validation.data;

  const { data: updatedGroup, error } =
    await supabase
      .from("invitation_groups")
      .update({
        name: data.name,
        invitation_code: data.invitationCode,
        save_the_date_status:
          data.saveTheDateStatus,

        recipient_name: data.recipientName,
        postal_code: data.postalCode,
        street: data.street,
        street_number: data.streetNumber,
        complement: data.complement,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,

        notes: data.notes,
      })
      .eq("id", data.id)
      .eq("wedding_id", wedding.id)
      .select("id")
      .maybeSingle();

  if (error) {
    console.error(
      "Erro ao atualizar grupo de convite:",
      error,
    );

    return {
      success: false,
      message: getDatabaseErrorMessage(
        error.code,
        "Não foi possível atualizar o grupo de convite.",
      ),
    };
  }

  if (!updatedGroup) {
    return {
      success: false,
      message: "Grupo de convite não encontrado.",
    };
  }

  revalidateGuestPages();

  return {
    success: true,
    message: "Grupo de convite atualizado.",
    id: updatedGroup.id,
  };
}

export async function deleteInvitationGroupAction(
  groupId: string,
): Promise<GuestActionResult> {
  const validation =
    updateInvitationGroupSchema.shape.id.safeParse(
      groupId,
    );

  if (!validation.success) {
    return {
      success: false,
      message: "Grupo de convite inválido.",
    };
  }

  const wedding = await requireWeddingRole([
    "owner",
    "admin",
  ]);

  const supabase = await createClient();

  const { data: deletedGroup, error } =
    await supabase
      .from("invitation_groups")
      .delete()
      .eq("id", validation.data)
      .eq("wedding_id", wedding.id)
      .select("id")
      .maybeSingle();

  if (error) {
    console.error(
      "Erro ao excluir grupo de convite:",
      error,
    );

    return {
      success: false,
      message:
        "Não foi possível excluir o grupo de convite.",
    };
  }

  if (!deletedGroup) {
    return {
      success: false,
      message: "Grupo de convite não encontrado.",
    };
  }

  revalidateGuestPages();

  return {
    success: true,
    message:
      "Grupo e seus convidados foram excluídos.",
  };
}

export async function createGuestAction(
  input: CreateGuestInput,
): Promise<GuestActionResult> {
  const validation =
    createGuestSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false,
      message:
        "Revise os dados do convidado.",
      fieldErrors:
        validation.error.flatten().fieldErrors,
    };
  }

  const wedding = await requireWeddingRole([
    "owner",
    "admin",
  ]);

  const supabase = await createClient();
  const data = validation.data;

  const { data: group } = await supabase
    .from("invitation_groups")
    .select("id")
    .eq("id", data.invitationGroupId)
    .eq("wedding_id", wedding.id)
    .maybeSingle();

  if (!group) {
    return {
      success: false,
      message:
        "O grupo de convite selecionado não existe.",
    };
  }

  const respondedAt =
    data.confirmationStatus === "pending"
      ? null
      : new Date().toISOString();

  const { data: createdGuest, error } =
    await supabase
      .from("guests")
      .insert({
        wedding_id: wedding.id,

        invitation_group_id:
          data.invitationGroupId,

        full_name: data.fullName,
        preferred_name: data.preferredName,

        email: data.email,
        phone: data.phone,

        side: data.side,
        confirmation_status:
          data.confirmationStatus,

        is_primary: data.isPrimary,
        is_child: data.isChild,

        linked_guest_id:
          data.linkedGuestId,

        relationship_label:
          data.relationshipLabel,

        dietary_restrictions:
          data.dietaryRestrictions,

        notes: data.notes,
        responded_at: respondedAt,
      })
      .select("id")
      .single();

  if (error) {
    console.error(
      "Erro ao criar convidado:",
      error,
    );

    return {
      success: false,
      message: getDatabaseErrorMessage(
        error.code,
        "Não foi possível criar o convidado.",
      ),
    };
  }

  revalidateGuestPages();

  return {
    success: true,
    message: "Convidado adicionado.",
    id: createdGuest.id,
  };
}

export async function updateGuestAction(
  input: UpdateGuestInput,
): Promise<GuestActionResult> {
  const validation =
    updateGuestSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false,
      message:
        "Revise os dados do convidado.",
      fieldErrors:
        validation.error.flatten().fieldErrors,
    };
  }

  const wedding = await requireWeddingRole([
    "owner",
    "admin",
  ]);

  const supabase = await createClient();
  const data = validation.data;

  const { data: currentGuest, error: readError } =
    await supabase
      .from("guests")
      .select("confirmation_status")
      .eq("id", data.id)
      .eq("wedding_id", wedding.id)
      .maybeSingle();

  if (readError) {
    console.error(
      "Erro ao consultar convidado:",
      readError,
    );

    return {
      success: false,
      message:
        "Não foi possível consultar o convidado.",
    };
  }

  if (!currentGuest) {
    return {
      success: false,
      message: "Convidado não encontrado.",
    };
  }

  let respondedAt: string | null | undefined;

  if (
    currentGuest.confirmation_status !==
    data.confirmationStatus
  ) {
    respondedAt =
      data.confirmationStatus === "pending"
        ? null
        : new Date().toISOString();
  }

  const updateData = {
    invitation_group_id:
      data.invitationGroupId,

    full_name: data.fullName,
    preferred_name: data.preferredName,

    email: data.email,
    phone: data.phone,

    side: data.side,
    confirmation_status:
      data.confirmationStatus,

    is_primary: data.isPrimary,
    is_child: data.isChild,

    linked_guest_id:
      data.linkedGuestId,

    relationship_label:
      data.relationshipLabel,

    dietary_restrictions:
      data.dietaryRestrictions,

    notes: data.notes,

    ...(respondedAt !== undefined
      ? { responded_at: respondedAt }
      : {}),
  };

  const { data: updatedGuest, error } =
    await supabase
      .from("guests")
      .update(updateData)
      .eq("id", data.id)
      .eq("wedding_id", wedding.id)
      .select("id")
      .maybeSingle();

  if (error) {
    console.error(
      "Erro ao atualizar convidado:",
      error,
    );

    return {
      success: false,
      message: getDatabaseErrorMessage(
        error.code,
        "Não foi possível atualizar o convidado.",
      ),
    };
  }

  if (!updatedGuest) {
    return {
      success: false,
      message: "Convidado não encontrado.",
    };
  }

  revalidateGuestPages();

  return {
    success: true,
    message: "Convidado atualizado.",
    id: updatedGuest.id,
  };
}

export async function deleteGuestAction(
  guestId: string,
): Promise<GuestActionResult> {
  const validation =
    updateGuestSchema.shape.id.safeParse(
      guestId,
    );

  if (!validation.success) {
    return {
      success: false,
      message: "Convidado inválido.",
    };
  }

  const wedding = await requireWeddingRole([
    "owner",
    "admin",
  ]);

  const supabase = await createClient();

  const { error: unlinkError } =
    await supabase
      .from("guests")
      .update({
        linked_guest_id: null,
        relationship_label: null,
      })
      .eq("linked_guest_id", validation.data)
      .eq("wedding_id", wedding.id);

  if (unlinkError) {
    console.error(
      "Erro ao remover vínculos do convidado:",
      unlinkError,
    );

    return {
      success: false,
      message:
        "Não foi possível remover os vínculos do convidado.",
    };
  }

  const { data: deletedGuest, error } =
    await supabase
      .from("guests")
      .delete()
      .eq("id", validation.data)
      .eq("wedding_id", wedding.id)
      .select("id")
      .maybeSingle();

  if (error) {
    console.error(
      "Erro ao excluir convidado:",
      error,
    );

    return {
      success: false,
      message:
        "Não foi possível excluir o convidado.",
    };
  }

  if (!deletedGuest) {
    return {
      success: false,
      message: "Convidado não encontrado.",
    };
  }

  revalidateGuestPages();

  return {
    success: true,
    message: "Convidado excluído.",
  };
}
