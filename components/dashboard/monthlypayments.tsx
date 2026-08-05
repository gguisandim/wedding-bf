import styles from "./monthlypayments.module.css";

export type MonthlyPaymentItem = {
  id: string;

  title: string;
  service: string;
  category: string;

  amount: number;
  paidAmount: number;
  dueDate: string;

  status:
    | "paid"
    | "partially_paid"
    | "pending";
};

type MonthlyPaymentsProps = {
  items: MonthlyPaymentItem[];
  referenceDate: string;
};

type DisplayStatus =
  | "paid"
  | "partial"
  | "pending"
  | "overdue";

type PreparedPayment =
  MonthlyPaymentItem & {
    displayStatus:
      DisplayStatus;

    remainingAmount: number;
  };

type PaymentStatement = {
  monthKey: string;
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
  partial: "Parcial",
  pending: "A pagar",
  overdue: "Vencido",
};

const statusClasses: Record<
  DisplayStatus,
  string
> = {
  paid: styles.statusPaid,
  partial: styles.statusPartial,
  pending: styles.statusPending,
  overdue: styles.statusOverdue,
};

function formatCurrency(
  value: number,
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  ).format(value);
}

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

function dateToIso(
  value: Date,
) {
  return [
    value.getFullYear(),
    String(
      value.getMonth() + 1,
    ).padStart(2, "0"),
    String(
      value.getDate(),
    ).padStart(2, "0"),
  ].join("-");
}

function addMonths(
  value: string,
  amount: number,
) {
  const date =
    parseDateOnly(
      `${value.slice(0, 7)}-01`,
    );

  date.setMonth(
    date.getMonth() + amount,
  );

  return dateToIso(date).slice(
    0,
    7,
  );
}

function formatMonth(
  monthKey: string,
) {
  const label =
    new Intl.DateTimeFormat(
      "pt-BR",
      {
        month: "long",
        year: "numeric",
      },
    ).format(
      parseDateOnly(
        `${monthKey}-01`,
      ),
    );

  return (
    label.charAt(0).toUpperCase() +
    label.slice(1)
  );
}

function formatDueDate(
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

function getDisplayStatus(
  item: MonthlyPaymentItem,
  referenceDate: string,
): DisplayStatus {
  const remaining =
    Math.max(
      0,
      item.amount -
        item.paidAmount,
    );

  if (
    item.status === "paid" ||
    remaining === 0
  ) {
    return "paid";
  }

  if (
    item.dueDate <
    referenceDate
  ) {
    return "overdue";
  }

  if (
    item.status ===
      "partially_paid" ||
    item.paidAmount > 0
  ) {
    return "partial";
  }

  return "pending";
}

export default function MonthlyPayments({
  items,
  referenceDate,
}: MonthlyPaymentsProps) {
  const currentMonth =
    referenceDate.slice(0, 7);

  const nextMonth =
    addMonths(
      referenceDate,
      1,
    );

  const statements:
    PaymentStatement[] =
    [
      {
        monthKey:
          currentMonth,

        shortLabel:
          "Fatura atual",
      },

      {
        monthKey:
          nextMonth,

        shortLabel:
          "Próxima fatura",
      },
    ].map(
      ({
        monthKey,
        shortLabel,
      }) => {
        const statementItems =
          items
            .filter(
              (item) =>
                item.dueDate.slice(
                  0,
                  7,
                ) === monthKey,
            )
            .map(
              (
                item,
              ): PreparedPayment => ({
                ...item,

                displayStatus:
                  getDisplayStatus(
                    item,
                    referenceDate,
                  ),

                remainingAmount:
                  Math.max(
                    0,
                    item.amount -
                      item.paidAmount,
                  ),
              }),
            )
            .sort(
              (first, second) =>
                first.dueDate.localeCompare(
                  second.dueDate,
                ),
            );

        const total =
          statementItems.reduce(
            (sum, item) =>
              sum + item.amount,
            0,
          );

        const paid =
          statementItems.reduce(
            (sum, item) =>
              sum +
              Math.min(
                item.amount,
                Math.max(
                  0,
                  item.paidAmount,
                ),
              ),
            0,
          );

        const remaining =
          Math.max(
            0,
            total - paid,
          );

        const percentage =
          total > 0
            ? Math.round(
                (
                  paid /
                  total
                ) * 100,
              )
            : 0;

        return {
          monthKey,
          monthLabel:
            formatMonth(
              monthKey,
            ),
          shortLabel,
          items:
            statementItems,
          total,
          paid,
          remaining,
          percentage,
        };
      },
    );

  const nextTwoMonthsRemaining =
    statements.reduce(
      (total, statement) =>
        total +
        statement.remaining,
      0,
    );

  return (
    <section
      className={styles.section}
      aria-labelledby="monthly-payments-title"
    >
      <header
        className={styles.sectionHeader}
      >
        <div>
          <span
            className={styles.eyebrow}
          >
            Planejamento financeiro
          </span>

          <h2 id="monthly-payments-title">
            Contas dos próximos meses
          </h2>

          <p>
            Valores cadastrados no
            orçamento com vencimento no
            mês atual e no próximo mês.
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
            Considerando os próximos
            dois meses
          </small>
        </div>
      </header>

      <div
        className={styles.statementGrid}
      >
        {statements.map(
          (statement, index) => (
            <article
              key={
                statement.monthKey
              }
              className={`${styles.statementCard} ${
                index === 0
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
                    {
                      statement.shortLabel
                    }
                  </span>

                  <h3>
                    {
                      statement.monthLabel
                    }
                  </h3>
                </div>

                <div
                  className={
                    styles.statementTotal
                  }
                >
                  <span>
                    Total das contas
                  </span>

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
                    )}
                    {" "}
                    pagos
                  </span>

                  <strong>
                    {
                      statement.percentage
                    }
                    %
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
                      width:
                        `${statement.percentage}%`,
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
                  <span>Contas</span>

                  <strong>
                    {
                      statement.items
                        .length
                    }
                  </strong>
                </div>
              </div>

              {statement.items.length >
              0 ? (
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
                            {item.dueDate.slice(
                              8,
                              10,
                            )}
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
                                parseDateOnly(
                                  item.dueDate,
                                ),
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
                            {
                              item.title
                            }
                          </strong>

                          <span>
                            {
                              item.service
                            }
                          </span>

                          <small>
                            {
                              item.category
                            }
                            {" · Vence "}
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
                              item.remainingAmount >
                                0
                                ? item.remainingAmount
                                : item.amount,
                            )}
                          </strong>

                          {item.displayStatus ===
                            "partial" && (
                            <small>
                              de
                              {" "}
                              {formatCurrency(
                                item.amount,
                              )}
                            </small>
                          )}

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
                <div
                  className={
                    styles.empty
                  }
                >
                  <span
                    aria-hidden="true"
                  >
                    ✓
                  </span>

                  <strong>
                    Nenhuma conta
                    prevista
                  </strong>

                  <p>
                    Não existem parcelas
                    cadastradas para este
                    mês.
                  </p>
                </div>
              )}

              <footer
                className={
                  styles.statementFooter
                }
              >
                <span>
                  Saldo do mês
                </span>

                <strong>
                  {formatCurrency(
                    statement.remaining,
                  )}
                </strong>
              </footer>
            </article>
          ),
        )}
      </div>
    </section>
  );
}
