import Link from "next/link";

export type NextStepPriority = "urgent" | "soon" | "normal";

export type NextStepItem = {
  id: string;
  title: string;
  description: string;
  deadline: string;
  category: string;
  priority: NextStepPriority;
};

type NextStepsProps = {
  items: NextStepItem[];
  completedTasks: number;
  totalTasks: number;
};

const priorityLabels: Record<NextStepPriority, string> = {
  urgent: "Prioridade alta",
  soon: "Próximo",
  normal: "Planejado",
};

export default function NextSteps({
  items,
  completedTasks,
  totalTasks,
}: NextStepsProps) {
  const completionPercentage =
    totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

  return (
    <section
      className="next-steps-section"
      aria-labelledby="next-steps-title"
    >
      <div className="next-steps-heading">
        <div>
          <span className="dashboard-eyebrow">
            Planejamento
          </span>

          <h2
            id="next-steps-title"
            className="next-steps-title"
          >
            Próximos passos
          </h2>

          <p className="next-steps-description">
            O que precisa da sua atenção nos próximos dias.
          </p>
        </div>

        <Link
          href="/painel/checklist"
          className="next-steps-view-all"
        >
          Ver checklist
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="next-steps-layout">
        <div className="next-steps-list">
          {items.length > 0 ? (
            items.map((item) => (
              <article
                key={item.id}
                className={`next-step-item next-step-item-${item.priority}`}
              >
                <div
                  className="next-step-indicator"
                  aria-hidden="true"
                />

                <div className="next-step-content">
                  <div className="next-step-meta">
                    <span className="next-step-category">
                      {item.category}
                    </span>

                    <span
                      className={`next-step-priority next-step-priority-${item.priority}`}
                    >
                      {priorityLabels[item.priority]}
                    </span>
                  </div>

                  <h3 className="next-step-title">
                    {item.title}
                  </h3>

                  <p className="next-step-description">
                    {item.description}
                  </p>
                </div>

                <div className="next-step-deadline">
                  <span>Prazo</span>
                  <strong>{item.deadline}</strong>
                </div>
              </article>
            ))
          ) : (
            <div className="next-steps-empty">
              <span className="next-steps-empty-symbol">
                ✓
              </span>

              <div>
                <strong>Tudo organizado por enquanto</strong>
                <p>
                  Nenhuma tarefa urgente precisa da sua atenção.
                </p>
              </div>
            </div>
          )}
        </div>

        <aside className="next-steps-progress">
          <span className="next-steps-progress-label">
            Progresso geral
          </span>

          <strong className="next-steps-progress-value">
            {completionPercentage}%
          </strong>

          <p className="next-steps-progress-text">
            {completedTasks} de {totalTasks} tarefas concluídas
          </p>

          <div
            className="next-steps-progress-bar"
            role="progressbar"
            aria-label="Progresso geral do checklist"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={completionPercentage}
          >
            <span
              style={{
                width: `${completionPercentage}%`,
              }}
            />
          </div>

          <p className="next-steps-progress-message">
            Cada etapa concluída deixa o grande dia mais perto.
          </p>

          <Link
            href="/painel/checklist"
            className="next-steps-progress-button"
          >
            Abrir checklist
          </Link>
        </aside>
      </div>
    </section>
  );
}