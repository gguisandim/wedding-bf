"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import styles from "./monthlypayments.module.css";

export type MonthlyPaymentItem = {
  id: number;

  title: string;
  supplier: string;
  category: string;

  amount: number;
  dueDay: number;

  monthOffset: 0 | 1;
  status: "paid" | "pending";
};

type MonthlyPaymentsProps = {
  items: MonthlyPaymentItem[];
};

type DisplayStatus =
  | "paid"
  | "pending"
  | "overdue";

type PreparedPayment =
  MonthlyPaymentItem & {
    dueDate: Date;
    displayStatus: DisplayStatus;
  };

type PaymentStatement = {
  monthOffset: 0 | 1;
  monthLabel: string;
  shortLabel: string;

  items: PreparedPayment[];

  total: number;
  paid: number;
  remaining: number;
  percentage: number;
};

const statusLabels: Record<
  DisplayStatus,
  string
> = {
  paid: "Pago",
  pending: "A pagar",
  overdue: "Vencido",
};

const statusClasses: Record<
  DisplayStatus,
  string
> = {
  paid: styles.statusPaid,
  pending: styles.statusPending,
  overdue: styles.statusOverdue,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getMonthDate(
  referenceDate: Date,
  monthOffset: number,
) {
  return new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() +
      monthOffset,
    1,
  );
}

function getDueDate(
  referenceDate: Date,
  monthOffset: number,
  dueDay: number,
) {
  const monthDate = getMonthDate(
    referenceDate,
    monthOffset,
  );

  const lastDay = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    0,
  ).getDate();

  return new Date(
    monthDate.getFullYear(),
    monthDate.getMonth(),
    Math.min(dueDay, lastDay),
  );
}

function formatMonth(date: Date) {
  const label =
    new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
    }).format(date);

  return (
    label.charAt(0).toUpperCase() +
    label.slice(1)
  );
}

function formatDueDate(date: Date) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "short",
    },
  )
    .format(date)
    .replace(".", "");
}

function getDisplayStatus(
  item: MonthlyPaymentItem,
  dueDate: Date,
  today: Date,
): DisplayStatus {
  if (item.status === "paid") {
    return "paid";
  }

  const todayAtMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  if (
    item.monthOffset === 0 &&
    dueDate < todayAtMidnight
  ) {
    return "overdue";
  }

  return "pending";
}

