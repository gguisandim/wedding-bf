"use client";

import Link from "next/link";
import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import {
  createCronogramaEventAction,
  deleteCronogramaEventAction,
  setCronogramaEventCompletedAction,
  updateCronogramaEventAction,
} from "@/lib/actions/cronograma";

import styles from "./cronograma-manager.module.css";

export type CronogramaEventSource =
  | "manual"
  | "checklist"
  | "budget"
  | "dress"
  | "wedding";

export type CronogramaEventItem = {
  id: string;
  sourceId: string;
  source:
    CronogramaEventSource;

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
    | "cancelled"
    | "wedding";

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

type CronogramaManagerProps = {
  initialEvents:
    CronogramaEventItem[];

  brideName: string;
  groomName: string;
};

type Filter =
  | "all"
  | "today"
  | "next30"
  | "overdue"
  | "completed";

type EventForm = {
  id?: string;

  title: string;
  description: string;

  eventDate: string;
  startTime: string;
  endTime: string;
  allDay: boolean;

  category: string;
  location: string;

  responsibleType:
    | "bride"
    | "groom"
    | "couple"
    | "planner"
    | "other";

  responsibleName: string;

  priority:
    | "normal"
    | "high";
};

const categories = [
  "Compromisso",
  "Cerimônia",
  "Convidados",
  "Decoração",
  "Documentos",
  "Financeiro",
  "Fotografia",
  "Reunião",
  "Vestido",
  "Outro",
];

const monthFormatter =
  new Intl.DateTimeFormat(
    "pt-BR",
    {
      month: "long",
      year: "numeric",
    },
  );

const weekdayFormatter =
  new Intl.DateTimeFormat(
    "pt-BR",
    {
      weekday: "short",
    },
  );

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
  date: Date,
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(2, "0");

  const day =
    String(
      date.getDate(),
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayIso() {
  return dateToIso(
    new Date(),
  );
}

function formatLongDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  ).format(
    parseDateOnly(value),
  );
}

function getMonthKey(
  value: string,
) {
  return value.slice(0, 7);
}

function formatMonthTitle(
  monthKey: string,
) {
  return monthFormatter.format(
    parseDateOnly(
      `${monthKey}-01`,
    ),
  );
}

function formatWeekday(
  value: string,
) {
  return weekdayFormatter
    .format(
      parseDateOnly(value),
    )
    .replace(".", "")
    .replace(
      /^./,
      (character) =>
        character.toUpperCase(),
    );
}

function addDays(
  date: Date,
  amount: number,
) {
  const next =
    new Date(date);

  next.setDate(
    next.getDate() + amount,
  );

  return next;
}

function isEventCompleted(
  event: CronogramaEventItem,
) {
  return (
    event.status ===
      "completed" ||
    event.status ===
      "cancelled"
  );
}

function isEventOverdue(
  event: CronogramaEventItem,
) {
  if (
    isEventCompleted(event) ||
    event.status === "wedding"
  ) {
    return false;
  }

  return (
    event.date <
    getTodayIso()
  );
}

function isEventToday(
  event: CronogramaEventItem,
) {
  return (
    event.date ===
    getTodayIso()
  );
}

function isEventWithinNext30Days(
  event: CronogramaEventItem,
) {
  if (
    isEventCompleted(event)
  ) {
    return false;
  }

  const today =
    parseDateOnly(
      getTodayIso(),
    );

  const limit =
    addDays(today, 30);

  const eventDate =
    parseDateOnly(
      event.date,
    );

  return (
    eventDate.getTime() >=
      today.getTime() &&
    eventDate.getTime() <=
      limit.getTime()
  );
}

function eventSortValue(
  event: CronogramaEventItem,
) {
  return [
    event.date,
    event.startTime ?? "23:59",
    event.title,
  ].join(" ");
}

function emptyEventForm():
  EventForm {
  return {
    title: "",
    description: "",

    eventDate:
      getTodayIso(),

    startTime: "",
    endTime: "",
    allDay: false,

    category:
      "Compromisso",

    location: "",

    responsibleType:
      "couple",

    responsibleName: "",

    priority: "normal",
  };
}

