type ChecklistHeaderProps = {
  completedTasks: number;
  totalTasks: number;
  urgentTasks: number;
};

export default function ChecklistHeader({
  completedTasks,
  totalTasks,
  urgentTasks,
}: ChecklistHeaderProps) {
  const percentage =
    totalTasks > 0
      ? Math.round(
          (completedTasks / totalTasks) * 100,
        )
      : 0;

  return (
    <header className="checklist-page-header">
      <div className="checklist-page-header-content">
        <span className="dashboard-eyebrow">
          Planejamento
        </span>

        <h1>Checklist do casamento</h1>

        <p>
          Organize cada etapa e acompanhe tudo o que
          precisa ser resolvido até o grande dia.
        </p>
      </div>

      <div className="checklist-page-overview">
        <div className="checklist-page-progress-circle">
          <strong>{percentage}%</strong>
          <span>concluído</span>
        </div>

        <div className="checklist-page-numbers">
          <div>
            <strong>{completedTasks}</strong>
            <span>Concluídas</span>
          </div>

          <div>
            <strong>{totalTasks - completedTasks}</strong>
            <span>Pendentes</span>
          </div>

          <div>
            <strong>{urgentTasks}</strong>
            <span>Prioritárias</span>
          </div>
        </div>
      </div>
    </header>
  );
}