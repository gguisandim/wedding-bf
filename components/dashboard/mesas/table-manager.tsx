"use client";

import {
  type CSSProperties,
  type FormEvent,
  useMemo,
  useState,
} from "react";

import styles from "./table-manager.module.css";

export type GuestRSVPStatus =
  | "confirmed"
  | "pending"
  | "declined";

export type TableShape =
  | "round"
  | "rectangle";

export type TableGuest = {
  id: string;
  name: string;
  invitationName: string;
  relationship?: string;
  status: GuestRSVPStatus;
  tableId: string | null;
};

export type WeddingTable = {
  id: string;
  name: string;
  shape: TableShape;
  capacity: number;
  positionX: number;
  positionY: number;
};

type TableManagerProps = {
  initialGuests: TableGuest[];
  initialTables: WeddingTable[];
};

type ViewMode =
  | "map"
  | "list";

type TableFormState = {
  id: string | null;
  name: string;
  shape: TableShape;
  capacity: number;
};

type TableOccupancyStatus =
  | "available"
  | "full"
  | "empty";

const emptyTableForm: TableFormState = {
  id: null,
  name: "",
  shape: "round",
  capacity: 8,
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
  guest: TableGuest,
) {
  return (
    guest.relationship ||
    guest.invitationName
  );
}

function getOccupancyStatus(
  occupied: number,
  capacity: number,
): TableOccupancyStatus {
  if (occupied === 0) {
    return "empty";
  }

  if (occupied >= capacity) {
    return "full";
  }

  return "available";
}

function getSeatStyle(
  index: number,
  total: number,
  shape: TableShape,
): CSSProperties {
  const angle =
    (Math.PI * 2 * index) /
      Math.max(total, 1) -
    Math.PI / 2;

  const radiusX =
    shape === "round" ? 43 : 47;

  const radiusY =
    shape === "round" ? 41 : 34;

  const left =
    50 + Math.cos(angle) * radiusX;

  const top =
    50 + Math.sin(angle) * radiusY;

  return {
    left: `${left}%`,
    top: `${top}%`,
  };
}

function getStatusLabel(
  status: TableOccupancyStatus,
) {
  if (status === "full") {
    return "Completa";
  }

  if (status === "empty") {
    return "Vazia";
  }

  return "Disponível";
}

