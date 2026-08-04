"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireWeddingRole } from "@/lib/auth/require-wedding-role";
import { createClient } from "@/lib/supabase/server";

const deleteGuestWithPrimaryTransferSchema = z.object({
  guestId: z.string().uuid("Convidado inválido."),
  newPrimaryGuestId: z
    .string()
    .uuid("Novo titular inválido.")
    .nullable()
    .optional(),
});

export type DeleteGuestOutcome =
  | "guest_deleted"
  | "primary_transferred"
  | "invitation_deleted";

export type DeleteGuestWithPrimaryTransferResult =
  | {
      success: true;
      message: string;
      outcome: DeleteGuestOutcome;
    }
  | {
      success: false;
      message: string;
    };

function revalidateGuestPages() {
  revalidatePath("/painel");
  revalidatePath("/painel/convidados");
  revalidatePath("/painel/rsvp");
  revalidatePath("/painel/mesas");
}

function getDeletionErrorMessage(
  message: string,
): string {
  if (message.includes("guest_not_found")) {
    return "Convidado não encontrado.";
  }

  if (message.includes("new_primary_required")) {
    return "Selecione um novo titular antes de excluir o titular atual.";
  }

  if (message.includes("invalid_new_primary")) {
    return "O novo titular precisa ser outra pessoa do mesmo grupo de convite.";
  }

  if (message.includes("forbidden")) {
    return "Você não possui permissão para excluir este convidado.";
  }

  return "Não foi possível excluir o convidado.";
}

export async function deleteGuestWithPrimaryTransferAction(
  input: {
    guestId: string;
    newPrimaryGuestId?: string | null;
  },
): Promise<DeleteGuestWithPrimaryTransferResult> {
  const validation =
    deleteGuestWithPrimaryTransferSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false,
      message:
        validation.error.issues[0]?.message ??
        "Dados inválidos para exclusão.",
    };
  }

  await requireWeddingRole([
    "owner",
    "admin",
  ]);

  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "delete_guest_with_primary_transfer",
    {
      p_guest_id: validation.data.guestId,
      p_new_primary_guest_id:
        validation.data.newPrimaryGuestId ?? undefined,
    },
  );

  if (error) {
    console.error(
      "Erro ao excluir convidado com proteção do titular:",
      error,
    );

    return {
      success: false,
      message: getDeletionErrorMessage(
        error.message,
      ),
    };
  }

  const outcome = data as DeleteGuestOutcome;

  revalidateGuestPages();

  if (outcome === "invitation_deleted") {
    return {
      success: true,
      message:
        "Convidado e convite excluídos.",
      outcome,
    };
  }

  if (outcome === "primary_transferred") {
    return {
      success: true,
      message:
        "Convidado excluído e titularidade transferida.",
      outcome,
    };
  }

  return {
    success: true,
    message: "Convidado excluído.",
    outcome: "guest_deleted",
  };
}