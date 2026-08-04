import RsvpManager, {
  type RsvpGroup,
} from "@/components/dashboard/rsvp/rsvp-manager";

import { requireCurrentWedding } from "@/lib/auth/get-current-wedding";
import { getRsvpManagementData } from "@/lib/data/rsvp";

export default async function RsvpPage() {
  const wedding =
    await requireCurrentWedding();

  const { groups, guests } =
    await getRsvpManagementData(
      wedding.id,
    );

  const guestsByGroup = new Map<
    string,
    typeof guests
  >();

  for (const guest of guests) {
    const currentGuests =
      guestsByGroup.get(
        guest.invitation_group_id,
      ) ?? [];

    currentGuests.push(guest);

    guestsByGroup.set(
      guest.invitation_group_id,
      currentGuests,
    );
  }

  const rsvpGroups: RsvpGroup[] =
    groups.map((group) => ({
      id: group.id,
      name: group.name,
      invitationCode:
        group.invitation_code,

      guests:
        (
          guestsByGroup.get(
            group.id,
          ) ?? []
        ).map((guest) => ({
          id: guest.id,
          name: guest.full_name,

          preferredName:
            guest.preferred_name ??
            undefined,

          phone:
            guest.phone ??
            undefined,

          email:
            guest.email ??
            undefined,

          side: guest.side,

          confirmation:
            guest.confirmation_status,

          isPrimary:
            guest.is_primary,

          isChild:
            guest.is_child,

          relationshipLabel:
            guest.relationship_label ??
            undefined,

          respondedAt:
            guest.responded_at ??
            undefined,
        })),
    }));

  return (
    <RsvpManager
      initialGroups={rsvpGroups}
      brideName={wedding.brideName}
      groomName={wedding.groomName}
    />
  );
}
