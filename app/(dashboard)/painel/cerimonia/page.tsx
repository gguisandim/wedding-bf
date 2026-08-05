import CeremonyManager, {
  type CeremonyBlock,
  type CeremonyChecklistItem,
} from "@/components/dashboard/cerimonia/ceremony-manager";

import { requireCurrentWedding } from "@/lib/auth/get-current-wedding";
import { getCeremonyManagementData } from "@/lib/data/ceremony";

export default async function CeremonyPage() {
  const wedding = await requireCurrentWedding();
  const { blocks, tasks } = await getCeremonyManagementData(wedding.id);

  const tasksByBlock = new Map<string, CeremonyChecklistItem[]>();

  for (const task of tasks) {
    if (!task.source_id) {
      continue;
    }

    const current = tasksByBlock.get(task.source_id) ?? [];

    current.push({
      id: task.id,
      blockId: task.source_id,
      title: task.title,
      status: task.status as CeremonyChecklistItem["status"],
      priority: task.priority as CeremonyChecklistItem["priority"],
      responsibleType:
        task.responsible_type as CeremonyChecklistItem["responsibleType"],
      sortOrder: task.sort_order,
      ...(task.due_date ? { dueDate: task.due_date } : {}),
      ...(task.responsible_name
        ? { responsibleName: task.responsible_name }
        : {}),
    });

    tasksByBlock.set(task.source_id, current);
  }

  const ceremonyBlocks: CeremonyBlock[] = blocks.map((block) => ({
    id: block.id,
    time: block.start_time.slice(0, 5),
    durationMinutes: block.duration_minutes,
    title: block.title,
    type: block.block_type as CeremonyBlock["type"],
    status: block.status as CeremonyBlock["status"],
    sortOrder: block.sort_order,
    checklist: tasksByBlock.get(block.id) ?? [],
    ...(block.description ? { description: block.description } : {}),
    ...(block.responsible ? { responsible: block.responsible } : {}),
    ...(block.participants ? { participants: block.participants } : {}),
    ...(block.instructions ? { instructions: block.instructions } : {}),
  }));

  return (
    <CeremonyManager
      initialBlocks={ceremonyBlocks}
      brideName={wedding.brideName}
      groomName={wedding.groomName}
    />
  );
}