export default function MonthlyPayments({
  items,
}: MonthlyPaymentsProps) {
  const [today, setToday] =
    useState<Date | null>(null);

  useEffect(() => {
    setToday(new Date());
  }, []);

  const statements = useMemo<
    PaymentStatement[]
  >(() => {
    if (!today) {
      return [];
    }

    return ([0, 1] as const).map(
      (monthOffset) => {
        const monthDate = getMonthDate(
          today,
          monthOffset,
        );

        const statementItems = items
          .filter(
            (item) =>
              item.monthOffset ===
              monthOffset,
          )
          .map((item) => {
            const dueDate = getDueDate(
              today,
              monthOffset,
              item.dueDay,
            );

            return {
              ...item,
              dueDate,
              displayStatus:
                getDisplayStatus(
                  item,
                  dueDate,
                  today,
                ),
            };
          })
          .sort(
            (first, second) =>
              first.dueDate.getTime() -
              second.dueDate.getTime(),
          );

        const total =
          statementItems.reduce(
            (sum, item) =>
              sum + item.amount,
            0,
          );

        const paid =
          statementItems
            .filter(
              (item) =>
                item.displayStatus ===
                "paid",
            )
            .reduce(
              (sum, item) =>
                sum + item.amount,
              0,
            );

        const remaining =
          total - paid;

        const percentage =
          total > 0
            ? Math.round(
                (paid / total) * 100,
              )
            : 0;

        return {
          monthOffset,
          monthLabel:
            formatMonth(monthDate),

          shortLabel:
            monthOffset === 0
              ? "Fatura atual"
              : "Próxima fatura",

          items: statementItems,

          total,
          paid,
          remaining,
          percentage,
        };
      },
    );
  }, [items, today]);

  const nextTwoMonthsRemaining =
    statements.reduce(
      (total, statement) =>
        total + statement.remaining,
      0,
    );

  if (!today) {
    return (
      <section
        className={styles.section}
        aria-label="Pagamentos mensais"
      >
        <div className={styles.loading}>
          Carregando pagamentos...
        </div>
      </section>
    );
  }

  return (
    <section
      className={styles.section}
      aria-labelledby="monthly-payments-title"
    >
      <header
        className={styles.sectionHeader}
      >
        <div>
          <span className={styles.eyebrow}>
            Planejamento financeiro
          </span>

          <h2 id="monthly-payments-title">
            Faturas dos próximos meses
          </h2>

          <p>
            Visualize rapidamente as parcelas
            previstas para o mês atual e para
            o próximo mês.
          </p>
        </div>

        <div
          className={styles.totalOverview}
        >
          <span>
            Total ainda a pagar
          </span>

          <strong>
            {formatCurrency(
              nextTwoMonthsRemaining,
            )}
          </strong>

          <small>
            Considerando os próximos dois
            meses
          </small>
        </div>
      </header>

      <div
        className={styles.statementGrid}
      >
        {statements.map((statement) => (
          <article
            key={statement.monthOffset}
            className={`${styles.statementCard} ${
              statement.monthOffset === 0
                ? styles.currentStatement
                : ""
            }`}
          >
            <header
              className={
                styles.statementHeader
              }
            >
              <div>
                <span
                  className={
                    styles.statementType
                  }
                >
                  {statement.shortLabel}
                </span>

                <h3>
                  {statement.monthLabel}
                </h3>
              </div>

              <div
                className={
                  styles.statementTotal
                }
              >
                <span>Valor previsto</span>

                <strong>
                  {formatCurrency(
                    statement.total,
                  )}
                </strong>
              </div>
            </header>

            <div
              className={
                styles.paymentProgress
              }
            >
              <div
                className={
                  styles.progressHeader
                }
              >
                <span>
                  {formatCurrency(
                    statement.paid,
                  )}{" "}
                  pagos
                </span>

                <strong>
                  {statement.percentage}%
                </strong>
              </div>

              <div
                className={
                  styles.progressTrack
                }
              >
                <span
                  className={
                    styles.progressFill
                  }
                  style={{
                    width: `${statement.percentage}%`,
                  }}
                />
              </div>
            </div>

            <div
              className={
                styles.statementSummary
              }
            >
              <div>
                <span>Pago</span>

                <strong>
                  {formatCurrency(
                    statement.paid,
                  )}
                </strong>
              </div>

              <div>
                <span>A pagar</span>

                <strong>
                  {formatCurrency(
                    statement.remaining,
                  )}
                </strong>
              </div>

              <div>
                <span>Parcelas</span>

                <strong>
                  {statement.items.length}
                </strong>
              </div>
            </div>

            {statement.items.length > 0 ? (
              <div
                className={
                  styles.paymentList
                }
              >
                {statement.items.map(
                  (item) => (
                    <article
                      key={item.id}
                      className={
                        styles.paymentItem
                      }
                    >
                      <div
                        className={
                          styles.dueDate
                        }
                      >
                        <strong>
                          {String(
                            item.dueDate.getDate(),
                          ).padStart(2, "0")}
                        </strong>

                        <span>
                          {new Intl.DateTimeFormat(
                            "pt-BR",
                            {
                              month:
                                "short",
                            },
                          )
                            .format(
                              item.dueDate,
                            )
                            .replace(
                              ".",
                              "",
                            )}
                        </span>
                      </div>

                      <div
                        className={
                          styles.paymentIdentity
                        }
                      >
                        <strong>
                          {item.title}
                        </strong>

                        <span>
                          {item.supplier}
                        </span>

                        <small>
                          {item.category} · Vence{" "}
                          {formatDueDate(
                            item.dueDate,
                          )}
                        </small>
                      </div>

                      <div
                        className={
                          styles.paymentAmount
                        }
                      >
                        <strong>
                          {formatCurrency(
                            item.amount,
                          )}
                        </strong>

                        <span
                          className={`${styles.statusBadge} ${
                            statusClasses[
                              item
                                .displayStatus
                            ]
                          }`}
                        >
                          {
                            statusLabels[
                              item
                                .displayStatus
                            ]
                          }
                        </span>
                      </div>
                    </article>
                  ),
                )}
              </div>
            ) : (
              <div className={styles.empty}>
                <span aria-hidden="true">
                  ✓
                </span>

                <strong>
                  Nenhum pagamento previsto
                </strong>

                <p>
                  Não existem parcelas
                  cadastradas para este mês.
                </p>
              </div>
            )}

            <footer
              className={
                styles.statementFooter
              }
            >
              <span>
                Saldo da fatura
              </span>

              <strong>
                {formatCurrency(
                  statement.remaining,
                )}
              </strong>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}