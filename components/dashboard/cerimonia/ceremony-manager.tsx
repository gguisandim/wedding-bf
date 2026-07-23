"use client";

import {
  type DragEvent,
  type FormEvent,
  useMemo,
  useState,
} from "react";

import styles from "./ceremony-manager.module.css";

export type CeremonyBlockType =
  | "reception"
  | "entrance"
  | "music"
  | "speech"
  | "ritual"
  | "vows"
  | "signing"
  | "exit"
  | "other";

export type CeremonyBlockStatus =
  | "planned"
  | "confirmed"
  | "attention";

export type CeremonyBlock = {
  id: string;
  time: string;
  durationMinutes: number;

  title: string;
  description: string;

  responsible: string;
  participants: string;
  instructions: string;

  type: CeremonyBlockType;
  status: CeremonyBlockStatus;
};

type CeremonyManagerProps = {
  initialBlocks: CeremonyBlock[];
};

type BlockFormState = {
  id: string | null;
  time: string;
  durationMinutes: string;

  title: string;
  description: string;

  responsible: string;
  participants: string;
  instructions: string;

  type: CeremonyBlockType;
  status: CeremonyBlockStatus;
};

const emptyForm: BlockFormState = {
  id: null,
  time: "17:00",
  durationMinutes: "10",

  title: "",
  description: "",

  responsible: "",
  participants: "",
  instructions: "",

  type: "other",
  status: "planned",
};

const typeLabels: Record<
  CeremonyBlockType,
  string
> = {
  reception: "Recepção",
  entrance: "Entrada",
  music: "Música",
  speech: "Fala",
  ritual: "Ritual",
  vows: "Votos",
  signing: "Assinatura",
  exit: "Saída",
  other: "Outro",
};

const typeSymbols: Record<
  CeremonyBlockType,
  string
> = {
  reception: "◇",
  entrance: "→",
  music: "♫",
  speech: "“”",
  ritual: "✦",
  vows: "♡",
  signing: "✎",
  exit: "↗",
  other: "○",
};

const typeClasses: Record<
  CeremonyBlockType,
  string
> = {
  reception: styles.typeReception,
  entrance: styles.typeEntrance,
  music: styles.typeMusic,
  speech: styles.typeSpeech,
  ritual: styles.typeRitual,
  vows: styles.typeVows,
  signing: styles.typeSigning,
  exit: styles.typeExit,
  other: styles.typeOther,
};

const statusLabels: Record<
  CeremonyBlockStatus,
  string
> = {
  planned: "Planejado",
  confirmed: "Confirmado",
  attention: "Precisa de atenção",
};

const statusClasses: Record<
  CeremonyBlockStatus,
  string
> = {
  planned: styles.statusPlanned,
  confirmed: styles.statusConfirmed,
  attention: styles.statusAttention,
};

