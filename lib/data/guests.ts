import "server-only";

import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type InvitationGroupRow =
  Database["public"]["Tables"]["invitation_groups"]["Row"];

type GuestRow =
  Database["public"]["Tables"]["guests"]["Row"];

export type InvitationGroupData = Pick<
  InvitationGroupRow,
  | "id"
  | "wedding_id"
  | "name"
  | "invitation_code"
  | "save_the_date_status"
  | "recipient_name"
  | "postal_code"
  | "street"
  | "street_number"
  | "complement"
  | "neighborhood"
  | "city"
  | "state"
  | "notes"
  | "created_at"
  | "updated_at"
>;

export type GuestData = Pick<
  GuestRow,
  | "id"
  | "wedding_id"
  | "invitation_group_id"
  | "full_name"
  | "preferred_name"
  | "email"
  | "phone"
  | "side"
  | "confirmation_status"
  | "is_primary"
  | "is_child"
  | "linked_guest_id"
  | "relationship_label"
  | "dietary_restrictions"
  | "notes"
  | "responded_at"
  | "created_at"
  | "updated_at"
>;

export type InvitationGroupWithGuests =
  InvitationGroupData & {
    guests: GuestData[];
  };

export type GuestManagementData = {
  groups: InvitationGroupWithGuests[];
  guests: GuestData[];
};

export async function getGuestManagementData(
  weddingId: string,
): Promise<GuestManagementData> {
  const supabase = await createClient();

  const [
    invitationGroupsResult,
    guestsResult,
  ] = await Promise.all([
    supabase
      .from("invitation_groups")
      .select(`
        id,
        wedding_id,
        name,
        invitation_code,
        save_the_date_status,
        recipient_name,
        postal_code,
        street,
        street_number,
        complement,
        neighborhood,
        city,
        state,
        notes,
        created_at,
        updated_at
      `)
      .eq("wedding_id", weddingId)
      .order("name", {
        ascending: true,
      }),

    supabase
      .from("guests")
      .select(`
        id,
        wedding_id,
        invitation_group_id,
        full_name,
        preferred_name,
        email,
        phone,
        side,
        confirmation_status,
        is_primary,
        is_child,
        linked_guest_id,
        relationship_label,
        dietary_restrictions,
        notes,
        responded_at,
        created_at,
        updated_at
      `)
      .eq("wedding_id", weddingId)
      .order("full_name", {
        ascending: true,
      }),
  ]);

  if (invitationGroupsResult.error) {
    throw new Error(
      `Não foi possível carregar os grupos de convite: ${invitationGroupsResult.error.message}`,
    );
  }

  if (guestsResult.error) {
    throw new Error(
      `Não foi possível carregar os convidados: ${guestsResult.error.message}`,
    );
  }

  const invitationGroups =
    invitationGroupsResult.data ?? [];

  const guests = guestsResult.data ?? [];

  const guestsByGroup = new Map<
    string,
    GuestData[]
  >();

  for (const guest of guests) {
    const groupGuests =
      guestsByGroup.get(
        guest.invitation_group_id,
      ) ?? [];

    groupGuests.push(guest);

    guestsByGroup.set(
      guest.invitation_group_id,
      groupGuests,
    );
  }

  const groups: InvitationGroupWithGuests[] =
    invitationGroups.map((group) => ({
      ...group,
      guests:
        guestsByGroup.get(group.id) ?? [],
    }));

  return {
    groups,
    guests,
  };
}