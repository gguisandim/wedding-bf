import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type ChecklistGroupRow =
  Database["public"]["Tables"]["checklist_groups"]["Row"];

type ChecklistTaskRow =
  Database["public"]["Tables"]["checklist_tasks"]["Row"];

export type ChecklistManagementData = {
  groups: ChecklistGroupRow[];
  tasks: ChecklistTaskRow[];
};

export type ChecklistOverviewTask = {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  groupTitle: string;
  priority: "normal" | "medium" | "high";
  status: "pending" | "progress";
};

export async function getChecklistManagementData(
  weddingId: string,
): Promise<ChecklistManagementData> {
  const supabase = await createClient();

  const groupsResult = await supabase
    .from("checklist_groups")
    .select()
    .eq("wedding_id", weddingId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (groupsResult.error) {
    console.error(
      "Erro ao carregar etapas do checklist:",
      groupsResult.error,
    );

    throw new Error(
      "Não foi possível carregar as etapas do checklist.",
    );
  }

  const tasksResult = await supabase
    .from("checklist_tasks")
    .select()
    .eq("wedding_id", weddingId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (tasksResult.error) {
    console.error(
      "Erro ao carregar tarefas do checklist:",
      tasksResult.error,
    );

    throw new Error(
      "Não foi possível carregar as tarefas do checklist.",
    );
  }

  return {
    groups: groupsResult.data ?? [],
    tasks: tasksResult.data ?? [],
  };
}

export async function getChecklistOverviewTasks(
  weddingId: string,
  limit = 4,
): Promise<ChecklistOverviewTask[]> {
  const supabase = await createClient();

  const tasksResult = await supabase
    .from("checklist_tasks")
    .select()
    .eq("wedding_id", weddingId)
    .neq("status", "completed")
    .order("due_date", {
      ascending: true,
      nullsFirst: false,
    })
    .order("priority", { ascending: true });

  if (tasksResult.error) {
    console.error(
      "Erro ao carregar próximos passos:",
      tasksResult.error,
    );

    throw new Error(
      "Não foi possível carregar os próximos passos.",
    );
  }

  const tasks: ChecklistTaskRow[] =
    tasksResult.data ?? [];

  const groupIds = Array.from(
    new Set(tasks.map((task) => task.group_id)),
  );

  if (groupIds.length === 0) {
    return [];
  }

  const groupsResult = await supabase
    .from("checklist_groups")
    .select()
    .eq("wedding_id", weddingId)
    .in("id", groupIds);

  if (groupsResult.error) {
    console.error(
      "Erro ao carregar etapas dos próximos passos:",
      groupsResult.error,
    );

    throw new Error(
      "Não foi possível carregar as etapas dos próximos passos.",
    );
  }

  const groupsById = new Map(
    (groupsResult.data ?? []).map((group) => [
      group.id,
      group,
    ]),
  );

  const overviewTasks: ChecklistOverviewTask[] = [];

  for (const task of tasks) {
    const group = groupsById.get(task.group_id);

    if (!group) {
      continue;
    }

    overviewTasks.push({
      id: task.id,
      title: task.title,
      groupTitle: group.title,
      priority:
        task.priority as ChecklistOverviewTask["priority"],
      status:
        task.status as ChecklistOverviewTask["status"],

      ...(task.description
        ? { description: task.description }
        : {}),

      ...(task.due_date
        ? { dueDate: task.due_date }
        : {}),
    });

    if (overviewTasks.length >= limit) {
      break;
    }
  }

  return overviewTasks;
}
