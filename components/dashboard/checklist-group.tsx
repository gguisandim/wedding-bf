import ChecklistTask, {
  type ChecklistTaskItem,
} from "./checklist-task";

type ChecklistGroupProps = {
  title: string;
  description: string;
  tasks: ChecklistTaskItem[];
  tone?: "blue" | "green" | "yellow" | "terracotta";
};

export default function ChecklistGroup({
  title,
  description,
  tasks,
  tone = "blue",
}: ChecklistGroupProps) {
  const completedTasks = tasks.filter(
    (task) => task.status === "completed",
  ).length;

  const percentage =
    tasks.length > 0
      ? Math.round(
          (completedTasks / tasks.length) * 100,
        )
      : 0;

  return (
    <section
      className={`checklist-group checklist-group-${tone}`}
    >
      <header className="checklist-group-header">
        <div className="checklist-group-heading">
          <span
            className="checklist-group-marker"
            aria-hidden="true"
          />

          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        </div>

        <div className="checklist-group-progress">
          <span>
            {completedTasks} de {tasks.length}
          </span>

          <strong>{percentage}%</strong>
        </div>
      </header>

      <div
        className="checklist-group-progress-bar"
        role="progressbar"
        aria-label={`Progresso de ${title}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
      >
        <span
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>

      <div className="checklist-group-tasks">
        {tasks.map((task) => (
          <ChecklistTask
            key={task.id}
            task={task}
          />
        ))}
      </div>

      <button
        type="button"
        className="checklist-group-add"
      >
        <span aria-hidden="true">＋</span>
        Adicionar tarefa nesta etapa
      </button>
    </section>
  );
}