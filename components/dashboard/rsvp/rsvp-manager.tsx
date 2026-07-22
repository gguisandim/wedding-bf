"use client";

import { useMemo, useState } from "react";

import styles from "./rsvp.module.css";

export type RSVPStatus =
  | "confirmed"
  | "pending"
  | "declined";

export type RSVPChannel =
  | "site"
  | "whatsapp"
  | "phone"
  | "manual";

export type RSVPGuestMember = {
  id: number;
  name: string;

  isPrimary: boolean;

  relationship?: string;
  relatedToName?: string;

  status: RSVPStatus;

  dietaryRestriction?: string;
  responseDate?: string;
  responseChannel?: RSVPChannel;
  note?: string;
};

export type RSVPInvitation = {
  id: number;
  groupName: string;

  contactName: string;
  phone?: string;
  email?: string;

  lastReminder?: string;

  members: RSVPGuestMember[];
};

type RSVPManagerProps = {
  invitations: RSVPInvitation[];
};

type InvitationFilter =
  | "all"
  | "pending"
  | "answered"
  | "confirmed"
  | "declined";

const statusLabels: Record<RSVPStatus, string> = {
  confirmed: "Confirmado",
  pending: "Aguardando resposta",
  declined: "Não comparecerá",
};

const channelLabels: Record<RSVPChannel, string> = {
  site: "Site",
  whatsapp: "WhatsApp",
  phone: "Telefone",
  manual: "Registro manual",
};

