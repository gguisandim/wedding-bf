export type ChecklistTaskStatus =
  | "pending"
  | "progress"
  | "completed";

export type ChecklistTaskPriority =
  | "high"
  | "medium"
  | "normal";

export type ChecklistTaskItem = {
  id: number;
  title: string;
  description?: string;
  deadline: string;
  responsible: string;
  status: ChecklistTaskStatus;
  priority: ChecklistTaskPriority;
};

type ChecklistTaskProps = {
  task: ChecklistTaskItem;
};

const statusLabels: Record<ChecklistTaskStatus, string> = {
  pending: "Pendente",
  progress: "Em andamento",
  completed: "Concluída",
};

const priorityLabels: Record<ChecklistTaskPriority, string> = {
  high: "Prioridade alta",
  medium: "Prioridade média",
  normal: "Normal",
};

export default function ChecklistTask({
  task,
}: ChecklistTaskProps) {
  return (
    <article
      className={`checklist-task checklist-task-${task.status}`}
    >
      <button
        type="button"
        className="checklist-task-check"
        aria-label={
          task.status === "completed"
            ? `Marcar ${task.title} como pendente`
            : `Marcar ${task.title} como concluída`
        }
      >
        {task.status === "completed" && (
          <span aria-hidden="true">✓</span>
        )}

        {task.status === "progress" && (
          <span
            className="checklist-task-progress-dot"
            aria-hidden="true"
          />
        )}
      </button>

      <div className="checklist-task-content">
        <div className="checklist-task-heading">
          <div>
            <h3>{task.title}</h3>

            {task.description && (
              <p>{task.description}</p>
            )}
          </div>

          <span
            className={`checklist-task-priority checklist-task-priority-${task.priority}`}
          >
            {priorityLabels[task.priority]}
          </span>
        </div>

        <div className="checklist-task-meta">
          <span>
            <strong>Prazo:</strong> {task.deadline}
          </span>

          <span aria-hidden="true">•</span>

          <span>
            <strong>Responsável:</strong> {task.responsible}
          </span>

          <span
            className={`checklist-task-status checklist-task-status-${task.status}`}
          >
            {statusLabels[task.status]}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="checklist-task-menu"
        aria-label={`Mais opções para ${task.title}`}
      >
        <span aria-hidden="true">•••</span>
      </button>
    </article>
  );
}