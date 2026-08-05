"use client";

import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import {
  createChecklistGroupAction,
  createChecklistTaskAction,
  deleteChecklistGroupAction,
  deleteChecklistTaskAction,
  initializeChecklistAction,
  toggleChecklistTaskAction,
  updateChecklistGroupAction,
  updateChecklistTaskAction,
} from "@/lib/actions/checklist";

import styles from "./checklist-manager.module.css";

export type ChecklistGroupItem = {
  id: string;
  title: string;
  description?: string;
  tone: "blue" | "green" | "yellow" | "terracotta";
  sortOrder: number;
};

export type ChecklistTaskItem = {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  dueDate?: string;
  responsibleType:
    | "bride"
    | "groom"
    | "couple"
    | "planner"
    | "other";
  responsibleName?: string;
  status: "pending" | "progress" | "completed";
  priority: "normal" | "medium" | "high";
  sourceType:
    | "manual"
    | "ceremony"
    | "budget"
    | "rsvp"
    | "system";
  sortOrder: number;
};

type ChecklistManagerProps = {
  initialGroups: ChecklistGroupItem[];
  initialTasks: ChecklistTaskItem[];
  brideName: string;
  groomName: string;
};

type TaskFilter =
  | "all"
  | "pending"
  | "progress"
  | "completed"
  | "overdue";

type GroupForm = {
  id?: string;
  title: string;
  description: string;
  tone: ChecklistGroupItem["tone"];
};

type TaskForm = {
  id?: string;
  groupId: string;
  title: string;
  description: string;
  dueDate: string;
  responsibleType: ChecklistTaskItem["responsibleType"];
  responsibleName: string;
  status: ChecklistTaskItem["status"];
  priority: ChecklistTaskItem["priority"];
};

const groupToneLabels: Record<
  ChecklistGroupItem["tone"],
  string
> = {
  blue: "Azul",
  green: "Verde",
  yellow: "Amarelo",
  terracotta: "Terracota",
};

const priorityLabels: Record<
  ChecklistTaskItem["priority"],
  string
> = {
  high: "Alta",
  medium: "Média",
  normal: "Normal",
};

const statusLabels: Record<
  ChecklistTaskItem["status"],
  string
> = {
  pending: "Pendente",
  progress: "Em andamento",
  completed: "Concluída",
};

function emptyGroupForm(): GroupForm {
  return {
    title: "",
    description: "",
    tone: "blue",
  };
}

