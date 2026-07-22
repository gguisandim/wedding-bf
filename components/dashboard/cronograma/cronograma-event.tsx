import styles from "./cronograma.module.css";

export type CronogramaEventStatus =
  | "completed"
  | "upcoming"
  | "planned"
  | "wedding";

export type CronogramaEventItem = {
  id: number;
  day: string;
  weekday: string;
  title: string;
  description: string;
  category: string;
  status: CronogramaEventStatus;
  time?: string;
  location?: string;
  responsible?: string;
};

type CronogramaEventProps = {
  event: CronogramaEventItem;
};

const statusLabels: Record<CronogramaEventStatus, string> = {
  completed: "Concluído",
  upcoming: "Próximo",
  planned: "Planejado",
  wedding: "Grande dia",
};

const statusClasses: Record<
  CronogramaEventStatus,
  string
> = {
  completed: styles.eventCompleted,
  upcoming: styles.eventUpcoming,
  planned: styles.eventPlanned,
  wedding: styles.eventWedding,
};

export default function CronogramaEvent({
  event,
}: CronogramaEventProps) {
  return (
    <article
      className={`${styles.eventCard} ${
        statusClasses[event.status]
      }`}
    >
      <div className={styles.eventDate}>
        <strong>{event.day}</strong>
        <span>{event.weekday}</span>
      </div>

      <div
        className={styles.eventTimelineMarker}
        aria-hidden="true"
      >
        <span />
      </div>

      <div className={styles.eventContent}>
        <div className={styles.eventTop}>
          <div className={styles.eventTags}>
            <span className={styles.eventCategory}>
              {event.category}
            </span>

            <span className={styles.eventStatus}>
              {statusLabels[event.status]}
            </span>
          </div>

          <button
            type="button"
            className={styles.eventMenu}
            aria-label={`Mais opções para ${event.title}`}
          >
            <span aria-hidden="true">•••</span>
          </button>
        </div>

        <h3>{event.title}</h3>

        <p className={styles.eventDescription}>
          {event.description}
        </p>

        <div className={styles.eventMetadata}>
          {event.time && (
            <span>
              <strong>Horário:</strong> {event.time}
            </span>
          )}

          {event.location && (
            <span>
              <strong>Local:</strong> {event.location}
            </span>
          )}

          {event.responsible && (
            <span>
              <strong>Responsável:</strong>{" "}
              {event.responsible}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}