function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}min`;
}

function addMinutesToTime(
  time: string,
  minutes: number,
) {
  const [hours, currentMinutes] = time
    .split(":")
    .map(Number);

  const totalMinutes =
    hours * 60 +
    currentMinutes +
    minutes;

  const normalizedHours =
    Math.floor(totalMinutes / 60) % 24;

  const normalizedMinutes =
    totalMinutes % 60;

  return `${String(
    normalizedHours,
  ).padStart(2, "0")}:${String(
    normalizedMinutes,
  ).padStart(2, "0")}`;
}

export default function CeremonyManager({
  initialBlocks,
}: CeremonyManagerProps) {
  const [blocks, setBlocks] =
    useState<CeremonyBlock[]>(
      initialBlocks,
    );

  const [form, setForm] =
    useState<BlockFormState>(
      emptyForm,
    );

  const [
    isModalOpen,
    setIsModalOpen,
  ] = useState(false);

  const [formError, setFormError] =
    useState("");

  const [feedback, setFeedback] =
    useState<string | null>(null);

  const [draggingId, setDraggingId] =
    useState<string | null>(null);

  const [dragOverId, setDragOverId] =
    useState<string | null>(null);

  const totalDuration = useMemo(
    () =>
      blocks.reduce(
        (total, block) =>
          total +
          block.durationMinutes,
        0,
      ),
    [blocks],
  );

  const confirmedCount = blocks.filter(
    (block) =>
      block.status === "confirmed",
  ).length;

  const attentionCount = blocks.filter(
    (block) =>
      block.status === "attention",
  ).length;

  const unassignedCount = blocks.filter(
    (block) =>
      !block.responsible.trim(),
  ).length;

  function showFeedback(
    message: string,
  ) {
    setFeedback(message);

    window.setTimeout(() => {
      setFeedback(null);
    }, 2600);
  }

  function openCreateModal() {
    const lastBlock =
      blocks[blocks.length - 1];

    const suggestedTime = lastBlock
      ? addMinutesToTime(
          lastBlock.time,
          lastBlock.durationMinutes,
        )
      : "17:00";

    setForm({
      ...emptyForm,
      time: suggestedTime,
    });

    setFormError("");
    setIsModalOpen(true);
  }

  function openEditModal(
    block: CeremonyBlock,
  ) {
    setForm({
      id: block.id,
      time: block.time,

      durationMinutes: String(
        block.durationMinutes,
      ),

      title: block.title,
      description: block.description,

      responsible: block.responsible,
      participants: block.participants,
      instructions: block.instructions,

      type: block.type,
      status: block.status,
    });

    setFormError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setForm(emptyForm);
    setFormError("");
    setIsModalOpen(false);
  }

  function saveBlock(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const title = form.title.trim();

    const durationMinutes = Number(
      form.durationMinutes,
    );

    if (!title) {
      setFormError(
        "Informe o nome deste momento da cerimônia.",
      );

      return;
    }

    if (!form.time) {
      setFormError(
        "Informe o horário previsto.",
      );

      return;
    }

    if (
      !Number.isInteger(
        durationMinutes,
      ) ||
      durationMinutes < 1 ||
      durationMinutes > 240
    ) {
      setFormError(
        "A duração deve estar entre 1 e 240 minutos.",
      );

      return;
    }

    const normalizedBlock: CeremonyBlock =
      {
        id:
          form.id ||
          `ceremony-${Date.now()}`,

        time: form.time,
        durationMinutes,

        title,
        description:
          form.description.trim(),

        responsible:
          form.responsible.trim(),

        participants:
          form.participants.trim(),

        instructions:
          form.instructions.trim(),

        type: form.type,
        status: form.status,
      };

    if (form.id) {
      setBlocks((currentBlocks) =>
        currentBlocks.map((block) =>
          block.id === form.id
            ? normalizedBlock
            : block,
        ),
      );

      showFeedback(
        "Bloco da cerimônia atualizado.",
      );
    } else {
      setBlocks((currentBlocks) => [
        ...currentBlocks,
        normalizedBlock,
      ]);

      showFeedback(
        "Novo bloco adicionado à cerimônia.",
      );
    }

    closeModal();
  }

  function deleteBlock(
    block: CeremonyBlock,
  ) {
    const confirmed =
      window.confirm(
        `Excluir o bloco "${block.title}"?`,
      );

    if (!confirmed) {
      return;
    }

    setBlocks((currentBlocks) =>
      currentBlocks.filter(
        (item) =>
          item.id !== block.id,
      ),
    );

    showFeedback(
      "Bloco excluído.",
    );
  }

  function duplicateBlock(
    block: CeremonyBlock,
  ) {
    setBlocks((currentBlocks) => {
      const currentIndex =
        currentBlocks.findIndex(
          (item) =>
            item.id === block.id,
        );

      const duplicatedBlock: CeremonyBlock =
        {
          ...block,

          id: `ceremony-${Date.now()}`,
          title: `${block.title} — cópia`,

          time: addMinutesToTime(
            block.time,
            block.durationMinutes,
          ),

          status: "planned",
        };

      const nextBlocks = [
        ...currentBlocks,
      ];

      nextBlocks.splice(
        currentIndex + 1,
        0,
        duplicatedBlock,
      );

      return nextBlocks;
    });

    showFeedback(
      "Bloco duplicado.",
    );
  }

  function moveBlock(
    sourceId: string,
    targetId: string,
  ) {
    if (sourceId === targetId) {
      return;
    }

    setBlocks((currentBlocks) => {
      const sourceIndex =
        currentBlocks.findIndex(
          (block) =>
            block.id === sourceId,
        );

      const targetIndex =
        currentBlocks.findIndex(
          (block) =>
            block.id === targetId,
        );

      if (
        sourceIndex < 0 ||
        targetIndex < 0
      ) {
        return currentBlocks;
      }

      const nextBlocks = [
        ...currentBlocks,
      ];

      const [movedBlock] =
        nextBlocks.splice(
          sourceIndex,
          1,
        );

      nextBlocks.splice(
        targetIndex,
        0,
        movedBlock,
      );

      return nextBlocks;
    });
  }

  function moveBlockByDirection(
    blockId: string,
    direction: -1 | 1,
  ) {
    setBlocks((currentBlocks) => {
      const currentIndex =
        currentBlocks.findIndex(
          (block) =>
            block.id === blockId,
        );

      const targetIndex =
        currentIndex + direction;

      if (
        currentIndex < 0 ||
        targetIndex < 0 ||
        targetIndex >=
          currentBlocks.length
      ) {
        return currentBlocks;
      }

      const nextBlocks = [
        ...currentBlocks,
      ];

      const [movedBlock] =
        nextBlocks.splice(
          currentIndex,
          1,
        );

      nextBlocks.splice(
        targetIndex,
        0,
        movedBlock,
      );

      return nextBlocks;
    });
  }

  function handleDragStart(
    event: DragEvent<HTMLButtonElement>,
    blockId: string,
  ) {
    event.dataTransfer.effectAllowed =
      "move";

    event.dataTransfer.setData(
      "text/plain",
      blockId,
    );

    setDraggingId(blockId);
  }

  function handleDrop(
    event: DragEvent<HTMLElement>,
    targetId: string,
  ) {
    event.preventDefault();

    const sourceId =
      draggingId ||
      event.dataTransfer.getData(
        "text/plain",
      );

    if (sourceId) {
      moveBlock(sourceId, targetId);
      showFeedback(
        "Ordem da cerimônia atualizada.",
      );
    }

    setDraggingId(null);
    setDragOverId(null);
  }

  function finishDragging() {
    setDraggingId(null);
    setDragOverId(null);
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
          <span
            className={styles.eyebrow}
          >
            Serviços e planejamento
          </span>

          <h1>Cerimônia</h1>

          <p>
            Organize cada momento da
            cerimônia, defina quem será
            responsável e altere a ordem
            arrastando os blocos.
          </p>
        </div>

        <button
          type="button"
          className={
            styles.primaryButton
          }
          onClick={openCreateModal}
        >
          <span aria-hidden="true">
            +
          </span>

          Novo momento
        </button>

        <div
          className={styles.summaryGrid}
        >
          <article
            className={styles.summaryCard}
          >
            <span
              className={`${styles.summaryIcon} ${styles.momentsIcon}`}
              aria-hidden="true"
            >
              ◫
            </span>

            <div>
              <strong>
                {blocks.length}
              </strong>

              <span>
                Momentos planejados
              </span>
            </div>
          </article>

          <article
            className={styles.summaryCard}
          >
            <span
              className={`${styles.summaryIcon} ${styles.durationIcon}`}
              aria-hidden="true"
            >
              ◷
            </span>

            <div>
              <strong>
                {formatDuration(
                  totalDuration,
                )}
              </strong>

              <span>
                Duração estimada
              </span>
            </div>
          </article>

          <article
            className={styles.summaryCard}
          >
            <span
              className={`${styles.summaryIcon} ${styles.confirmedIcon}`}
              aria-hidden="true"
            >
              ✓
            </span>

            <div>
              <strong>
                {confirmedCount}
              </strong>

              <span>Confirmados</span>
            </div>
          </article>

          <article
            className={styles.summaryCard}
          >
            <span
              className={`${styles.summaryIcon} ${styles.attentionIcon}`}
              aria-hidden="true"
            >
              !
            </span>

            <div>
              <strong>
                {attentionCount +
                  unassignedCount}
              </strong>

              <span>
                Pendências encontradas
              </span>
            </div>
          </article>
        </div>
      </header>

      <section
        className={styles.timelineSection}
      >
        <header
          className={styles.sectionHeader}
        >
          <div>
            <span
              className={styles.eyebrow}
            >
              Ordem da cerimônia
            </span>

            <h2>Linha do tempo</h2>

            <p>
              Arraste pelo botão de pontos
              para alterar a ordem dos
              momentos.
            </p>
          </div>

          <div className={styles.legend}>
            <span>
              <i
                className={
                  styles.confirmedDot
                }
              />
              Confirmado
            </span>

            <span>
              <i
                className={
                  styles.plannedDot
                }
              />
              Planejado
            </span>

            <span>
              <i
                className={
                  styles.attentionDot
                }
              />
              Atenção
            </span>
          </div>
        </header>

        {blocks.length > 0 ? (
          <div
            className={styles.timeline}
          >
            {blocks.map(
              (block, index) => (
                <article
                  key={block.id}
                  className={`${styles.timelineBlock} ${
                    typeClasses[
                      block.type
                    ]
                  } ${
                    draggingId === block.id
                      ? styles.draggingBlock
                      : ""
                  } ${
                    dragOverId === block.id &&
                    draggingId !== block.id
                      ? styles.dragOverBlock
                      : ""
                  }`}
                  onDragOver={(event) => {
                    event.preventDefault();

                    event.dataTransfer.dropEffect =
                      "move";

                    setDragOverId(
                      block.id,
                    );
                  }}
                  onDrop={(event) =>
                    handleDrop(
                      event,
                      block.id,
                    )
                  }
                >
                  <div
                    className={
                      styles.timelineRail
                    }
                  >
                    <span
                      className={
                        styles.sequenceNumber
                      }
                    >
                      {String(
                        index + 1,
                      ).padStart(2, "0")}
                    </span>

                    <button
                      type="button"
                      draggable
                      className={
                        styles.dragHandle
                      }
                      title="Arrastar bloco"
                      aria-label={`Arrastar ${block.title}`}
                      onDragStart={(
                        event,
                      ) =>
                        handleDragStart(
                          event,
                          block.id,
                        )
                      }
                      onDragEnd={
                        finishDragging
                      }
                    >
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                    </button>
                  </div>

                  <div
                    className={
                      styles.blockContent
                    }
                  >
                    <header
                      className={
                        styles.blockHeader
                      }
                    >
                      <div
                        className={
                          styles.blockTime
                        }
                      >
                        <strong>
                          {block.time}
                        </strong>

                        <span>
                          {formatDuration(
                            block.durationMinutes,
                          )}
                        </span>
                      </div>

                      <span
                        className={
                          styles.typeBadge
                        }
                      >
                        <i
                          aria-hidden="true"
                        >
                          {
                            typeSymbols[
                              block.type
                            ]
                          }
                        </i>

                        {
                          typeLabels[
                            block.type
                          ]
                        }
                      </span>

                      <span
                        className={`${styles.statusBadge} ${
                          statusClasses[
                            block.status
                          ]
                        }`}
                      >
                        <i />

                        {
                          statusLabels[
                            block.status
                          ]
                        }
                      </span>
                    </header>

                    <div
                      className={
                        styles.blockMain
                      }
                    >
                      <div
                        className={
                          styles.blockDescription
                        }
                      >
                        <h3>
                          {block.title}
                        </h3>

                        <p>
                          {block.description ||
                            "Nenhuma descrição informada."}
                        </p>
                      </div>

                      <div
                        className={
                          styles.assignmentGrid
                        }
                      >
                        <div>
                          <span>
                            Responsável
                          </span>

                          <strong
                            className={
                              !block.responsible
                                ? styles.missingValue
                                : ""
                            }
                          >
                            {block.responsible ||
                              "Não definido"}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Quem participa
                          </span>

                          <strong>
                            {block.participants ||
                              "Não informado"}
                          </strong>
                        </div>
                      </div>

                      {block.instructions && (
                        <div
                          className={
                            styles.instructions
                          }
                        >
                          <span
                            aria-hidden="true"
                          >
                            i
                          </span>

                          <div>
                            <strong>
                              Orientações
                            </strong>

                            <p>
                              {
                                block.instructions
                              }
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <footer
                      className={
                        styles.blockActions
                      }
                    >
                      <div
                        className={
                          styles.positionActions
                        }
                      >
                        <button
                          type="button"
                          disabled={
                            index === 0
                          }
                          aria-label="Mover bloco para cima"
                          onClick={() =>
                            moveBlockByDirection(
                              block.id,
                              -1,
                            )
                          }
                        >
                          ↑
                        </button>

                        <button
                          type="button"
                          disabled={
                            index ===
                            blocks.length - 1
                          }
                          aria-label="Mover bloco para baixo"
                          onClick={() =>
                            moveBlockByDirection(
                              block.id,
                              1,
                            )
                          }
                        >
                          ↓
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          openEditModal(
                            block,
                          )
                        }
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          duplicateBlock(
                            block,
                          )
                        }
                      >
                        Duplicar
                      </button>

                      <button
                        type="button"
                        className={
                          styles.deleteButton
                        }
                        onClick={() =>
                          deleteBlock(
                            block,
                          )
                        }
                      >
                        Excluir
                      </button>
                    </footer>
                  </div>
                </article>
              ),
            )}
          </div>
        ) : (
          <div
            className={styles.emptyState}
          >
            <span aria-hidden="true">
              ♡
            </span>

            <strong>
              A cerimônia ainda está vazia
            </strong>

            <p>
              Adicione entradas, músicas,
              votos, falas e outros momentos.
            </p>

            <button
              type="button"
              onClick={openCreateModal}
            >
              Criar primeiro momento
            </button>
          </div>
        )}
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
              closeModal();
            }
          }}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ceremony-modal-title"
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
                  Linha do tempo
                </span>

                <h2 id="ceremony-modal-title">
                  {form.id
                    ? "Editar momento"
                    : "Novo momento"}
                </h2>
              </div>

              <button
                type="button"
                className={
                  styles.closeButton
                }
                aria-label="Fechar"
                onClick={closeModal}
              >
                ×
              </button>
            </header>

            <form
              className={styles.form}
              onSubmit={saveBlock}
            >
              <div
                className={styles.formGrid}
              >
                <label
                  className={
                    styles.fullField
                  }
                >
                  <span>
                    Nome do momento
                  </span>

                  <input
                    type="text"
                    value={form.title}
                    placeholder="Ex.: Entrada da noiva"
                    autoFocus
                    onChange={(event) =>
                      setForm(
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
                  <span>
                    Horário previsto
                  </span>

                  <input
                    type="time"
                    value={form.time}
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          time:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Duração em minutos
                  </span>

                  <input
                    type="number"
                    min={1}
                    max={240}
                    value={
                      form.durationMinutes
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          durationMinutes:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Tipo de momento
                  </span>

                  <select
                    value={form.type}
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          type: event.target
                            .value as CeremonyBlockType,
                        }),
                      )
                    }
                  >
                    {Object.entries(
                      typeLabels,
                    ).map(
                      ([value, label]) => (
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
                  <span>Situação</span>

                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          status:
                            event.target
                              .value as CeremonyBlockStatus,
                        }),
                      )
                    }
                  >
                    <option value="planned">
                      Planejado
                    </option>

                    <option value="confirmed">
                      Confirmado
                    </option>

                    <option value="attention">
                      Precisa de atenção
                    </option>
                  </select>
                </label>

                <label>
                  <span>Responsável</span>

                  <input
                    type="text"
                    value={
                      form.responsible
                    }
                    placeholder="Ex.: Cerimonialista Ana"
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          responsible:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Quem participa
                  </span>

                  <input
                    type="text"
                    value={
                      form.participants
                    }
                    placeholder="Ex.: Noiva e pai da noiva"
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          participants:
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
                  <span>Descrição</span>

                  <textarea
                    value={
                      form.description
                    }
                    placeholder="Descreva o que acontecerá neste momento..."
                    onChange={(event) =>
                      setForm(
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

                <label
                  className={
                    styles.fullField
                  }
                >
                  <span>
                    Orientações e detalhes
                  </span>

                  <textarea
                    value={
                      form.instructions
                    }
                    placeholder="Ex.: A música deve começar quando a porta for aberta."
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          instructions:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />
                </label>
              </div>

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
                  onClick={closeModal}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className={
                    styles.saveButton
                  }
                >
                  {form.id
                    ? "Salvar alterações"
                    : "Adicionar momento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}