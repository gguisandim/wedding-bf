import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type SeatingTableRow =
  Database["public"]["Tables"]["seating_tables"]["Row"];

type GuestTableAssignmentRow =
  Database["public"]["Tables"]["guest_table_assignments"]["Row"];

type GuestRow =
  Database["public"]["Tables"]["guests"]["Row"];

type InvitationGroupRow =
  Database["public"]["Tables"]["invitation_groups"]["Row"];

export type TableManagementData = {
  tables: SeatingTableRow[];
  assignments: GuestTableAssignmentRow[];
  guests: GuestRow[];
  groups: InvitationGroupRow[];
};

export async function getTableManagementData(
  weddingId: string,
): Promise<TableManagementData> {
  const supabase = await createClient();

  /*
   * As consultas ficam separadas e usam select() sem uma string manual.
   * Isso evita o SelectQueryError do parser de tipos do Supabase,
   * que estava unindo os resultados das quatro consultas.
   */

  const tablesResult = await supabase
    .from("seating_tables")
    .select()
    .eq("wedding_id", weddingId)
    .order("sort_order", {
      ascending: true,
    })
    .order("name", {
      ascending: true,
    });

  if (tablesResult.error) {
    console.error(
      "Erro ao carregar mesas:",
      tablesResult.error,
    );

    throw new Error(
      "Não foi possível carregar as mesas.",
    );
  }

  const assignmentsResult = await supabase
    .from("guest_table_assignments")
    .select()
    .eq("wedding_id", weddingId);

  if (assignmentsResult.error) {
    console.error(
      "Erro ao carregar atribuições:",
      assignmentsResult.error,
    );

    throw new Error(
      "Não foi possível carregar as atribuições de mesa.",
    );
  }

  const guestsResult = await supabase
    .from("guests")
    .select()
    .eq("wedding_id", weddingId)
    .order("full_name", {
      ascending: true,
    });

  if (guestsResult.error) {
    console.error(
      "Erro ao carregar convidados para mesas:",
      guestsResult.error,
    );

    throw new Error(
      "Não foi possível carregar os convidados.",
    );
  }

  const groupsResult = await supabase
    .from("invitation_groups")
    .select()
    .eq("wedding_id", weddingId);

  if (groupsResult.error) {
    console.error(
      "Erro ao carregar grupos para mesas:",
      groupsResult.error,
    );

    throw new Error(
      "Não foi possível carregar os grupos de convite.",
    );
  }

  return {
    tables: tablesResult.data ?? [],
    assignments: assignmentsResult.data ?? [],
    guests: guestsResult.data ?? [],
    groups: groupsResult.data ?? [],
  };
}