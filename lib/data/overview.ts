import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type GuestRow =
  Database["public"]["Tables"]["guests"]["Row"];

type BudgetItemRow =
  Database["public"]["Tables"]["budget_items"]["Row"];

type BudgetInstallmentRow =
  Database["public"]["Tables"]["budget_installments"]["Row"];

type ChecklistGroupRow =
  Database["public"]["Tables"]["checklist_groups"]["Row"];

type ChecklistTaskRow =
  Database["public"]["Tables"]["checklist_tasks"]["Row"];

type CalendarEventRow =
  Database["public"]["Tables"]["calendar_events"]["Row"];

type SeatingTableRow =
  Database["public"]["Tables"]["seating_tables"]["Row"];

type GuestTableAssignmentRow =
  Database["public"]["Tables"]["guest_table_assignments"]["Row"];

type CeremonyBlockRow =
  Database["public"]["Tables"]["ceremony_blocks"]["Row"];

type BridalDressOptionRow =
  Database["public"]["Tables"]["bridal_dress_options"]["Row"];

type BridalDressAppointmentRow =
  Database["public"]["Tables"]["bridal_dress_appointments"]["Row"];

export type OverviewNextStep = {
  id: string;
  title: string;
  description: string;
  deadline: string;
  category: string;
  priority:
    | "urgent"
    | "soon"
    | "normal";
};

export type OverviewMonthlyPayment = {
  id: string;
  title: string;
  service: string;
  category: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status:
    | "paid"
    | "partially_paid"
    | "pending";
};

export type OverviewTimelineItem = {
  title: string;
  date: string;
  source: string;
};

export type OverviewPrivateDress = {
  optionCount: number;
  chosenCount: number;
  nextAppointment?: {
    title: string;
    appointmentAt: string;
  };
};

export type WeddingOverviewData = {
  today: string;

  guests: {
    total: number;
    confirmed: number;
    pending: number;
    declined: number;
  };

  finance: {
    total: number;
    paid: number;
    remaining: number;
    scheduledRemaining: number;
    unscheduled: number;
    dueNext30: number;
    overdue: number;
  };

  checklist: {
    total: number;
    completed: number;
    pending: number;
    priority: number;
    nextSteps: OverviewNextStep[];
  };

  monthlyPayments:
    OverviewMonthlyPayment[];

  timeline: {
    totalUpcoming: number;
    next30: number;
    overdue: number;
    nextItem?: OverviewTimelineItem;
  };

  seating: {
    tableCount: number;
    capacity: number;
    confirmedGuests: number;
    assignedConfirmedGuests: number;
    unassignedConfirmedGuests: number;
  };

  ceremony: {
    blockCount: number;
    confirmedCount: number;
    attentionCount: number;
    totalDurationMinutes: number;
  };

  privateDress?: OverviewPrivateDress;
};

function getDateInTimeZone(
  timeZone: string,
) {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      },
    ).formatToParts(
      new Date(),
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

  if (!year || !month || !day) {
    throw new Error(
      "Não foi possível determinar a data atual.",
    );
  }

  return `${year}-${month}-${day}`;
}

function parseDateOnly(
  value: string,
) {
  const [
    year,
    month,
    day,
  ] = value
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day,
  );
}

function dateToIso(
  value: Date,
) {
  return [
    value.getFullYear(),
    String(
      value.getMonth() + 1,
    ).padStart(2, "0"),
    String(
      value.getDate(),
    ).padStart(2, "0"),
  ].join("-");
}

function addDays(
  value: string,
  amount: number,
) {
  const date =
    parseDateOnly(value);

  date.setDate(
    date.getDate() + amount,
  );

  return dateToIso(date);
}

function addMonths(
  value: string,
  amount: number,
) {
  const date =
    parseDateOnly(
      `${value.slice(0, 7)}-01`,
    );

  date.setMonth(
    date.getMonth() + amount,
  );

  return dateToIso(date).slice(
    0,
    7,
  );
}

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "short",
    },
  )
    .format(
      parseDateOnly(value),
    )
    .replace(".", "");
}

function serviceTotal(
  item: BudgetItemRow,
) {
  return item.contracted_amount >
    0
    ? item.contracted_amount
    : item.planned_amount;
}

function installmentRemaining(
  installment:
    BudgetInstallmentRow,
) {
  return Math.max(
    0,
    installment.amount -
      installment.paid_amount,
  );
}

function checklistPriorityRank(
  priority: string,
) {
  if (priority === "high") {
    return 0;
  }

  if (priority === "medium") {
    return 1;
  }

  return 2;
}

