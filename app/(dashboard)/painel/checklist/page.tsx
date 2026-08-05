import ChecklistManager, {
  type ChecklistGroupItem,
  type ChecklistTaskItem,
} from "@/components/dashboard/checklist/checklist-manager";

import { requireCurrentWedding } from "@/lib/auth/get-current-wedding";
import { getChecklistManagementData } from "@/lib/data/checklist";

export default async function ChecklistPage() {
  const wedding = await requireCurrentWedding();

  const { groups, tasks } =
    await getChecklistManagementData(wedding.id);

  const checklistGroups: ChecklistGroupItem[] =
    groups.map((group) => ({
      id: group.id,
      title: group.title,
      description: group.description ?? undefined,
      tone:
        group.tone as ChecklistGroupItem["tone"],
      sortOrder: group.sort_order,
    }));

  const checklistTasks: ChecklistTaskItem[] =
    tasks.map((task) => ({
      id: task.id,
      groupId: task.group_id,
      title: task.title,
      description: task.description ?? undefined,
      dueDate: task.due_date ?? undefined,
      responsibleType:
        task.responsible_type as ChecklistTaskItem["responsibleType"],
      responsibleName:
        task.responsible_name ?? undefined,
      status:
        task.status as ChecklistTaskItem["status"],
      priority:
        task.priority as ChecklistTaskItem["priority"],
      sourceType:
        task.source_type as ChecklistTaskItem["sourceType"],
      sortOrder: task.sort_order,
    }));

  return (
    <ChecklistManager
      initialGroups={checklistGroups}
      initialTasks={checklistTasks}
      brideName={wedding.brideName}
      groomName={wedding.groomName}
    />
  );
}
