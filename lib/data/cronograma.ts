import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type CalendarEventRow =
  Database["public"]["Tables"]["calendar_events"]["Row"];

type ChecklistTaskRow =
  Database["public"]["Tables"]["checklist_tasks"]["Row"];

type ChecklistGroupRow =
  Database["public"]["Tables"]["checklist_groups"]["Row"];

type BudgetInstallmentRow =
  Database["public"]["Tables"]["budget_installments"]["Row"];

type BudgetItemRow =
  Database["public"]["Tables"]["budget_items"]["Row"];

type BridalDressAppointmentRow =
  Database["public"]["Tables"]["bridal_dress_appointments"]["Row"];

type BridalDressOptionRow =
  Database["public"]["Tables"]["bridal_dress_options"]["Row"];

export type CronogramaSource =
  | "manual"
  | "checklist"
  | "budget"
  | "dress";

export type CronogramaDataEvent = {
  id: string;
  sourceId: string;
  source: CronogramaSource;

  title: string;
  description?: string;

  date: string;
  startTime?: string;
  endTime?: string;
  allDay: boolean;

  category: string;
  location?: string;
  responsible?: string;

  status:
    | "planned"
    | "completed"
    | "cancelled";

  priority:
    | "normal"
    | "high";

  sourceLabel: string;
  sourceHref?: string;

  editable: boolean;

  responsibleType?:
    | "bride"
    | "groom"
    | "couple"
    | "planner"
    | "other";

  responsibleName?: string;
};

export type CronogramaManagementData = {
  events: CronogramaDataEvent[];
};

const weddingTimeZone =
  "America/Belem";

function stripSeconds(
  value: string | null,
) {
  if (!value) {
    return undefined;
  }

  return value.slice(0, 5);
}

function formatMoney(
  value: number,
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  ).format(value);
}

function formatDateInWeddingTimeZone(
  value: string,
) {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          weddingTimeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      },
    ).formatToParts(
      new Date(value),
    );

  const year =
    parts.find(
      (part) =>
        part.type === "year",
    )?.value;

  const month =
    parts.find(
      (part) =>
        part.type === "month",
    )?.value;

  const day =
    parts.find(
      (part) =>
        part.type === "day",
    )?.value;

  return `${year}-${month}-${day}`;
}

function formatTimeInWeddingTimeZone(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone:
        weddingTimeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
  ).format(new Date(value));
}

function responsibleLabel(
  type: string,
  name: string | null,
) {
  if (
    type === "other" &&
    name
  ) {
    return name;
  }

  const labels:
    Record<string, string> = {
      bride: "Noiva",
      groom: "Noivo",
      couple: "Casal",
      planner:
        "Cerimonialista",
    };

  return labels[type];
}

function eventSortValue(
  event: CronogramaDataEvent,
) {
  return [
    event.date,
    event.startTime ?? "23:59",
    event.title,
  ].join(" ");
}

