"use client";

import {
  type DragEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import {
  assignGuestToTableAction,
  createSeatingTableAction,
  deleteSeatingTableAction,
  unassignGuestFromTableAction,
  updateSeatingTableAction,
  updateTablePositionAction,
} from "@/lib/actions/tables";

import styles from "./table-manager.module.css";

export type SeatingTableShape =
  | "round"
  | "rectangular"
  | "square";

export type SeatingGuest = {
  id: string;
  name: string;
  preferredName?: string;
  groupName: string;

  side:
    | "bride"
    | "groom"
    | "both";

  confirmation:
    | "confirmed"
    | "pending"
    | "declined";

  isPrimary: boolean;
  isChild: boolean;

  tableId?: string;
};

export type SeatingTable = {
  id: string;
  name: string;
  shape: SeatingTableShape;
  capacity: number;

  positionX: number;
  positionY: number;
  rotation: number;

  notes?: string;
};

type TableManagerProps = {
  initialTables: SeatingTable[];
  initialGuests: SeatingGuest[];
  brideName: string;
  groomName: string;
};

type ViewMode = "map" | "list";

type TableForm = {
  id?: string;
  name: string;
  shape: SeatingTableShape;
  capacity: string;
  notes: string;

  positionX: number;
  positionY: number;
  rotation: number;
};

const shapeLabels:
  Record<
    SeatingTableShape,
    string
  > = {
    round: "Redonda",
    rectangular: "Retangular",
    square: "Quadrada",
  };

const confirmationLabels = {
  confirmed: "Confirmado",
  pending: "Aguardando",
  declined: "Recusou",
} as const;

function createEmptyForm(
  tableCount: number,
): TableForm {
  const column =
    tableCount % 4;

  const row =
    Math.floor(tableCount / 4) % 3;

  return {
    name:
      `Mesa ${tableCount + 1}`,
    shape: "round",
    capacity: "8",
    notes: "",

    positionX:
      16 + column * 23,

    positionY:
      20 + row * 31,

    rotation: 0,
  };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase(
      "pt-BR",
    );
}

function clamp(
  value: number,
  min: number,
  max: number,
) {
  return Math.min(
    max,
    Math.max(min, value),
  );
}

export default function TableManager({
  initialTables,
  initialGuests,
  brideName,
  groomName,
}: TableManagerProps) {
  const router = useRouter();

  const floorRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const [
    tables,
    setTables,
  ] = useState<SeatingTable[]>(
    initialTables,
  );

  const [
    guests,
    setGuests,
  ] = useState<SeatingGuest[]>(
    initialGuests,
  );

  const [
    viewMode,
    setViewMode,
  ] = useState<ViewMode>("map");

  const [
    selectedTableId,
    setSelectedTableId,
  ] = useState<string | null>(
    initialTables[0]?.id ??
      null,
  );

  const [
    selectedGuestId,
    setSelectedGuestId,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    isModalOpen,
    setIsModalOpen,
  ] = useState(false);

  const [
    tableForm,
    setTableForm,
  ] = useState<TableForm>(
    () =>
      createEmptyForm(
        initialTables.length,
      ),
  );

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    activeGuestId,
    setActiveGuestId,
  ] = useState<string | null>(
    null,
  );

  const [
    activeTableId,
    setActiveTableId,
  ] = useState<string | null>(
    null,
  );

  const [
    draggingTableId,
    setDraggingTableId,
  ] = useState<string | null>(
    null,
  );

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
    setTables(initialTables);
  }, [initialTables]);

  useEffect(() => {
    setGuests(initialGuests);
  }, [initialGuests]);

  useEffect(() => {
    if (
      selectedTableId &&
      !tables.some(
        (table) =>
          table.id ===
          selectedTableId,
      )
    ) {
      setSelectedTableId(
        tables[0]?.id ??
          null,
      );
    }
  }, [
    selectedTableId,
    tables,
  ]);

  const selectedTable =
    useMemo(
      () =>
        tables.find(
          (table) =>
            table.id ===
            selectedTableId,
        ) ?? null,
      [
        tables,
        selectedTableId,
      ],
    );

  const assignedGuests =
    useMemo(
      () =>
        guests.filter(
          (guest) =>
            guest.tableId ===
            selectedTableId,
        ),
      [
        guests,
        selectedTableId,
      ],
    );

  const unassignedGuests =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLocaleLowerCase(
            "pt-BR",
          );

      return guests.filter(
        (guest) => {
          if (
            guest.tableId ||
            guest.confirmation ===
              "declined"
          ) {
            return false;
          }

          const searchable = [
            guest.name,
            guest.preferredName,
            guest.groupName,
          ]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase(
              "pt-BR",
            );

          return (
            normalizedSearch
              .length === 0 ||
            searchable.includes(
              normalizedSearch,
            )
          );
        },
      );
    }, [
      guests,
      search,
    ]);

  const occupiedSeats =
    guests.filter(
      (guest) =>
        Boolean(guest.tableId),
    ).length;

  const confirmedGuests =
    guests.filter(
      (guest) =>
        guest.confirmation ===
        "confirmed",
    ).length;

  const totalCapacity =
    tables.reduce(
      (total, table) =>
        total + table.capacity,
      0,
    );

  const unassignedConfirmed =
    guests.filter(
      (guest) =>
        guest.confirmation ===
          "confirmed" &&
        !guest.tableId,
    ).length;

  const sideLabels = {
    bride: brideName,
    groom: groomName,
    both: "Casal",
  } as const;

  function showFeedback(
    message: string,
  ) {
    setFeedback(message);

    window.setTimeout(() => {
      setFeedback(null);
    }, 3000);
  }

  function openCreateModal() {
    window.dispatchEvent(
      new Event(
        "dashboard:collapse-sidebar",
      ),
    );

    setTableForm(
      createEmptyForm(
        tables.length,
      ),
    );

    setIsModalOpen(true);
  }

  function openEditModal(
    table: SeatingTable,
  ) {
    window.dispatchEvent(
      new Event(
        "dashboard:collapse-sidebar",
      ),
    );

    setTableForm({
      id: table.id,
      name: table.name,
      shape: table.shape,
      capacity:
        String(table.capacity),
      notes:
        table.notes ?? "",

      positionX:
        table.positionX,
      positionY:
        table.positionY,
      rotation:
        table.rotation,
    });

    setIsModalOpen(true);
  }

  function closeModal() {
    if (!isSaving) {
      setIsModalOpen(false);
    }
  }

  async function saveTable(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    const capacity =
      Number(
        tableForm.capacity,
      );

    if (
      tableForm.name.trim()
        .length < 2
    ) {
      showFeedback(
        "Informe o nome da mesa.",
      );
      return;
    }

    if (
      !Number.isInteger(
        capacity,
      ) ||
      capacity < 1 ||
      capacity > 30
    ) {
      showFeedback(
        "A capacidade deve ficar entre 1 e 30 lugares.",
      );
      return;
    }

    setIsSaving(true);

    try {
      if (tableForm.id) {
        const result =
          await updateSeatingTableAction({
            id: tableForm.id,
            name:
              tableForm.name.trim(),
            shape:
              tableForm.shape,
            capacity,
            notes:
              tableForm.notes.trim(),

            positionX:
              tableForm.positionX,
            positionY:
              tableForm.positionY,
            rotation:
              tableForm.rotation,
          });

        if (!result.success) {
          showFeedback(
            result.message,
          );
          return;
        }

        setTables((current) =>
          current.map((table) =>
            table.id ===
            tableForm.id
              ? {
                  ...table,
                  name:
                    tableForm.name.trim(),
                  shape:
                    tableForm.shape,
                  capacity,
                  notes:
                    tableForm.notes.trim() ||
                    undefined,
                }
              : table,
          ),
        );

        showFeedback(
          result.message,
        );
      } else {
        const result =
          await createSeatingTableAction({
            name:
              tableForm.name.trim(),
            shape:
              tableForm.shape,
            capacity,
            notes:
              tableForm.notes.trim(),

            positionX:
              tableForm.positionX,
            positionY:
              tableForm.positionY,
            rotation:
              tableForm.rotation,
          });

        if (
          !result.success ||
          !result.id
        ) {
          showFeedback(
            result.message,
          );
          return;
        }

        const newTable:
          SeatingTable = {
          id: result.id,
          name:
            tableForm.name.trim(),
          shape:
            tableForm.shape,
          capacity,

          positionX:
            tableForm.positionX,
          positionY:
            tableForm.positionY,
          rotation:
            tableForm.rotation,

          notes:
            tableForm.notes.trim() ||
            undefined,
        };

        setTables(
          (current) => [
            ...current,
            newTable,
          ],
        );

        setSelectedTableId(
          newTable.id,
        );

        showFeedback(
          result.message,
        );
      }

      setIsModalOpen(false);
      router.refresh();
    } catch (error) {
      console.error(
        "Erro ao salvar mesa:",
        error,
      );

      showFeedback(
        "Não foi possível salvar a mesa.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteTable(
    table: SeatingTable,
  ) {
    const confirmed =
      window.confirm(
        `Excluir ${table.name}? Os convidados ficarão sem mesa.`,
      );

    if (!confirmed) {
      return;
    }

    setActiveTableId(
      table.id,
    );

    try {
      const result =
        await deleteSeatingTableAction(
          table.id,
        );

      if (!result.success) {
        showFeedback(
          result.message,
        );
        return;
      }

      setTables((current) =>
        current.filter(
          (currentTable) =>
            currentTable.id !==
            table.id,
        ),
      );

      setGuests((current) =>
        current.map((guest) =>
          guest.tableId ===
          table.id
            ? {
                ...guest,
                tableId: undefined,
              }
            : guest,
        ),
      );

      showFeedback(
        result.message,
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Erro ao excluir mesa:",
        error,
      );

      showFeedback(
        "Não foi possível excluir a mesa.",
      );
    } finally {
      setActiveTableId(null);
    }
  }

  async function assignGuest(
    guestId = selectedGuestId,
  ) {
    if (
      !selectedTable ||
      !guestId ||
      activeGuestId
    ) {
      return;
    }

    setActiveGuestId(
      guestId,
    );

    try {
      const result =
        await assignGuestToTableAction({
          guestId,
          tableId:
            selectedTable.id,
        });

      if (!result.success) {
        showFeedback(
          result.message,
        );
        return;
      }

      setGuests((current) =>
        current.map((guest) =>
          guest.id === guestId
            ? {
                ...guest,
                tableId:
                  selectedTable.id,
              }
            : guest,
        ),
      );

      setSelectedGuestId("");
      showFeedback(
        result.message,
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Erro ao atribuir convidado:",
        error,
      );

      showFeedback(
        "Não foi possível atribuir o convidado.",
      );
    } finally {
      setActiveGuestId(null);
    }
  }

  async function unassignGuest(
    guestId: string,
  ) {
    if (activeGuestId) {
      return;
    }

    setActiveGuestId(
      guestId,
    );

    try {
      const result =
        await unassignGuestFromTableAction({
          guestId,
        });

      if (!result.success) {
        showFeedback(
          result.message,
        );
        return;
      }

      setGuests((current) =>
        current.map((guest) =>
          guest.id === guestId
            ? {
                ...guest,
                tableId: undefined,
              }
            : guest,
        ),
      );

      showFeedback(
        result.message,
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Erro ao remover convidado:",
        error,
      );

      showFeedback(
        "Não foi possível remover o convidado da mesa.",
      );
    } finally {
      setActiveGuestId(null);
    }
  }

  function startDragging(
    event:
      DragEvent<HTMLButtonElement>,
    tableId: string,
  ) {
    setDraggingTableId(
      tableId,
    );

    event.dataTransfer
      .setData(
        "text/plain",
        tableId,
      );

    event.dataTransfer
      .setDragImage(
        event.currentTarget,
        event.currentTarget
          .offsetWidth / 2,
        event.currentTarget
          .offsetHeight / 2,
      );
  }

  async function dropTable(
    event:
      DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault();

    const tableId =
      event.dataTransfer
        .getData("text/plain") ||
      draggingTableId;

    const floor =
      floorRef.current;

    if (!tableId || !floor) {
      setDraggingTableId(null);
      return;
    }

    const currentTable =
      tables.find(
        (table) =>
          table.id === tableId,
      );

    if (!currentTable) {
      setDraggingTableId(null);
      return;
    }

    const rect =
      floor.getBoundingClientRect();

    const positionX =
      clamp(
        (
          (event.clientX -
            rect.left) /
          rect.width
        ) * 100,
        7,
        93,
      );

    const positionY =
      clamp(
        (
          (event.clientY -
            rect.top) /
          rect.height
        ) * 100,
        10,
        90,
      );

    const previousX =
      currentTable.positionX;

    const previousY =
      currentTable.positionY;

    setTables((current) =>
      current.map((table) =>
        table.id === tableId
          ? {
              ...table,
              positionX,
              positionY,
            }
          : table,
      ),
    );

    setDraggingTableId(null);

    try {
      const result =
        await updateTablePositionAction({
          tableId,
          positionX,
          positionY,
        });

      if (!result.success) {
        setTables((current) =>
          current.map((table) =>
            table.id === tableId
              ? {
                  ...table,
                  positionX:
                    previousX,
                  positionY:
                    previousY,
                }
              : table,
          ),
        );

        showFeedback(
          result.message,
        );
        return;
      }

      showFeedback(
        result.message,
      );
    } catch (error) {
      console.error(
        "Erro ao mover mesa:",
        error,
      );

      setTables((current) =>
        current.map((table) =>
          table.id === tableId
            ? {
                ...table,
                positionX:
                  previousX,
                positionY:
                  previousY,
              }
            : table,
        ),
      );

      showFeedback(
        "Não foi possível salvar a posição da mesa.",
      );
    }
  }

  const modal =
    isModalOpen ? (
      <div
        className={
          styles.modalOverlay
        }
        role="presentation"
        onMouseDown={(event) => {
          if (
            event.target ===
            event.currentTarget
          ) {
            closeModal();
          }
        }}
      >
        <section
          className={styles.modal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="table-modal-title"
        >
          <header
            className={
              styles.modalHeader
            }
          >
            <div>
              <span
                className={
                  styles.eyebrow
                }
              >
                Salão
              </span>

              <h2 id="table-modal-title">
                {tableForm.id
                  ? "Editar mesa"
                  : "Nova mesa"}
              </h2>
            </div>

            <button
              type="button"
              aria-label="Fechar"
              onClick={closeModal}
              disabled={isSaving}
            >
              ×
            </button>
          </header>

          <form
            className={styles.form}
            onSubmit={saveTable}
          >
            <div
              className={
                styles.formGrid
              }
            >
              <label
                className={
                  styles.fullField
                }
              >
                <span>
                  Nome da mesa
                </span>

                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={80}
                  value={
                    tableForm.name
                  }
                  onChange={(event) =>
                    setTableForm(
                      (current) => ({
                        ...current,
                        name:
                          event.target
                            .value,
                      }),
                    )
                  }
                />
              </label>

              <label>
                <span>Formato</span>

                <select
                  value={
                    tableForm.shape
                  }
                  onChange={(event) =>
                    setTableForm(
                      (current) => ({
                        ...current,
                        shape:
                          event.target
                            .value as SeatingTableShape,
                      }),
                    )
                  }
                >
                  {Object.entries(
                    shapeLabels,
                  ).map(
                    ([
                      value,
                      label,
                    ]) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                <span>
                  Capacidade
                </span>

                <input
                  type="number"
                  min={1}
                  max={30}
                  required
                  value={
                    tableForm.capacity
                  }
                  onChange={(event) =>
                    setTableForm(
                      (current) => ({
                        ...current,
                        capacity:
                          event.target
                            .value,
                      }),
                    )
                  }
                />
              </label>

              <label
                className={
                  styles.fullField
                }
              >
                <span>
                  Observações
                </span>

                <textarea
                  rows={4}
                  maxLength={500}
                  placeholder="Ex.: Próxima ao palco, mesa dos avós..."
                  value={
                    tableForm.notes
                  }
                  onChange={(event) =>
                    setTableForm(
                      (current) => ({
                        ...current,
                        notes:
                          event.target
                            .value,
                      }),
                    )
                  }
                />
              </label>
            </div>

            <div
              className={
                styles.modalActions
              }
            >
              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSaving}
              >
                {isSaving
                  ? "Salvando..."
                  : "Salvar mesa"}
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
        className={
          styles.pageHeader
        }
      >
        <div
          className={
            styles.headerCopy
          }
        >
          <span
            className={
              styles.eyebrow
            }
          >
            Organização do salão
          </span>

          <h1>Mesas</h1>

          <p>
            Distribua os convidados,
            acompanhe a capacidade e
            arraste as mesas para
            representar a disposição
            vista de cima.
          </p>
        </div>

        <button
          type="button"
          className={
            styles.primaryButton
          }
          onClick={
            openCreateModal
          }
        >
          <span aria-hidden="true">
            +
          </span>

          Nova mesa
        </button>

        <div
          className={
            styles.metrics
          }
        >
          <article>
            <span>Mesas</span>
            <strong>
              {tables.length}
            </strong>
          </article>

          <article>
            <span>
              Lugares disponíveis
            </span>
            <strong>
              {Math.max(
                0,
                totalCapacity -
                  occupiedSeats,
              )}
            </strong>
          </article>

          <article>
            <span>
              Confirmados
            </span>
            <strong>
              {confirmedGuests}
            </strong>
          </article>

          <article>
            <span>
              Confirmados sem mesa
            </span>
            <strong>
              {unassignedConfirmed}
            </strong>
          </article>
        </div>
      </header>

      <section
        className={
          styles.workspace
        }
      >
        <div
          className={
            styles.mainPanel
          }
        >
          <header
            className={
              styles.toolbar
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

              <h2>
                Distribuição das mesas
              </h2>
            </div>

            <div
              className={
                styles.viewSwitch
              }
            >
              <button
                type="button"
                className={
                  viewMode === "map"
                    ? styles.activeView
                    : ""
                }
                onClick={() =>
                  setViewMode(
                    "map",
                  )
                }
              >
                Vista superior
              </button>

              <button
                type="button"
                className={
                  viewMode === "list"
                    ? styles.activeView
                    : ""
                }
                onClick={() =>
                  setViewMode(
                    "list",
                  )
                }
              >
                Lista
              </button>
            </div>
          </header>

          {tables.length === 0 ? (
            <div
              className={
                styles.emptyState
              }
            >
              <span aria-hidden="true">
                ◯
              </span>

              <strong>
                Nenhuma mesa criada
              </strong>

              <p>
                Crie a primeira mesa
                para começar a organizar
                o salão.
              </p>

              <button
                type="button"
                onClick={
                  openCreateModal
                }
              >
                Criar primeira mesa
              </button>
            </div>
          ) : viewMode === "map" ? (
            <div
              ref={floorRef}
              className={
                styles.floor
              }
              onDragOver={(event) =>
                event.preventDefault()
              }
              onDrop={dropTable}
            >
              <div
                className={
                  styles.stage
                }
              >
                Palco / cerimônia
              </div>

              {tables.map(
                (table) => {
                  const tableGuests =
                    guests.filter(
                      (guest) =>
                        guest.tableId ===
                        table.id,
                    );

                  const isSelected =
                    table.id ===
                    selectedTableId;

                  return (
                    <button
                      key={table.id}
                      type="button"
                      draggable
                      className={`${styles.floorTable} ${
                        styles[
                          `shape-${table.shape}`
                        ]
                      } ${
                        isSelected
                          ? styles.selectedFloorTable
                          : ""
                      } ${
                        draggingTableId ===
                        table.id
                          ? styles.draggingTable
                          : ""
                      }`}
                      style={{
                        left:
                          `${table.positionX}%`,
                        top:
                          `${table.positionY}%`,
                        transform:
                          `translate(-50%, -50%) rotate(${table.rotation}deg)`,
                      }}
                      onClick={() =>
                        setSelectedTableId(
                          table.id,
                        )
                      }
                      onDragStart={(
                        event,
                      ) =>
                        startDragging(
                          event,
                          table.id,
                        )
                      }
                      onDragEnd={() =>
                        setDraggingTableId(
                          null,
                        )
                      }
                    >
                      <span>
                        {table.name}
                      </span>

                      <strong>
                        {
                          tableGuests.length
                        }
                        /
                        {table.capacity}
                      </strong>

                      <small>
                        Arraste para mover
                      </small>
                    </button>
                  );
                },
              )}
            </div>
          ) : (
            <div
              className={
                styles.tableList
              }
            >
              {tables.map(
                (table) => {
                  const tableGuests =
                    guests.filter(
                      (guest) =>
                        guest.tableId ===
                        table.id,
                    );

                  return (
                    <article
                      key={table.id}
                      className={`${styles.tableListCard} ${
                        table.id ===
                        selectedTableId
                          ? styles.selectedListCard
                          : ""
                      }`}
                      onClick={() =>
                        setSelectedTableId(
                          table.id,
                        )
                      }
                    >
                      <div
                        className={`${styles.tableIcon} ${
                          styles[
                            `shape-${table.shape}`
                          ]
                        }`}
                      />

                      <div>
                        <strong>
                          {table.name}
                        </strong>

                        <span>
                          {
                            shapeLabels[
                              table.shape
                            ]
                          }
                          {" · "}
                          {
                            tableGuests.length
                          }
                          /
                          {table.capacity}
                          {" lugares"}
                        </span>
                      </div>

                      <progress
                        max={
                          table.capacity
                        }
                        value={
                          tableGuests.length
                        }
                      />

                      <button
                        type="button"
                        onClick={(
                          event,
                        ) => {
                          event.stopPropagation();
                          openEditModal(
                            table,
                          );
                        }}
                      >
                        Editar
                      </button>
                    </article>
                  );
                },
              )}
            </div>
          )}
        </div>

        <aside
          className={
            styles.detailsPanel
          }
        >
          {selectedTable ? (
            <>
              <header
                className={
                  styles.detailsHeader
                }
              >
                <div>
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

                  <p>
                    {
                      shapeLabels[
                        selectedTable.shape
                      ]
                    }
                    {" · "}
                    {
                      assignedGuests.length
                    }
                    /
                    {
                      selectedTable.capacity
                    }
                    {" lugares"}
                  </p>
                </div>

                <div
                  className={
                    styles.tableActions
                  }
                >
                  <button
                    type="button"
                    onClick={() =>
                      openEditModal(
                        selectedTable,
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
                    disabled={
                      activeTableId ===
                      selectedTable.id
                    }
                    onClick={() =>
                      deleteTable(
                        selectedTable,
                      )
                    }
                  >
                    Excluir
                  </button>
                </div>
              </header>

              <div
                className={
                  styles.capacityBar
                }
              >
                <span
                  style={{
                    width:
                      `${Math.min(
                        100,
                        (
                          assignedGuests.length /
                          selectedTable.capacity
                        ) * 100,
                      )}%`,
                  }}
                />
              </div>

              <section
                className={
                  styles.assignSection
                }
              >
                <label>
                  <span>
                    Adicionar convidado
                  </span>

                  <div>
                    <select
                      value={
                        selectedGuestId
                      }
                      onChange={(event) =>
                        setSelectedGuestId(
                          event.target
                            .value,
                        )
                      }
                    >
                      <option value="">
                        Selecione uma pessoa
                      </option>

                      {unassignedGuests.map(
                        (guest) => (
                          <option
                            key={
                              guest.id
                            }
                            value={
                              guest.id
                            }
                          >
                            {
                              guest.name
                            }
                            {" — "}
                            {
                              guest.groupName
                            }
                          </option>
                        ),
                      )}
                    </select>

                    <button
                      type="button"
                      disabled={
                        !selectedGuestId ||
                        Boolean(
                          activeGuestId,
                        ) ||
                        assignedGuests.length >=
                          selectedTable.capacity
                      }
                      onClick={() =>
                        assignGuest()
                      }
                    >
                      Adicionar
                    </button>
                  </div>
                </label>
              </section>

              <section
                className={
                  styles.assignedSection
                }
              >
                <header>
                  <span
                    className={
                      styles.eyebrow
                    }
                  >
                    Lugares ocupados
                  </span>

                  <strong>
                    {
                      assignedGuests.length
                    }
                    {" convidados"}
                  </strong>
                </header>

                {assignedGuests.length >
                0 ? (
                  <div
                    className={
                      styles.assignedList
                    }
                  >
                    {assignedGuests.map(
                      (guest) => (
                        <div
                          key={
                            guest.id
                          }
                          className={
                            styles.guestRow
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
                              {guest.name}
                            </strong>

                            <span>
                              {
                                guest.groupName
                              }
                              {" · "}
                              {
                                sideLabels[
                                  guest.side
                                ]
                              }
                            </span>
                          </div>

                          <span
                            className={`${styles.confirmationBadge} ${
                              styles[
                                `confirmation-${guest.confirmation}`
                              ]
                            }`}
                          >
                            {
                              confirmationLabels[
                                guest.confirmation
                              ]
                            }
                          </span>

                          <button
                            type="button"
                            aria-label={`Remover ${guest.name} da mesa`}
                            disabled={
                              activeGuestId ===
                              guest.id
                            }
                            onClick={() =>
                              unassignGuest(
                                guest.id,
                              )
                            }
                          >
                            ×
                          </button>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <div
                    className={
                      styles.emptyAssigned
                    }
                  >
                    Nenhum convidado
                    nesta mesa.
                  </div>
                )}
              </section>

              {selectedTable.notes && (
                <div
                  className={
                    styles.notes
                  }
                >
                  <strong>
                    Observações
                  </strong>

                  <p>
                    {
                      selectedTable.notes
                    }
                  </p>
                </div>
              )}
            </>
          ) : (
            <div
              className={
                styles.noSelection
              }
            >
              <strong>
                Selecione uma mesa
              </strong>

              <p>
                Os convidados e as
                ações da mesa aparecerão
                aqui.
              </p>
            </div>
          )}

          <section
            className={
              styles.unassignedSection
            }
          >
            <header>
              <div>
                <span
                  className={
                    styles.eyebrow
                  }
                >
                  Sem mesa
                </span>

                <strong>
                  {
                    unassignedGuests.length
                  }
                  {" pessoas"}
                </strong>
              </div>

              <input
                type="search"
                value={search}
                placeholder="Buscar..."
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
              />
            </header>

            <div
              className={
                styles.unassignedList
              }
            >
              {unassignedGuests
                .slice(0, 20)
                .map(
                  (guest) => (
                    <button
                      key={
                        guest.id
                      }
                      type="button"
                      disabled={
                        !selectedTable ||
                        assignedGuests.length >=
                          selectedTable.capacity ||
                        Boolean(
                          activeGuestId,
                        )
                      }
                      onClick={() =>
                        assignGuest(
                          guest.id,
                        )
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

                      <span>
                        <strong>
                          {guest.name}
                        </strong>

                        <small>
                          {
                            guest.groupName
                          }
                        </small>
                      </span>

                      <i
                        aria-hidden="true"
                      >
                        +
                      </i>
                    </button>
                  ),
                )}
            </div>
          </section>
        </aside>
      </section>

      {mounted &&
        modal &&
        createPortal(
          modal,
          document.body,
        )}
    </div>
  );
}