function eventStatus(
  event: CronogramaEventItem,
) {
  if (
    event.status ===
    "wedding"
  ) {
    return {
      label: "Grande dia",
      tone: "wedding",
    };
  }

  if (
    event.status ===
    "completed"
  ) {
    return {
      label: "Concluído",
      tone: "completed",
    };
  }

  if (
    event.status ===
    "cancelled"
  ) {
    return {
      label: "Cancelado",
      tone: "cancelled",
    };
  }

  if (isEventOverdue(event)) {
    return {
      label: "Atrasado",
      tone: "overdue",
    };
  }

  if (isEventToday(event)) {
    return {
      label: "Hoje",
      tone: "today",
    };
  }

  if (
    isEventWithinNext30Days(
      event,
    )
  ) {
    return {
      label: "Próximo",
      tone: "upcoming",
    };
  }

  return {
    label: "Planejado",
    tone: "planned",
  };
}

export default function CronogramaManager({
  initialEvents,
  brideName,
  groomName,
}: CronogramaManagerProps) {
  const router = useRouter();

  const [
    events,
    setEvents,
  ] = useState<
    CronogramaEventItem[]
  >(initialEvents);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    filter,
    setFilter,
  ] = useState<Filter>("all");

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    eventForm,
    setEventForm,
  ] = useState<EventForm>(
    emptyEventForm,
  );

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    feedback,
    setFeedback,
  ] = useState<string | null>(
    null,
  );

  const [
    mounted,
    setMounted,
  ] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  const sortedEvents =
    useMemo(
      () =>
        events
          .slice()
          .sort(
            (first, second) =>
              eventSortValue(
                first,
              ).localeCompare(
                eventSortValue(
                  second,
                ),
              ),
          ),
      [events],
    );

  const nextEvent =
    useMemo(
      () =>
        sortedEvents.find(
          (event) =>
            !isEventCompleted(
              event,
            ) &&
            event.date >=
              getTodayIso(),
        ),
      [sortedEvents],
    );

  const statistics =
    useMemo(() => {
      const completed =
        events.filter(
          (event) =>
            event.status ===
            "completed",
        ).length;

      const overdue =
        events.filter(
          isEventOverdue,
        ).length;

      const next30 =
        events.filter(
          isEventWithinNext30Days,
        ).length;

      const automatic =
        events.filter(
          (event) =>
            event.source !==
            "manual" &&
            event.source !==
            "wedding",
        ).length;

      return {
        completed,
        overdue,
        next30,
        automatic,
      };
    }, [events]);

  const filteredEvents =
    useMemo(() => {
      const normalized =
        search
          .trim()
          .toLocaleLowerCase(
            "pt-BR",
          );

      return sortedEvents.filter(
        (event) => {
          const searchable = [
            event.title,
            event.description,
            event.category,
            event.location,
            event.responsible,
            event.sourceLabel,
          ]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase(
              "pt-BR",
            );

          const matchesSearch =
            !normalized ||
            searchable.includes(
              normalized,
            );

          const matchesFilter =
            filter === "all" ||
            (
              filter === "today" &&
              isEventToday(event)
            ) ||
            (
              filter === "next30" &&
              isEventWithinNext30Days(
                event,
              )
            ) ||
            (
              filter === "overdue" &&
              isEventOverdue(event)
            ) ||
            (
              filter ===
                "completed" &&
              event.status ===
                "completed"
            );

          return (
            matchesSearch &&
            matchesFilter
          );
        },
      );
    }, [
      sortedEvents,
      search,
      filter,
    ]);

  const monthGroups =
    useMemo(() => {
      const groups =
        new Map<
          string,
          CronogramaEventItem[]
        >();

      for (
        const event
        of filteredEvents
      ) {
        const monthKey =
          getMonthKey(
            event.date,
          );

        const current =
          groups.get(monthKey) ??
          [];

        current.push(event);

        groups.set(
          monthKey,
          current,
        );
      }

      return Array.from(
        groups.entries(),
      );
    }, [filteredEvents]);

  function showFeedback(
    message: string,
  ) {
    setFeedback(message);

    window.setTimeout(() => {
      setFeedback(null);
    }, 3200);
  }

  function openNewEvent() {
    window.dispatchEvent(
      new Event(
        "dashboard:collapse-sidebar",
      ),
    );

    setEventForm(
      emptyEventForm(),
    );

    setModalOpen(true);
  }

  function openEditEvent(
    event: CronogramaEventItem,
  ) {
    if (
      !event.editable ||
      event.source !== "manual"
    ) {
      return;
    }

    window.dispatchEvent(
      new Event(
        "dashboard:collapse-sidebar",
      ),
    );

    setEventForm({
      id: event.sourceId,

      title: event.title,

      description:
        event.description ?? "",

      eventDate:
        event.date,

      startTime:
        event.startTime ?? "",

      endTime:
        event.endTime ?? "",

      allDay: event.allDay,

      category:
        event.category,

      location:
        event.location ?? "",

      responsibleType:
        event.responsibleType ??
        "couple",

      responsibleName:
        event.responsibleName ??
        "",

      priority:
        event.priority,
    });

    setModalOpen(true);
  }

  async function saveEvent(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const input = {
        title:
          eventForm.title.trim(),

        description:
          eventForm.description.trim(),

        eventDate:
          eventForm.eventDate,

        startTime:
          eventForm.allDay
            ? ""
            : eventForm.startTime,

        endTime:
          eventForm.allDay
            ? ""
            : eventForm.endTime,

        allDay:
          eventForm.allDay,

        category:
          eventForm.category,

        location:
          eventForm.location.trim(),

        responsibleType:
          eventForm.responsibleType,

        responsibleName:
          eventForm.responsibleName.trim(),

        priority:
          eventForm.priority,
      };

      const result =
        eventForm.id
          ? await updateCronogramaEventAction({
              id:
                eventForm.id,
              ...input,
            })
          : await createCronogramaEventAction(
              input,
            );

      showFeedback(
        result.message,
      );

      if (result.success) {
        setModalOpen(false);
        router.refresh();
      }
    } catch (error) {
      console.error(
        "Erro ao salvar compromisso:",
        error,
      );

      showFeedback(
        "Não foi possível salvar o compromisso.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleCompleted(
    event: CronogramaEventItem,
  ) {
    if (
      !event.editable ||
      event.source !== "manual"
    ) {
      return;
    }

    const result =
      await setCronogramaEventCompletedAction(
        event.sourceId,
        event.status !==
          "completed",
      );

    showFeedback(
      result.message,
    );

    if (result.success) {
      router.refresh();
    }
  }

  async function removeEvent(
    event: CronogramaEventItem,
  ) {
    if (
      !event.editable ||
      event.source !== "manual"
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Excluir o compromisso "${event.title}"?`,
      );

    if (!confirmed) {
      return;
    }

    const result =
      await deleteCronogramaEventAction(
        event.sourceId,
      );

    showFeedback(
      result.message,
    );

    if (result.success) {
      router.refresh();
    }
  }

  const eventModal =
    modalOpen ? (
      <div
        className={
          styles.modalOverlay
        }
        role="presentation"
        onMouseDown={(event) => {
          if (
            event.target ===
              event.currentTarget &&
            !isSaving
          ) {
            setModalOpen(false);
          }
        }}
      >
        <section
          className={styles.modal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cronograma-modal-title"
        >
          <header
            className={
              styles.modalHeader
            }
          >
            <div>
              <span>
                Cronograma
              </span>

              <h2 id="cronograma-modal-title">
                {eventForm.id
                  ? "Editar compromisso"
                  : "Novo compromisso"}
              </h2>

              <p>
                Compromissos criados
                aqui podem ser editados.
                Prazos de outros módulos
                aparecem automaticamente.
              </p>
            </div>

            <button
              type="button"
              aria-label="Fechar"
              disabled={isSaving}
              onClick={() =>
                setModalOpen(false)
              }
            >
              ×
            </button>
          </header>

          <form
            className={styles.form}
            onSubmit={saveEvent}
          >
            <label
              className={
                styles.fullField
              }
            >
              <span>Título</span>

              <input
                required
                minLength={2}
                value={
                  eventForm.title
                }
                placeholder="Ex.: Reunião com fotógrafo"
                onChange={(event) =>
                  setEventForm(
                    (current) => ({
                      ...current,
                      title:
                        event.target
                          .value,
                    }),
                  )
                }
              />
            </label>

            <label>
              <span>Data</span>

              <input
                required
                type="date"
                value={
                  eventForm.eventDate
                }
                onChange={(event) =>
                  setEventForm(
                    (current) => ({
                      ...current,
                      eventDate:
                        event.target
                          .value,
                    }),
                  )
                }
              />
            </label>

            <label>
              <span>Categoria</span>

              <select
                value={
                  eventForm.category
                }
                onChange={(event) =>
                  setEventForm(
                    (current) => ({
                      ...current,
                      category:
                        event.target
                          .value,
                    }),
                  )
                }
              >
                {categories.map(
                  (category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label
              className={
                styles.checkboxField
              }
            >
              <input
                type="checkbox"
                checked={
                  eventForm.allDay
                }
                onChange={(event) =>
                  setEventForm(
                    (current) => ({
                      ...current,
                      allDay:
                        event.target
                          .checked,
                    }),
                  )
                }
              />

              <span>
                Compromisso sem horário
              </span>
            </label>

            {!eventForm.allDay && (
              <>
                <label>
                  <span>
                    Horário inicial
                  </span>

                  <input
                    type="time"
                    value={
                      eventForm.startTime
                    }
                    onChange={(event) =>
                      setEventForm(
                        (current) => ({
                          ...current,
                          startTime:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Horário final
                  </span>

                  <input
                    type="time"
                    value={
                      eventForm.endTime
                    }
                    onChange={(event) =>
                      setEventForm(
                        (current) => ({
                          ...current,
                          endTime:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />
                </label>
              </>
            )}

            <label
              className={
                styles.fullField
              }
            >
              <span>Local</span>

              <input
                value={
                  eventForm.location
                }
                placeholder="Ex.: Reunião on-line"
                onChange={(event) =>
                  setEventForm(
                    (current) => ({
                      ...current,
                      location:
                        event.target
                          .value,
                    }),
                  )
                }
              />
            </label>

            <label>
              <span>Responsável</span>

              <select
                value={
                  eventForm
                    .responsibleType
                }
                onChange={(event) =>
                  setEventForm(
                    (current) => ({
                      ...current,
                      responsibleType:
                        event.target
                          .value as
                          EventForm[
                            "responsibleType"
                          ],
                    }),
                  )
                }
              >
                <option value="bride">
                  {brideName}
                </option>

                <option value="groom">
                  {groomName}
                </option>

                <option value="couple">
                  Casal
                </option>

                <option value="planner">
                  Cerimonialista
                </option>

                <option value="other">
                  Outra pessoa
                </option>
              </select>
            </label>

            <label>
              <span>Prioridade</span>

              <select
                value={
                  eventForm.priority
                }
                onChange={(event) =>
                  setEventForm(
                    (current) => ({
                      ...current,
                      priority:
                        event.target
                          .value as
                          EventForm[
                            "priority"
                          ],
                    }),
                  )
                }
              >
                <option value="normal">
                  Normal
                </option>

                <option value="high">
                  Alta
                </option>
              </select>
            </label>

            {eventForm.responsibleType ===
              "other" && (
              <label
                className={
                  styles.fullField
                }
              >
                <span>
                  Nome do responsável
                </span>

                <input
                  required
                  value={
                    eventForm
                      .responsibleName
                  }
                  onChange={(event) =>
                    setEventForm(
                      (current) => ({
                        ...current,
                        responsibleName:
                          event.target
                            .value,
                      }),
                    )
                  }
                />
              </label>
            )}

            <label
              className={
                styles.fullField
              }
            >
              <span>Descrição</span>

              <textarea
                rows={5}
                value={
                  eventForm.description
                }
                placeholder="Informações importantes sobre o compromisso..."
                onChange={(event) =>
                  setEventForm(
                    (current) => ({
                      ...current,
                      description:
                        event.target
                          .value,
                    }),
                  )
                }
              />
            </label>

            <div
              className={
                styles.modalActions
              }
            >
              <button
                type="button"
                disabled={isSaving}
                onClick={() =>
                  setModalOpen(false)
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSaving}
              >
                {isSaving
                  ? "Salvando..."
                  : "Salvar compromisso"}
              </button>
            </div>
          </form>
        </section>
      </div>
    ) : null;

  return (
    <div className={styles.page}>
      {feedback && (
        <div
          className={
            styles.feedback
          }
          role="status"
          aria-live="polite"
        >
          <span aria-hidden="true">
            ✓
          </span>

          {feedback}
        </div>
      )}

      <header
        className={styles.hero}
      >
        <div
          className={
            styles.heroContent
          }
        >
          <span
            className={
              styles.eyebrow
            }
          >
            Planejamento
          </span>

          <h1>
            Cronograma do casamento
          </h1>

          <p>
            Reúna compromissos,
            pagamentos e prazos em uma
            linha do tempo única até o
            grande dia.
          </p>

          <button
            type="button"
            className={
              styles.primaryButton
            }
            onClick={
              openNewEvent
            }
          >
            <span aria-hidden="true">
              +
            </span>

            Novo compromisso
          </button>
        </div>

        <div
          className={
            styles.heroOverview
          }
        >
          <section
            className={
              styles.nextEventCard
            }
          >
            <span>
              Próximo compromisso
            </span>

            {nextEvent ? (
              <div>
                <time
                  dateTime={
                    nextEvent.date
                  }
                  className={
                    styles.nextDate
                  }
                >
                  <strong>
                    {nextEvent.date.slice(
                      8,
                      10,
                    )}
                  </strong>

                  <small>
                    {new Intl.DateTimeFormat(
                      "pt-BR",
                      {
                        month:
                          "short",
                      },
                    )
                      .format(
                        parseDateOnly(
                          nextEvent.date,
                        ),
                      )
                      .replace(
                        ".",
                        "",
                      )
                      .toUpperCase()}
                  </small>
                </time>

                <div>
                  <strong>
                    {nextEvent.title}
                  </strong>

                  <small>
                    {nextEvent.allDay
                      ? "Sem horário definido"
                      : nextEvent.startTime ??
                        "Horário não informado"}
                  </small>
                </div>
              </div>
            ) : (
              <p>
                Nenhum compromisso
                futuro.
              </p>
            )}
          </section>

          <div
            className={
              styles.heroStats
            }
          >
            <article>
              <strong>
                {
                  statistics.next30
                }
              </strong>

              <span>
                Próximos 30 dias
              </span>
            </article>

            <article
              className={
                statistics.overdue >
                0
                  ? styles.dangerStat
                  : ""
              }
            >
              <strong>
                {
                  statistics.overdue
                }
              </strong>

              <span>
                Em atraso
              </span>
            </article>
          </div>
        </div>
      </header>

      <section
        className={
          styles.summaryGrid
        }
      >
        <article>
          <span>
            Itens no cronograma
          </span>

          <strong>
            {events.length}
          </strong>

          <small>
            Manuais e automáticos
          </small>
        </article>

        <article>
          <span>
            Concluídos
          </span>

          <strong>
            {
              statistics.completed
            }
          </strong>

          <small>
            Compromissos finalizados
          </small>
        </article>

        <article>
          <span>
            Integrações
          </span>

          <strong>
            {
              statistics.automatic
            }
          </strong>

          <small>
            Checklist, orçamento e vestido
          </small>
        </article>

        <article>
          <span>
            Até o casamento
          </span>

          <strong>
            {(() => {
              const wedding =
                events.find(
                  (event) =>
                    event.source ===
                    "wedding",
                );

              if (!wedding) {
                return "—";
              }

              const difference =
                Math.ceil(
                  (
                    parseDateOnly(
                      wedding.date,
                    ).getTime() -
                    parseDateOnly(
                      getTodayIso(),
                    ).getTime()
                  ) /
                    (
                      24 *
                      60 *
                      60 *
                      1000
                    ),
                );

              return difference >= 0
                ? `${difference} dias`
                : "Realizado";
            })()}
          </strong>

          <small>
            {brideName}
            {" & "}
            {groomName}
          </small>
        </article>
      </section>

      <section
        className={
          styles.toolbar
        }
      >
        <label
          className={styles.search}
        >
          <span aria-hidden="true">
            ⌕
          </span>

          <input
            type="search"
            value={search}
            placeholder="Buscar compromisso, local ou responsável..."
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
          />
        </label>

        <div
          className={
            styles.filters
          }
        >
          {(
            [
              ["all", "Todos"],
              ["today", "Hoje"],
              [
                "next30",
                "Próximos 30 dias",
              ],
              [
                "overdue",
                "Atrasados",
              ],
              [
                "completed",
                "Concluídos",
              ],
            ] as const
          ).map(
            ([value, label]) => (
              <button
                key={value}
                type="button"
                className={
                  filter === value
                    ? styles.filterActive
                    : ""
                }
                onClick={() =>
                  setFilter(value)
                }
              >
                {label}
              </button>
            ),
          )}
        </div>
      </section>

      <section
        className={
          styles.timelinePanel
        }
      >
        <header
          className={
            styles.panelHeader
          }
        >
          <div>
            <span
              className={
                styles.eyebrow
              }
            >
              Linha do tempo
            </span>

            <h2>
              {filteredEvents.length}
              {" "}
              {filteredEvents.length ===
              1
                ? "compromisso"
                : "compromissos"}
            </h2>
          </div>

          <p>
            Itens vindos de outros
            módulos devem ser alterados
            na página de origem.
          </p>
        </header>

        {monthGroups.length >
        0 ? (
          <div
            className={
              styles.monthList
            }
          >
            {monthGroups.map(
              ([
                monthKey,
                monthEvents,
              ]) => {
                const currentMonth =
                  monthKey ===
                  getTodayIso().slice(
                    0,
                    7,
                  );

                return (
                  <section
                    key={monthKey}
                    className={
                      styles.monthSection
                    }
                  >
                    <header
                      className={
                        styles.monthHeader
                      }
                    >
                      <div>
                        <h3>
                          {formatMonthTitle(
                            monthKey,
                          )}
                        </h3>

                        {currentMonth && (
                          <span>
                            Mês atual
                          </span>
                        )}
                      </div>

                      <small>
                        {monthEvents.length}
                        {" "}
                        {monthEvents.length ===
                        1
                          ? "item"
                          : "itens"}
                      </small>
                    </header>

                    <div
                      className={
                        styles.eventList
                      }
                    >
                      {monthEvents.map(
                        (event) => {
                          const status =
                            eventStatus(
                              event,
                            );

                          return (
                            <article
                              key={
                                event.id
                              }
                              className={`${styles.eventCard} ${
                                styles[
                                  `event-${status.tone}`
                                ]
                              }`}
                            >
                              <time
                                dateTime={
                                  event.date
                                }
                                className={
                                  styles.eventDate
                                }
                              >
                                <strong>
                                  {event.date.slice(
                                    8,
                                    10,
                                  )}
                                </strong>

                                <span>
                                  {formatWeekday(
                                    event.date,
                                  )}
                                </span>
                              </time>

                              <div
                                className={
                                  styles.timelineMarker
                                }
                                aria-hidden="true"
                              >
                                <span />
                              </div>

                              <div
                                className={
                                  styles.eventContent
                                }
                              >
                                <div
                                  className={
                                    styles.eventTop
                                  }
                                >
                                  <div
                                    className={
                                      styles.tags
                                    }
                                  >
                                    <span
                                      className={`${styles.sourceBadge} ${
                                        styles[
                                          `source-${event.source}`
                                        ]
                                      }`}
                                    >
                                      {
                                        event.sourceLabel
                                      }
                                    </span>

                                    <span
                                      className={
                                        styles.categoryBadge
                                      }
                                    >
                                      {
                                        event.category
                                      }
                                    </span>

                                    <span
                                      className={`${styles.statusBadge} ${
                                        styles[
                                          `status-${status.tone}`
                                        ]
                                      }`}
                                    >
                                      {
                                        status.label
                                      }
                                    </span>

                                    {event.priority ===
                                      "high" && (
                                      <span
                                        className={
                                          styles.priorityBadge
                                        }
                                      >
                                        Prioridade alta
                                      </span>
                                    )}
                                  </div>

                                  <div
                                    className={
                                      styles.eventActions
                                    }
                                  >
                                    {event.editable ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            toggleCompleted(
                                              event,
                                            )
                                          }
                                        >
                                          {event.status ===
                                          "completed"
                                            ? "Reabrir"
                                            : "Concluir"}
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            openEditEvent(
                                              event,
                                            )
                                          }
                                        >
                                          Editar
                                        </button>

                                        <button
                                          type="button"
                                          className={
                                            styles.deleteButton
                                          }
                                          onClick={() =>
                                            removeEvent(
                                              event,
                                            )
                                          }
                                        >
                                          Excluir
                                        </button>
                                      </>
                                    ) : (
                                      event.sourceHref && (
                                        <Link
                                          href={
                                            event.sourceHref
                                          }
                                        >
                                          Abrir origem
                                        </Link>
                                      )
                                    )}
                                  </div>
                                </div>

                                <h4>
                                  {event.title}
                                </h4>

                                {event.description && (
                                  <p
                                    className={
                                      styles.eventDescription
                                    }
                                  >
                                    {
                                      event.description
                                    }
                                  </p>
                                )}

                                <div
                                  className={
                                    styles.metadata
                                  }
                                >
                                  <span>
                                    <strong>
                                      Data:
                                    </strong>
                                    {" "}
                                    {formatLongDate(
                                      event.date,
                                    )}
                                  </span>

                                  <span>
                                    <strong>
                                      Horário:
                                    </strong>
                                    {" "}
                                    {event.allDay
                                      ? "Sem horário"
                                      : event.startTime
                                        ? `${event.startTime}${
                                            event.endTime
                                              ? `–${event.endTime}`
                                              : ""
                                          }`
                                        : "Não informado"}
                                  </span>

                                  {event.location && (
                                    <span>
                                      <strong>
                                        Local:
                                      </strong>
                                      {" "}
                                      {
                                        event.location
                                      }
                                    </span>
                                  )}

                                  {event.responsible && (
                                    <span>
                                      <strong>
                                        Responsável:
                                      </strong>
                                      {" "}
                                      {
                                        event.responsible
                                      }
                                    </span>
                                  )}
                                </div>
                              </div>
                            </article>
                          );
                        },
                      )}
                    </div>
                  </section>
                );
              },
            )}
          </div>
        ) : (
          <div
            className={
              styles.emptyState
            }
          >
            <span aria-hidden="true">
              ◷
            </span>

            <strong>
              Nenhum compromisso encontrado
            </strong>

            <p>
              Ajuste os filtros ou
              adicione um compromisso
              manual.
            </p>

            <button
              type="button"
              onClick={
                openNewEvent
              }
            >
              Novo compromisso
            </button>
          </div>
        )}
      </section>

      {mounted &&
        eventModal &&
        createPortal(
          eventModal,
          document.body,
        )}
    </div>
  );
}
