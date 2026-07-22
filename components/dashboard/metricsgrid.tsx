import MetricCard from "./metric-card";

type MetricsGridProps = {
  totalGuests: number;
  confirmedGuests: number;
  pendingGuests: number;
  totalBudget: number;
  paidAmount: number;
  pendingTasks: number;
  priorityTasks: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function MetricsGrid({
  totalGuests,
  confirmedGuests,
  pendingGuests,
  totalBudget,
  paidAmount,
  pendingTasks,
  priorityTasks,
}: MetricsGridProps) {
  const confirmationPercentage =
    totalGuests > 0
      ? (confirmedGuests / totalGuests) * 100
      : 0;

  const budgetPercentage =
    totalBudget > 0
      ? (paidAmount / totalBudget) * 100
      : 0;

  return (
    <section
      className="metrics-section"
      aria-labelledby="metrics-title"
    >
      <div className="metrics-section-heading">
        <div>
          <span className="dashboard-eyebrow">
            Resumo
          </span>

          <h2
            id="metrics-title"
            className="metrics-section-title"
          >
            Como está a organização
          </h2>
        </div>

        <p className="metrics-section-description">
          Os principais números do casamento em um só lugar.
        </p>
      </div>

      <div className="metrics-grid">
        <MetricCard
          label="Convidados"
          value={String(totalGuests)}
          description="pessoas cadastradas"
          detail={`${confirmedGuests} já confirmaram presença`}
          tone="blue"
        />

        <MetricCard
          label="Confirmações"
          value={`${Math.round(confirmationPercentage)}%`}
          description="das respostas recebidas"
          detail={`${pendingGuests} aguardando resposta`}
          progress={confirmationPercentage}
          tone="green"
        />

        <MetricCard
          label="Valor pago"
          value={formatCurrency(paidAmount)}
          description={`de ${formatCurrency(totalBudget)}`}
          detail={`${Math.round(budgetPercentage)}% do orçamento pago`}
          progress={budgetPercentage}
          tone="yellow"
        />

        <MetricCard
          label="Checklist"
          value={String(pendingTasks)}
          description="tarefas pendentes"
          detail={`${priorityTasks} precisam de atenção`}
          tone="neutral"
        />
      </div>
    </section>
  );
}