export async function getCronogramaManagementData(
  weddingId: string,
  options?: {
    includePrivateDress?: boolean;
  },
): Promise<CronogramaManagementData> {
  const supabase =
    await createClient();

  const events:
    CronogramaDataEvent[] = [];

  const manualResult =
    await supabase
      .from("calendar_events")
      .select()
      .eq("wedding_id", weddingId)
      .order("event_date", {
        ascending: true,
      })
      .order("start_time", {
        ascending: true,
        nullsFirst: false,
      });

  if (manualResult.error) {
    console.error(
      "Erro ao carregar compromissos manuais:",
      manualResult.error,
    );

    throw new Error(
      "Não foi possível carregar o cronograma.",
    );
  }

  const manualRows:
    CalendarEventRow[] =
    manualResult.data ?? [];

  for (const event of manualRows) {
    const manualEvent:
      CronogramaDataEvent = {
      id: `manual:${event.id}`,
      sourceId: event.id,
      source: "manual",

      title: event.title,
      date: event.event_date,

      allDay: event.all_day,
      category: event.category,

      status:
        event.status as
          CronogramaDataEvent["status"],

      priority:
        event.priority as
          CronogramaDataEvent["priority"],

      sourceLabel:
        "Compromisso",

      editable: true,

      responsibleType:
        event.responsible_type as
          NonNullable<
            CronogramaDataEvent[
              "responsibleType"
            ]
          >,

      ...(event.description
        ? {
            description:
              event.description,
          }
        : {}),

      ...(stripSeconds(
        event.start_time,
      )
        ? {
            startTime:
              stripSeconds(
                event.start_time,
              ),
          }
        : {}),

      ...(stripSeconds(
        event.end_time,
      )
        ? {
            endTime:
              stripSeconds(
                event.end_time,
              ),
          }
        : {}),

      ...(event.location
        ? {
            location:
              event.location,
          }
        : {}),

      ...(responsibleLabel(
        event.responsible_type,
        event.responsible_name,
      )
        ? {
            responsible:
              responsibleLabel(
                event.responsible_type,
                event.responsible_name,
              ),
          }
        : {}),

      ...(event.responsible_name
        ? {
            responsibleName:
              event.responsible_name,
          }
        : {}),
    };

    events.push(manualEvent);
  }

  const checklistTasksResult =
    await supabase
      .from("checklist_tasks")
      .select()
      .eq("wedding_id", weddingId)
      .not("due_date", "is", null)
      .order("due_date", {
        ascending: true,
      });

  if (
    checklistTasksResult.error
  ) {
    console.error(
      "Erro ao carregar prazos do checklist:",
      checklistTasksResult.error,
    );

    throw new Error(
      "Não foi possível carregar os prazos do checklist.",
    );
  }

  const checklistTasks:
    ChecklistTaskRow[] =
    checklistTasksResult.data ??
    [];

  const checklistGroupIds =
    Array.from(
      new Set(
        checklistTasks.map(
          (task) =>
            task.group_id,
        ),
      ),
    );

  let checklistGroups:
    ChecklistGroupRow[] = [];

  if (
    checklistGroupIds.length > 0
  ) {
    const groupsResult =
      await supabase
        .from("checklist_groups")
        .select()
        .eq(
          "wedding_id",
          weddingId,
        )
        .in(
          "id",
          checklistGroupIds,
        );

    if (groupsResult.error) {
      console.error(
        "Erro ao carregar etapas do checklist:",
        groupsResult.error,
      );

      throw new Error(
        "Não foi possível carregar as etapas do checklist.",
      );
    }

    checklistGroups =
      groupsResult.data ?? [];
  }

  const groupsById =
    new Map(
      checklistGroups.map(
        (group) => [
          group.id,
          group,
        ],
      ),
    );

  for (
    const task of checklistTasks
  ) {
    if (
      !task.due_date ||
      task.source_type ===
        "budget"
    ) {
      continue;
    }

    const group =
      groupsById.get(
        task.group_id,
      );

    const checklistEvent:
      CronogramaDataEvent = {
      id: `checklist:${task.id}`,
      sourceId: task.id,
      source: "checklist",

      title: task.title,
      date: task.due_date,
      allDay: true,

      category:
        group?.title ??
        "Checklist",

      status:
        task.status ===
        "completed"
          ? "completed"
          : "planned",

      priority:
        task.priority === "high"
          ? "high"
          : "normal",

      sourceLabel:
        "Checklist",

      sourceHref:
        "/painel/checklist",

      editable: false,

      ...(task.description
        ? {
            description:
              task.description,
          }
        : {}),

      ...(responsibleLabel(
        task.responsible_type,
        task.responsible_name,
      )
        ? {
            responsible:
              responsibleLabel(
                task.responsible_type,
                task.responsible_name,
              ),
          }
        : {}),
    };

    events.push(
      checklistEvent,
    );
  }

  const installmentsResult =
    await supabase
      .from(
        "budget_installments",
      )
      .select()
      .eq("wedding_id", weddingId)
      .neq("status", "cancelled")
      .order("due_date", {
        ascending: true,
      });

  if (
    installmentsResult.error
  ) {
    console.error(
      "Erro ao carregar contas do cronograma:",
      installmentsResult.error,
    );

    throw new Error(
      "Não foi possível carregar as contas do orçamento.",
    );
  }

  const installments:
    BudgetInstallmentRow[] =
    installmentsResult.data ?? [];

  const budgetItemIds =
    Array.from(
      new Set(
        installments.map(
          (installment) =>
            installment
              .budget_item_id,
        ),
      ),
    );

  let budgetItems:
    BudgetItemRow[] = [];

  if (
    budgetItemIds.length > 0
  ) {
    const budgetItemsResult =
      await supabase
        .from("budget_items")
        .select()
        .eq(
          "wedding_id",
          weddingId,
        )
        .in(
          "id",
          budgetItemIds,
        );

    if (
      budgetItemsResult.error
    ) {
      console.error(
        "Erro ao carregar serviços do orçamento:",
        budgetItemsResult.error,
      );

      throw new Error(
        "Não foi possível carregar os serviços do orçamento.",
      );
    }

    budgetItems =
      budgetItemsResult.data ??
      [];
  }

  const budgetItemsById =
    new Map(
      budgetItems.map(
        (item) => [
          item.id,
          item,
        ],
      ),
    );

  for (
    const installment
    of installments
  ) {
    const item =
      budgetItemsById.get(
        installment
          .budget_item_id,
      );

    if (!item) {
      continue;
    }

    const remaining =
      Math.max(
        0,
        installment.amount -
          installment.paid_amount,
      );

    events.push({
      id: `budget:${installment.id}`,
      sourceId:
        installment.id,
      source: "budget",

      title:
        `${item.name} — ${installment.description}`,

      description:
        installment.status ===
        "paid"
          ? `Pagamento concluído no valor de ${formatMoney(
              installment.amount,
            )}.`
          : `Valor pendente: ${formatMoney(
              remaining,
            )}.`,

      date:
        installment.due_date,

      allDay: true,
      category: "Financeiro",

      status:
        installment.status ===
        "paid"
          ? "completed"
          : "planned",

      priority: "high",

      sourceLabel:
        "Orçamento",

      sourceHref:
        "/painel/financeiro",

      editable: false,
    });
  }

  if (
    options?.includePrivateDress
  ) {
    const appointmentsResult =
      await supabase
        .from(
          "bridal_dress_appointments",
        )
        .select()
        .eq(
          "wedding_id",
          weddingId,
        )
        .order(
          "appointment_at",
          {
            ascending: true,
          },
        );

    if (
      appointmentsResult.error
    ) {
      console.error(
        "Erro ao carregar agenda privada do vestido:",
        appointmentsResult.error,
      );

      throw new Error(
        "Não foi possível carregar os compromissos do vestido.",
      );
    }

    const appointments:
      BridalDressAppointmentRow[] =
      appointmentsResult.data ??
      [];

    const optionIds =
      Array.from(
        new Set(
          appointments
            .map(
              (appointment) =>
                appointment
                  .dress_option_id,
            )
            .filter(
              (
                value,
              ): value is string =>
                Boolean(value),
            ),
        ),
      );

    let dressOptions:
      BridalDressOptionRow[] =
      [];

    if (optionIds.length > 0) {
      const optionsResult =
        await supabase
          .from(
            "bridal_dress_options",
          )
          .select()
          .eq(
            "wedding_id",
            weddingId,
          )
          .in("id", optionIds);

      if (
        optionsResult.error
      ) {
        console.error(
          "Erro ao carregar vestidos vinculados:",
          optionsResult.error,
        );
      } else {
        dressOptions =
          optionsResult.data ??
          [];
      }
    }

    const dressOptionsById =
      new Map(
        dressOptions.map(
          (option) => [
            option.id,
            option,
          ],
        ),
      );

    for (
      const appointment
      of appointments
    ) {
      const option =
        appointment
          .dress_option_id
          ? dressOptionsById.get(
              appointment
                .dress_option_id,
            )
          : undefined;

      events.push({
        id: `dress:${appointment.id}`,
        sourceId:
          appointment.id,
        source: "dress",

        title:
          appointment.title,

        date:
          formatDateInWeddingTimeZone(
            appointment
              .appointment_at,
          ),

        startTime:
          formatTimeInWeddingTimeZone(
            appointment
              .appointment_at,
          ),

        allDay: false,
        category:
          "Vestido da noiva",

        status:
          appointment.completed
            ? "completed"
            : "planned",

        priority: "normal",

        sourceLabel:
          "Área privada",

        sourceHref:
          "/painel/fornecedores",

        editable: false,

        ...(appointment.notes
          ? {
              description:
                appointment.notes,
            }
          : option
            ? {
                description:
                  `Referência: ${option.title}.`,
              }
            : {}),

        ...(appointment.location
          ? {
              location:
                appointment.location,
            }
          : {}),
      });
    }
  }

  events.sort(
    (first, second) =>
      eventSortValue(
        first,
      ).localeCompare(
        eventSortValue(second),
      ),
  );

  return {
    events,
  };
}
