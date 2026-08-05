type WeddingHeaderProps = {
  coupleName: string;
  memberName: string;
  weddingDate: string;
  daysRemaining: number;
  confirmedGuests: number;
  pendingGuests: number;
};

export default function WeddingHeader({
  coupleName,
  memberName,
  weddingDate,
  daysRemaining,
  confirmedGuests,
  pendingGuests,
}: WeddingHeaderProps) {
  return (
    <header className="wedding-header">
      <div className="wedding-header-content">
        <span className="wedding-header-eyebrow">
          {coupleName}
        </span>

        <h1 className="wedding-header-title">
          Bem-vindo, {memberName}
        </h1>

        <p className="wedding-header-date">
          {weddingDate}
          <span aria-hidden="true"> · </span>
          Faltam {daysRemaining} dias
        </p>

        <p className="wedding-header-status">
          <strong>{confirmedGuests}</strong> convidados confirmados
          <span aria-hidden="true"> · </span>
          <strong>{pendingGuests}</strong> aguardando resposta
        </p>
      </div>

      <div
        className="wedding-header-countdown"
        aria-label={`Faltam ${daysRemaining} dias para o casamento`}
      >
        <span className="wedding-header-countdown-label">
          Contagem regressiva
        </span>

        <strong className="wedding-header-countdown-number">
          {daysRemaining}
        </strong>

        <span className="wedding-header-countdown-text">
          dias para o grande dia
        </span>
      </div>
    </header>
  );
}
