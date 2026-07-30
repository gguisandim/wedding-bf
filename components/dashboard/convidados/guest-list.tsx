"use client";

import { useMemo, useState } from "react";

import styles from "./guest-list.module.css";

export type GuestConfirmation =
  | "confirmed"
  | "pending"
  | "declined";

export type GuestSide = "bride" | "groom" | "both";

export type GuestRelationship =
  | "primary"
  | "spouse"
  | "boyfriend"
  | "girlfriend"
  | "fiance"
  | "fiancee"
  | "child"
  | "parent"
  | "sibling"
  | "relative"
  | "friend"
  | "plus_one"
  | "other";

export type SaveTheDateStatus =
  | "not_ready"
  | "ready"
  | "sent"
  | "delivered"
  | "returned";

export type GuestAddress = {
  recipientName: string;
  postalCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
};

export type InvitationGroup = {
  id: number;
  name: string;
  invitationCode: string;
  primaryGuestId: number;
  saveTheDateStatus: SaveTheDateStatus;
  address?: GuestAddress;
};

export type GuestItem = {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  group: string;
  side: GuestSide;
  confirmation: GuestConfirmation;
  table?: string;
  invitationGroupId: number;
  isPrimaryGuest: boolean;
  relationship: GuestRelationship;
  linkedGuestId?: number;
  relationshipLabel?: string;
};

type GuestListProps = {
  guests: GuestItem[];
  invitationGroups: InvitationGroup[];
};

type ConfirmationFilter = "all" | GuestConfirmation;

const confirmationLabels: Record<GuestConfirmation, string> = {
  confirmed: "Confirmado",
  pending: "Aguardando",
  declined: "Não comparecerá",
};

const sideLabels: Record<GuestSide, string> = {
  bride: "Bárbara",
  groom: "Felipe",
  both: "Casal",
};

const relationshipLabels: Record<GuestRelationship, string> = {
  primary: "Titular do convite",
  spouse: "Cônjuge",
  boyfriend: "Namorado",
  girlfriend: "Namorada",
  fiance: "Noivo",
  fiancee: "Noiva",
  child: "Filho(a)",
  parent: "Pai/mãe",
  sibling: "Irmão/irmã",
  relative: "Familiar",
  friend: "Amigo(a)",
  plus_one: "Acompanhante",
  other: "Outro vínculo",
};

