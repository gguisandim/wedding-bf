import { createClient } from "@/lib/supabase/server";

export async function getRsvpManagementData(
  weddingId: string,
) {
  const supabase = await createClient();

  const [
    groupsResult,
    guestsResult,
  ] = await Promise.all([
    supabase
      .from("invitation_groups")
      .select(
        [
          "id",
          "name",
          "invitation_code",
        ].join(","),
      )
      .eq("wedding_id", weddingId)
      .order("name", {
        ascending: true,
      }),

    supabase
      .from("guests")
      .select(
        [
          "id",
          "invitation_group_id",
          "full_name",
          "preferred_name",
          "email",
          "phone",
          "side",
          "confirmation_status",
          "is_primary",
          "is_child",
          "relationship_label",
          "responded_at",
        ].join(","),
      )
      .eq("wedding_id", weddingId)
      .order("is_primary", {
        ascending: false,
      })
      .order("full_name", {
        ascending: true,
      }),
  ]);

  if (groupsResult.error) {
    console.error(
      "Erro ao carregar grupos para RSVP:",
      groupsResult.error,
    );

    throw new Error(
      "Não foi possível carregar os grupos de convite.",
    );
  }

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
