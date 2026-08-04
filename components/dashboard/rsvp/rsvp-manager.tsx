"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  updateGuestConfirmationAction,
  updateInvitationGroupConfirmationAction,
  type RsvpConfirmationStatus,
} from "@/lib/actions/rsvp";

import styles from "./rsvp-manager.module.css";

export type RsvpGuest = {
  id: string;
  name: string;
  preferredName?: string;
  phone?: string;
  email?: string;

  side:
    | "bride"
    | "groom"
    | "both";

  confirmation:
    RsvpConfirmationStatus;

  isPrimary: boolean;
  isChild: boolean;

  relationshipLabel?: string;
  respondedAt?: string;
};

export type RsvpGroup = {
  id: string;
  name: string;
  invitationCode: string;
  guests: RsvpGuest[];
};

type RsvpManagerProps = {
  initialGroups: RsvpGroup[];
  brideName: string;
  groomName: string;
};

type GroupConfirmation =
  | RsvpConfirmationStatus
  | "mixed"
  | "empty";

type StatusFilter =
  | "all"
  | RsvpConfirmationStatus
  | "mixed";

const confirmationLabels: Record<
  RsvpConfirmationStatus,
  string
> = {
  confirmed: "Confirmado",
  pending: "Aguardando",
  declined: "Não comparecerá",
};

const groupConfirmationLabels: Record<
  GroupConfirmation,
  string
> = {
  confirmed: "Todos confirmados",
  pending: "Aguardando resposta",
  declined: "Todos recusaram",
  mixed: "Respostas diferentes",
  empty: "Sem convidados",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("pt-BR");
}

function getGroupConfirmation(
  guests: RsvpGuest[],
): GroupConfirmation {
  if (guests.length === 0) {
    return "empty";
  }

  const confirmations =
    new Set(
      guests.map(
        (guest) =>
          guest.confirmation,
      ),
    );

  if (confirmations.size > 1) {
    return "mixed";
  }

  return guests[0].confirmation;
}

function formatResponseDate(
  value?: string,
): string {
  if (!value) {
    return "Sem resposta registrada";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data não disponível";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    },
  ).format(date);
}

function getLatestResponse(
  guests: RsvpGuest[],
): string | undefined {
  const dates = guests
    .map((guest) => guest.respondedAt)
    .filter(
      (value): value is string =>
        Boolean(value),
    )
    .sort(
      (first, second) =>
        new Date(second).getTime() -
        new Date(first).getTime(),
    );

  return dates[0];
}

