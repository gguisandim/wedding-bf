import Link from "next/link";

type GuestSummaryProps = {
  totalGuests: number;
  confirmedGuests: number;
  pendingGuests: number;
  declinedGuests: number;
};

function calculatePercentage(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

export default function GuestSummary({
  totalGuests,
  confirmedGuests,
  pendingGuests,
  declinedGuests,
}: GuestSummaryProps) {
  const confirmedPercentage = calculatePercentage(
    confirmedGuests,
    totalGuests,
  );

  const pendingPercentage = calculatePercentage(
    pendingGuests,
    totalGuests,
  );

  const declinedPercentage = calculatePercentage(
    declinedGuests,
    totalGuests,
  );

  return (
    <article
      className="summary-card guest-summary"
      aria-labelledby="guest-summary-title"
    >
      <header className="summary-card-header">
        <div>
          <span className="dashboard-eyebrow">
            Convidados
          </span>

          <h2
            id="guest-summary-title"
            className="summary-card-title"
          >
            Confirmações de presença
          </h2>
        </div>

        <Link
          href="/painel/convidados"
          className="summary-card-link"
        >
          Ver lista
          <span aria-hidden="true">→</span>
        </Link>
      </header>

      <div className="guest-summary-main">
        <div className="guest-summary-total">
          <strong>{confirmedPercentage}%</strong>

          <span>dos convidados confirmaram</span>
        </div>

        <div
          className="guest-summary-segmented-bar"
          role="img"
          aria-label={`${confirmedGuests} confirmados, ${pendingGuests} pendentes e ${declinedGuests} recusados`}
        >
          <span
            className="guest-segment guest-segment-confirmed"
            style={{
              width: `${confirmedPercentage}%`,
            }}
          />

          <span
            className="guest-segment guest-segment-pending"
            style={{
              width: `${pendingPercentage}%`,
            }}
          />

          <span
            className="guest-segment guest-segment-declined"
            style={{
              width: `${declinedPercentage}%`,
            }}
          />
        </div>
      </div>

      <div className="guest-summary-list">
        <div className="guest-summary-row">
          <div className="guest-summary-row-label">
            <span className="guest-status-dot guest-status-confirmed" />

            <div>
              <strong>Confirmados</strong>
              <span>{confirmedPercentage}% da lista</span>
            </div>
          </div>

          <strong className="guest-summary-value">
            {confirmedGuests}
          </strong>
        </div>

        <div className="guest-summary-row">
          <div className="guest-summary-row-label">
            <span className="guest-status-dot guest-status-pending" />

            <div>
              <strong>Aguardando resposta</strong>
              <span>{pendingPercentage}% da lista</span>
            </div>
          </div>

          <strong className="guest-summary-value">
            {pendingGuests}
          </strong>
        </div>

        <div className="guest-summary-row">
          <div className="guest-summary-row-label">
            <span className="guest-status-dot guest-status-declined" />

            <div>
              <strong>Não comparecerão</strong>
              <span>{declinedPercentage}% da lista</span>
            </div>
          </div>

          <strong className="guest-summary-value">
            {declinedGuests}
          </strong>
        </div>
      </div>

      <footer className="guest-summary-footer">
        <p>
          <strong>{pendingGuests}</strong> convidados ainda precisam
          responder.
        </p>

        <Link
          href="/painel/rsvp"
          className="guest-summary-reminder"
        >
          Gerenciar confirmações
        </Link>
      </footer>
    </article>
  );
}