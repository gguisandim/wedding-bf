import styles from "./cronograma.module.css";

type CronogramaHeaderProps = {
  nextEventDay: string;
  nextEventMonth: string;
  nextEventTitle: string;
  totalEvents: number;
  upcomingEvents: number;
};

export default function CronogramaHeader({
  nextEventDay,
  nextEventMonth,
  nextEventTitle,
  totalEvents,
  upcomingEvents,
}: CronogramaHeaderProps) {
  return (
    <header className={styles.pageHeader}>
      <div className={styles.pageHeaderContent}>
        <span className="dashboard-eyebrow">
          Planejamento
        </span>

        <h1>Cronograma do casamento</h1>

        <p>
          Acompanhe compromissos, pagamentos, reuniões e
          decisões importantes até o grande dia.
        </p>

        <button
          type="button"
          className={styles.newEventButton}
        >
          <span aria-hidden="true">＋</span>
          Novo compromisso
        </button>
      </div>

      <div className={styles.pageHeaderOverview}>
        <div className={styles.nextEventCard}>
          <span className={styles.nextEventLabel}>
            Próximo compromisso
          </span>

          <div className={styles.nextEventContent}>
            <div className={styles.nextEventDate}>
              <strong>{nextEventDay}</strong>
              <span>{nextEventMonth}</span>
            </div>

            <div>
              <strong>{nextEventTitle}</strong>
              <span>Confira os detalhes no cronograma</span>
            </div>
          </div>
        </div>

        <div className={styles.headerStatistics}>
          <div>
            <strong>{totalEvents}</strong>
            <span>Eventos planejados</span>
          </div>

          <div>
            <strong>{upcomingEvents}</strong>
            <span>Nos próximos 30 dias</span>
          </div>
        </div>
      </div>
    </header>
  );
}