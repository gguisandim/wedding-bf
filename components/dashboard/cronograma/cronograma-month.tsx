import CronogramaEvent, {
  type CronogramaEventItem,
} from "./cronograma-event";

import styles from "./cronograma.module.css";

type CronogramaMonthProps = {
  month: string;
  year: number;
  description: string;
  events: CronogramaEventItem[];
  current?: boolean;
};

export default function CronogramaMonth({
  month,
  year,
  description,
  events,
  current = false,
}: CronogramaMonthProps) {
  return (
    <section className={styles.monthSection}>
      <header className={styles.monthHeader}>
        <div>
          <div className={styles.monthTitleRow}>
            <h2>
              {month} <span>{year}</span>
            </h2>

            {current && (
              <span className={styles.currentMonthBadge}>
                Mês atual
              </span>
            )}
          </div>

          <p>{description}</p>
        </div>

        <span className={styles.monthEventCount}>
          {events.length}{" "}
          {events.length === 1 ? "evento" : "eventos"}
        </span>
      </header>

      <div className={styles.monthTimeline}>
        {events.map((event) => (
          <CronogramaEvent
            key={event.id}
            event={event}
          />
        ))}
      </div>
    </section>
  );
}