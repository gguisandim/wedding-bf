import Link from "next/link";

type FinancialSummaryProps = {
  totalBudget: number;
  paidAmount: number;
  remainingAmount: number;
  dueNext30: number;
  overdueAmount: number;
  unscheduledAmount: number;
};

function formatCurrency(
  value: number,
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    },
  ).format(value);
}

function calculatePercentage(
  value: number,
  total: number,
) {
  if (total <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (
          value /
          total
        ) * 100,
      ),
    ),
  );
}

export default function FinancialSummary({
  totalBudget,
  paidAmount,
  remainingAmount,
  dueNext30,
  overdueAmount,
  unscheduledAmount,
}: FinancialSummaryProps) {
  const paidPercentage =
    calculatePercentage(
      paidAmount,
      totalBudget,
    );

  const remainingPercentage =
    calculatePercentage(
      remainingAmount,
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
          <span aria-hidden="true">
            →
          </span>
        </Link>
      </header>

      <div className="financial-summary-main">
        <span className="financial-summary-label">
          Progresso dos pagamentos
        </span>

        <div className="financial-summary-value-row">
          <strong>
            {paidPercentage}%
          </strong>

          <span>
            de
            {" "}
            {formatCurrency(
              totalBudget,
            )}
          </span>
        </div>

        <div
          className="financial-summary-progress"
          role="progressbar"
          aria-label="Percentual do valor total já pago"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={
            paidPercentage
          }
        >
          <span
            className="financial-progress-paid"
            style={{
              width:
                `${paidPercentage}%`,
            }}
          />

          <span
            className="financial-progress-committed"
            style={{
              width:
                `${remainingPercentage}%`,
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
              <span>
                Valores já registrados
              </span>
            </div>
          </div>

          <strong>
            {formatCurrency(
              paidAmount,
            )}
          </strong>
        </div>

        <div className="financial-summary-row">
          <div>
            <span className="financial-status-icon financial-status-committed">
              ○
            </span>

            <div>
              <strong>A pagar</strong>
              <span>
                Saldo total dos serviços
              </span>
            </div>
          </div>

          <strong>
            {formatCurrency(
              remainingAmount,
            )}
          </strong>
        </div>

        <div className="financial-summary-row">
          <div>
            <span className="financial-status-icon financial-status-available">
              →
            </span>

            <div>
              <strong>
                Próximos 30 dias
              </strong>
              <span>
                Contas com vencimento próximo
              </span>
            </div>
          </div>

          <strong>
            {formatCurrency(
              dueNext30,
            )}
          </strong>
        </div>
      </div>

      <footer className="financial-summary-footer">
        <span>
          {overdueAmount > 0
            ? `${formatCurrency(
                overdueAmount,
              )} em atraso`
            : "Nenhuma conta atrasada"}
          {unscheduledAmount > 0
            ? ` · ${formatCurrency(
                unscheduledAmount,
              )} sem data definida`
            : ""}
        </span>

        <Link href="/painel/financeiro">
          Gerenciar contas
        </Link>
      </footer>
    </article>
  );
}
