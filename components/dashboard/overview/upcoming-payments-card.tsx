import Link from "next/link";

import type { UpcomingPayable } from "@/lib/data/upcoming-payables";

import styles from "./upcoming-payments-card.module.css";

type UpcomingPaymentsCardProps = {
  items: UpcomingPayable[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  ).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(
    "pt-BR",
  ).format(
    new Date(
      `${value}T00:00:00`,
    ),
  );
}

export default function UpcomingPaymentsCard({
  items,
}: UpcomingPaymentsCardProps) {
  return (
    <section className={styles.card}>
      <header>
        <div>
          <span>
            Financeiro
          </span>

          <h2>
            Próximas contas
          </h2>
        </div>

        <Link href="/painel/financeiro">
          Ver todas
        </Link>
      </header>

      {items.length > 0 ? (
        <div className={styles.list}>
          {items.map((item) => (
            <article
              key={item.id}
              className={
                item.isOverdue
                  ? styles.overdue
                  : ""
              }
            >
              <div>
                <strong>
                  {item.serviceName}
                </strong>

                <span>
                  {item.description}
                  {item.supplierName
                    ? ` · ${item.supplierName}`
                    : ""}
                </span>
              </div>

              <div>
                <strong>
                  {formatCurrency(
                    item.remainingAmount,
                  )}
                </strong>

                <span>
                  {item.isOverdue
                    ? "Atrasada"
                    : `Até ${formatDate(item.dueDate)}`}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>
          Nenhuma conta pendente.
        </p>
      )}
    </section>
  );
}