function emptyTaskForm(groupId = ""): TaskForm {
  return {
    groupId,
    title: "",
    description: "",
    dueDate: "",
    responsibleType: "couple",
    responsibleName: "",
    status: "pending",
    priority: "normal",
  };
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

function getTodayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function isOverdue(task: ChecklistTaskItem) {
  if (!task.dueDate || task.status === "completed") {
    return false;
  }

  return (
    parseDateOnly(task.dueDate).getTime() <
    getTodayStart().getTime()
  );
}

export default function ChecklistManager({
  initialGroups,
  initialTasks,
  brideName,
  groomName,
}: ChecklistManagerProps) {
  const router = useRouter();

  const [groups, setGroups] =
    useState<ChecklistGroupItem[]>(initialGroups);
  const [tasks, setTasks] =
    useState<ChecklistTaskItem[]>(initialTasks);

  const [search, setSearch] = useState("");
  const [filter, setFilter] =
    useState<TaskFilter>("all");

  const [collapsedGroups, setCollapsedGroups] =
    useState<Set<string>>(new Set());

  const [groupModalOpen, setGroupModalOpen] =
    useState(false);
  const [taskModalOpen, setTaskModalOpen] =
    useState(false);

  const [groupForm, setGroupForm] =
    useState<GroupForm>(emptyGroupForm);
  const [taskForm, setTaskForm] =
    useState<TaskForm>(emptyTaskForm);

  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [feedback, setFeedback] =
    useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setGroups(initialGroups);
  }, [initialGroups]);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const metrics = useMemo(() => {
    const completed = tasks.filter(
      (task) => task.status === "completed",
    ).length;

    const progress = tasks.filter(
      (task) => task.status === "progress",
    ).length;

    const pending = tasks.filter(
      (task) => task.status === "pending",
    ).length;

    const urgent = tasks.filter(
      (task) =>
        task.priority === "high" &&
        task.status !== "completed",
    ).length;

    const overdue = tasks.filter(isOverdue).length;

    const percentage =
      tasks.length > 0
        ? Math.round((completed / tasks.length) * 100)
        : 0;

    return {
      completed,
      progress,
      pending,
      urgent,
      overdue,
      percentage,
      total: tasks.length,
    };
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLocaleLowerCase("pt-BR");

    return tasks.filter((task) => {
      const responsible = getResponsibleLabel(task);
      const searchable = [
        task.title,
        task.description,
        responsible,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("pt-BR");

      const matchesSearch =
        !normalizedSearch ||
        searchable.includes(normalizedSearch);

      const matchesFilter =
        filter === "all" ||
        (filter === "overdue" && isOverdue(task)) ||
        task.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [tasks, search, filter]);

  const tasksByGroup = useMemo(() => {
    const result = new Map<string, ChecklistTaskItem[]>();

    for (const group of groups) {
      result.set(group.id, []);
    }

    for (const task of visibleTasks) {
      const current = result.get(task.groupId) ?? [];
      current.push(task);
      result.set(task.groupId, current);
    }

    for (const [groupId, groupTasks] of result) {
      result.set(
        groupId,
        groupTasks.sort((first, second) => {
          if (first.status === "completed" && second.status !== "completed") {
            return 1;
          }

          if (first.status !== "completed" && second.status === "completed") {
            return -1;
          }

          if (first.dueDate && second.dueDate) {
            return first.dueDate.localeCompare(second.dueDate);
          }

          if (first.dueDate) {
            return -1;
          }

          if (second.dueDate) {
            return 1;
          }

          return first.sortOrder - second.sortOrder;
        }),
      );
    }

    return result;
  }, [groups, visibleTasks]);

  function getResponsibleLabel(task: ChecklistTaskItem) {
    const labels: Record<
      ChecklistTaskItem["responsibleType"],
      string
    > = {
      bride: brideName,
      groom: groomName,
      couple: `${brideName} e ${groomName}`,
      planner: "Cerimonialista",
      other: task.responsibleName || "Outro responsável",
    };

    return labels[task.responsibleType];
  }

  function showFeedback(message: string) {
    setFeedback(message);

    window.setTimeout(() => {
      setFeedback(null);
    }, 3200);
  }

  function openNewGroup() {
    window.dispatchEvent(
      new Event("dashboard:collapse-sidebar"),
    );

    setGroupForm(emptyGroupForm());
    setGroupModalOpen(true);
  }

  function openEditGroup(group: ChecklistGroupItem) {
    window.dispatchEvent(
      new Event("dashboard:collapse-sidebar"),
    );

    setGroupForm({
      id: group.id,
      title: group.title,
      description: group.description ?? "",
      tone: group.tone,
    });

    setGroupModalOpen(true);
  }

  function openNewTask(groupId = "") {
    window.dispatchEvent(
      new Event("dashboard:collapse-sidebar"),
    );

    setTaskForm(
      emptyTaskForm(groupId || groups[0]?.id || ""),
    );
    setTaskModalOpen(true);
  }

  function openEditTask(task: ChecklistTaskItem) {
    window.dispatchEvent(
      new Event("dashboard:collapse-sidebar"),
    );

    setTaskForm({
      id: task.id,
      groupId: task.groupId,
      title: task.title,
      description: task.description ?? "",
      dueDate: task.dueDate ?? "",
      responsibleType: task.responsibleType,
      responsibleName: task.responsibleName ?? "",
      status: task.status,
      priority: task.priority,
    });

    setTaskModalOpen(true);
  }

  function toggleGroup(groupId: string) {
    setCollapsedGroups((current) => {
      const next = new Set(current);

      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }

      return next;
    });
  }

  async function initializeChecklist() {
    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const result = await initializeChecklistAction();
      showFeedback(result.message);

      if (result.success) {
        router.refresh();
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function saveGroup(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const input = {
        title: groupForm.title.trim(),
        description: groupForm.description.trim(),
        tone: groupForm.tone,
      };

      const result = groupForm.id
        ? await updateChecklistGroupAction({
            id: groupForm.id,
            ...input,
          })
        : await createChecklistGroupAction(input);

      showFeedback(result.message);

      if (result.success) {
        setGroupModalOpen(false);
        router.refresh();
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function saveTask(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    if (!taskForm.groupId) {
      showFeedback("Crie uma etapa antes de adicionar tarefas.");
      return;
    }

    setIsSaving(true);

    try {
      const input = {
        groupId: taskForm.groupId,
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        dueDate: taskForm.dueDate,
        responsibleType: taskForm.responsibleType,
        responsibleName: taskForm.responsibleName.trim(),
        status: taskForm.status,
        priority: taskForm.priority,
      };

      const result = taskForm.id
        ? await updateChecklistTaskAction({
            id: taskForm.id,
            ...input,
          })
        : await createChecklistTaskAction(input);

      showFeedback(result.message);

      if (result.success) {
        setTaskModalOpen(false);
        setCollapsedGroups((current) => {
          const next = new Set(current);
          next.delete(taskForm.groupId);
          return next;
        });
        router.refresh();
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleTask(task: ChecklistTaskItem) {
    const completed = task.status !== "completed";

    setTasks((current) =>
      current.map((currentTask) =>
        currentTask.id === task.id
          ? {
              ...currentTask,
              status: completed ? "completed" : "pending",
            }
          : currentTask,
      ),
    );

    const result = await toggleChecklistTaskAction(
      task.id,
      completed,
    );

    showFeedback(result.message);

    if (!result.success) {
      setTasks(initialTasks);
    }

    router.refresh();
  }

  async function removeTask(task: ChecklistTaskItem) {
    const confirmed = window.confirm(
      `Excluir a tarefa “${task.title}”?`,
    );

    if (!confirmed) {
      return;
    }

    const result = await deleteChecklistTaskAction(task.id);
    showFeedback(result.message);

    if (result.success) {
      router.refresh();
    }
  }

  async function removeGroup(group: ChecklistGroupItem) {
    const groupTaskCount = tasks.filter(
      (task) => task.groupId === group.id,
    ).length;

    const message =
      groupTaskCount > 0
        ? `Excluir a etapa “${group.title}” e suas ${groupTaskCount} tarefa(s)?`
        : `Excluir a etapa “${group.title}”?`;

    const confirmed = window.confirm(message);

    if (!confirmed) {
      return;
    }

    const result = await deleteChecklistGroupAction(group.id);
    showFeedback(result.message);

    if (result.success) {
      router.refresh();
    }
  }

  const groupModal = groupModalOpen ? (
    <div
      className={styles.modalOverlay}
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !isSaving
        ) {
          setGroupModalOpen(false);
        }
      }}
    >
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checklist-group-modal-title"
      >
        <header className={styles.modalHeader}>
          <div>
            <span>Etapa do checklist</span>
            <h2 id="checklist-group-modal-title">
              {groupForm.id ? "Editar etapa" : "Nova etapa"}
            </h2>
            <p>
              Use etapas para separar o planejamento em blocos claros.
            </p>
          </div>

          <button
            type="button"
            aria-label="Fechar"
            disabled={isSaving}
            onClick={() => setGroupModalOpen(false)}
          >
            ×
          </button>
        </header>

        <form className={styles.form} onSubmit={saveGroup}>
          <label className={styles.fullField}>
            <span>Nome da etapa</span>
            <input
              required
              minLength={2}
              value={groupForm.title}
              placeholder="Ex.: Contratações principais"
              onChange={(event) =>
                setGroupForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />
          </label>

          <label className={styles.fullField}>
            <span>Descrição</span>
            <textarea
              rows={3}
              value={groupForm.description}
              placeholder="Explique o objetivo desta etapa..."
              onChange={(event) =>
                setGroupForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </label>

          <fieldset className={styles.fullField}>
            <legend>Identidade visual</legend>
            <div className={styles.toneOptions}>
              {(
                Object.entries(groupToneLabels) as Array<
                  [ChecklistGroupItem["tone"], string]
                >
              ).map(([tone, label]) => (
                <button
                  key={tone}
                  type="button"
                  className={`${styles.toneOption} ${
                    styles[`tone-${tone}`]
                  } ${
                    groupForm.tone === tone
                      ? styles.toneOptionActive
                      : ""
                  }`}
                  onClick={() =>
                    setGroupForm((current) => ({
                      ...current,
                      tone,
                    }))
                  }
                >
                  <span aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className={styles.modalActions}>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setGroupModalOpen(false)}
            >
              Cancelar
            </button>
            <button type="submit" disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar etapa"}
            </button>
          </div>
        </form>
      </section>
    </div>
  ) : null;

  const taskModal = taskModalOpen ? (
    <div
      className={styles.modalOverlay}
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !isSaving
        ) {
          setTaskModalOpen(false);
        }
      }}
    >
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checklist-task-modal-title"
      >
        <header className={styles.modalHeader}>
          <div>
            <span>Tarefa</span>
            <h2 id="checklist-task-modal-title">
              {taskForm.id ? "Editar tarefa" : "Nova tarefa"}
            </h2>
            <p>
              Defina prazo, responsável, prioridade e andamento.
            </p>
          </div>

          <button
            type="button"
            aria-label="Fechar"
            disabled={isSaving}
            onClick={() => setTaskModalOpen(false)}
          >
            ×
          </button>
        </header>

        <form className={styles.form} onSubmit={saveTask}>
          <label className={styles.fullField}>
            <span>Título</span>
            <input
              required
              minLength={2}
              value={taskForm.title}
              placeholder="Ex.: Confirmar o buffet"
              onChange={(event) =>
                setTaskForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />
          </label>

          <label className={styles.fullField}>
            <span>Descrição — opcional</span>
            <textarea
              rows={3}
              value={taskForm.description}
              placeholder="Detalhes importantes para concluir a tarefa..."
              onChange={(event) =>
                setTaskForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </label>

          <label>
            <span>Etapa</span>
            <select
              required
              value={taskForm.groupId}
              onChange={(event) =>
                setTaskForm((current) => ({
                  ...current,
                  groupId: event.target.value,
                }))
              }
            >
              <option value="">Selecione</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.title}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Prazo — opcional</span>
            <input
              type="date"
              value={taskForm.dueDate}
              onChange={(event) =>
                setTaskForm((current) => ({
                  ...current,
                  dueDate: event.target.value,
                }))
              }
            />
          </label>

          <label>
            <span>Responsável</span>
            <select
              value={taskForm.responsibleType}
              onChange={(event) =>
                setTaskForm((current) => ({
                  ...current,
                  responsibleType:
                    event.target
                      .value as TaskForm["responsibleType"],
                }))
              }
            >
              <option value="couple">
                {brideName} e {groomName}
              </option>
              <option value="bride">{brideName}</option>
              <option value="groom">{groomName}</option>
              <option value="planner">Cerimonialista</option>
              <option value="other">Outra pessoa</option>
            </select>
          </label>

          <label>
            <span>Prioridade</span>
            <select
              value={taskForm.priority}
              onChange={(event) =>
                setTaskForm((current) => ({
                  ...current,
                  priority:
                    event.target
                      .value as TaskForm["priority"],
                }))
              }
            >
              <option value="normal">Normal</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
          </label>

          {taskForm.responsibleType === "other" && (
            <label className={styles.fullField}>
              <span>Nome do responsável</span>
              <input
                required
                value={taskForm.responsibleName}
                placeholder="Ex.: Mãe da noiva"
                onChange={(event) =>
                  setTaskForm((current) => ({
                    ...current,
                    responsibleName: event.target.value,
                  }))
                }
              />
            </label>
          )}

          <fieldset className={styles.fullField}>
            <legend>Situação</legend>
            <div className={styles.statusOptions}>
              {(
                Object.entries(statusLabels) as Array<
                  [ChecklistTaskItem["status"], string]
                >
              ).map(([status, label]) => (
                <button
                  key={status}
                  type="button"
                  className={`${styles.statusOption} ${
                    taskForm.status === status
                      ? styles.statusOptionActive
                      : ""
                  }`}
                  onClick={() =>
                    setTaskForm((current) => ({
                      ...current,
                      status,
                    }))
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className={styles.modalActions}>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setTaskModalOpen(false)}
            >
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
        <div
          className={styles.feedback}
          role="status"
          aria-live="polite"
        >
          <span aria-hidden="true">✓</span>
          {feedback}
        </div>
      )}

      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Planejamento</span>
          <h1>Checklist do casamento</h1>
          <p>
            Reúna decisões, prazos e responsáveis em um único lugar e
            acompanhe o avanço de cada etapa até o grande dia.
          </p>
        </div>

        <div className={styles.heroProgress}>
          <div
            className={styles.progressRing}
            style={{
              background: `conic-gradient(#404d77 ${metrics.percentage * 3.6}deg, #e7e2d8 0deg)`,
            }}
          >
            <div>
              <strong>{metrics.percentage}%</strong>
              <span>concluído</span>
            </div>
          </div>

          <button
            type="button"
            className={styles.primaryButton}
            disabled={groups.length === 0}
            onClick={() => openNewTask()}
          >
            <span aria-hidden="true">+</span>
            Nova tarefa
          </button>
        </div>
      </header>

      <section className={styles.metrics}>
        <article>
          <span>Total</span>
          <strong>{metrics.total}</strong>
          <small>Tarefas cadastradas</small>
        </article>
        <article>
          <span>Concluídas</span>
          <strong>{metrics.completed}</strong>
          <small>Etapas resolvidas</small>
        </article>
        <article>
          <span>Em andamento</span>
          <strong>{metrics.progress}</strong>
          <small>Já iniciadas</small>
        </article>
        <article
          className={metrics.overdue > 0 ? styles.metricDanger : ""}
        >
          <span>Atrasadas</span>
          <strong>{metrics.overdue}</strong>
          <small>Com prazo vencido</small>
        </article>
        <article
          className={metrics.urgent > 0 ? styles.metricAttention : ""}
        >
          <span>Prioridade alta</span>
          <strong>{metrics.urgent}</strong>
          <small>Precisam de atenção</small>
        </article>
      </section>

      {groups.length > 0 && (
        <section className={styles.toolbar}>
          <label className={styles.search}>
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              placeholder="Buscar tarefa ou responsável..."
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <div className={styles.filters}>
            {(
              [
                ["all", "Todas"],
                ["pending", "Pendentes"],
                ["progress", "Em andamento"],
                ["completed", "Concluídas"],
                ["overdue", "Atrasadas"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={
                  filter === value ? styles.filterActive : ""
                }
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={styles.secondaryButton}
            onClick={openNewGroup}
          >
            + Nova etapa
          </button>
        </section>
      )}

      {groups.length === 0 ? (
        <section className={styles.initialState}>
          <div className={styles.initialSymbol} aria-hidden="true">
            ✓
          </div>
          <span className={styles.eyebrow}>Primeiro acesso</span>
          <h2>Monte a estrutura do checklist</h2>
          <p>
            Crie quatro etapas iniciais para organizar decisões,
            contratações, identidade do evento e convidados. Depois você
            poderá editar, excluir ou adicionar novas etapas.
          </p>
          <div className={styles.initialActions}>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={isSaving}
              onClick={initializeChecklist}
            >
              {isSaving ? "Criando..." : "Criar etapas iniciais"}
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={openNewGroup}
            >
              Criar manualmente
            </button>
          </div>
        </section>
      ) : (
        <div className={styles.groupList}>
          {groups
            .slice()
            .sort((first, second) => first.sortOrder - second.sortOrder)
            .map((group) => {
              const allGroupTasks = tasks.filter(
                (task) => task.groupId === group.id,
              );

              const groupTasks = tasksByGroup.get(group.id) ?? [];

              const completedCount = allGroupTasks.filter(
                (task) => task.status === "completed",
              ).length;

              const groupPercentage =
                allGroupTasks.length > 0
                  ? Math.round(
                      (completedCount / allGroupTasks.length) * 100,
                    )
                  : 0;

              const collapsed = collapsedGroups.has(group.id);

              return (
                <section
                  key={group.id}
                  className={`${styles.groupCard} ${
                    styles[`group-${group.tone}`]
                  }`}
                >
                  <header className={styles.groupHeader}>
                    <button
                      type="button"
                      className={styles.groupMain}
                      aria-expanded={!collapsed}
                      onClick={() => toggleGroup(group.id)}
                    >
                      <span
                        className={styles.groupMarker}
                        aria-hidden="true"
                      />

                      <span className={styles.groupCopy}>
                        <strong>{group.title}</strong>
                        <small>
                          {group.description ||
                            "Sem descrição para esta etapa."}
                        </small>
                      </span>
                    </button>

                    <div className={styles.groupProgressSummary}>
                      <span>
                        {completedCount} de {allGroupTasks.length}
                      </span>
                      <strong>{groupPercentage}%</strong>
                    </div>

                    <div className={styles.groupActions}>
                      <button
                        type="button"
                        onClick={() => openNewTask(group.id)}
                      >
                        + Tarefa
                      </button>
                      <button
                        type="button"
                        aria-label={`Editar etapa ${group.title}`}
                        onClick={() => openEditGroup(group)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className={styles.deleteButton}
                        aria-label={`Excluir etapa ${group.title}`}
                        onClick={() => removeGroup(group)}
                      >
                        Excluir
                      </button>
                    </div>
                  </header>

                  <div className={styles.groupProgressTrack}>
                    <span style={{ width: `${groupPercentage}%` }} />
                  </div>

                  {!collapsed && (
                    <div className={styles.groupBody}>
                      {groupTasks.length > 0 ? (
                        <div className={styles.taskList}>
                          {groupTasks.map((task) => {
                            const overdue = isOverdue(task);

                            return (
                              <article
                                key={task.id}
                                className={`${styles.taskCard} ${
                                  task.status === "completed"
                                    ? styles.taskCompleted
                                    : ""
                                } ${overdue ? styles.taskOverdue : ""}`}
                              >
                                <button
                                  type="button"
                                  className={styles.checkButton}
                                  aria-label={
                                    task.status === "completed"
                                      ? `Reabrir ${task.title}`
                                      : `Concluir ${task.title}`
                                  }
                                  onClick={() => toggleTask(task)}
                                >
                                  {task.status === "completed" ? (
                                    <span aria-hidden="true">✓</span>
                                  ) : task.status === "progress" ? (
                                    <span
                                      className={styles.progressDot}
                                      aria-hidden="true"
                                    />
                                  ) : null}
                                </button>

                                <div className={styles.taskContent}>
                                  <div className={styles.taskHeading}>
                                    <div>
                                      <h3>{task.title}</h3>
                                      {task.description && (
                                        <p>{task.description}</p>
                                      )}
                                    </div>

                                    <span
                                      className={`${styles.priorityBadge} ${
                                        styles[
                                          `priority-${task.priority}`
                                        ]
                                      }`}
                                    >
                                      {priorityLabels[task.priority]}
                                    </span>
                                  </div>

                                  <div className={styles.taskMeta}>
                                    <span>
                                      <b>Responsável:</b>{" "}
                                      {getResponsibleLabel(task)}
                                    </span>

                                    <span>
                                      <b>Prazo:</b>{" "}
                                      {task.dueDate
                                        ? formatDate(task.dueDate)
                                        : "Sem prazo"}
                                    </span>

                                    <span
                                      className={`${styles.statusBadge} ${
                                        styles[
                                          `status-${task.status}`
                                        ]
                                      }`}
                                    >
                                      {overdue
                                        ? "Atrasada"
                                        : statusLabels[task.status]}
                                    </span>

                                    {task.sourceType !== "manual" && (
                                      <span className={styles.sourceBadge}>
                                        Integrada
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className={styles.taskActions}>
                                  <button
                                    type="button"
                                    onClick={() => openEditTask(task)}
                                  >
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.deleteButton}
                                    onClick={() => removeTask(task)}
                                  >
                                    Excluir
                                  </button>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      ) : (
                        <div className={styles.emptyGroup}>
                          <div>
                            <strong>
                              {allGroupTasks.length > 0
                                ? "Nenhuma tarefa corresponde ao filtro"
                                : "Nenhuma tarefa nesta etapa"}
                            </strong>
                            <p>
                              {allGroupTasks.length > 0
                                ? "Altere a busca ou os filtros para visualizar outras tarefas."
                                : "Adicione a primeira tarefa e comece a acompanhar o progresso."}
                            </p>
                          </div>

                          {allGroupTasks.length === 0 && (
                            <button
                              type="button"
                              onClick={() => openNewTask(group.id)}
                            >
                              + Adicionar tarefa
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </section>
              );
            })}
        </div>
      )}

      {mounted &&
        groupModal &&
        createPortal(groupModal, document.body)}

      {mounted &&
        taskModal &&
        createPortal(taskModal, document.body)}
    </div>
  );
}
