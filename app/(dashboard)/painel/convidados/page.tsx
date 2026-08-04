import GuestList, {
  type GuestAddress,
  type GuestItem,
  type GuestRelationship,
  type InvitationGroup,
} from "@/components/dashboard/convidados/guest-list";

import { requireCurrentWedding } from "@/lib/auth/get-current-wedding";
import { getGuestManagementData } from "@/lib/data/guests";

function buildGroupAddress(
  group: Awaited<
    ReturnType<typeof getGuestManagementData>
  >["groups"][number],
): GuestAddress | undefined {
  const hasAddress = [
    group.recipient_name,
    group.postal_code,
    group.street,
    group.street_number,
    group.complement,
    group.neighborhood,
    group.city,
    group.state,
  ].some((value) => Boolean(value?.trim()));

  if (!hasAddress) {
    return undefined;
  }

  return {
    recipientName:
      group.recipient_name?.trim() ||
      group.name,

    postalCode:
      group.postal_code?.trim() ?? "",

    street:
      group.street?.trim() ?? "",

    number:
      group.street_number?.trim() ?? "",

    complement:
      group.complement?.trim() ||
      undefined,

    neighborhood:
      group.neighborhood?.trim() ?? "",

    city:
      group.city?.trim() ?? "",

    state:
      group.state?.trim() ?? "",
  };
}

function getGuestRelationship(
  isPrimary: boolean,
  isChild: boolean,
): GuestRelationship {
  if (isPrimary) {
    return "primary";
  }

  if (isChild) {
    return "child";
  }

  return "other";
}

export default async function GuestsPage() {
  const wedding =
    await requireCurrentWedding();

  const { groups, guests } =
    await getGuestManagementData(
      wedding.id,
    );

  const groupsById = new Map(
    groups.map((group) => [
      group.id,
      group,
    ]),
  );

  const invitationGroups: InvitationGroup[] =
    groups.map((group) => {
      const primaryGuest =
        group.guests.find(
          (guest) => guest.is_primary,
        );

      return {
        id: group.id,
        name: group.name,

        invitationCode:
          group.invitation_code,

        primaryGuestId:
          primaryGuest?.id,

        saveTheDateStatus:
          group.save_the_date_status,

        address:
          buildGroupAddress(group),
      };
    });

  const guestItems: GuestItem[] =
    guests.map((guest) => {
      const invitationGroup =
        groupsById.get(
          guest.invitation_group_id,
        );

      return {
        id: guest.id,
        name: guest.full_name,

        preferredName:
          guest.preferred_name ?? undefined,

        phone:
          guest.phone ?? undefined,

        email:
          guest.email ?? undefined,

        group:
          invitationGroup?.name ??
          "Grupo não encontrado",

        side: guest.side,

        confirmation:
          guest.confirmation_status,

        invitationGroupId:
          guest.invitation_group_id,

        isPrimaryGuest:
          guest.is_primary,

        isChild:
          guest.is_child,

        relationship:
          getGuestRelationship(
            guest.is_primary,
            guest.is_child,
          ),

        linkedGuestId:
          guest.linked_guest_id ??
          undefined,

        relationshipLabel:
          guest.relationship_label ??
          undefined,

        dietaryRestrictions:
          guest.dietary_restrictions ??
          undefined,

        notes:
          guest.notes ?? undefined,
      };
    });

  return (
    <GuestList
      guests={guestItems}
      invitationGroups={
        invitationGroups
      }
      brideName={wedding.brideName}
      groomName={wedding.groomName}
    />
  );
}