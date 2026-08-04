import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type InvitationGroupRow =
  Database["public"]["Tables"]["invitation_groups"]["Row"];

type GuestRow =
  Database["public"]["Tables"]["guests"]["Row"];

export type RsvpManagementData = {
  groups: InvitationGroupRow[];
  guests: GuestRow[];
};

export async function getRsvpManagementData(
  weddingId: string,
): Promise<RsvpManagementData> {
  const supabase = await createClient();

  /*
   * As consultas ficam separadas e usam select() tipado.
   * Isso evita o GenericStringError causado pelo select
   * construído dinamicamente com array.join(",").
   */

  const groupsResult = await supabase
    .from("invitation_groups")
    .select()
    .eq("wedding_id", weddingId)
    .order("name", {
      ascending: true,
    });

  if (groupsResult.error) {
    console.error(
      "Erro ao carregar grupos para RSVP:",
      groupsResult.error,
    );

    throw new Error(
      "Não foi possível carregar os grupos de convite.",
    );
  }

  const guestsResult = await supabase
    .from("guests")
    .select()
    .eq("wedding_id", weddingId)
    .order("is_primary", {
      ascending: false,
    })
    .order("full_name", {
      ascending: true,
    });

  if (guestsResult.error) {
    console.error(
      "Erro ao carregar convidados para RSVP:",
      guestsResult.error,
    );

    throw new Error(
      "Não foi possível carregar os convidados.",
    );
  }

  return {
    groups: groupsResult.data ?? [],
    guests: guestsResult.data ?? [],
  };
}