const saveTheDateLabels: Record<SaveTheDateStatus, string> = {
  not_ready: "Endereço pendente",
  ready: "Pronto para envio",
  sent: "Save the Date enviado",
  delivered: "Save the Date entregue",
  returned: "Correspondência devolvida",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatAddress(address?: GuestAddress) {
  if (!address) {
    return "Endereço ainda não cadastrado.";
  }

  const street = [
    address.street,
    address.number,
    address.complement,
  ]
    .filter(Boolean)
    .join(", ");

  return `${street} — ${address.neighborhood}, ${address.city}/${address.state} — CEP ${address.postalCode}`;
}

export default function GuestList({
  guests: initialGuests,
  invitationGroups: initialInvitationGroups,
}: GuestListProps) {
  const [guests, setGuests] = useState<GuestItem[]>(
    initialGuests ?? [],
  );

  const [invitationGroups] = useState<InvitationGroup[]>(
    initialInvitationGroups ?? [],
  );

  const [search, setSearch] = useState("");
  const [confirmationFilter, setConfirmationFilter] =
    useState<ConfirmationFilter>("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [selectedInvitationGroupId, setSelectedInvitationGroupId] =
    useState<number | null>(null);

  const selectedInvitationGroup = useMemo(
    () =>
      invitationGroups.find(
        (group) => group.id === selectedInvitationGroupId,
      ) ?? null,
    [invitationGroups, selectedInvitationGroupId],
  );

  const selectedGroupGuests = useMemo(
    () =>
      guests.filter(
        (guest) =>
          guest.invitationGroupId === selectedInvitationGroupId,
      ),
    [guests, selectedInvitationGroupId],
  );

  const groups = useMemo(
    () =>
      Array.from(new Set(guests.map((guest) => guest.group))).sort(),
    [guests],
  );

  function findGuest(guestId?: number) {
    if (!guestId) {
      return undefined;
    }

    return guests.find((guest) => guest.id === guestId);
  }

  function findInvitationGroup(invitationGroupId: number) {
    return invitationGroups.find(
      (group) => group.id === invitationGroupId,
    );
  }

  function getRelationshipText(guest: GuestItem) {
    if (guest.relationshipLabel?.trim()) {
      return guest.relationshipLabel;
    }

    if (guest.isPrimaryGuest || guest.relationship === "primary") {
      return "Titular do convite";
    }

    const linkedGuest = findGuest(guest.linkedGuestId);
    const label = relationshipLabels[guest.relationship];

    return linkedGuest ? `${label} de ${linkedGuest.name}` : label;
  }

  const filteredGuests = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLocaleLowerCase("pt-BR");

    return guests.filter((guest) => {
      const invitationGroup = findInvitationGroup(
        guest.invitationGroupId,
      );
      const linkedGuest = findGuest(guest.linkedGuestId);
      const searchableText = [
        guest.name,
        guest.phone,
        guest.email,
        guest.group,
        invitationGroup?.name,
        invitationGroup?.invitationCode,
        linkedGuest?.name,
        guest.relationshipLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("pt-BR");

      const matchesSearch =
        normalizedSearch.length === 0 ||
        searchableText.includes(normalizedSearch);

      const matchesConfirmation =
        confirmationFilter === "all" ||
        guest.confirmation === confirmationFilter;

      const matchesGroup =
        groupFilter === "all" || guest.group === groupFilter;

      return matchesSearch && matchesConfirmation && matchesGroup;
    });
  }, [
    guests,
    invitationGroups,
    search,
    confirmationFilter,
    groupFilter,
  ]);

  const confirmedGuests = guests.filter(
    (guest) => guest.confirmation === "confirmed",
  ).length;

  const pendingGuests = guests.filter(
    (guest) => guest.confirmation === "pending",
  ).length;

  const declinedGuests = guests.filter(
    (guest) => guest.confirmation === "declined",
  ).length;

  function updateInvitationGroupConfirmation(
    confirmation: GuestConfirmation,
  ) {
    if (!selectedInvitationGroupId) {
      return;
    }

    setGuests((currentGuests) =>
      currentGuests.map((guest) =>
        guest.invitationGroupId === selectedInvitationGroupId
          ? { ...guest, confirmation }
          : guest,
      ),
    );
  }

  function exportList() {
    const header = [
      "Convidado",
      "Grupo",
      "Grupo RSVP",
      "Código RSVP",
      "Vínculo",
      "Telefone",
      "E-mail",
      "Confirmação",
      "Mesa",
      "Endereço",
    ];

    const rows = guests.map((guest) => {
      const invitationGroup = findInvitationGroup(
        guest.invitationGroupId,
      );

      return [
        guest.name,
        guest.group,
        invitationGroup?.name ?? "",
        invitationGroup?.invitationCode ?? "",
        getRelationshipText(guest),
        guest.phone ?? "",
        guest.email ?? "",
        confirmationLabels[guest.confirmation],
        guest.table ?? "",
        formatAddress(invitationGroup?.address),
      ];
    });

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(";"),
      )
      .join("\n");

    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "lista-de-convidados.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <span className="dashboard-eyebrow">Convidados</span>

          <h1>Lista de convidados</h1>

          <p>
            Cada pessoa aparece individualmente na lista. Os grupos são
            utilizados apenas para o RSVP e para o envio do Save the Date.
          </p>

          <button type="button" className={styles.addGuestButton}>
            <span aria-hidden="true">＋</span>
            Adicionar convidado
          </button>
        </div>

        <div className={styles.headerSummary}>
          <div className={styles.totalGuestsCard}>
            <span>Total previsto</span>
            <strong>{guests.length}</strong>
            <p>{invitationGroups.length} convites cadastrados</p>
          </div>

          <div className={styles.headerStats}>
            <div>
              <span
                className={`${styles.statusDot} ${styles.confirmedDot}`}
              />
              <strong>{confirmedGuests}</strong>
              <span>Confirmados</span>
            </div>

            <div>
              <span
                className={`${styles.statusDot} ${styles.pendingDot}`}
              />
              <strong>{pendingGuests}</strong>
              <span>Aguardando</span>
            </div>

            <div>
              <span
                className={`${styles.statusDot} ${styles.declinedDot}`}
              />
              <strong>{declinedGuests}</strong>
              <span>Recusaram</span>
            </div>
          </div>
        </div>
      </header>

      <section
        className={styles.toolbar}
        aria-label="Filtros da lista de convidados"
      >
        <label className={styles.search}>
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={search}
            placeholder="Buscar convidado, vínculo ou código RSVP..."
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <div className={styles.filters}>
          {(
            [
              ["all", "Todos"],
              ["confirmed", "Confirmados"],
              ["pending", "Aguardando"],
              ["declined", "Recusaram"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`${styles.filterButton} ${
                confirmationFilter === value
                  ? styles.filterButtonActive
                  : ""
              }`}
              onClick={() => setConfirmationFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <select
          className={styles.groupSelect}
          value={groupFilter}
          onChange={(event) => setGroupFilter(event.target.value)}
          aria-label="Filtrar por grupo"
        >
          <option value="all">Todos os grupos</option>
          {groups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
      </section>

      <section className={styles.listCard}>
        <header className={styles.listHeader}>
          <div>
            <span className="dashboard-eyebrow">Lista</span>
            <h2>
              {filteredGuests.length}{" "}
              {filteredGuests.length === 1
                ? "convidado encontrado"
                : "convidados encontrados"}
            </h2>
          </div>

          <button
            type="button"
            className={styles.exportButton}
            onClick={exportList}
          >
            Exportar lista
          </button>
        </header>

        {filteredGuests.length > 0 ? (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Convidado</th>
                    <th>Grupo</th>
                    <th>Vínculo / RSVP</th>
                    <th>Contato</th>
                    <th>Confirmação</th>
                    <th>Mesa</th>
                    <th>
                      <span className={styles.srOnly}>Ações</span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredGuests.map((guest) => {
                    const invitationGroup = findInvitationGroup(
                      guest.invitationGroupId,
                    );

                    return (
                      <tr key={guest.id}>
                        <td>
                          <div className={styles.guestIdentity}>
                            <span
                              className={styles.avatar}
                              aria-hidden="true"
                            >
                              {getInitials(guest.name)}
                            </span>

                            <div>
                              <strong>{guest.name}</strong>
                              <span>
                                Convidado de {sideLabels[guest.side]}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className={styles.groupBadge}>
                            {guest.group}
                          </span>
                        </td>

                        <td>
                          <div className={styles.rsvpInfo}>
                            <strong>{getRelationshipText(guest)}</strong>
                            <span>
                              {invitationGroup?.name ?? "Grupo não definido"}
                            </span>
                            <div className={styles.rsvpMeta}>
                              <code>
                                {invitationGroup?.invitationCode ??
                                  "Sem código"}
                              </code>
                              <span
                                className={`${styles.saveTheDateBadge} ${
                                  styles[
                                    `saveTheDate-${
                                      invitationGroup?.saveTheDateStatus ??
                                      "not_ready"
                                    }`
                                  ]
                                }`}
                              >
                                {
                                  saveTheDateLabels[
                                    invitationGroup?.saveTheDateStatus ??
                                      "not_ready"
                                  ]
                                }
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className={styles.contact}>
                            <span>{guest.phone || "Sem telefone"}</span>
                            {guest.email && <span>{guest.email}</span>}
                          </div>
                        </td>

                        <td>
                          <span
                            className={`${styles.confirmationBadge} ${
                              styles[`confirmation-${guest.confirmation}`]
                            }`}
                          >
                            <span className={styles.statusDot} />
                            {confirmationLabels[guest.confirmation]}
                          </span>
                        </td>

                        <td>
                          {guest.table ? (
                            <span className={styles.tableBadge}>
                              {guest.table}
                            </span>
                          ) : (
                            <span className={styles.noTableLabel}>
                              Não definida
                            </span>
                          )}
                        </td>

                        <td>
                          <button
                            type="button"
                            className={styles.rowMenu}
                            aria-label={`Ver RSVP e endereço de ${guest.name}`}
                            title="Ver grupo RSVP e endereço"
                            onClick={() =>
                              setSelectedInvitationGroupId(
                                guest.invitationGroupId,
                              )
                            }
                          >
                            <span aria-hidden="true">•••</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={styles.mobileList}>
              {filteredGuests.map((guest) => {
                const invitationGroup = findInvitationGroup(
                  guest.invitationGroupId,
                );

                return (
                  <article key={guest.id} className={styles.mobileGuestCard}>
                    <header>
                      <div className={styles.guestIdentity}>
                        <span className={styles.avatar} aria-hidden="true">
                          {getInitials(guest.name)}
                        </span>

                        <div>
                          <strong>{guest.name}</strong>
                          <span>{getRelationshipText(guest)}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={styles.rowMenu}
                        aria-label={`Ver RSVP e endereço de ${guest.name}`}
                        onClick={() =>
                          setSelectedInvitationGroupId(
                            guest.invitationGroupId,
                          )
                        }
                      >
                        <span aria-hidden="true">•••</span>
                      </button>
                    </header>

                    <div className={styles.mobileGuestInfo}>
                      <span
                        className={`${styles.confirmationBadge} ${
                          styles[`confirmation-${guest.confirmation}`]
                        }`}
                      >
                        <span className={styles.statusDot} />
                        {confirmationLabels[guest.confirmation]}
                      </span>

                      <span>
                        RSVP: {invitationGroup?.name ?? "Não definido"}
                      </span>

                      <span>{guest.table || "Mesa não definida"}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <span aria-hidden="true">⌕</span>
            <strong>Nenhum convidado encontrado</strong>
            <p>Tente alterar a busca ou os filtros selecionados.</p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setConfirmationFilter("all");
                setGroupFilter("all");
              }}
            >
              Limpar filtros
            </button>
          </div>
        )}
      </section>

      {selectedInvitationGroup && (
        <div
          className={styles.modalOverlay}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedInvitationGroupId(null);
            }
          }}
        >
          <section
            className={styles.rsvpModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="rsvp-modal-title"
          >
            <header className={styles.modalHeader}>
              <div>
                <span className="dashboard-eyebrow">Grupo de convite</span>
                <h2 id="rsvp-modal-title">
                  {selectedInvitationGroup.name}
                </h2>
                <p>
                  Código RSVP: <strong>{selectedInvitationGroup.invitationCode}</strong>
                </p>
              </div>

              <button
                type="button"
                className={styles.closeButton}
                aria-label="Fechar"
                onClick={() => setSelectedInvitationGroupId(null)}
              >
                ×
              </button>
            </header>

            <div className={styles.modalContent}>
              <section className={styles.modalSection}>
                <div className={styles.modalSectionHeader}>
                  <div>
                    <span className="dashboard-eyebrow">RSVP conjunto</span>
                    <h3>Pessoas deste convite</h3>
                  </div>
                </div>

                <div className={styles.groupGuestList}>
                  {selectedGroupGuests.map((guest) => (
                    <div key={guest.id} className={styles.groupGuestItem}>
                      <span className={styles.avatar} aria-hidden="true">
                        {getInitials(guest.name)}
                      </span>
                      <div>
                        <strong>{guest.name}</strong>
                        <span>{getRelationshipText(guest)}</span>
                      </div>
                      <span
                        className={`${styles.confirmationBadge} ${
                          styles[`confirmation-${guest.confirmation}`]
                        }`}
                      >
                        <span className={styles.statusDot} />
                        {confirmationLabels[guest.confirmation]}
                      </span>
                    </div>
                  ))}
                </div>

                <div className={styles.groupConfirmationActions}>
                  <button
                    type="button"
                    onClick={() =>
                      updateInvitationGroupConfirmation("confirmed")
                    }
                  >
                    Confirmar todos
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateInvitationGroupConfirmation("pending")
                    }
                  >
                    Colocar todos como aguardando
                  </button>
                  <button
                    type="button"
                    className={styles.declineGroupButton}
                    onClick={() =>
                      updateInvitationGroupConfirmation("declined")
                    }
                  >
                    Marcar todos como ausentes
                  </button>
                </div>
              </section>

              <section className={styles.modalSection}>
                <div className={styles.modalSectionHeader}>
                  <div>
                    <span className="dashboard-eyebrow">Save the Date</span>
                    <h3>Endereço de entrega</h3>
                  </div>

                  <span
                    className={`${styles.saveTheDateBadge} ${
                      styles[
                        `saveTheDate-${
                          selectedInvitationGroup.saveTheDateStatus
                        }`
                      ]
                    }`}
                  >
                    {
                      saveTheDateLabels[
                        selectedInvitationGroup.saveTheDateStatus
                      ]
                    }
                  </span>
                </div>

                {selectedInvitationGroup.address ? (
                  <address className={styles.addressCard}>
                    <strong>
                      {selectedInvitationGroup.address.recipientName}
                    </strong>
                    <span>
                      {formatAddress(selectedInvitationGroup.address)}
                    </span>
                  </address>
                ) : (
                  <div className={styles.missingAddress}>
                    <strong>Endereço não cadastrado</strong>
                    <p>
                      Cadastre o endereço deste grupo antes de preparar o
                      Save the Date.
                    </p>
                  </div>
                )}
              </section>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}