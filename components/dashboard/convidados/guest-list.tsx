"use client";

import { useMemo, useState } from "react";

import styles from "./guest-list.module.css";

export type GuestConfirmation =
  | "confirmed"
  | "pending"
  | "declined";

export type GuestSide =
  | "bride"
  | "groom"
  | "both";

export type GuestItem = {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  group: string;
  side: GuestSide;
  confirmation: GuestConfirmation;
  companions: number;
  table?: string;
};

type GuestListProps = {
  guests: GuestItem[];
};

type ConfirmationFilter =
  | "all"
  | GuestConfirmation;

const confirmationLabels: Record<
  GuestConfirmation,
  string
> = {
  confirmed: "Confirmado",
  pending: "Aguardando",
  declined: "Não comparecerá",
};

const sideLabels: Record<GuestSide, string> = {
  bride: "Bárbara",
  groom: "Felipe",
  both: "Casal",
};

export default function GuestList({
  guests,
}: GuestListProps) {
  const [search, setSearch] = useState("");
  const [confirmationFilter, setConfirmationFilter] =
    useState<ConfirmationFilter>("all");
  const [groupFilter, setGroupFilter] =
    useState("all");

  const groups = useMemo(() => {
    return Array.from(
      new Set(guests.map((guest) => guest.group)),
    ).sort();
  }, [guests]);

  const filteredGuests = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLocaleLowerCase("pt-BR");

    return guests.filter((guest) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        guest.name
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch) ||
        guest.phone
          ?.toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch) ||
        guest.email
          ?.toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch);

      const matchesConfirmation =
        confirmationFilter === "all" ||
        guest.confirmation === confirmationFilter;

      const matchesGroup =
        groupFilter === "all" ||
        guest.group === groupFilter;

      return (
        matchesSearch &&
        matchesConfirmation &&
        matchesGroup
      );
    });
  }, [
    guests,
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

  const totalPeople = guests.reduce(
    (total, guest) =>
      total + 1 + guest.companions,
    0,
  );

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <span className="dashboard-eyebrow">
            Convidados
          </span>

          <h1>Lista de convidados</h1>

          <p>
            Organize os convidados, acompanhe as
            confirmações e prepare a distribuição das
            mesas.
          </p>

          <button
            type="button"
            className={styles.addGuestButton}
          >
            <span aria-hidden="true">＋</span>
            Adicionar convidado
          </button>
        </div>

        <div className={styles.headerSummary}>
          <div className={styles.totalGuestsCard}>
            <span>Total previsto</span>

            <strong>{totalPeople}</strong>

            <p>
              {guests.length} convites cadastrados
            </p>
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
            placeholder="Buscar convidado..."
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </label>

        <div className={styles.filters}>
          <button
            type="button"
            className={`${styles.filterButton} ${
              confirmationFilter === "all"
                ? styles.filterButtonActive
                : ""
            }`}
            onClick={() =>
              setConfirmationFilter("all")
            }
          >
            Todos
          </button>

          <button
            type="button"
            className={`${styles.filterButton} ${
              confirmationFilter === "confirmed"
                ? styles.filterButtonActive
                : ""
            }`}
            onClick={() =>
              setConfirmationFilter("confirmed")
            }
          >
            Confirmados
          </button>

          <button
            type="button"
            className={`${styles.filterButton} ${
              confirmationFilter === "pending"
                ? styles.filterButtonActive
                : ""
            }`}
            onClick={() =>
              setConfirmationFilter("pending")
            }
          >
            Aguardando
          </button>

          <button
            type="button"
            className={`${styles.filterButton} ${
              confirmationFilter === "declined"
                ? styles.filterButtonActive
                : ""
            }`}
            onClick={() =>
              setConfirmationFilter("declined")
            }
          >
            Recusaram
          </button>
        </div>

        <select
          className={styles.groupSelect}
          value={groupFilter}
          onChange={(event) =>
            setGroupFilter(event.target.value)
          }
          aria-label="Filtrar por grupo"
        >
          <option value="all">
            Todos os grupos
          </option>

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
            <span className="dashboard-eyebrow">
              Lista
            </span>

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
                    <th>Contato</th>
                    <th>Acompanhantes</th>
                    <th>Confirmação</th>
                    <th>Mesa</th>
                    <th>
                      <span className={styles.srOnly}>
                        Ações
                      </span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredGuests.map((guest) => (
                    <tr key={guest.id}>
                      <td>
                        <div
                          className={styles.guestIdentity}
                        >
                          <span
                            className={styles.avatar}
                            aria-hidden="true"
                          >
                            {guest.name
                              .split(" ")
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join("")
                              .toUpperCase()}
                          </span>

                          <div>
                            <strong>{guest.name}</strong>

                            <span>
                              Convidado de{" "}
                              {sideLabels[guest.side]}
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
                        <div className={styles.contact}>
                          <span>
                            {guest.phone || "Sem telefone"}
                          </span>

                          {guest.email && (
                            <span>{guest.email}</span>
                          )}
                        </div>
                      </td>

                      <td>
                        <span
                          className={
                            styles.companionCount
                          }
                        >
                          {guest.companions}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`${styles.confirmationBadge} ${
                            styles[
                              `confirmation-${guest.confirmation}`
                            ]
                          }`}
                        >
                          <span
                            className={styles.statusDot}
                          />

                          {
                            confirmationLabels[
                              guest.confirmation
                            ]
                          }
                        </span>
                      </td>

                      <td>
                        {guest.table ? (
                          <span
                            className={styles.tableBadge}
                          >
                            {guest.table}
                          </span>
                        ) : (
                          <span
                            className={
                              styles.noTableLabel
                            }
                          >
                            Não definida
                          </span>
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className={styles.rowMenu}
                          aria-label={`Mais opções para ${guest.name}`}
                        >
                          <span aria-hidden="true">
                            •••
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.mobileList}>
              {filteredGuests.map((guest) => (
                <article
                  key={guest.id}
                  className={styles.mobileGuestCard}
                >
                  <header>
                    <div
                      className={styles.guestIdentity}
                    >
                      <span
                        className={styles.avatar}
                        aria-hidden="true"
                      >
                        {guest.name
                          .split(" ")
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join("")
                          .toUpperCase()}
                      </span>

                      <div>
                        <strong>{guest.name}</strong>
                        <span>{guest.group}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={styles.rowMenu}
                      aria-label={`Mais opções para ${guest.name}`}
                    >
                      <span aria-hidden="true">
                        •••
                      </span>
                    </button>
                  </header>

                  <div className={styles.mobileGuestInfo}>
                    <span
                      className={`${styles.confirmationBadge} ${
                        styles[
                          `confirmation-${guest.confirmation}`
                        ]
                      }`}
                    >
                      <span className={styles.statusDot} />

                      {
                        confirmationLabels[
                          guest.confirmation
                        ]
                      }
                    </span>

                    <span>
                      {guest.companions} acompanhante(s)
                    </span>

                    <span>
                      {guest.table || "Mesa não definida"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <span aria-hidden="true">⌕</span>

            <strong>
              Nenhum convidado encontrado
            </strong>

            <p>
              Tente alterar a busca ou os filtros
              selecionados.
            </p>

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
    </div>
  );
}