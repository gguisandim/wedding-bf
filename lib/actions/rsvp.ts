"use server";

import { revalidatePath } from "next/cache";

import { requireWeddingRole } from "@/lib/auth/require-wedding-role";
import { createClient } from "@/lib/supabase/server";
import {
  guestConfirmationStatusSchema,
  updateGuestSchema,
  updateInvitationGroupSchema,
} from "@/lib/validations/guests";

export type RsvpConfirmationStatus =
  | "pending"
  | "confirmed"
  | "declined";

export type RsvpActionResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      message: string;
    };

type UpdateGuestConfirmationInput = {
  guestId: string;
  confirmationStatus: RsvpConfirmationStatus;
};

type UpdateInvitationGroupConfirmationInput = {
  invitationGroupId: string;
  confirmationStatus: RsvpConfirmationStatus;
};

function revalidateRsvpPages() {
  revalidatePath("/painel");
  revalidatePath("/painel/convidados");
  revalidatePath("/painel/rsvp");
  revalidatePath("/painel/mesas");
}

function getRespondedAt(
  confirmationStatus: RsvpConfirmationStatus,
): string | null {
  return confirmationStatus === "pending"
    ? null
    : new Date().toISOString();
}

export async function updateGuestConfirmationAction(
  input: UpdateGuestConfirmationInput,
): Promise<RsvpActionResult> {
  const guestIdValidation =
    updateGuestSchema.shape.id.safeParse(
      input.guestId,
    );

  const confirmationValidation =
    guestConfirmationStatusSchema.safeParse(
      input.confirmationStatus,
    );

  if (
    !guestIdValidation.success ||
    !confirmationValidation.success
  ) {
    return {
      success: false,
      message:
        "O convidado ou a situação do RSVP é inválido.",
    };
  }

  const wedding = await requireWeddingRole([
    "owner",
    "admin",
  ]);

  const supabase = await createClient();
  const confirmationStatus =
    confirmationValidation.data;

  const { data: updatedGuest, error } =
    await supabase
      .from("guests")
      .update({
        confirmation_status:
          confirmationStatus,
        responded_at:
          getRespondedAt(
            confirmationStatus,
          ),
      })
      .eq("id", guestIdValidation.data)
      .eq("wedding_id", wedding.id)
      .select("id")
      .maybeSingle();

  if (error) {
    console.error(
      "Erro ao atualizar RSVP individual:",
      error,
    );

    return {
      success: false,
      message:
        "Não foi possível atualizar o RSVP do convidado.",
    };
  }

  if (!updatedGuest) {
    return {
      success: false,
      message: "Convidado não encontrado.",
    };
  }

  revalidateRsvpPages();

  return {
    success: true,
    message:
      "Confirmação do convidado atualizada.",
  };
}

export async function updateInvitationGroupConfirmationAction(
  input: UpdateInvitationGroupConfirmationInput,
): Promise<RsvpActionResult> {
  const groupIdValidation =
    updateInvitationGroupSchema.shape.id.safeParse(
      input.invitationGroupId,
    );

  const confirmationValidation =
    guestConfirmationStatusSchema.safeParse(
      input.confirmationStatus,
    );

  if (
    !groupIdValidation.success ||
    !confirmationValidation.success
  ) {
    return {
      success: false,
      message:
        "O grupo ou a situação do RSVP é inválido.",
    };
  }

  const wedding = await requireWeddingRole([
    "owner",
    "admin",
  ]);

  const supabase = await createClient();

  const {
    data: invitationGroup,
    error: groupError,
  } = await supabase
    .from("invitation_groups")
    .select("id")
    .eq("id", groupIdValidation.data)
    .eq("wedding_id", wedding.id)
    .maybeSingle();

  if (groupError) {
    console.error(
      "Erro ao consultar grupo para atualizar RSVP:",
      groupError,
    );

    return {
      success: false,
      message:
        "Não foi possível consultar o grupo de convite.",
    };
  }

  if (!invitationGroup) {
    return {
      success: false,
      message:
        "Grupo de convite não encontrado.",
    };
  }

  const confirmationStatus =
    confirmationValidation.data;

  const { data: updatedGuests, error } =
    await supabase
      .from("guests")
      .update({
        confirmation_status:
          confirmationStatus,
        responded_at:
          getRespondedAt(
            confirmationStatus,
          ),
      })
      .eq("wedding_id", wedding.id)
      .eq(
        "invitation_group_id",
        invitationGroup.id,
      )
      .select("id");

  if (error) {
    console.error(
      "Erro ao atualizar RSVP coletivo:",
      error,
    );

    return {
      success: false,
      message:
        "Não foi possível atualizar o RSVP do grupo.",
    };
  }

  if (
    !updatedGuests ||
    updatedGuests.length === 0
  ) {
    return {
      success: false,
      message:
        "O grupo não possui convidados cadastrados.",
    };
  }

  revalidateRsvpPages();

  const messages = {
    confirmed:
      "Todos os convidados do grupo foram confirmados.",
    pending:
      "Todos os convidados do grupo voltaram para aguardando.",
    declined:
      "Todos os convidados do grupo foram marcados como ausentes.",
  } satisfies Record<
    RsvpConfirmationStatus,
    string
  >;

  return {
    success: true,
    message:
      messages[confirmationStatus],
  };
}