const statusClassNames: Record<RSVPStatus, string> = {
  confirmed: styles.statusConfirmed,
  pending: styles.statusPending,
  declined: styles.statusDeclined,
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getRelationshipLabel(
  member: RSVPGuestMember,
) {
  if (member.isPrimary) {
    return "Titular do convite";
  }

  if (
    member.relationship &&
    member.relatedToName
  ) {
    return `${member.relationship} de ${member.relatedToName}`;
  }

  return member.relationship || "Convidado vinculado";
}

export default function RSVPManager({
  invitations,
}: RSVPManagerProps) {
  const [items, setItems] =
    useState<RSVPInvitation[]>(invitations);

  const [search, setSearch] = useState("");

  const [filter, setFilter] =
    useState<InvitationFilter>("all");

  const [feedback, setFeedback] =
    useState<string | null>(null);

  const allMembers = useMemo(
    () =>
      items.flatMap((invitation) =>
        invitation.members.map((member) => ({
          ...member,
          invitationId: invitation.id,
        })),
      ),
    [items],
  );

  const confirmedMembers = allMembers.filter(
    (member) => member.status === "confirmed",
  );

  const pendingMembers = allMembers.filter(
    (member) => member.status === "pending",
  );

  const declinedMembers = allMembers.filter(
    (member) => member.status === "declined",
  );

  const answeredMembers =
    confirmedMembers.length +
    declinedMembers.length;

  const responsePercentage =
    allMembers.length > 0
      ? Math.round(
          (answeredMembers / allMembers.length) *
            100,
        )
      : 0;

  const invitationsWithPendingMembers =
    items.filter((invitation) =>
      invitation.members.some(
        (member) => member.status === "pending",
      ),
    );

  const filteredInvitations = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLocaleLowerCase("pt-BR");

    return items.filter((invitation) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        invitation.groupName
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch) ||
        invitation.contactName
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch) ||
        invitation.phone
          ?.toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch) ||
        invitation.email
          ?.toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch) ||
        invitation.members.some((member) =>
          member.name
            .toLocaleLowerCase("pt-BR")
            .includes(normalizedSearch),
        );

      const hasPending =
        invitation.members.some(
          (member) =>
            member.status === "pending",
        );

      const hasConfirmed =
        invitation.members.some(
          (member) =>
            member.status === "confirmed",
        );

      const hasDeclined =
        invitation.members.some(
          (member) =>
            member.status === "declined",
        );

      const fullyAnswered =
        invitation.members.every(
          (member) =>
            member.status !== "pending",
        );

      const matchesFilter =
        filter === "all" ||
        (filter === "pending" && hasPending) ||
        (filter === "answered" &&
          fullyAnswered) ||
        (filter === "confirmed" &&
          hasConfirmed) ||
        (filter === "declined" &&
          hasDeclined);

      return matchesSearch && matchesFilter;
    });
  }, [items, search, filter]);

  function showFeedback(message: string) {
    setFeedback(message);

    window.setTimeout(() => {
      setFeedback(null);
    }, 2800);
  }

  function updateMemberStatus(
    invitationId: number,
    memberId: number,
    status: RSVPStatus,
  ) {
    setItems((currentItems) =>
      currentItems.map((invitation) => {
        if (invitation.id !== invitationId) {
          return invitation;
        }

        return {
          ...invitation,
          members: invitation.members.map(
            (member) => {
              if (member.id !== memberId) {
                return member;
              }

              return {
                ...member,
                status,
                responseDate:
                  status === "pending"
                    ? undefined
                    : "Atualizado agora",
                responseChannel:
                  status === "pending"
                    ? undefined
                    : member.responseChannel ||
                      "manual",
              };
            },
          ),
        };
      }),
    );

    showFeedback(
      "Confirmação atualizada com sucesso.",
    );
  }

  function updateDietaryRestriction(
    invitationId: number,
    memberId: number,
    value: string,
  ) {
    setItems((currentItems) =>
      currentItems.map((invitation) => {
        if (invitation.id !== invitationId) {
          return invitation;
        }

        return {
          ...invitation,
          members: invitation.members.map(
            (member) =>
              member.id === memberId
                ? {
                    ...member,
                    dietaryRestriction: value,
                  }
                : member,
          ),
        };
      }),
    );
  }

  function sendReminder(
    invitationId: number,
  ) {
    setItems((currentItems) =>
      currentItems.map((invitation) =>
        invitation.id === invitationId
          ? {
              ...invitation,
              lastReminder: "Agora",
            }
          : invitation,
      ),
    );

    showFeedback(
      "Lembrete registrado para o contato principal.",
    );
  }

  function sendAllReminders() {
    if (
      invitationsWithPendingMembers.length === 0
    ) {
      showFeedback(
        "Não existem convites com respostas pendentes.",
      );

      return;
    }

    setItems((currentItems) =>
      currentItems.map((invitation) => {
        const hasPending =
          invitation.members.some(
            (member) =>
              member.status === "pending",
          );

        return hasPending
          ? {
              ...invitation,
              lastReminder: "Agora",
            }
          : invitation;
      }),
    );

    showFeedback(
      `Lembretes registrados para ${invitationsWithPendingMembers.length} convites.`,
    );
  }

  return (
    <div className={styles.page}>
      {feedback && (
        <div
          className={styles.feedback}
          role="status"
        >
          <span aria-hidden="true">✓</span>
          {feedback}
        </div>
      )}

      <header className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <span className="dashboard-eyebrow">
            Convidados
          </span>

          <h1>Confirmações de presença</h1>

          <p>
            Acompanhe a resposta individual de cada
            pessoa cadastrada nos convites.
          </p>

          <div className={styles.invitationNotice}>
            <span aria-hidden="true">i</span>

            <p>
              A confirmação está limitada às pessoas
              previamente cadastradas em cada convite.
            </p>
          </div>

          <button
            type="button"
            className={styles.remindAllButton}
            onClick={sendAllReminders}
          >
            <span aria-hidden="true">↗</span>

            Lembrar convites pendentes

            {invitationsWithPendingMembers.length >
              0 && (
              <span
                className={
                  styles.remindAllCounter
                }
              >
                {
                  invitationsWithPendingMembers.length
                }
              </span>
            )}
          </button>
        </div>

        <div className={styles.headerOverview}>
          <div className={styles.responseProgress}>
            <div
              className={
                styles.responseProgressCircle
              }
              style={{
                background: `conic-gradient(
                  var(--dashboard-accent, #92966f)
                  ${responsePercentage}%,
                  rgba(64, 77, 119, 0.08)
                  ${responsePercentage}%
                )`,
              }}
            >
              <div>
                <strong>
                  {responsePercentage}%
                </strong>

                <span>responderam</span>
              </div>
            </div>
          </div>

          <div className={styles.headerStatistics}>
            <div>
              <span
                className={`${styles.statisticDot} ${styles.invitationDot}`}
              />

              <div>
                <strong>{items.length}</strong>
                <span>Convites</span>
              </div>
            </div>

            <div>
              <span
                className={`${styles.statisticDot} ${styles.peopleDot}`}
              />

              <div>
                <strong>{allMembers.length}</strong>
                <span>Pessoas cadastradas</span>
              </div>
            </div>

            <div>
              <span
                className={`${styles.statisticDot} ${styles.confirmedDot}`}
              />

              <div>
                <strong>
                  {confirmedMembers.length}
                </strong>

                <span>Confirmadas</span>
              </div>
            </div>

            <div>
              <span
                className={`${styles.statisticDot} ${styles.pendingDot}`}
              />

              <div>
                <strong>
                  {pendingMembers.length}
                </strong>

                <span>Aguardando</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section
        className={styles.toolbar}
        aria-label="Filtros das confirmações"
      >
        <label className={styles.search}>
          <span aria-hidden="true">⌕</span>

          <input
            type="search"
            value={search}
            placeholder="Buscar pessoa ou convite..."
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </label>

        <div className={styles.filters}>
          <button
            type="button"
            className={`${styles.filterButton} ${
              filter === "all"
                ? styles.filterButtonActive
                : ""
            }`}
            onClick={() => setFilter("all")}
          >
            Todos
            <span>{items.length}</span>
          </button>

          <button
            type="button"
            className={`${styles.filterButton} ${
              filter === "pending"
                ? styles.filterButtonActive
                : ""
            }`}
            onClick={() => setFilter("pending")}
          >
            Com pendências
            <span>
              {
                invitationsWithPendingMembers.length
              }
            </span>
          </button>

          <button
            type="button"
            className={`${styles.filterButton} ${
              filter === "answered"
                ? styles.filterButtonActive
                : ""
            }`}
            onClick={() =>
              setFilter("answered")
            }
          >
            Respondidos
          </button>

          <button
            type="button"
            className={`${styles.filterButton} ${
              filter === "confirmed"
                ? styles.filterButtonActive
                : ""
            }`}
            onClick={() =>
              setFilter("confirmed")
            }
          >
            Com confirmados
          </button>

          <button
            type="button"
            className={`${styles.filterButton} ${
              filter === "declined"
                ? styles.filterButtonActive
                : ""
            }`}
            onClick={() =>
              setFilter("declined")
            }
          >
            Com recusas
          </button>
        </div>
      </section>

      <section className={styles.invitationList}>
        <header className={styles.listHeader}>
          <div>
            <span className="dashboard-eyebrow">
              Convites
            </span>

            <h2>
              {filteredInvitations.length}{" "}
              {filteredInvitations.length === 1
                ? "convite encontrado"
                : "convites encontrados"}
            </h2>
          </div>

          <div className={styles.listLegend}>
            <span>
              <i className={styles.confirmedDot} />
              Confirmado
            </span>

            <span>
              <i className={styles.pendingDot} />
              Aguardando
            </span>

            <span>
              <i className={styles.declinedDot} />
              Recusou
            </span>
          </div>
        </header>

        {filteredInvitations.length > 0 ? (
          <div className={styles.invitationGroups}>
            {filteredInvitations.map(
              (invitation) => {
                const confirmedCount =
                  invitation.members.filter(
                    (member) =>
                      member.status ===
                      "confirmed",
                  ).length;

                const pendingCount =
                  invitation.members.filter(
                    (member) =>
                      member.status === "pending",
                  ).length;

                const declinedCount =
                  invitation.members.filter(
                    (member) =>
                      member.status ===
                      "declined",
                  ).length;

                return (
                  <article
                    key={invitation.id}
                    className={
                      styles.invitationCard
                    }
                  >
                    <header
                      className={
                        styles.invitationHeader
                      }
                    >
                      <div
                        className={
                          styles.invitationIdentity
                        }
                      >
                        <span
                          className={
                            styles.invitationIcon
                          }
                          aria-hidden="true"
                        >
                          ✉
                        </span>

                        <div>
                          <span
                            className={
                              styles.invitationLabel
                            }
                          >
                            Convite
                          </span>

                          <h3>
                            {invitation.groupName}
                          </h3>

                          <p>
                            Contato principal:{" "}
                            <strong>
                              {
                                invitation.contactName
                              }
                            </strong>

                            {invitation.phone &&
                              ` · ${invitation.phone}`}
                          </p>
                        </div>
                      </div>

                      <div
                        className={
                          styles.invitationSummary
                        }
                      >
                        <span>
                          <strong>
                            {confirmedCount}
                          </strong>
                          confirmados
                        </span>

                        <span>
                          <strong>
                            {pendingCount}
                          </strong>
                          pendentes
                        </span>

                        <span>
                          <strong>
                            {declinedCount}
                          </strong>
                          recusas
                        </span>
                      </div>

                      {pendingCount > 0 ? (
                        <button
                          type="button"
                          className={
                            styles.reminderButton
                          }
                          onClick={() =>
                            sendReminder(
                              invitation.id,
                            )
                          }
                        >
                          Enviar lembrete
                        </button>
                      ) : (
                        <span
                          className={
                            styles.completedInvitation
                          }
                        >
                          <i />
                          Convite respondido
                        </span>
                      )}
                    </header>

                    <div
                      className={
                        styles.memberList
                      }
                    >
                      {invitation.members.map(
                        (member) => (
                          <article
                            key={member.id}
                            className={
                              styles.memberRow
                            }
                          >
                            <div
                              className={
                                styles.memberIdentity
                              }
                            >
                              <span
                                className={
                                  styles.avatar
                                }
                                aria-hidden="true"
                              >
                                {getInitials(
                                  member.name,
                                )}
                              </span>

                              <div>
                                <strong>
                                  {member.name}
                                </strong>

                                <span>
                                  {getRelationshipLabel(
                                    member,
                                  )}
                                </span>
                              </div>
                            </div>

                            <div
                              className={
                                styles.memberStatus
                              }
                            >
                              <label
                                htmlFor={`status-${invitation.id}-${member.id}`}
                              >
                                Confirmação
                              </label>

                              <select
                                id={`status-${invitation.id}-${member.id}`}
                                value={
                                  member.status
                                }
                                className={`${styles.statusSelect} ${
                                  statusClassNames[
                                    member.status
                                  ]
                                }`}
                                onChange={(
                                  event,
                                ) =>
                                  updateMemberStatus(
                                    invitation.id,
                                    member.id,
                                    event.target
                                      .value as RSVPStatus,
                                  )
                                }
                              >
                                <option value="confirmed">
                                  Confirmado
                                </option>

                                <option value="pending">
                                  Aguardando
                                </option>

                                <option value="declined">
                                  Não comparecerá
                                </option>
                              </select>
                            </div>

                            <div
                              className={
                                styles.memberResponse
                              }
                            >
                              <span>Resposta</span>

                              <strong>
                                {member.responseDate ||
                                  "Ainda não respondeu"}
                              </strong>

                              {member.responseChannel && (
                                <small>
                                  Via{" "}
                                  {
                                    channelLabels[
                                      member
                                        .responseChannel
                                    ]
                                  }
                                </small>
                              )}
                            </div>

                            <label
                              className={
                                styles.restrictionField
                              }
                            >
                              <span>
                                Restrição alimentar
                              </span>

                              <input
                                type="text"
                                value={
                                  member.dietaryRestriction ||
                                  ""
                                }
                                placeholder="Nenhuma informada"
                                onChange={(
                                  event,
                                ) =>
                                  updateDietaryRestriction(
                                    invitation.id,
                                    member.id,
                                    event.target
                                      .value,
                                  )
                                }
                              />
                            </label>

                            <button
                              type="button"
                              className={
                                styles.moreButton
                              }
                              aria-label={`Mais opções para ${member.name}`}
                            >
                              <span aria-hidden="true">
                                •••
                              </span>
                            </button>
                          </article>
                        ),
                      )}
                    </div>

                    <footer
                      className={
                        styles.invitationFooter
                      }
                    >
                      <span>
                        {invitation.members.length}{" "}
                        {invitation.members.length ===
                        1
                          ? "pessoa cadastrada"
                          : "pessoas cadastradas"}
                      </span>

                      <span>
                        {invitation.lastReminder
                          ? `Último lembrete: ${invitation.lastReminder}`
                          : "Nenhum lembrete enviado"}
                      </span>
                    </footer>
                  </article>
                );
              },
            )}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <span aria-hidden="true">⌕</span>

            <strong>
              Nenhum convite encontrado
            </strong>

            <p>
              Altere a busca ou os filtros
              selecionados.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFilter("all");
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