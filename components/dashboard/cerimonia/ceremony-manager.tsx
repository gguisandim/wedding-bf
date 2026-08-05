"use client";

import {
  type DragEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import {
  createCeremonyBlockAction,
  createCeremonyChecklistItemAction,
  deleteCeremonyBlockAction,
  deleteCeremonyChecklistItemAction,
  duplicateCeremonyBlockAction,
  initializeCeremonyAction,
  reorderCeremonyBlocksAction,
  toggleCeremonyChecklistItemAction,
  updateCeremonyBlockAction,
  updateCeremonyChecklistItemAction,
} from "@/lib/actions/ceremony";

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

export type CeremonyBlockStatus = "planned" | "confirmed" | "attention";

export type CeremonyChecklistItem = {
  id: string;
  blockId: string;
  title: string;
  status: "pending" | "progress" | "completed";
  priority: "normal" | "medium" | "high";
  responsibleType: "bride" | "groom" | "couple" | "planner" | "other";
  responsibleName?: string;
  dueDate?: string;
  sortOrder: number;
};

export type CeremonyBlock = {
  id: string;
  time: string;
  durationMinutes: number;
  title: string;
  description?: string;
  responsible?: string;
  participants?: string;
  instructions?: string;
  type: CeremonyBlockType;
  status: CeremonyBlockStatus;
  sortOrder: number;
  checklist: CeremonyChecklistItem[];
};

type Props = {
  initialBlocks: CeremonyBlock[];
  brideName: string;
  groomName: string;
};

type BlockForm = {
  id?: string;
  startTime: string;
  durationMinutes: string;
  title: string;
  description: string;
  responsible: string;
  participants: string;
  instructions: string;
  type: CeremonyBlockType;
  status: CeremonyBlockStatus;
};

type ChecklistForm = {
  id?: string;
  blockId: string;
  title: string;
  dueDate: string;
  priority: CeremonyChecklistItem["priority"];
  responsibleType: CeremonyChecklistItem["responsibleType"];
  responsibleName: string;
};

const typeLabels: Record<CeremonyBlockType, string> = {
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

const typeSymbols: Record<CeremonyBlockType, string> = {
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

const statusLabels: Record<CeremonyBlockStatus, string> = {
  planned: "Planejado",
  confirmed: "Confirmado",
  attention: "Precisa de atenção",
};

const priorityLabels: Record<CeremonyChecklistItem["priority"], string> = {
  normal: "Normal",
  medium: "Média",
  high: "Alta",
};

function emptyBlockForm(startTime = "17:00"): BlockForm {
  return {
    startTime,
    durationMinutes: "10",
    title: "",
    description: "",
    responsible: "",
    participants: "",
    instructions: "",
    type: "other",
    status: "planned",
  };
}

function emptyChecklistForm(blockId: string): ChecklistForm {
  return {
    blockId,
    title: "",
    dueDate: "",
    priority: "medium",
    responsibleType: "planner",
    responsibleName: "",
  };
}

function addMinutes(time: string, minutes: number) {
  const [hours, currentMinutes] = time.split(":").map(Number);
  const total = ((hours * 60 + currentMinutes + minutes) % 1440 + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(
    total % 60,
  ).padStart(2, "0")}`;
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}min` : `${hours}h`;
}

function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(parseDateOnly(value))
    .replace(".", "");
}

function progressOf(items: CeremonyChecklistItem[]) {
  const completed = items.filter((item) => item.status === "completed").length;
  return {
    completed,
    pending: items.length - completed,
    percentage: items.length ? Math.round((completed / items.length) * 100) : 0,
  };
}

function responsibleLabel(
  item: CeremonyChecklistItem,
  brideName: string,
  groomName: string,
) {
  const labels: Record<CeremonyChecklistItem["responsibleType"], string> = {
    bride: brideName,
    groom: groomName,
    couple: `${brideName} e ${groomName}`,
    planner: "Cerimonialista",
    other: item.responsibleName || "Outra pessoa",
  };
  return labels[item.responsibleType];
}

export default function CeremonyManager({
  initialBlocks,
  brideName,
  groomName,
}: Props) {
  const router = useRouter();
  const [blocks, setBlocks] = useState(initialBlocks);
  const [blockForm, setBlockForm] = useState<BlockForm>(emptyBlockForm());
  const [checklistForm, setChecklistForm] = useState<ChecklistForm>(
    emptyChecklistForm(""),
  );
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [expandedBlockIds, setExpandedBlockIds] = useState<Set<string>>(
    () => new Set(),
  );

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setBlocks(initialBlocks);

    const availableIds = new Set(
      initialBlocks.map((block) => block.id),
    );

    setExpandedBlockIds((current) => {
      const next = new Set(
        [...current].filter((id) => availableIds.has(id)),
      );

      return next;
    });
  }, [initialBlocks]);

  const totalDuration = useMemo(
    () => blocks.reduce((total, block) => total + block.durationMinutes, 0),
    [blocks],
  );
  const confirmedCount = blocks.filter((block) => block.status === "confirmed").length;
  const attentionCount = blocks.filter((block) => block.status === "attention").length;
  const pendingCount = blocks.reduce(
    (total, block) => total + progressOf(block.checklist).pending,
    0,
  );
  const endTime = blocks.length
    ? addMinutes(blocks[blocks.length - 1].time, blocks[blocks.length - 1].durationMinutes)
    : undefined;

  const formIndex = blockForm.id
    ? blocks.findIndex((block) => block.id === blockForm.id)
    : blocks.length;
  const canEditStartTime = blocks.length === 0 || formIndex === 0;

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 3200);
  }

  function toggleBlockDetails(blockId: string) {
    setExpandedBlockIds((current) => {
      const next = new Set(current);

      if (next.has(blockId)) {
        next.delete(blockId);
      } else {
        next.add(blockId);
      }

      return next;
    });
  }

  function nextTime() {
    const last = blocks[blocks.length - 1];
    return last ? addMinutes(last.time, last.durationMinutes) : "17:00";
  }

  function openNewBlock() {
    window.dispatchEvent(new Event("dashboard:collapse-sidebar"));
    setBlockForm(emptyBlockForm(nextTime()));
    setBlockModalOpen(true);
  }

  function openEditBlock(block: CeremonyBlock) {
    window.dispatchEvent(new Event("dashboard:collapse-sidebar"));
    setBlockForm({
      id: block.id,
      startTime: block.time,
      durationMinutes: String(block.durationMinutes),
      title: block.title,
      description: block.description ?? "",
      responsible: block.responsible ?? "",
      participants: block.participants ?? "",
      instructions: block.instructions ?? "",
      type: block.type,
      status: block.status,
    });
    setBlockModalOpen(true);
  }

  function openEditTask(item: CeremonyChecklistItem) {
    window.dispatchEvent(new Event("dashboard:collapse-sidebar"));
    setChecklistForm({
      id: item.id,
      blockId: item.blockId,
      title: item.title,
      dueDate: item.dueDate ?? "",
      priority: item.priority,
      responsibleType: item.responsibleType,
      responsibleName: item.responsibleName ?? "",
    });
    setChecklistModalOpen(true);
  }

  async function saveBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    const durationMinutes = Number(blockForm.durationMinutes);
    if (!Number.isInteger(durationMinutes)) {
      showFeedback("Informe uma duração válida.");
      return;
    }

    setIsSaving(true);
    try {
      const input = {
        startTime: blockForm.startTime,
        durationMinutes,
        title: blockForm.title.trim(),
        description: blockForm.description.trim(),
        responsible: blockForm.responsible.trim(),
        participants: blockForm.participants.trim(),
        instructions: blockForm.instructions.trim(),
        type: blockForm.type,
        status: blockForm.status,
      };

      const result = blockForm.id
        ? await updateCeremonyBlockAction({ id: blockForm.id, ...input })
        : await createCeremonyBlockAction(input);

      showFeedback(result.message);
      if (result.success) {
        setBlockModalOpen(false);
        router.refresh();
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving || !checklistForm.id) return;

    setIsSaving(true);
    try {
      const result = await updateCeremonyChecklistItemAction({
        id: checklistForm.id,
        blockId: checklistForm.blockId,
        title: checklistForm.title.trim(),
        dueDate: checklistForm.dueDate,
        priority: checklistForm.priority,
        responsibleType: checklistForm.responsibleType,
        responsibleName: checklistForm.responsibleName.trim(),
      });

      showFeedback(result.message);
      if (result.success) {
        setChecklistModalOpen(false);
        router.refresh();
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function addTask(blockId: string) {
    const title = drafts[blockId]?.trim();
    if (!title) return;

    const result = await createCeremonyChecklistItemAction({
      blockId,
      title,
      dueDate: "",
      priority: "medium",
      responsibleType: "planner",
      responsibleName: "",
    });

    showFeedback(result.message);
    if (result.success) {
      setDrafts((current) => ({ ...current, [blockId]: "" }));
      router.refresh();
    }
  }

  async function toggleTask(taskId: string) {
    const result = await toggleCeremonyChecklistItemAction(taskId);
    showFeedback(result.message);
    if (result.success) router.refresh();
  }

  async function removeTask(taskId: string) {
    if (!window.confirm("Excluir esta tarefa?")) return;
    const result = await deleteCeremonyChecklistItemAction(taskId);
    showFeedback(result.message);
    if (result.success) router.refresh();
  }

  async function initializeCeremony() {
    const result = await initializeCeremonyAction();
    showFeedback(result.message);
    if (result.success) router.refresh();
  }

  async function removeBlock(block: CeremonyBlock) {
    if (!window.confirm(`Excluir “${block.title}” e suas tarefas?`)) return;
    const result = await deleteCeremonyBlockAction(block.id);
    showFeedback(result.message);
    if (result.success) router.refresh();
  }

  async function duplicateBlock(blockId: string) {
    const result = await duplicateCeremonyBlockAction(blockId);
    showFeedback(result.message);
    if (result.success) router.refresh();
  }

  async function persistOrder(next: CeremonyBlock[], previous: CeremonyBlock[]) {
    setBlocks(next);
    const result = await reorderCeremonyBlocksAction({
      orderedIds: next.map((block) => block.id),
    });
    showFeedback(result.message);
    if (!result.success) {
      setBlocks(previous);
      return;
    }
    router.refresh();
  }

  async function moveBlock(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    const previous = [...blocks];
    const sourceIndex = previous.findIndex((block) => block.id === sourceId);
    const targetIndex = previous.findIndex((block) => block.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const next = [...previous];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    await persistOrder(next, previous);
  }

  async function moveDirection(blockId: string, direction: -1 | 1) {
    const previous = [...blocks];
    const index = previous.findIndex((block) => block.id === blockId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= previous.length) return;

    const next = [...previous];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    await persistOrder(next, previous);
  }

  function handleDragStart(event: DragEvent<HTMLButtonElement>, blockId: string) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", blockId);
    setDraggingId(blockId);
  }

  async function handleDrop(event: DragEvent<HTMLElement>, targetId: string) {
    event.preventDefault();
    const sourceId = draggingId || event.dataTransfer.getData("text/plain");
    setDraggingId(null);
    setDragOverId(null);
    if (sourceId) await moveBlock(sourceId, targetId);
  }

  const blockModal = blockModalOpen ? (
    <div
      className={styles.modalOverlay}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) {
          setBlockModalOpen(false);
        }
      }}
    >
      <section className={styles.modal} role="dialog" aria-modal="true">
        <header className={styles.modalHeader}>
          <div>
            <span>Momento da cerimônia</span>
            <h2>{blockForm.id ? "Editar momento" : "Novo momento"}</h2>
            <p>A ordem e a duração recalculam os horários seguintes.</p>
          </div>
          <button type="button" onClick={() => setBlockModalOpen(false)}>×</button>
        </header>

        <form className={styles.form} onSubmit={saveBlock}>
          <label className={styles.fullField}>
            <span>Nome do momento</span>
            <input
              required
              minLength={2}
              value={blockForm.title}
              placeholder="Ex.: Entrada da noiva"
              onChange={(event) =>
                setBlockForm((current) => ({ ...current, title: event.target.value }))
              }
            />
          </label>

          <label>
            <span>Horário inicial</span>
            <input
              required
              type="time"
              disabled={!canEditStartTime}
              value={blockForm.startTime}
              onChange={(event) =>
                setBlockForm((current) => ({
                  ...current,
                  startTime: event.target.value,
                }))
              }
            />
            {!canEditStartTime && <small>Calculado automaticamente.</small>}
          </label>

          <label>
            <span>Duração em minutos</span>
            <input
              required
              type="number"
              min={1}
              max={240}
              value={blockForm.durationMinutes}
              onChange={(event) =>
                setBlockForm((current) => ({
                  ...current,
                  durationMinutes: event.target.value,
                }))
              }
            />
          </label>

          <label>
            <span>Tipo</span>
            <select
              value={blockForm.type}
              onChange={(event) =>
                setBlockForm((current) => ({
                  ...current,
                  type: event.target.value as CeremonyBlockType,
                }))
              }
            >
              {(Object.entries(typeLabels) as Array<[CeremonyBlockType, string]>).map(
                ([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ),
              )}
            </select>
          </label>

          <label>
            <span>Situação</span>
            <select
              value={blockForm.status}
              onChange={(event) =>
                setBlockForm((current) => ({
                  ...current,
                  status: event.target.value as CeremonyBlockStatus,
                }))
              }
            >
              {(Object.entries(statusLabels) as Array<[
                CeremonyBlockStatus,
                string,
              ]>).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <label className={styles.fullField}>
            <span>Descrição</span>
            <textarea
              rows={3}
              value={blockForm.description}
              onChange={(event) =>
                setBlockForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </label>

          <label>
            <span>Responsável</span>
            <input
              value={blockForm.responsible}
              placeholder="Ex.: Cerimonialista"
              onChange={(event) =>
                setBlockForm((current) => ({
                  ...current,
                  responsible: event.target.value,
                }))
              }
            />
          </label>

          <label>
            <span>Participantes</span>
            <input
              value={blockForm.participants}
              placeholder="Ex.: Casal e padrinhos"
              onChange={(event) =>
                setBlockForm((current) => ({
                  ...current,
                  participants: event.target.value,
                }))
              }
            />
          </label>

          <label className={styles.fullField}>
            <span>Orientações</span>
            <textarea
              rows={4}
              value={blockForm.instructions}
              onChange={(event) =>
                setBlockForm((current) => ({
                  ...current,
                  instructions: event.target.value,
                }))
              }
            />
          </label>

          <div className={styles.modalActions}>
            <button type="button" onClick={() => setBlockModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar momento"}
            </button>
          </div>
        </form>
      </section>
    </div>
  ) : null;

  const taskModal = checklistModalOpen ? (
    <div
      className={styles.modalOverlay}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) {
          setChecklistModalOpen(false);
        }
      }}
    >
      <section className={`${styles.modal} ${styles.smallModal}`} role="dialog">
        <header className={styles.modalHeader}>
          <div>
            <span>Tarefa da cerimônia</span>
            <h2>Editar tarefa</h2>
            <p>Ela também aparece no checklist geral, sem duplicação.</p>
          </div>
          <button type="button" onClick={() => setChecklistModalOpen(false)}>×</button>
        </header>

        <form className={styles.form} onSubmit={saveTask}>
          <label className={styles.fullField}>
            <span>Tarefa</span>
            <input
              required
              minLength={2}
              value={checklistForm.title}
              onChange={(event) =>
                setChecklistForm((current) => ({ ...current, title: event.target.value }))
              }
            />
          </label>

          <label>
            <span>Prazo</span>
            <input
              type="date"
              value={checklistForm.dueDate}
              onChange={(event) =>
                setChecklistForm((current) => ({
                  ...current,
                  dueDate: event.target.value,
                }))
              }
            />
          </label>

          <label>
            <span>Prioridade</span>
            <select
              value={checklistForm.priority}
              onChange={(event) =>
                setChecklistForm((current) => ({
                  ...current,
                  priority: event.target.value as CeremonyChecklistItem["priority"],
                }))
              }
            >
              {(Object.entries(priorityLabels) as Array<[
                CeremonyChecklistItem["priority"],
                string,
              ]>).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Responsável</span>
            <select
              value={checklistForm.responsibleType}
              onChange={(event) =>
                setChecklistForm((current) => ({
                  ...current,
                  responsibleType:
                    event.target.value as CeremonyChecklistItem["responsibleType"],
                }))
              }
            >
              <option value="planner">Cerimonialista</option>
              <option value="couple">{brideName} e {groomName}</option>
              <option value="bride">{brideName}</option>
              <option value="groom">{groomName}</option>
              <option value="other">Outra pessoa</option>
            </select>
          </label>

          {checklistForm.responsibleType === "other" && (
            <label>
              <span>Nome do responsável</span>
              <input
                required
                value={checklistForm.responsibleName}
                onChange={(event) =>
                  setChecklistForm((current) => ({
                    ...current,
                    responsibleName: event.target.value,
                  }))
                }
              />
            </label>
          )}

          <div className={styles.modalActions}>
            <button type="button" onClick={() => setChecklistModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar tarefa"}
            </button>
          </div>
        </form>
      </section>
    </div>
  ) : null;

  return (
    <div className={styles.page}>
      {feedback && (
        <div className={styles.feedback} role="status">
          <span>✓</span>{feedback}
        </div>
      )}

      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Roteiro do grande dia</span>
          <h1>Cerimônia</h1>
          <p>
            Organize a ordem dos momentos, responsáveis, orientações e tarefas
            necessárias para a execução da cerimônia.
          </p>
          <div className={styles.heroActions}>
            <button type="button" className={styles.primaryButton} onClick={openNewBlock}>
              + Novo momento
            </button>
            {blocks.length === 0 && (
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={initializeCeremony}
              >
                Criar roteiro inicial
              </button>
            )}
          </div>
        </div>

        <div className={styles.heroSchedule}>
          <span>Previsão da cerimônia</span>
          <strong>
            {blocks.length ? `${blocks[0].time}–${endTime}` : "Ainda não definida"}
          </strong>
          <small>{formatDuration(totalDuration)} de duração estimada</small>
        </div>
      </header>

      <section className={styles.summaryGrid}>
        <article><span>Momentos</span><strong>{blocks.length}</strong><small>Blocos no roteiro</small></article>
        <article><span>Confirmados</span><strong>{confirmedCount}</strong><small>Momentos definidos</small></article>
        <article className={attentionCount ? styles.attentionSummary : ""}>
          <span>Precisam de atenção</span><strong>{attentionCount}</strong><small>Pontos para revisar</small>
        </article>
        <article className={pendingCount ? styles.pendingSummary : ""}>
          <span>Tarefas pendentes</span><strong>{pendingCount}</strong><small>Também no checklist geral</small>
        </article>
      </section>

      <section className={styles.timelinePanel}>
        <header className={styles.panelHeader}>
          <div>
            <span className={styles.eyebrow}>Ordem da cerimônia</span>
            <h2>Linha do tempo</h2>
            <p>Arraste os momentos ou use as setas. Os horários são recalculados.</p>
          </div>
          <div className={styles.legend}>
            <span><i className={styles.confirmedDot} />Confirmado</span>
            <span><i className={styles.plannedDot} />Planejado</span>
            <span><i className={styles.attentionDot} />Atenção</span>
          </div>
        </header>

        {blocks.length ? (
          <div className={styles.timeline}>
            {blocks.map((block, index) => {
              const progress = progressOf(block.checklist);
              const isExpanded = expandedBlockIds.has(block.id);

              return (
                <article
                  key={block.id}
                  className={`${styles.timelineBlock} ${styles[`type-${block.type}`]} ${
                    draggingId === block.id ? styles.draggingBlock : ""
                  } ${
                    dragOverId === block.id && draggingId !== block.id
                      ? styles.dragOverBlock
                      : ""
                  }`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOverId(block.id);
                  }}
                  onDrop={(event) => handleDrop(event, block.id)}
                >
                  <div className={styles.timelineRail}>
                    <span className={styles.sequenceNumber}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <button
                      type="button"
                      draggable
                      className={styles.dragHandle}
                      onDragStart={(event) => handleDragStart(event, block.id)}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDragOverId(null);
                      }}
                    >
                      <span /><span /><span /><span /><span /><span />
                    </button>
                  </div>

                  <div className={styles.blockContent}>
                    <button
                      type="button"
                      className={styles.blockToggle}
                      aria-expanded={isExpanded}
                      aria-controls={`ceremony-details-${block.id}`}
                      onClick={() => toggleBlockDetails(block.id)}
                    >
                      <div className={styles.blockTime}>
                        <strong>{block.time}</strong>
                        <span>{formatDuration(block.durationMinutes)}</span>
                      </div>

                      <div className={styles.compactIdentity}>
                        <div className={styles.compactTags}>
                          <span className={styles.typeBadge}>
                            <i>{typeSymbols[block.type]}</i>
                            {typeLabels[block.type]}
                          </span>

                          <span
                            className={`${styles.statusBadge} ${
                              styles[`status-${block.status}`]
                            }`}
                          >
                            <i />
                            {statusLabels[block.status]}
                          </span>
                        </div>

                        <h3>{block.title}</h3>

                        <p>
                          {block.description ||
                            "Nenhuma descrição informada."}
                        </p>
                      </div>

                      <div className={styles.compactMeta}>
                        <span>
                          <small>Responsável</small>
                          <strong>
                            {block.responsible || "Não definido"}
                          </strong>
                        </span>

                        <span>
                          <small>Checklist</small>
                          <strong>
                            {progress.completed}/{block.checklist.length}
                          </strong>
                        </span>
                      </div>

                      <span
                        className={`${styles.expandButton} ${
                          isExpanded ? styles.expandButtonOpen : ""
                        }`}
                        aria-hidden="true"
                      >
                        ⌄
                      </span>
                    </button>

                    {isExpanded && (
                      <div
                        id={`ceremony-details-${block.id}`}
                        className={styles.blockDetails}
                      >
                        <div className={styles.blockMain}>
                          <div className={styles.detailsIntro}>
                            <span>Detalhes do momento</span>

                            <p>
                              {block.description ||
                                "Nenhuma descrição informada."}
                            </p>
                          </div>

                          <div className={styles.assignmentGrid}>
                            <div>
                              <span>Responsável</span>
                              <strong>
                                {block.responsible || "Não definido"}
                              </strong>
                            </div>

                            <div>
                              <span>Participantes</span>
                              <strong>
                                {block.participants || "Não informado"}
                              </strong>
                            </div>
                          </div>

                          {block.instructions && (
                            <div className={styles.instructions}>
                              <span>i</span>

                              <div>
                                <strong>Orientações</strong>
                                <p>{block.instructions}</p>
                              </div>
                            </div>
                          )}

                          <section className={styles.checklistSection}>
                            <header className={styles.checklistHeader}>
                              <div>
                                <span>Preparação</span>
                                <strong>Checklist deste momento</strong>
                              </div>

                              <b>{progress.percentage}%</b>
                            </header>

                            <div className={styles.progressTrack}>
                              <span
                                style={{
                                  width: `${progress.percentage}%`,
                                }}
                              />
                            </div>

                            {block.checklist.length ? (
                              <div className={styles.checklistItems}>
                                {block.checklist.map((item) => (
                                  <article
                                    key={item.id}
                                    className={`${styles.checklistItem} ${
                                      item.status === "completed"
                                        ? styles.checklistItemCompleted
                                        : ""
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      className={styles.checklistToggle}
                                      aria-pressed={
                                        item.status === "completed"
                                      }
                                      onClick={() => toggleTask(item.id)}
                                    >
                                      {item.status === "completed" ? "✓" : ""}
                                    </button>

                                    <div className={styles.checklistIdentity}>
                                      <strong>{item.title}</strong>

                                      <span>
                                        {responsibleLabel(
                                          item,
                                          brideName,
                                          groomName,
                                        )}
                                        {item.dueDate
                                          ? ` · ${formatDate(item.dueDate)}`
                                          : ""}
                                      </span>
                                    </div>

                                    <span
                                      className={`${styles.priorityBadge} ${
                                        styles[`priority-${item.priority}`]
                                      }`}
                                    >
                                      {priorityLabels[item.priority]}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() => openEditTask(item)}
                                    >
                                      Editar
                                    </button>

                                    <button
                                      type="button"
                                      aria-label="Excluir tarefa"
                                      onClick={() => removeTask(item.id)}
                                    >
                                      ×
                                    </button>
                                  </article>
                                ))}
                              </div>
                            ) : (
                              <p className={styles.emptyChecklist}>
                                Nenhuma tarefa neste momento.
                              </p>
                            )}

                            <div className={styles.checklistComposer}>
                              <input
                                value={drafts[block.id] ?? ""}
                                placeholder="Adicionar tarefa..."
                                onChange={(event) =>
                                  setDrafts((current) => ({
                                    ...current,
                                    [block.id]: event.target.value,
                                  }))
                                }
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    event.preventDefault();
                                    addTask(block.id);
                                  }
                                }}
                              />

                              <button
                                type="button"
                                onClick={() => addTask(block.id)}
                              >
                                Adicionar
                              </button>
                            </div>

                            <p className={styles.sourceNote}>
                              Estas tarefas também aparecem na etapa
                              “Cerimônia” do checklist geral.
                            </p>
                          </section>
                        </div>

                        <footer className={styles.blockActions}>
                          <div>
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => moveDirection(block.id, -1)}
                            >
                              ↑
                            </button>

                            <button
                              type="button"
                              disabled={index === blocks.length - 1}
                              onClick={() => moveDirection(block.id, 1)}
                            >
                              ↓
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => duplicateBlock(block.id)}
                          >
                            Duplicar
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditBlock(block)}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className={styles.deleteButton}
                            onClick={() => removeBlock(block)}
                          >
                            Excluir
                          </button>
                        </footer>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <span>♡</span>
            <strong>A cerimônia ainda não possui um roteiro</strong>
            <p>Crie os momentos manualmente ou use uma estrutura inicial.</p>
            <div>
              <button type="button" onClick={initializeCeremony}>Criar roteiro inicial</button>
              <button type="button" onClick={openNewBlock}>Criar primeiro momento</button>
            </div>
          </div>
        )}
      </section>

      {mounted && blockModal && createPortal(blockModal, document.body)}
      {mounted && taskModal && createPortal(taskModal, document.body)}
    </div>
  );
}
