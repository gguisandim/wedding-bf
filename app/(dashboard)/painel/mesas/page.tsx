import TableManager, {
  type SeatingGuest,
  type SeatingTable,
} from "@/components/dashboard/mesas/table-manager";

import { requireCurrentWedding } from "@/lib/auth/get-current-wedding";
import { getTableManagementData } from "@/lib/data/tables";

export default async function TablesPage() {
  const wedding =
    await requireCurrentWedding();

  const {
    tables,
    assignments,
    guests,
    groups,
  } = await getTableManagementData(
    wedding.id,
  );

  const groupsById =
    new Map(
      groups.map((group) => [
        group.id,
        group.name,
      ]),
    );

  const tableIdByGuestId =
    new Map(
      assignments.map(
        (assignment) => [
          assignment.guest_id,
          assignment.table_id,
        ],
      ),
    );

  const seatingGuests:
    SeatingGuest[] =
    guests.map((guest) => ({
      id: guest.id,
      name: guest.full_name,

      preferredName:
        guest.preferred_name ??
        undefined,

      groupName:
        groupsById.get(
          guest.invitation_group_id,
        ) ?? "Sem grupo",

      side: guest.side,

      confirmation:
        guest.confirmation_status,

      isPrimary:
        guest.is_primary,

      isChild:
        guest.is_child,

      tableId:
        tableIdByGuestId.get(
          guest.id,
        ),
    }));

  const seatingTables:
    SeatingTable[] =
    tables.map((table) => ({
      id: table.id,
      name: table.name,

      shape:
        table.shape as
          SeatingTable["shape"],

      capacity: table.capacity,

      positionX:
        table.position_x,

      positionY:
        table.position_y,

      rotation:
        table.rotation,

      notes:
        table.notes ??
        undefined,
    }));

  return (
    <TableManager
      initialTables={seatingTables}
      initialGuests={seatingGuests}
      brideName={wedding.brideName}
      groomName={wedding.groomName}
    />
  );
}
