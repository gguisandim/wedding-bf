import Link from "next/link";

type FinancialSummaryProps = {
  totalBudget: number;
  paidAmount: number;
  committedAmount: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function calculatePercentage(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(0, Math.round((value / total) * 100)),
  );
}

export default function FinancialSummary({
  totalBudget,
  paidAmount,
  committedAmount,
}: FinancialSummaryProps) {
  const availableAmount = Math.max(
    totalBudget - paidAmount - committedAmount,
    0,
  );

  const paidPercentage = calculatePercentage(
    paidAmount,
    totalBudget,
  );

  const committedPercentage = calculatePercentage(
    committedAmount,
    totalBudget,
  );

  const usedPercentage = calculatePercentage(
    paidAmount + committedAmount,
    totalBudget,
  );

  return (
    <article
      className="summary-card financial-summary"
      aria-labelledby="financial-summary-title"
    >
      <header className="summary-card-header">
        <div>
          <span className="dashboard-eyebrow">
            Financeiro
          </span>

          <h2
            id="financial-summary-title"
            className="summary-card-title"
          >
            Resumo financeiro
          </h2>
        </div>

        <Link
          href="/painel/financeiro"
          className="summary-card-link"
        >
          Ver orçamento
          <span aria-hidden="true">→</span>
        </Link>
      </header>

      <div className="financial-summary-main">
        <span className="financial-summary-label">
          Orçamento comprometido
        </span>

        <div className="financial-summary-value-row">
          <strong>{usedPercentage}%</strong>

          <span>
            de {formatCurrency(totalBudget)}
          </span>
        </div>

        <div
          className="financial-summary-progress"
          role="progressbar"
          aria-label="Percentual do orçamento comprometido"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={usedPercentage}
        >
          <span
            className="financial-progress-paid"
            style={{
              width: `${paidPercentage}%`,
            }}
          />

          <span
            className="financial-progress-committed"
            style={{
              width: `${committedPercentage}%`,
            }}
          />
        </div>

        <div className="financial-summary-legend">
          <span>
            <i className="financial-legend-paid" />
            Pago
          </span>

          <span>
            <i className="financial-legend-committed" />
            A pagar
          </span>
        </div>
      </div>

      <div className="financial-summary-list">
        <div className="financial-summary-row">
          <div>
            <span className="financial-status-icon financial-status-paid">
              ✓
            </span>

            <div>
              <strong>Pago</strong>
              <span>Valores já quitados</span>
            </div>
          </div>

          <strong>{formatCurrency(paidAmount)}</strong>
        </div>

        <div className="financial-summary-row">
          <div>
            <span className="financial-status-icon financial-status-committed">
              ○
            </span>

            <div>
              <strong>A pagar</strong>
              <span>Valores já comprometidos</span>
            </div>
          </div>

          <strong>{formatCurrency(committedAmount)}</strong>
        </div>

        <div className="financial-summary-row">
          <div>
            <span className="financial-status-icon financial-status-available">
              +
            </span>

            <div>
              <strong>Disponível</strong>
              <span>Saldo restante do orçamento</span>
            </div>
          </div>

          <strong>{formatCurrency(availableAmount)}</strong>
        </div>
      </div>

      <footer className="financial-summary-footer">
        <span>
          {formatCurrency(paidAmount + committedAmount)} comprometidos
        </span>

        <Link href="/painel/financeiro">
          Gerenciar despesas
        </Link>
      </footer>
    </article>
  );
}