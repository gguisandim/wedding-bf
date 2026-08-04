"use server";

import { revalidatePath } from "next/cache";

import { requireWeddingRole } from "@/lib/auth/require-wedding-role";
import { createClient } from "@/lib/supabase/server";
import {
  type UpdateWeddingInput,
  updateWeddingSchema,
} from "@/lib/validations/wedding";

export type UpdateWeddingActionResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      message: string;
      fieldErrors?: Partial<
        Record<keyof UpdateWeddingInput, string[]>
      >;
    };

export async function updateWeddingAction(
  input: UpdateWeddingInput,
): Promise<UpdateWeddingActionResult> {
  const validation =
    updateWeddingSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false,
      message:
        "Revise os campos destacados antes de salvar.",
      fieldErrors:
        validation.error.flatten().fieldErrors,
    };
  }

  /*
   * Apenas proprietários e administradores
   * podem alterar os dados do casamento.
   */
  const wedding = await requireWeddingRole([
    "owner",
    "admin",
  ]);

  const supabase = await createClient();

  const { error } = await supabase
    .from("weddings")
    .update({
      bride_name:
        validation.data.brideName,

      groom_name:
        validation.data.groomName,

      wedding_date:
        validation.data.weddingDate,

      wedding_time:
        validation.data.weddingTime,

      venue_name:
        validation.data.venueName,

      venue_address:
        validation.data.venueAddress,

      timezone:
        validation.data.timezone,
    })
    .eq("id", wedding.id);

  if (error) {
    console.error(
      "Erro ao atualizar casamento:",
      error,
    );

    return {
      success: false,
      message:
        "Não foi possível salvar as informações do casamento.",
    };
  }

  /*
   * Atualiza a página de configurações,
   * dashboard e layout que contém a sidebar.
   */
  revalidatePath("/painel", "layout");
  revalidatePath(
    "/painel/configuracoes",
  );

  return {
    success: true,
    message:
      "Informações do casamento atualizadas.",
  };
}