export default function RsvpManager({
  initialGroups,
  brideName,
  groomName,
}: RsvpManagerProps) {
  const router = useRouter();

  const [groups, setGroups] =
    useState<RsvpGroup[]>(
      initialGroups,
    );

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [
    expandedGroupIds,
    setExpandedGroupIds,
  ] = useState<Set<string>>(
    new Set(),
  );

  const [
    updatingGuestId,
    setUpdatingGuestId,
  ] = useState<string | null>(
    null,
  );

  const [
    updatingGroupId,
    setUpdatingGroupId,
  ] = useState<string | null>(
    null,
  );

  const [feedback, setFeedback] =
    useState<string | null>(
      null,
    );

  useEffect(() => {
    setGroups(initialGroups);
  }, [initialGroups]);

  const allGuests = useMemo(
    () =>
      groups.flatMap(
        (group) => group.guests,
      ),
    [groups],
  );

  const totals = useMemo(() => {
    const confirmed =
      allGuests.filter(
        (guest) =>
          guest.confirmation ===
          "confirmed",
      ).length;

    const pending =
      allGuests.filter(
        (guest) =>
          guest.confirmation ===
          "pending",
      ).length;

    const declined =
      allGuests.filter(
        (guest) =>
          guest.confirmation ===
          "declined",
      ).length;

    return {
      total: allGuests.length,
      confirmed,
      pending,
      declined,
      answered:
        confirmed + declined,
    };
  }, [allGuests]);

  const responsePercentage =
    totals.total > 0
      ? Math.round(
          (totals.answered /
            totals.total) *
            100,
        )
      : 0;

  const filteredGroups = useMemo(() => {
    const normalizedSearch =
      search
        .trim()
        .toLocaleLowerCase(
          "pt-BR",
        );

    return groups.filter((group) => {
      const groupConfirmation =
        getGroupConfirmation(
          group.guests,
        );

      const searchableText = [
        group.name,
        group.invitationCode,
        ...group.guests.flatMap(
          (guest) => [
            guest.name,
            guest.preferredName,
            guest.phone,
            guest.email,
            guest.relationshipLabel,
          ],
        ),
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase(
          "pt-BR",
        );

      const matchesSearch =
        normalizedSearch.length === 0 ||
        searchableText.includes(
          normalizedSearch,
        );

      const matchesStatus =
        statusFilter === "all" ||
        groupConfirmation ===
          statusFilter ||
        (
          statusFilter !==
            "mixed" &&
          group.guests.some(
            (guest) =>
              guest.confirmation ===
              statusFilter,
          )
        );

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    groups,
    search,
    statusFilter,
  ]);

  function showFeedback(
    message: string,
  ) {
    setFeedback(message);

    window.setTimeout(() => {
      setFeedback(null);
    }, 3000);
  }

  function toggleGroup(
    groupId: string,
  ) {
    setExpandedGroupIds(
      (current) => {
        const next =
          new Set(current);

        if (next.has(groupId)) {
          next.delete(groupId);
        } else {
          next.add(groupId);
        }

        return next;
      },
    );
  }

  async function updateGuest(
    groupId: string,
    guestId: string,
    confirmationStatus:
      RsvpConfirmationStatus,
  ) {
    if (
      updatingGuestId ||
      updatingGroupId
    ) {
      return;
    }

    setUpdatingGuestId(guestId);

    try {
      const result =
        await updateGuestConfirmationAction({
          guestId,
          confirmationStatus,
        });

      if (!result.success) {
        showFeedback(
          result.message,
        );
        return;
      }

      const respondedAt =
        confirmationStatus ===
        "pending"
          ? undefined
          : new Date().toISOString();

      setGroups((current) =>
        current.map((group) =>
          group.id === groupId
            ? {
                ...group,
                guests:
                  group.guests.map(
                    (guest) =>
                      guest.id ===
                      guestId
                        ? {
                            ...guest,
                            confirmation:
                              confirmationStatus,
                            respondedAt,
                          }
                        : guest,
                  ),
              }
            : group,
        ),
      );

      showFeedback(result.message);
      router.refresh();
    } catch (error) {
      console.error(
        "Erro ao atualizar RSVP individual:",
        error,
      );

      showFeedback(
        "Não foi possível atualizar o RSVP do convidado.",
      );
    } finally {
      setUpdatingGuestId(null);
    }
  }

  async function updateGroup(
    groupId: string,
    confirmationStatus:
      RsvpConfirmationStatus,
  ) {
    if (
      updatingGuestId ||
      updatingGroupId
    ) {
      return;
    }

    setUpdatingGroupId(groupId);

    try {
      const result =
        await updateInvitationGroupConfirmationAction({
          invitationGroupId:
            groupId,
          confirmationStatus,
        });

      if (!result.success) {
        showFeedback(
          result.message,
        );
        return;
      }

      const respondedAt =
        confirmationStatus ===
        "pending"
          ? undefined
          : new Date().toISOString();

      setGroups((current) =>
        current.map((group) =>
          group.id === groupId
            ? {
                ...group,
                guests:
                  group.guests.map(
                    (guest) => ({
                      ...guest,
                      confirmation:
                        confirmationStatus,
                      respondedAt,
                    }),
                  ),
              }
            : group,
        ),
      );

      showFeedback(result.message);
      router.refresh();
    } catch (error) {
      console.error(
        "Erro ao atualizar RSVP coletivo:",
        error,
      );

      showFeedback(
        "Não foi possível atualizar o RSVP do grupo.",
      );
    } finally {
      setUpdatingGroupId(null);
    }
  }

  return (
    <div className={styles.page}>
      {feedback && (
        <div
          className={styles.feedback}
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
          className={styles.heroCopy}
        >
          <span className="dashboard-eyebrow">
            Convidados
          </span>

          <h1>
            Confirmações de presença
          </h1>

          <p>
            Acompanhe as respostas para
            {" "}
            {brideName}
            {" & "}
            {groomName}
            {" "}
            e atualize convidados
            individualmente ou por grupo.
          </p>
        </div>

        <div
          className={styles.progressCard}
        >
          <div
            className={styles.progressHeading}
          >
            <div>
              <span>
                Progresso do RSVP
              </span>

              <strong>
                {responsePercentage}%
              </strong>
            </div>

            <small>
              {totals.answered} de
              {" "}
              {totals.total}
              {" "}
              responderam
            </small>
          </div>

          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-label="Progresso das confirmações"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={
              responsePercentage
            }
          >
            <span
              style={{
                width:
                  `${responsePercentage}%`,
              }}
            />
          </div>
        </div>
      </header>

      <section
        className={styles.metrics}
        aria-label="Resumo do RSVP"
      >
        <article>
          <span>Total previsto</span>
          <strong>{totals.total}</strong>
          <small>
            {groups.length}
            {" "}
            {groups.length === 1
              ? "convite"
              : "convites"}
          </small>
        </article>

        <article>
          <span>Confirmados</span>
          <strong>
            {totals.confirmed}
          </strong>
          <small>
            Presença confirmada
          </small>
        </article>

        <article>
          <span>Aguardando</span>
          <strong>
            {totals.pending}
          </strong>
          <small>
            Ainda sem resposta
          </small>
        </article>

        <article>
          <span>Recusaram</span>
          <strong>
            {totals.declined}
          </strong>
          <small>
            Não comparecerão
          </small>
        </article>
      </section>

      <section
        className={styles.toolbar}
        aria-label="Filtros do RSVP"
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
            placeholder="Buscar grupo, convidado ou código..."
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
          />
        </label>

        <div
          className={styles.filters}
        >
          {(
            [
              ["all", "Todos"],
              [
                "confirmed",
                "Confirmados",
              ],
              [
                "pending",
                "Aguardando",
              ],
              [
                "declined",
                "Recusaram",
              ],
              [
                "mixed",
                "Respostas mistas",
              ],
            ] as const
          ).map(
            ([value, label]) => (
              <button
                key={value}
                type="button"
                className={
                  statusFilter ===
                  value
                    ? styles.filterActive
                    : ""
                }
                onClick={() =>
                  setStatusFilter(
                    value,
                  )
                }
              >
                {label}
              </button>
            ),
          )}
        </div>
      </section>

      <section
        className={styles.groupsSection}
      >
        <header
          className={styles.sectionHeader}
        >
          <div>
            <span className="dashboard-eyebrow">
              Convites
            </span>

            <h2>
              {filteredGroups.length}
              {" "}
              {filteredGroups.length ===
              1
                ? "grupo encontrado"
                : "grupos encontrados"}
            </h2>
          </div>

          <p>
            Cada grupo compartilha o
            mesmo código de acesso,
            mas cada pessoa mantém uma
            resposta individual.
          </p>
        </header>

        {filteredGroups.length > 0 ? (
          <div
            className={styles.groupList}
          >
            {filteredGroups.map(
              (group) => {
                const groupConfirmation =
                  getGroupConfirmation(
                    group.guests,
                  );

                const isExpanded =
                  expandedGroupIds.has(
                    group.id,
                  );

                const latestResponse =
                  getLatestResponse(
                    group.guests,
                  );

                const confirmed =
                  group.guests.filter(
                    (guest) =>
                      guest.confirmation ===
                      "confirmed",
                  ).length;

                const pending =
                  group.guests.filter(
                    (guest) =>
                      guest.confirmation ===
                      "pending",
                  ).length;

                const declined =
                  group.guests.filter(
                    (guest) =>
                      guest.confirmation ===
                      "declined",
                  ).length;

                const isUpdating =
                  updatingGroupId ===
                  group.id;

                return (
                  <article
                    key={group.id}
                    className={
                      styles.groupCard
                    }
                  >
                    <header
                      className={
                        styles.groupHeader
                      }
                    >
                      <button
                        type="button"
                        className={
                          styles.groupToggle
                        }
                        aria-expanded={
                          isExpanded
                        }
                        onClick={() =>
                          toggleGroup(
                            group.id,
                          )
                        }
                      >
                        <span
                          className={
                            styles.groupMonogram
                          }
                          aria-hidden="true"
                        >
                          {getInitials(
                            group.name,
                          )}
                        </span>

                        <span
                          className={
                            styles.groupIdentity
                          }
                        >
                          <strong>
                            {group.name}
                          </strong>

                          <small>
                            Código:
                            {" "}
                            <code>
                              {
                                group.invitationCode
                              }
                            </code>
                          </small>
                        </span>

                        <span
                          className={`${styles.groupStatus} ${
                            styles[
                              `status-${groupConfirmation}`
                            ]
                          }`}
                        >
                          {
                            groupConfirmationLabels[
                              groupConfirmation
                            ]
                          }
                        </span>

                        <span
                          className={
                            styles.expandIcon
                          }
                          aria-hidden="true"
                        >
                          {isExpanded
                            ? "−"
                            : "+"}
                        </span>
                      </button>

                      <div
                        className={
                          styles.groupSummary
                        }
                      >
                        <span>
                          <strong>
                            {group.guests.length}
                          </strong>
                          {" "}
                          pessoas
                        </span>

                        <span>
                          <strong>
                            {confirmed}
                          </strong>
                          {" "}
                          confirmados
                        </span>

                        <span>
                          <strong>
                            {pending}
                          </strong>
                          {" "}
                          aguardando
                        </span>

                        <span>
                          <strong>
                            {declined}
                          </strong>
                          {" "}
                          recusaram
                        </span>

                        <span>
                          Última resposta:
                          {" "}
                          <strong>
                            {formatResponseDate(
                              latestResponse,
                            )}
                          </strong>
                        </span>
                      </div>
                    </header>

                    {isExpanded && (
                      <div
                        className={
                          styles.groupContent
                        }
                      >
                        <div
                          className={
                            styles.groupActions
                          }
                        >
                          <span>
                            Atualizar todo o
                            grupo:
                          </span>

                          <button
                            type="button"
                            disabled={
                              isUpdating ||
                              Boolean(
                                updatingGuestId,
                              ) ||
                              group.guests
                                .length === 0
                            }
                            onClick={() =>
                              updateGroup(
                                group.id,
                                "confirmed",
                              )
                            }
                          >
                            {isUpdating
                              ? "Atualizando..."
                              : "Confirmar todos"}
                          </button>

                          <button
                            type="button"
                            disabled={
                              isUpdating ||
                              Boolean(
                                updatingGuestId,
                              ) ||
                              group.guests
                                .length === 0
                            }
                            onClick={() =>
                              updateGroup(
                                group.id,
                                "pending",
                              )
                            }
                          >
                            Aguardar todos
                          </button>

                          <button
                            type="button"
                            className={
                              styles.declineButton
                            }
                            disabled={
                              isUpdating ||
                              Boolean(
                                updatingGuestId,
                              ) ||
                              group.guests
                                .length === 0
                            }
                            onClick={() =>
                              updateGroup(
                                group.id,
                                "declined",
                              )
                            }
                          >
                            Marcar ausentes
                          </button>
                        </div>

                        {group.guests.length >
                        0 ? (
                          <div
                            className={
                              styles.guestList
                            }
                          >
                            {group.guests.map(
                              (guest) => (
                                <div
                                  key={
                                    guest.id
                                  }
                                  className={
                                    styles.guestRow
                                  }
                                >
                                  <div
                                    className={
                                      styles.guestIdentity
                                    }
                                  >
                                    <span
                                      className={
                                        styles.avatar
                                      }
                                      aria-hidden="true"
                                    >
                                      {getInitials(
                                        guest.name,
                                      )}
                                    </span>

                                    <div>
                                      <strong>
                                        {
                                          guest.name
                                        }
                                      </strong>

                                      <span>
                                        {guest.isPrimary
                                          ? "Titular do convite"
                                          : guest.relationshipLabel ||
                                            (guest.isChild
                                              ? "Criança"
                                              : "Convidado do grupo")}
                                      </span>
                                    </div>
                                  </div>

                                  <div
                                    className={
                                      styles.guestContact
                                    }
                                  >
                                    <span>
                                      {guest.phone ||
                                        "Sem telefone"}
                                    </span>

                                    {guest.email && (
                                      <span>
                                        {
                                          guest.email
                                        }
                                      </span>
                                    )}
                                  </div>

                                  <span
                                    className={`${styles.guestStatus} ${
                                      styles[
                                        `guest-${guest.confirmation}`
                                      ]
                                    }`}
                                  >
                                    {
                                      confirmationLabels[
                                        guest.confirmation
                                      ]
                                    }
                                  </span>

                                  <span
                                    className={
                                      styles.responseDate
                                    }
                                  >
                                    {formatResponseDate(
                                      guest.respondedAt,
                                    )}
                                  </span>

                                  <select
                                    value={
                                      guest.confirmation
                                    }
                                    aria-label={`Alterar confirmação de ${guest.name}`}
                                    disabled={
                                      updatingGuestId ===
                                        guest.id ||
                                      Boolean(
                                        updatingGroupId,
                                      )
                                    }
                                    onChange={(
                                      event,
                                    ) =>
                                      updateGuest(
                                        group.id,
                                        guest.id,
                                        event
                                          .target
                                          .value as RsvpConfirmationStatus,
                                      )
                                    }
                                  >
                                    <option value="pending">
                                      Aguardando
                                    </option>

                                    <option value="confirmed">
                                      Confirmado
                                    </option>

                                    <option value="declined">
                                      Não comparecerá
                                    </option>
                                  </select>
                                </div>
                              ),
                            )}
                          </div>
                        ) : (
                          <div
                            className={
                              styles.emptyGroup
                            }
                          >
                            Este grupo ainda
                            não possui
                            convidados.
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              },
            )}
          </div>
        ) : (
          <div
            className={styles.emptyState}
          >
            <strong>
              Nenhum grupo encontrado
            </strong>

            <p>
              Altere a busca ou os
              filtros selecionados.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
            >
              Limpar filtros
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
