import CronogramaManager, {
  type CronogramaEventItem,
} from "@/components/dashboard/cronograma/cronograma-manager";

import { requireCurrentWedding } from "@/lib/auth/get-current-wedding";
import { getCronogramaManagementData } from "@/lib/data/cronograma";

function hasPrivateDressAccess(
  memberType: string,
) {
  return (
    memberType === "bride" ||
    memberType === "developer"
  );
}

export default async function CronogramaPage() {
  const wedding =
    await requireCurrentWedding();

  const { events } =
    await getCronogramaManagementData(
      wedding.id,
      {
        includePrivateDress:
          hasPrivateDressAccess(
            wedding.memberType,
          ),
      },
    );

  const timelineEvents:
    CronogramaEventItem[] =
    events.map((event) => ({
      ...event,
    }));

  timelineEvents.push({
    id: `wedding:${wedding.id}`,
    sourceId: wedding.id,
    source: "wedding",

    title:
      `${wedding.brideName} & ${wedding.groomName}`,

    description:
      "Cerimônia e celebração do casamento.",

    date:
      wedding.weddingDate,

    allDay: true,

    category:
      "Nosso casamento",

    status: "wedding",
    priority: "high",

    sourceLabel:
      "Grande dia",

    sourceHref:
      "/painel/cerimonia",

    editable: false,
  });

  return (
    <CronogramaManager
      initialEvents={
        timelineEvents
      }
      brideName={
        wedding.brideName
      }
      groomName={
        wedding.groomName
      }
    />
  );
}
