import Link from "next/link";

import type {
  OverviewPrivateDress,
  OverviewTimelineItem,
} from "@/lib/data/overview";

import styles from "./modules-overview.module.css";

type ModulesOverviewProps = {
  timeline: {
    totalUpcoming: number;
    next30: number;
    overdue: number;
    nextItem?: OverviewTimelineItem;
  };

  seating: {
    tableCount: number;
    capacity: number;
    confirmedGuests: number;
    assignedConfirmedGuests: number;
    unassignedConfirmedGuests: number;
  };

  ceremony: {
    blockCount: number;
    confirmedCount: number;
    attentionCount: number;
    totalDurationMinutes: number;
  };

  privateDress?: OverviewPrivateDress;
  timeZone: string;
};

function parseDateOnly(
  value: string,
) {
  const [
    year,
    month,
    day,
  ] = value
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day,
  );
}

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "short",
    },
  )
    .format(
      parseDateOnly(value),
    )
    .replace(".", "");
}

function formatDateTime(
  value: string,
  timeZone: string,
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone,
    },
  )
    .format(new Date(value))
    .replace(".", "");
}

function formatDuration(
  minutes: number,
) {
  if (minutes <= 0) {
    return "Não definida";
  }

  const hours =
    Math.floor(
      minutes / 60,
    );

  const remaining =
    minutes % 60;

  if (hours === 0) {
    return `${remaining} min`;
  }

  if (remaining === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remaining}min`;
}

export default function ModulesOverview({
  timeline,
  seating,
  ceremony,
  privateDress,
  timeZone,
}: ModulesOverviewProps) {
  return (
    <section
      className={styles.section}
      aria-labelledby="modules-overview-title"
    >
      <header
        className={styles.header}
      >
        <div>
          <span
            className={styles.eyebrow}
          >
            Áreas do casamento
          </span>

          <h2 id="modules-overview-title">
            Situação dos módulos
          </h2>
        </div>

        <p>
          Os números abaixo são calculados
          com os dados cadastrados nas
          respectivas páginas.
        </p>
      </header>

      <div
        className={styles.grid}
      >
        <article
          className={`${styles.card} ${styles.timelineCard}`}
        >
          <header>
            <div
              className={styles.icon}
              aria-hidden="true"
            >
              ◷
            </div>

            <div>
              <span>Cronograma</span>
              <h3>Próximos compromissos</h3>
            </div>

            <Link href="/painel/cronograma">
              Abrir
              <span aria-hidden="true">
                →
              </span>
            </Link>
          </header>

          {timeline.nextItem ? (
            <div
              className={styles.highlight}
            >
              <time
                dateTime={
                  timeline.nextItem.date
                }
              >
                <strong>
                  {timeline.nextItem.date.slice(
                    8,
                    10,
                  )}
                </strong>

                <small>
                  {new Intl.DateTimeFormat(
                    "pt-BR",
                    {
                      month: "short",
                    },
                  )
                    .format(
                      parseDateOnly(
                        timeline.nextItem.date,
                      ),
                    )
                    .replace(".", "")
                    .toUpperCase()}
                </small>
              </time>

              <div>
                <strong>
                  {timeline.nextItem.title}
                </strong>

                <span>
                  {timeline.nextItem.source}
                  {" · "}
                  {formatDate(
                    timeline.nextItem.date,
                  )}
                </span>
              </div>
            </div>
          ) : (
            <p
              className={styles.empty}
            >
              Nenhum compromisso futuro
              cadastrado.
            </p>
          )}

          <footer>
            <div>
              <strong>
                {timeline.next30}
              </strong>

              <span>
                nos próximos 30 dias
              </span>
            </div>

            <div
              className={
                timeline.overdue > 0
                  ? styles.danger
                  : ""
              }
            >
              <strong>
                {timeline.overdue}
              </strong>

              <span>atrasados</span>
            </div>
          </footer>
        </article>

        <article
          className={`${styles.card} ${styles.seatingCard}`}
        >
          <header>
            <div
              className={styles.icon}
              aria-hidden="true"
            >
              ◉
            </div>

            <div>
              <span>Mesas</span>
              <h3>Distribuição dos convidados</h3>
            </div>

            <Link href="/painel/mesas">
              Abrir
              <span aria-hidden="true">
                →
              </span>
            </Link>
          </header>

          <div
            className={styles.mainValue}
          >
            <strong>
              {
                seating.assignedConfirmedGuests
              }
            </strong>

            <span>
              de
              {" "}
              {seating.confirmedGuests}
              {" "}
              confirmados com mesa
            </span>
          </div>

          <div
            className={styles.progress}
            role="progressbar"
            aria-label="Convidados confirmados com mesa definida"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={
              seating.confirmedGuests > 0
                ? Math.round(
                    (
                      seating.assignedConfirmedGuests /
                      seating.confirmedGuests
                    ) * 100,
                  )
                : 0
            }
          >
            <span
              style={{
                width:
                  `${
                    seating.confirmedGuests > 0
                      ? Math.min(
                          100,
                          Math.round(
                            (
                              seating.assignedConfirmedGuests /
                              seating.confirmedGuests
                            ) * 100,
                          ),
                        )
                      : 0
                  }%`,
              }}
            />
          </div>

          <footer>
            <div>
              <strong>
                {seating.tableCount}
              </strong>

              <span>mesas criadas</span>
            </div>

            <div>
              <strong>
                {seating.capacity}
              </strong>

              <span>lugares disponíveis</span>
            </div>

            <div
              className={
                seating.unassignedConfirmedGuests >
                0
                  ? styles.warning
                  : ""
              }
            >
              <strong>
                {
                  seating.unassignedConfirmedGuests
                }
              </strong>

              <span>sem mesa</span>
            </div>
          </footer>
        </article>

        <article
          className={`${styles.card} ${styles.ceremonyCard}`}
        >
          <header>
            <div
              className={styles.icon}
              aria-hidden="true"
            >
              ♡
            </div>

            <div>
              <span>Cerimônia</span>
              <h3>Roteiro do grande dia</h3>
            </div>

            <Link href="/painel/cerimonia">
              Abrir
              <span aria-hidden="true">
                →
              </span>
            </Link>
          </header>

          <div
            className={styles.mainValue}
          >
            <strong>
              {ceremony.blockCount}
            </strong>

            <span>
              momentos no roteiro
            </span>
          </div>

          <footer>
            <div>
              <strong>
                {ceremony.confirmedCount}
              </strong>

              <span>confirmados</span>
            </div>

            <div
              className={
                ceremony.attentionCount >
                0
                  ? styles.danger
                  : ""
              }
            >
              <strong>
                {
                  ceremony.attentionCount
                }
              </strong>

              <span>precisam de atenção</span>
            </div>

            <div>
              <strong>
                {formatDuration(
                  ceremony.totalDurationMinutes,
                )}
              </strong>

              <span>duração prevista</span>
            </div>
          </footer>
        </article>

        {privateDress && (
          <article
            className={`${styles.card} ${styles.dressCard}`}
          >
            <header>
              <div
                className={styles.icon}
                aria-hidden="true"
              >
                ✦
              </div>

              <div>
                <span>Área privada</span>
                <h3>Vestido da noiva</h3>
              </div>

              <Link href="/painel/fornecedores">
                Abrir
                <span aria-hidden="true">
                  →
                </span>
              </Link>
            </header>

            {privateDress.nextAppointment ? (
              <div
                className={styles.highlight}
              >
                <div
                  className={
                    styles.privateSymbol
                  }
                  aria-hidden="true"
                >
                  ♡
                </div>

                <div>
                  <strong>
                    {
                      privateDress
                        .nextAppointment
                        .title
                    }
                  </strong>

                  <span>
                    {formatDateTime(
                      privateDress
                        .nextAppointment
                        .appointmentAt,
                      timeZone,
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <p
                className={styles.empty}
              >
                Nenhum compromisso futuro
                cadastrado.
              </p>
            )}

            <footer>
              <div>
                <strong>
                  {
                    privateDress.optionCount
                  }
                </strong>

                <span>opções salvas</span>
              </div>

              <div>
                <strong>
                  {
                    privateDress.chosenCount
                  }
                </strong>

                <span>escolhidas</span>
              </div>
            </footer>
          </article>
        )}
      </div>
    </section>
  );
}