export default function TableManager({
  initialGuests,
  initialTables,
}: TableManagerProps) {
  const [guests, setGuests] =
    useState<TableGuest[]>(initialGuests);

  const [tables, setTables] =
    useState<WeddingTable[]>(initialTables);

  const [viewMode, setViewMode] =
    useState<ViewMode>("map");

  const [
    selectedTableId,
    setSelectedTableId,
  ] = useState<string | null>(
    initialTables[0]?.id ?? null,
  );

  const [search, setSearch] =
    useState("");

  const [feedback, setFeedback] =
    useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [tableForm, setTableForm] =
    useState<TableFormState>(
      emptyTableForm,
    );

  const [formError, setFormError] =
    useState("");

  const confirmedGuests = useMemo(
    () =>
      guests.filter(
        (guest) =>
          guest.status === "confirmed",
      ),
    [guests],
  );

  const pendingGuests = useMemo(
    () =>
      guests.filter(
        (guest) =>
          guest.status === "pending",
      ),
    [guests],
  );

  const validTableIds = useMemo(
    () =>
      new Set(
        tables.map((table) => table.id),
      ),
    [tables],
  );

  const allocatedGuests = useMemo(
    () =>
      confirmedGuests.filter(
        (guest) =>
          guest.tableId &&
          validTableIds.has(guest.tableId),
      ),
    [
      confirmedGuests,
      validTableIds,
    ],
  );

  const unallocatedGuests = useMemo(
    () =>
      confirmedGuests.filter(
        (guest) =>
          !guest.tableId ||
          !validTableIds.has(
            guest.tableId,
          ),
      ),
    [
      confirmedGuests,
      validTableIds,
    ],
  );

  const filteredUnallocatedGuests =
    useMemo(() => {
      const normalizedSearch = search
        .trim()
        .toLocaleLowerCase("pt-BR");

      if (!normalizedSearch) {
        return unallocatedGuests;
      }

      return unallocatedGuests.filter(
        (guest) =>
          guest.name
            .toLocaleLowerCase("pt-BR")
            .includes(normalizedSearch) ||
          guest.invitationName
            .toLocaleLowerCase("pt-BR")
            .includes(normalizedSearch) ||
          guest.relationship
            ?.toLocaleLowerCase("pt-BR")
            .includes(normalizedSearch),
      );
    }, [
      search,
      unallocatedGuests,
    ]);

  const guestsByTable = useMemo(() => {
    const groupedGuests = new Map<
      string,
      TableGuest[]
    >();

    tables.forEach((table) => {
      groupedGuests.set(table.id, []);
    });

    confirmedGuests.forEach((guest) => {
      if (
        guest.tableId &&
        groupedGuests.has(guest.tableId)
      ) {
        groupedGuests
          .get(guest.tableId)
          ?.push(guest);
      }
    });

    return groupedGuests;
  }, [
    confirmedGuests,
    tables,
  ]);

  const selectedTable =
    tables.find(
      (table) =>
        table.id === selectedTableId,
    ) ?? null;

  const selectedTableGuests =
    selectedTable
      ? guestsByTable.get(
          selectedTable.id,
        ) ?? []
      : [];

  const totalCapacity = tables.reduce(
    (total, table) =>
      total + table.capacity,
    0,
  );

  const totalOccupancyPercentage =
    totalCapacity > 0
      ? Math.round(
          (allocatedGuests.length /
            totalCapacity) *
            100,
        )
      : 0;

  function showFeedback(
    message: string,
  ) {
    setFeedback(message);

    window.setTimeout(() => {
      setFeedback(null);
    }, 2800);
  }

  function assignGuestToTable(
    guestId: string,
    tableId: string | null =
      selectedTableId,
  ) {
    if (!tableId) {
      showFeedback(
        "Selecione uma mesa antes de alocar o convidado.",
      );

      return;
    }

    const table = tables.find(
      (item) => item.id === tableId,
    );

    if (!table) {
      showFeedback(
        "A mesa selecionada não foi encontrada.",
      );

      return;
    }

    const occupiedPlaces =
      guestsByTable.get(table.id)
        ?.length ?? 0;

    if (
      occupiedPlaces >= table.capacity
    ) {
      showFeedback(
        `${table.name} já está completa.`,
      );

      return;
    }

    const guest = guests.find(
      (item) => item.id === guestId,
    );

    if (
      !guest ||
      guest.status !== "confirmed"
    ) {
      showFeedback(
        "Somente convidados confirmados podem ser alocados.",
      );

      return;
    }

    setGuests((currentGuests) =>
      currentGuests.map(
        (currentGuest) =>
          currentGuest.id === guestId
            ? {
                ...currentGuest,
                tableId,
              }
            : currentGuest,
      ),
    );

    setSelectedTableId(tableId);

    showFeedback(
      `${guest.name} foi alocado em ${table.name}.`,
    );
  }

  function removeGuestFromTable(
    guestId: string,
  ) {
    const guest = guests.find(
      (item) => item.id === guestId,
    );

    setGuests((currentGuests) =>
      currentGuests.map(
        (currentGuest) =>
          currentGuest.id === guestId
            ? {
                ...currentGuest,
                tableId: null,
              }
            : currentGuest,
      ),
    );

    if (guest) {
      showFeedback(
        `${guest.name} ficou sem mesa.`,
      );
    }
  }

  function openCreateTableModal() {
    setTableForm({
      ...emptyTableForm,
      name: `Mesa ${
        tables.length + 1
      }`,
    });

    setFormError("");
    setIsModalOpen(true);
  }

  function openEditTableModal(
    table: WeddingTable,
  ) {
    setTableForm({
      id: table.id,
      name: table.name,
      shape: table.shape,
      capacity: table.capacity,
    });

    setFormError("");
    setIsModalOpen(true);
  }

  function closeTableModal() {
    setIsModalOpen(false);
    setFormError("");
    setTableForm(emptyTableForm);
  }

  function saveTable(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const normalizedName =
      tableForm.name.trim();

    if (!normalizedName) {
      setFormError(
        "Informe um nome para a mesa.",
      );

      return;
    }

    if (
      !Number.isInteger(
        tableForm.capacity,
      ) ||
      tableForm.capacity < 1 ||
      tableForm.capacity > 20
    ) {
      setFormError(
        "A capacidade deve estar entre 1 e 20 lugares.",
      );

      return;
    }

    if (tableForm.id) {
      const currentGuests =
        guestsByTable.get(
          tableForm.id,
        ) ?? [];

      if (
        tableForm.capacity <
        currentGuests.length
      ) {
        setFormError(
          `Essa mesa possui ${currentGuests.length} pessoas. Remova convidados antes de reduzir a capacidade.`,
        );

        return;
      }

      setTables((currentTables) =>
        currentTables.map((table) =>
          table.id === tableForm.id
            ? {
                ...table,
                name: normalizedName,
                shape:
                  tableForm.shape,
                capacity:
                  tableForm.capacity,
              }
            : table,
        ),
      );

      showFeedback(
        `${normalizedName} foi atualizada.`,
      );

      closeTableModal();
      return;
    }

    const tableIndex =
      tables.length;

    const columns = 4;

    const columnIndex =
      tableIndex % columns;

    const rowIndex = Math.floor(
      tableIndex / columns,
    );

    const newTable: WeddingTable = {
      id: `table-${Date.now()}`,
      name: normalizedName,
      shape: tableForm.shape,
      capacity: tableForm.capacity,
      positionX:
        17 + columnIndex * 22,
      positionY:
        24 +
        (rowIndex % 3) * 31,
    };

    setTables((currentTables) => [
      ...currentTables,
      newTable,
    ]);

    setSelectedTableId(newTable.id);

    showFeedback(
      `${newTable.name} foi criada.`,
    );

    closeTableModal();
  }

  function deleteTable(
    tableId: string,
  ) {
    const table = tables.find(
      (item) => item.id === tableId,
    );

    if (!table) {
      return;
    }

    const confirmed =
      window.confirm(
        `Excluir ${table.name}? Os convidados alocados ficarão sem mesa.`,
      );

    if (!confirmed) {
      return;
    }

    const remainingTables =
      tables.filter(
        (item) => item.id !== tableId,
      );

    setTables(remainingTables);

    setGuests((currentGuests) =>
      currentGuests.map((guest) =>
        guest.tableId === tableId
          ? {
              ...guest,
              tableId: null,
            }
          : guest,
      ),
    );

    if (
      selectedTableId === tableId
    ) {
      setSelectedTableId(
        remainingTables[0]?.id ?? null,
      );
    }

    showFeedback(
      `${table.name} foi excluída.`,
    );
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
        className={styles.pageHeader}
      >
        <div className={styles.headerCopy}>
          <span className={styles.eyebrow}>
            Organização do evento
          </span>

          <h1>Organização das mesas</h1>

          <p>
            Distribua os convidados
            confirmados pelo salão e
            acompanhe os lugares disponíveis
            em cada mesa.
          </p>
        </div>

        <div
          className={styles.headerActions}
        >
          <div
            className={styles.viewToggle}
            aria-label="Modo de visualização"
          >
            <button
              type="button"
              className={
                viewMode === "map"
                  ? styles.activeView
                  : ""
              }
              aria-pressed={
                viewMode === "map"
              }
              onClick={() =>
                setViewMode("map")
              }
            >
              <span aria-hidden="true">
                ◉
              </span>
              Mapa
            </button>

            <button
              type="button"
              className={
                viewMode === "list"
                  ? styles.activeView
                  : ""
              }
              aria-pressed={
                viewMode === "list"
              }
              onClick={() =>
                setViewMode("list")
              }
            >
              <span aria-hidden="true">
                ≡
              </span>
              Lista
            </button>
          </div>

          <button
            type="button"
            className={
              styles.primaryButton
            }
            onClick={
              openCreateTableModal
            }
          >
            <span aria-hidden="true">
              +
            </span>

            Nova mesa
          </button>
        </div>

        <div
          className={styles.summaryGrid}
        >
          <article
            className={`${styles.summaryCard} ${styles.confirmedSummary}`}
          >
            <span
              className={styles.summaryIcon}
              aria-hidden="true"
            >
              ✓
            </span>

            <div>
              <strong>
                {confirmedGuests.length}
              </strong>

              <span>
                Convidados confirmados
              </span>
            </div>
          </article>

          <article
            className={`${styles.summaryCard} ${styles.allocatedSummary}`}
          >
            <span
              className={styles.summaryIcon}
              aria-hidden="true"
            >
              ⌾
            </span>

            <div>
              <strong>
                {allocatedGuests.length}
              </strong>

              <span>
                Pessoas alocadas
              </span>
            </div>
          </article>

          <article
            className={`${styles.summaryCard} ${styles.unassignedSummary}`}
          >
            <span
              className={styles.summaryIcon}
              aria-hidden="true"
            >
              !
            </span>

            <div>
              <strong>
                {
                  unallocatedGuests.length
                }
              </strong>

              <span>
                Pessoas sem mesa
              </span>
            </div>
          </article>

          <article
            className={`${styles.summaryCard} ${styles.capacitySummary}`}
          >
            <span
              className={styles.summaryIcon}
              aria-hidden="true"
            >
              %
            </span>

            <div>
              <strong>
                {
                  totalOccupancyPercentage
                }
                %
              </strong>

              <span>
                Ocupação do salão
              </span>
            </div>
          </article>
        </div>
      </header>

      <section
        className={styles.workspace}
      >
        <aside
          className={styles.guestPanel}
        >
          <header
            className={styles.panelHeader}
          >
            <div>
              <span
                className={styles.eyebrow}
              >
                Convidados
              </span>

              <h2
                className={
                  styles.panelTitle
                }
              >
                Sem mesa
              </h2>
            </div>

            <span
              className={
                styles.panelCount
              }
            >
              {unallocatedGuests.length}
            </span>
          </header>

          <label
            className={styles.searchBox}
          >
            <span aria-hidden="true">
              ⌕
            </span>

            <input
              type="search"
              value={search}
              placeholder="Buscar convidado..."
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
            />
          </label>

          <p
            className={styles.guestHint}
          >
            Selecione uma mesa no mapa e
            clique em “Adicionar”.
          </p>

          <div
            className={styles.guestList}
          >
            {filteredUnallocatedGuests.length >
            0 ? (
              filteredUnallocatedGuests.map(
                (guest) => (
                  <article
                    key={guest.id}
                    className={
                      styles.guestCard
                    }
                  >
                    <span
                      className={
                        styles.guestAvatar
                      }
                      aria-hidden="true"
                    >
                      {getInitials(
                        guest.name,
                      )}
                    </span>

                    <div
                      className={
                        styles.guestIdentity
                      }
                    >
                      <strong>
                        {guest.name}
                      </strong>

                      <span>
                        {
                          getRelationshipLabel(
                            guest,
                          )
                        }
                      </span>
                    </div>

                    <button
                      type="button"
                      className={
                        styles.assignButton
                      }
                      disabled={
                        !selectedTable
                      }
                      onClick={() =>
                        assignGuestToTable(
                          guest.id,
                        )
                      }
                    >
                      Adicionar
                    </button>
                  </article>
                ),
              )
            ) : (
              <div
                className={
                  styles.guestEmpty
                }
              >
                <span aria-hidden="true">
                  ✓
                </span>

                <strong>
                  Nenhum convidado encontrado
                </strong>

                <p>
                  Todos podem já estar
                  alocados ou a busca não
                  encontrou resultados.
                </p>
              </div>
            )}
          </div>

          <div
            className={
              styles.pendingSection
            }
          >
            <header
              className={
                styles.pendingHeader
              }
            >
              <div>
                <strong>
                  Aguardando confirmação
                </strong>

                <span>
                  Não ocupam lugares nas mesas
                </span>
              </div>

              <span>
                {pendingGuests.length}
              </span>
            </header>

            {pendingGuests.length > 0 && (
              <div
                className={
                  styles.pendingList
                }
              >
                {pendingGuests
                  .slice(0, 4)
                  .map((guest) => (
                    <div
                      key={guest.id}
                      className={
                        styles.pendingGuest
                      }
                    >
                      <span
                        aria-hidden="true"
                      />

                      <div>
                        <strong>
                          {guest.name}
                        </strong>

                        <small>
                          {
                            guest.invitationName
                          }
                        </small>
                      </div>
                    </div>
                  ))}

                {pendingGuests.length >
                  4 && (
                  <small>
                    +
                    {pendingGuests.length -
                      4}{" "}
                    pessoas aguardando
                  </small>
                )}
              </div>
            )}
          </div>
        </aside>

        <main
          className={styles.mainPanel}
        >
          {viewMode === "map" ? (
            <>
              <header
                className={
                  styles.mapHeader
                }
              >
                <div>
                  <span
                    className={
                      styles.eyebrow
                    }
                  >
                    Planta do salão
                  </span>

                  <h2
                    className={
                      styles.mapTitle
                    }
                  >
                    Mapa das mesas
                  </h2>
                </div>

                <div
                  className={styles.legend}
                >
                  <span
                    className={
                      styles.legendItem
                    }
                  >
                    <i
                      className={`${styles.legendDot} ${styles.availableLegend}`}
                    />
                    Disponível
                  </span>

                  <span
                    className={
                      styles.legendItem
                    }
                  >
                    <i
                      className={`${styles.legendDot} ${styles.fullLegend}`}
                    />
                    Completa
                  </span>

                  <span
                    className={
                      styles.legendItem
                    }
                  >
                    <i
                      className={`${styles.legendDot} ${styles.emptyLegend}`}
                    />
                    Vazia
                  </span>
                </div>
              </header>

              <div
                className={
                  styles.mapViewport
                }
              >
                <div
                  className={
                    styles.mapCanvas
                  }
                >
                  <div
                    className={
                      styles.mapDecor
                    }
                    aria-hidden="true"
                  >
                    <span
                      className={
                        styles.ceremonyLabel
                      }
                    >
                      Mesa dos noivos
                    </span>

                    <div
                      className={
                        styles.danceFloor
                      }
                    >
                      Pista
                    </div>
                  </div>

                  {tables.length > 0 ? (
                    tables.map((table) => {
                      const tableGuests =
                        guestsByTable.get(
                          table.id,
                        ) ?? [];

                      const occupied =
                        tableGuests.length;

                      const occupancyStatus =
                        getOccupancyStatus(
                          occupied,
                          table.capacity,
                        );

                      const statusClass =
                        occupancyStatus ===
                        "full"
                          ? styles.tableFull
                          : occupancyStatus ===
                              "empty"
                            ? styles.tableEmpty
                            : styles.tableAvailable;

                      return (
                        <button
                          key={table.id}
                          type="button"
                          className={`${styles.tableNode} ${
                            selectedTableId ===
                            table.id
                              ? styles.selectedTableNode
                              : ""
                          }`}
                          style={{
                            left: `${table.positionX}%`,
                            top: `${table.positionY}%`,
                          }}
                          aria-label={`Selecionar ${table.name}, ${occupied} de ${table.capacity} lugares ocupados`}
                          aria-pressed={
                            selectedTableId ===
                            table.id
                          }
                          onClick={() =>
                            setSelectedTableId(
                              table.id,
                            )
                          }
                        >
                          {Array.from({
                            length:
                              table.capacity,
                          }).map(
                            (_, index) => (
                              <span
                                key={`${table.id}-seat-${index}`}
                                className={`${styles.seat} ${
                                  index <
                                  occupied
                                    ? styles.occupiedSeat
                                    : styles.freeSeat
                                }`}
                                style={getSeatStyle(
                                  index,
                                  table.capacity,
                                  table.shape,
                                )}
                                aria-hidden="true"
                              />
                            ),
                          )}

                          <span
                            className={`${styles.tableSurface} ${
                              table.shape ===
                              "round"
                                ? styles.roundTable
                                : styles.rectangleTable
                            } ${statusClass}`}
                          >
                            <strong
                              className={
                                styles.tableName
                              }
                            >
                              {table.name}
                            </strong>

                            <small
                              className={
                                styles.tableOccupancy
                              }
                            >
                              {occupied}/
                              {table.capacity}
                            </small>
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div
                      className={
                        styles.emptyMap
                      }
                    >
                      <span
                        aria-hidden="true"
                      >
                        ○
                      </span>

                      <strong>
                        Nenhuma mesa criada
                      </strong>

                      <p>
                        Crie a primeira mesa
                        para iniciar a
                        organização.
                      </p>

                      <button
                        type="button"
                        onClick={
                          openCreateTableModal
                        }
                      >
                        Criar mesa
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div
              className={styles.listView}
            >
              <header
                className={
                  styles.mapHeader
                }
              >
                <div>
                  <span
                    className={
                      styles.eyebrow
                    }
                  >
                    Visão administrativa
                  </span>

                  <h2
                    className={
                      styles.mapTitle
                    }
                  >
                    Lista de mesas
                  </h2>
                </div>

                <span
                  className={
                    styles.panelCount
                  }
                >
                  {tables.length}
                </span>
              </header>

              {tables.length > 0 ? (
                <div
                  className={
                    styles.listGrid
                  }
                >
                  {tables.map((table) => {
                    const tableGuests =
                      guestsByTable.get(
                        table.id,
                      ) ?? [];

                    const occupied =
                      tableGuests.length;

                    const occupancyStatus =
                      getOccupancyStatus(
                        occupied,
                        table.capacity,
                      );

                    const occupancyPercentage =
                      Math.min(
                        100,
                        Math.round(
                          (occupied /
                            table.capacity) *
                            100,
                        ),
                      );

                    const statusClass =
                      occupancyStatus ===
                      "full"
                        ? styles.statusFull
                        : occupancyStatus ===
                            "empty"
                          ? styles.statusEmpty
                          : styles.statusAvailable;

                    return (
                      <article
                        key={table.id}
                        className={`${styles.tableListCard} ${
                          selectedTableId ===
                          table.id
                            ? styles.selectedListCard
                            : ""
                        }`}
                      >
                        <div
                          className={
                            styles.tableListTop
                          }
                        >
                          <span
                            className={`${styles.shapePreview} ${
                              table.shape ===
                              "round"
                                ? styles.shapePreviewRound
                                : styles.shapePreviewRectangle
                            }`}
                            aria-hidden="true"
                          />

                          <div
                            className={
                              styles.tableListIdentity
                            }
                          >
                            <strong>
                              {table.name}
                            </strong>

                            <span>
                              {table.shape ===
                              "round"
                                ? "Mesa redonda"
                                : "Mesa retangular"}
                            </span>
                          </div>

                          <span
                            className={`${styles.tableStatus} ${statusClass}`}
                          >
                            {getStatusLabel(
                              occupancyStatus,
                            )}
                          </span>
                        </div>

                        <div
                          className={
                            styles.occupancyBlock
                          }
                        >
                          <div
                            className={
                              styles.occupancyHeader
                            }
                          >
                            <span>
                              Ocupação
                            </span>

                            <strong>
                              {occupied}/
                              {
                                table.capacity
                              }
                            </strong>
                          </div>

                          <div
                            className={
                              styles.progressTrack
                            }
                          >
                            <span
                              className={
                                styles.progressFill
                              }
                              style={{
                                width: `${occupancyPercentage}%`,
                              }}
                            />
                          </div>

                          <small>
                            {Math.max(
                              0,
                              table.capacity -
                                occupied,
                            )}{" "}
                            lugares disponíveis
                          </small>
                        </div>

                        <div
                          className={
                            styles.guestPreview
                          }
                        >
                          {tableGuests.length >
                          0 ? (
                            <>
                              {tableGuests
                                .slice(0, 4)
                                .map(
                                  (guest) => (
                                    <span
                                      key={
                                        guest.id
                                      }
                                      className={
                                        styles.guestChip
                                      }
                                    >
                                      {
                                        guest.name
                                      }
                                    </span>
                                  ),
                                )}

                              {tableGuests.length >
                                4 && (
                                <span
                                  className={
                                    styles.moreGuests
                                  }
                                >
                                  +
                                  {tableGuests.length -
                                    4}{" "}
                                  convidados
                                </span>
                              )}
                            </>
                          ) : (
                            <span
                              className={
                                styles.moreGuests
                              }
                            >
                              Nenhum convidado
                              alocado
                            </span>
                          )}
                        </div>

                        <div
                          className={
                            styles.tableListActions
                          }
                        >
                          <button
                            type="button"
                            className={
                              styles.secondaryButton
                            }
                            onClick={() =>
                              setSelectedTableId(
                                table.id,
                              )
                            }
                          >
                            Selecionar
                          </button>

                          <button
                            type="button"
                            className={
                              styles.secondaryButton
                            }
                            onClick={() =>
                              openEditTableModal(
                                table,
                              )
                            }
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className={
                              styles.dangerGhostButton
                            }
                            onClick={() =>
                              deleteTable(
                                table.id,
                              )
                            }
                          >
                            Excluir
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div
                  className={styles.emptyMap}
                >
                  <strong>
                    Nenhuma mesa criada
                  </strong>

                  <button
                    type="button"
                    onClick={
                      openCreateTableModal
                    }
                  >
                    Criar mesa
                  </button>
                </div>
              )}
            </div>
          )}
        </main>

        <aside
          className={styles.detailsPanel}
        >
          {selectedTable ? (
            <>
              <header
                className={
                  styles.detailHeader
                }
              >
                <span
                  className={`${styles.detailShape} ${
                    selectedTable.shape ===
                    "round"
                      ? styles.detailShapeRound
                      : styles.detailShapeRectangle
                  }`}
                  aria-hidden="true"
                />

                <div
                  className={
                    styles.detailTitle
                  }
                >
                  <span
                    className={
                      styles.eyebrow
                    }
                  >
                    Mesa selecionada
                  </span>

                  <h2>
                    {selectedTable.name}
                  </h2>
                </div>

                <button
                  type="button"
                  className={
                    styles.iconButton
                  }
                  aria-label={`Editar ${selectedTable.name}`}
                  onClick={() =>
                    openEditTableModal(
                      selectedTable,
                    )
                  }
                >
                  ✎
                </button>
              </header>

              <div
                className={styles.detailMeta}
              >
                <span>
                  {selectedTable.shape ===
                  "round"
                    ? "Mesa redonda"
                    : "Mesa retangular"}
                </span>

                <span>
                  {
                    selectedTableGuests.length
                  }
                  /
                  {
                    selectedTable.capacity
                  }{" "}
                  lugares
                </span>
              </div>

              <div
                className={
                  styles.detailProgress
                }
              >
                <div
                  className={
                    styles.detailProgressHeader
                  }
                >
                  <span>
                    Ocupação da mesa
                  </span>

                  <strong>
                    {selectedTable.capacity >
                    0
                      ? Math.round(
                          (selectedTableGuests.length /
                            selectedTable.capacity) *
                            100,
                        )
                      : 0}
                    %
                  </strong>
                </div>

                <div
                  className={
                    styles.progressTrack
                  }
                >
                  <span
                    className={
                      styles.progressFill
                    }
                    style={{
                      width: `${
                        selectedTable.capacity >
                        0
                          ? Math.min(
                              100,
                              Math.round(
                                (selectedTableGuests.length /
                                  selectedTable.capacity) *
                                  100,
                              ),
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div
                className={
                  styles.detailGuestList
                }
              >
                <header>
                  <strong>
                    Pessoas alocadas
                  </strong>

                  <span>
                    {
                      selectedTableGuests.length
                    }
                  </span>
                </header>

                {selectedTableGuests.length >
                0 ? (
                  selectedTableGuests.map(
                    (guest) => (
                      <article
                        key={guest.id}
                        className={
                          styles.detailGuest
                        }
                      >
                        <span
                          className={
                            styles.detailGuestAvatar
                          }
                          aria-hidden="true"
                        >
                          {getInitials(
                            guest.name,
                          )}
                        </span>

                        <div
                          className={
                            styles.detailGuestIdentity
                          }
                        >
                          <strong>
                            {guest.name}
                          </strong>

                          <span>
                            {
                              getRelationshipLabel(
                                guest,
                              )
                            }
                          </span>
                        </div>

                        <button
                          type="button"
                          className={
                            styles.removeGuestButton
                          }
                          aria-label={`Remover ${guest.name} da mesa`}
                          onClick={() =>
                            removeGuestFromTable(
                              guest.id,
                            )
                          }
                        >
                          ×
                        </button>
                      </article>
                    ),
                  )
                ) : (
                  <div
                    className={
                      styles.detailEmpty
                    }
                  >
                    <span
                      aria-hidden="true"
                    >
                      ○
                    </span>

                    <p>
                      Esta mesa ainda não possui
                      convidados.
                    </p>
                  </div>
                )}
              </div>

              <footer
                className={
                  styles.detailFooter
                }
              >
                <p>
                  Selecione uma pessoa na coluna
                  “Sem mesa” para adicioná-la.
                </p>

                <button
                  type="button"
                  className={
                    styles.deleteButton
                  }
                  onClick={() =>
                    deleteTable(
                      selectedTable.id,
                    )
                  }
                >
                  Excluir mesa
                </button>
              </footer>
            </>
          ) : (
            <div
              className={
                styles.emptyDetails
              }
            >
              <span
                className={
                  styles.emptyDetailsIcon
                }
                aria-hidden="true"
              >
                ○
              </span>

              <strong>
                Selecione uma mesa
              </strong>

              <p>
                Clique em uma mesa no mapa
                para visualizar e organizar
                seus convidados.
              </p>
            </div>
          )}
        </aside>
      </section>

      {isModalOpen && (
        <div
          className={styles.modalOverlay}
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeTableModal();
            }
          }}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="table-modal-title"
          >
            <header
              className={styles.modalHeader}
            >
              <div>
                <span
                  className={
                    styles.eyebrow
                  }
                >
                  Organização do salão
                </span>

                <h2 id="table-modal-title">
                  {tableForm.id
                    ? "Editar mesa"
                    : "Criar nova mesa"}
                </h2>
              </div>

              <button
                type="button"
                className={
                  styles.closeButton
                }
                aria-label="Fechar"
                onClick={
                  closeTableModal
                }
              >
                ×
              </button>
            </header>

            <form
              className={styles.form}
              onSubmit={saveTable}
            >
              <label
                className={
                  styles.fieldGroup
                }
              >
                <span>
                  Nome da mesa
                </span>

                <input
                  type="text"
                  value={tableForm.name}
                  placeholder="Ex.: Mesa 01"
                  autoFocus
                  onChange={(event) =>
                    setTableForm(
                      (currentForm) => ({
                        ...currentForm,
                        name: event.target
                          .value,
                      }),
                    )
                  }
                />
              </label>

              <fieldset
                className={
                  styles.fieldGroup
                }
              >
                <legend>
                  Formato
                </legend>

                <div
                  className={
                    styles.shapeSelector
                  }
                >
                  <button
                    type="button"
                    className={`${styles.shapeOption} ${
                      tableForm.shape ===
                      "round"
                        ? styles.selectedShape
                        : ""
                    }`}
                    aria-pressed={
                      tableForm.shape ===
                      "round"
                    }
                    onClick={() =>
                      setTableForm(
                        (currentForm) => ({
                          ...currentForm,
                          shape: "round",
                        }),
                      )
                    }
                  >
                    <i
                      className={
                        styles.shapePreviewRound
                      }
                      aria-hidden="true"
                    />

                    <span>
                      Redonda
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.shapeOption} ${
                      tableForm.shape ===
                      "rectangle"
                        ? styles.selectedShape
                        : ""
                    }`}
                    aria-pressed={
                      tableForm.shape ===
                      "rectangle"
                    }
                    onClick={() =>
                      setTableForm(
                        (currentForm) => ({
                          ...currentForm,
                          shape:
                            "rectangle",
                        }),
                      )
                    }
                  >
                    <i
                      className={
                        styles.shapePreviewRectangle
                      }
                      aria-hidden="true"
                    />

                    <span>
                      Retangular
                    </span>
                  </button>
                </div>
              </fieldset>

              <label
                className={
                  styles.fieldGroup
                }
              >
                <span>
                  Capacidade
                </span>

                <input
                  type="number"
                  min={1}
                  max={20}
                  value={
                    tableForm.capacity
                  }
                  onChange={(event) =>
                    setTableForm(
                      (currentForm) => ({
                        ...currentForm,
                        capacity: Number(
                          event.target
                            .value,
                        ),
                      }),
                    )
                  }
                />

                <small>
                  Quantidade máxima de
                  convidados cadastrados na
                  mesa.
                </small>
              </label>

              {formError && (
                <div
                  className={
                    styles.modalError
                  }
                  role="alert"
                >
                  <span
                    aria-hidden="true"
                  >
                    !
                  </span>

                  {formError}
                </div>
              )}

              <div
                className={
                  styles.modalActions
                }
              >
                <button
                  type="button"
                  className={
                    styles.cancelButton
                  }
                  onClick={
                    closeTableModal
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className={
                    styles.saveButton
                  }
                >
                  {tableForm.id
                    ? "Salvar alterações"
                    : "Criar mesa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}