function checklistDisplayPriority(
  task: ChecklistTaskRow,
  today: string,
) {
  if (
    task.due_date &&
    task.due_date < today
  ) {
    return "urgent" as const;
  }

  if (task.priority === "high") {
    return "urgent" as const;
  }

  if (
    task.priority === "medium" ||
    (
      task.due_date &&
      task.due_date <=
        addDays(today, 30)
    )
  ) {
    return "soon" as const;
  }

  return "normal" as const;
}

function checklistDeadline(
  task: ChecklistTaskRow,
  today: string,
) {
  if (!task.due_date) {
    return "Sem prazo";
  }

  const formatted =
    formatDate(task.due_date);

  if (task.due_date < today) {
    return `Atrasada · ${formatted}`;
  }

  if (task.due_date === today) {
    return `Hoje · ${formatted}`;
  }

  return formatted;
}

function appointmentDateInTimeZone(
  value: string,
  timeZone: string,
) {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone,
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

  if (!year || !month || !day) {
    return value.slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

export async function getWeddingOverviewData(
  weddingId: string,
  options: {
    timeZone: string;
    weddingDate: string;
    includePrivateDress?: boolean;
  },
): Promise<WeddingOverviewData> {
  const supabase =
    await createClient();

  const today =
    getDateInTimeZone(
      options.timeZone,
    );

  const next30Date =
    addDays(today, 30);

  const currentMonth =
    today.slice(0, 7);

  const nextMonth =
    addMonths(today, 1);

  const guestsResult =
    await supabase
      .from("guests")
      .select()
      .eq(
        "wedding_id",
        weddingId,
      );

  if (guestsResult.error) {
    console.error(
      "Erro ao carregar convidados da visão geral:",
      guestsResult.error,
    );

    throw new Error(
      "Não foi possível carregar o resumo de convidados.",
    );
  }

  const guests:
    GuestRow[] =
    guestsResult.data ?? [];

  const budgetItemsResult =
    await supabase
      .from("budget_items")
      .select()
      .eq(
        "wedding_id",
        weddingId,
      );

  if (budgetItemsResult.error) {
    console.error(
      "Erro ao carregar serviços da visão geral:",
      budgetItemsResult.error,
    );

    throw new Error(
      "Não foi possível carregar o resumo financeiro.",
    );
  }

  const budgetItems:
    BudgetItemRow[] =
    budgetItemsResult.data ?? [];

  const installmentsResult =
    await supabase
      .from(
        "budget_installments",
      )
      .select()
      .eq(
        "wedding_id",
        weddingId,
      )
      .order(
        "due_date",
        {
          ascending: true,
        },
      );

  if (
    installmentsResult.error
  ) {
    console.error(
      "Erro ao carregar parcelas da visão geral:",
      installmentsResult.error,
    );

    throw new Error(
      "Não foi possível carregar as parcelas do orçamento.",
    );
  }

  const installments:
    BudgetInstallmentRow[] =
    installmentsResult.data ?? [];

  const checklistGroupsResult =
    await supabase
      .from("checklist_groups")
      .select()
      .eq(
        "wedding_id",
        weddingId,
      );

  if (
    checklistGroupsResult.error
  ) {
    console.error(
      "Erro ao carregar etapas da visão geral:",
      checklistGroupsResult.error,
    );

    throw new Error(
      "Não foi possível carregar o resumo do checklist.",
    );
  }

  const checklistGroups:
    ChecklistGroupRow[] =
    checklistGroupsResult.data ??
    [];

  const checklistTasksResult =
    await supabase
      .from("checklist_tasks")
      .select()
      .eq(
        "wedding_id",
        weddingId,
      );

  if (
    checklistTasksResult.error
  ) {
    console.error(
      "Erro ao carregar tarefas da visão geral:",
      checklistTasksResult.error,
    );

    throw new Error(
      "Não foi possível carregar as tarefas.",
    );
  }

  const checklistTasks:
    ChecklistTaskRow[] =
    checklistTasksResult.data ??
    [];

  const calendarEventsResult =
    await supabase
      .from("calendar_events")
      .select()
      .eq(
        "wedding_id",
        weddingId,
      );

  if (
    calendarEventsResult.error
  ) {
    console.error(
      "Erro ao carregar cronograma da visão geral:",
      calendarEventsResult.error,
    );

    throw new Error(
      "Não foi possível carregar o resumo do cronograma.",
    );
  }

  const calendarEvents:
    CalendarEventRow[] =
    calendarEventsResult.data ??
    [];

  const seatingTablesResult =
    await supabase
      .from("seating_tables")
      .select()
      .eq(
        "wedding_id",
        weddingId,
      );

  if (
    seatingTablesResult.error
  ) {
    console.error(
      "Erro ao carregar mesas da visão geral:",
      seatingTablesResult.error,
    );

    throw new Error(
      "Não foi possível carregar o resumo das mesas.",
    );
  }

  const seatingTables:
    SeatingTableRow[] =
    seatingTablesResult.data ??
    [];

  const assignmentsResult =
    await supabase
      .from(
        "guest_table_assignments",
      )
      .select()
      .eq(
        "wedding_id",
        weddingId,
      );

  if (
    assignmentsResult.error
  ) {
    console.error(
      "Erro ao carregar lugares da visão geral:",
      assignmentsResult.error,
    );

    throw new Error(
      "Não foi possível carregar as atribuições de mesa.",
    );
  }

  const assignments:
    GuestTableAssignmentRow[] =
    assignmentsResult.data ?? [];

  const ceremonyBlocksResult =
    await supabase
      .from("ceremony_blocks")
      .select()
      .eq(
        "wedding_id",
        weddingId,
      );

  if (
    ceremonyBlocksResult.error
  ) {
    console.error(
      "Erro ao carregar cerimônia da visão geral:",
      ceremonyBlocksResult.error,
    );

    throw new Error(
      "Não foi possível carregar o resumo da cerimônia.",
    );
  }

  const ceremonyBlocks:
    CeremonyBlockRow[] =
    ceremonyBlocksResult.data ??
    [];

  let dressOptions:
    BridalDressOptionRow[] = [];

  let dressAppointments:
    BridalDressAppointmentRow[] =
    [];

  if (
    options.includePrivateDress
  ) {
    const dressOptionsResult =
      await supabase
        .from(
          "bridal_dress_options",
        )
        .select()
        .eq(
          "wedding_id",
          weddingId,
        );

    if (
      dressOptionsResult.error
    ) {
      console.error(
        "Erro ao carregar opções privadas na visão geral:",
        dressOptionsResult.error,
      );
    } else {
      dressOptions =
        dressOptionsResult.data ??
        [];
    }

    const dressAppointmentsResult =
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
      dressAppointmentsResult.error
    ) {
      console.error(
        "Erro ao carregar compromissos privados na visão geral:",
        dressAppointmentsResult.error,
      );
    } else {
      dressAppointments =
        dressAppointmentsResult.data ??
        [];
    }
  }

  const confirmedGuests =
    guests.filter(
      (guest) =>
        guest.confirmation_status ===
        "confirmed",
    );

  const guestStats = {
    total: guests.length,

    confirmed:
      confirmedGuests.length,

    pending:
      guests.filter(
        (guest) =>
          guest.confirmation_status ===
          "pending",
      ).length,

    declined:
      guests.filter(
        (guest) =>
          guest.confirmation_status ===
          "declined",
      ).length,
  };

  const activeBudgetItems =
    budgetItems.filter(
      (item) =>
        item.status !==
        "cancelled",
    );

  const activeInstallments =
    installments.filter(
      (installment) =>
        installment.status !==
        "cancelled",
    );

  const totalBudget =
    activeBudgetItems.reduce(
      (sum, item) =>
        sum + serviceTotal(item),
      0,
    );

  const totalPaid =
    activeInstallments.reduce(
      (sum, installment) =>
        sum +
        Math.min(
          installment.amount,
          Math.max(
            0,
            installment.paid_amount,
          ),
        ),
      0,
    );

  const installmentsByItem =
    new Map<
      string,
      BudgetInstallmentRow[]
    >();

  for (
    const installment
    of activeInstallments
  ) {
    const current =
      installmentsByItem.get(
        installment
          .budget_item_id,
      ) ?? [];

    current.push(installment);

    installmentsByItem.set(
      installment
        .budget_item_id,
      current,
    );
  }

  const unscheduledAmount =
    activeBudgetItems.reduce(
      (sum, item) => {
        const scheduled =
          (
            installmentsByItem.get(
              item.id,
            ) ?? []
          ).reduce(
            (
              installmentSum,
              installment,
            ) =>
              installmentSum +
              installment.amount,
            0,
          );

        return (
          sum +
          Math.max(
            0,
            serviceTotal(item) -
              scheduled,
          )
        );
      },
      0,
    );

  const scheduledRemaining =
    activeInstallments.reduce(
      (sum, installment) =>
        sum +
        installmentRemaining(
          installment,
        ),
      0,
    );

  const overdueAmount =
    activeInstallments
      .filter(
        (installment) =>
          installmentRemaining(
            installment,
          ) > 0 &&
          installment.due_date <
            today,
      )
      .reduce(
        (sum, installment) =>
          sum +
          installmentRemaining(
            installment,
          ),
        0,
      );

  const dueNext30Amount =
    activeInstallments
      .filter(
        (installment) =>
          installmentRemaining(
            installment,
          ) > 0 &&
          installment.due_date >=
            today &&
          installment.due_date <=
            next30Date,
      )
      .reduce(
        (sum, installment) =>
          sum +
          installmentRemaining(
            installment,
          ),
        0,
      );

  const budgetItemsById =
    new Map(
      budgetItems.map(
        (item) => [
          item.id,
          item,
        ],
      ),
    );

  const monthlyPayments:
    OverviewMonthlyPayment[] =
    activeInstallments
      .filter((installment) => {
        const month =
          installment.due_date.slice(
            0,
            7,
          );

        return (
          month === currentMonth ||
          month === nextMonth
        );
      })
      .reduce<
        OverviewMonthlyPayment[]
      >(
        (result, installment) => {
          const item =
            budgetItemsById.get(
              installment
                .budget_item_id,
            );

          if (!item) {
            return result;
          }

          const status =
            installment.paid_amount >=
            installment.amount
              ? "paid"
              : installment.paid_amount >
                  0
                ? "partially_paid"
                : "pending";

          result.push({
            id: installment.id,

            title:
              installment.description,

            service: item.name,
            category:
              item.category,

            amount:
              installment.amount,

            paidAmount:
              Math.min(
                installment.amount,
                Math.max(
                  0,
                  installment
                    .paid_amount,
                ),
              ),

            dueDate:
              installment.due_date,

            status,
          });

          return result;
        },
        [],
      )
      .sort(
        (first, second) =>
          first.dueDate.localeCompare(
            second.dueDate,
          ),
      );

  const groupsById =
    new Map(
      checklistGroups.map(
        (group) => [
          group.id,
          group,
        ],
      ),
    );

  const incompleteTasks =
    checklistTasks.filter(
      (task) =>
        task.status !==
        "completed",
    );

  const priorityTasks =
    incompleteTasks.filter(
      (task) =>
        task.priority ===
          "high" ||
        (
          task.due_date &&
          task.due_date < today
        ),
    );

  const sortedNextTasks =
    incompleteTasks
      .slice()
      .sort(
        (first, second) => {
          const firstOverdue =
            Boolean(
              first.due_date &&
                first.due_date <
                  today,
            );

          const secondOverdue =
            Boolean(
              second.due_date &&
                second.due_date <
                  today,
            );

          if (
            firstOverdue !==
            secondOverdue
          ) {
            return firstOverdue
              ? -1
              : 1;
          }

          const firstDate =
            first.due_date ??
            "9999-12-31";

          const secondDate =
            second.due_date ??
            "9999-12-31";

          const dateComparison =
            firstDate.localeCompare(
              secondDate,
            );

          if (
            dateComparison !== 0
          ) {
            return dateComparison;
          }

          return (
            checklistPriorityRank(
              first.priority,
            ) -
            checklistPriorityRank(
              second.priority,
            )
          );
        },
      )
      .slice(0, 4);

  const nextSteps:
    OverviewNextStep[] =
    sortedNextTasks.map(
      (task) => {
        const group =
          groupsById.get(
            task.group_id,
          );

        return {
          id: task.id,
          title: task.title,

          description:
            task.description ||
            `Tarefa da etapa ${
              group?.title ??
              "Checklist"
            }.`,

          deadline:
            checklistDeadline(
              task,
              today,
            ),

          category:
            group?.title ??
            "Checklist",

          priority:
            checklistDisplayPriority(
              task,
              today,
            ),
        };
      },
    );

  const openTimelineItems:
    OverviewTimelineItem[] = [];

  for (
    const event
    of calendarEvents
  ) {
    if (
      event.status ===
        "completed" ||
      event.status ===
        "cancelled"
    ) {
      continue;
    }

    openTimelineItems.push({
      title: event.title,
      date: event.event_date,
      source:
        event.category ||
        "Cronograma",
    });
  }

  for (
    const task
    of incompleteTasks
  ) {
    if (
      !task.due_date ||
      task.source_type ===
        "budget"
    ) {
      continue;
    }

    openTimelineItems.push({
      title: task.title,
      date: task.due_date,
      source: "Checklist",
    });
  }

  for (
    const installment
    of activeInstallments
  ) {
    if (
      installmentRemaining(
        installment,
      ) <= 0
    ) {
      continue;
    }

    const item =
      budgetItemsById.get(
        installment
          .budget_item_id,
      );

    openTimelineItems.push({
      title: item
        ? `${item.name} — ${installment.description}`
        : installment.description,

      date:
        installment.due_date,

      source: "Financeiro",
    });
  }

  if (
    options.weddingDate >=
    today
  ) {
    openTimelineItems.push({
      title:
        "Dia do casamento",

      date:
        options.weddingDate,

      source:
        "Grande dia",
    });
  }

  if (
    options.includePrivateDress
  ) {
    for (
      const appointment
      of dressAppointments
    ) {
      if (
        appointment.completed
      ) {
        continue;
      }

      openTimelineItems.push({
        title:
          appointment.title,

        date:
          appointmentDateInTimeZone(
            appointment
              .appointment_at,
            options.timeZone,
          ),

        source:
          "Vestido da noiva",
      });
    }
  }

  openTimelineItems.sort(
    (first, second) =>
      first.date.localeCompare(
        second.date,
      ),
  );

  const upcomingTimelineItems =
    openTimelineItems.filter(
      (item) =>
        item.date >= today,
    );

  const assignedGuestIds =
    new Set(
      assignments.map(
        (assignment) =>
          assignment.guest_id,
      ),
    );

  const assignedConfirmedGuests =
    confirmedGuests.filter(
      (guest) =>
        assignedGuestIds.has(
          guest.id,
        ),
    ).length;

  const ceremonyStats = {
    blockCount:
      ceremonyBlocks.length,

    confirmedCount:
      ceremonyBlocks.filter(
        (block) =>
          block.status ===
          "confirmed",
      ).length,

    attentionCount:
      ceremonyBlocks.filter(
        (block) =>
          block.status ===
          "attention",
      ).length,

    totalDurationMinutes:
      ceremonyBlocks.reduce(
        (sum, block) =>
          sum +
          block.duration_minutes,
        0,
      ),
  };

  let privateDress:
    OverviewPrivateDress |
    undefined;

  if (
    options.includePrivateDress
  ) {
    const now =
      new Date();

    const nextAppointment =
      dressAppointments.find(
        (appointment) =>
          !appointment.completed &&
          new Date(
            appointment
              .appointment_at,
          ).getTime() >=
            now.getTime(),
      );

    privateDress = {
      optionCount:
        dressOptions.length,

      chosenCount:
        dressOptions.filter(
          (option) =>
            option.status ===
            "chosen",
        ).length,

      ...(nextAppointment
        ? {
            nextAppointment: {
              title:
                nextAppointment.title,

              appointmentAt:
                nextAppointment
                  .appointment_at,
            },
          }
        : {}),
    };
  }

  return {
    today,

    guests: guestStats,

    finance: {
      total: totalBudget,
      paid: totalPaid,

      remaining:
        Math.max(
          0,
          totalBudget -
            totalPaid,
        ),

      scheduledRemaining,
      unscheduled:
        unscheduledAmount,

      dueNext30:
        dueNext30Amount,

      overdue:
        overdueAmount,
    },

    checklist: {
      total:
        checklistTasks.length,

      completed:
        checklistTasks.filter(
          (task) =>
            task.status ===
            "completed",
        ).length,

      pending:
        incompleteTasks.length,

      priority:
        priorityTasks.length,

      nextSteps,
    },

    monthlyPayments,

    timeline: {
      totalUpcoming:
        upcomingTimelineItems.length,

      next30:
        upcomingTimelineItems.filter(
          (item) =>
            item.date <=
            next30Date,
        ).length,

      overdue:
        openTimelineItems.filter(
          (item) =>
            item.date < today,
        ).length,

      ...(upcomingTimelineItems[0]
        ? {
            nextItem:
              upcomingTimelineItems[0],
          }
        : {}),
    },

    seating: {
      tableCount:
        seatingTables.length,

      capacity:
        seatingTables.reduce(
          (sum, table) =>
            sum +
            table.capacity,
          0,
        ),

      confirmedGuests:
        confirmedGuests.length,

      assignedConfirmedGuests,

      unassignedConfirmedGuests:
        Math.max(
          0,
          confirmedGuests.length -
            assignedConfirmedGuests,
        ),
    },

    ceremony:
      ceremonyStats,

    ...(privateDress
      ? {
          privateDress,
        }
      : {}),
  };
}
