"use client";

import {
  type FormEvent,
  useMemo,
  useState,
} from "react";

import styles from "./budget-manager.module.css";

export type BudgetCategoryKey =
  | "venue"
  | "buffet"
  | "decor"
  | "photo"
  | "music"
  | "attire"
  | "stationery"
  | "other";

export type ExpenseStatus =
  | "paid"
  | "partial"
  | "pending"
  | "estimate";

export type BudgetCategory = {
  key: BudgetCategoryKey;
  label: string;
  limit: number;
};

export type BudgetExpense = {
  id: string;
  description: string;
  supplier: string;
  category: BudgetCategoryKey;

  totalAmount: number;
  paidAmount: number;

  status: ExpenseStatus;

  dueDate?: string;
  notes?: string;
};

type BudgetManagerProps = {
  initialBudget: number;
  initialCategories: BudgetCategory[];
  initialExpenses: BudgetExpense[];
};

type ExpenseFormState = {
  id: string | null;
  description: string;
  supplier: string;
  category: BudgetCategoryKey;
  totalAmount: string;
  paidAmount: string;
  status: ExpenseStatus;
  dueDate: string;
  notes: string;
};

const emptyExpenseForm: ExpenseFormState = {
  id: null,
  description: "",
  supplier: "",
  category: "venue",
  totalAmount: "",
  paidAmount: "",
  status: "pending",
  dueDate: "",
  notes: "",
};

const statusLabels: Record<
  ExpenseStatus,
  string
> = {
  paid: "Pago",
  partial: "Parcialmente pago",
  pending: "A pagar",
  estimate: "Estimativa",
};

const statusClasses: Record<
  ExpenseStatus,
  string
> = {
  paid: styles.statusPaid,
  partial: styles.statusPartial,
  pending: styles.statusPending,
  estimate: styles.statusEstimate,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(date?: string) {
  if (!date) {
    return "Sem vencimento";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(
    new Date(`${date}T12:00:00`),
  );
}

function normalizeMoney(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, value);
}

export default function BudgetManager({
  initialBudget,
  initialCategories,
  initialExpenses,
}: BudgetManagerProps) {
  const [budgetLimit, setBudgetLimit] =
    useState(initialBudget);

  const [expenses, setExpenses] =
    useState<BudgetExpense[]>(
      initialExpenses,
    );

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<ExpenseStatus | "all">(
      "all",
    );

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState<
    BudgetCategoryKey | "all"
  >("all");

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [expenseForm, setExpenseForm] =
    useState<ExpenseFormState>(
      emptyExpenseForm,
    );

  const [formError, setFormError] =
    useState("");

  const [feedback, setFeedback] =
    useState<string | null>(null);

  const [
    isEditingBudget,
    setIsEditingBudget,
  ] = useState(false);

  const [budgetDraft, setBudgetDraft] =
    useState(String(initialBudget));

  const categoryMap = useMemo(
    () =>
      new Map(
        initialCategories.map(
          (category) => [
            category.key,
            category,
          ],
        ),
      ),
    [initialCategories],
  );

  const paidTotal = useMemo(
    () =>
      expenses
        .filter(
          (expense) =>
            expense.status !==
            "estimate",
        )
        .reduce(
          (total, expense) =>
            total +
            Math.min(
              expense.paidAmount,
              expense.totalAmount,
            ),
          0,
        ),
    [expenses],
  );

  const committedTotal = useMemo(
    () =>
      expenses
        .filter(
          (expense) =>
            expense.status !==
            "estimate",
        )
        .reduce(
          (total, expense) =>
            total +
            Math.max(
              0,
              expense.totalAmount -
                expense.paidAmount,
            ),
          0,
        ),
    [expenses],
  );

  const contractedTotal =
    paidTotal + committedTotal;

  const availableTotal =
    budgetLimit - contractedTotal;

  const estimatedTotal = useMemo(
    () =>
      expenses
        .filter(
          (expense) =>
            expense.status ===
            "estimate",
        )
        .reduce(
          (total, expense) =>
            total +
            expense.totalAmount,
          0,
        ),
    [expenses],
  );

  const budgetUsage =
    budgetLimit > 0
      ? Math.min(
          100,
          Math.round(
            (contractedTotal /
              budgetLimit) *
              100,
          ),
        )
      : 0;

  const categorySummaries =
    useMemo(() => {
      return initialCategories.map(
        (category) => {
          const categoryExpenses =
            expenses.filter(
              (expense) =>
                expense.category ===
                  category.key &&
                expense.status !==
                  "estimate",
            );

          const used =
            categoryExpenses.reduce(
              (total, expense) =>
                total +
                expense.totalAmount,
              0,
            );

          const paid =
            categoryExpenses.reduce(
              (total, expense) =>
                total +
                Math.min(
                  expense.paidAmount,
                  expense.totalAmount,
                ),
              0,
            );

          const estimate =
            expenses
              .filter(
                (expense) =>
                  expense.category ===
                    category.key &&
                  expense.status ===
                    "estimate",
              )
              .reduce(
                (total, expense) =>
                  total +
                  expense.totalAmount,
                0,
              );

          const percentage =
            category.limit > 0
              ? Math.min(
                  100,
                  Math.round(
                    (used /
                      category.limit) *
                      100,
                  ),
                )
              : 0;

          return {
            ...category,
            used,
            paid,
            estimate,
            percentage,
            available:
              category.limit - used,
          };
        },
      );
    }, [
      expenses,
      initialCategories,
    ]);

  const upcomingPayments =
    useMemo(() => {
      return expenses
        .filter(
          (expense) =>
            expense.status !==
              "estimate" &&
            expense.status !==
              "paid" &&
            expense.dueDate,
        )
        .sort((first, second) =>
          String(
            first.dueDate,
          ).localeCompare(
            String(second.dueDate),
          ),
        )
        .slice(0, 4);
    }, [expenses]);

  const filteredExpenses =
    useMemo(() => {
      const normalizedSearch = search
        .trim()
        .toLocaleLowerCase("pt-BR");

      return expenses.filter(
        (expense) => {
          const category =
            categoryMap.get(
              expense.category,
            );

          const matchesSearch =
            !normalizedSearch ||
            expense.description
              .toLocaleLowerCase(
                "pt-BR",
              )
              .includes(
                normalizedSearch,
              ) ||
            expense.supplier
              .toLocaleLowerCase(
                "pt-BR",
              )
              .includes(
                normalizedSearch,
              ) ||
            category?.label
              .toLocaleLowerCase(
                "pt-BR",
              )
              .includes(
                normalizedSearch,
              );

          const matchesStatus =
            statusFilter === "all" ||
            expense.status ===
              statusFilter;

          const matchesCategory =
            categoryFilter === "all" ||
            expense.category ===
              categoryFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesCategory
          );
        },
      );
    }, [
      categoryFilter,
      categoryMap,
      expenses,
      search,
      statusFilter,
    ]);

  function showFeedback(
    message: string,
  ) {
    setFeedback(message);

    window.setTimeout(() => {
      setFeedback(null);
    }, 2800);
  }

  function openCreateExpenseModal() {
    setExpenseForm(
      emptyExpenseForm,
    );

    setFormError("");
    setIsModalOpen(true);
  }

  function openEditExpenseModal(
    expense: BudgetExpense,
  ) {
    setExpenseForm({
      id: expense.id,
      description:
        expense.description,
      supplier: expense.supplier,
      category: expense.category,
      totalAmount: String(
        expense.totalAmount,
      ),
      paidAmount: String(
        expense.paidAmount,
      ),
      status: expense.status,
      dueDate:
        expense.dueDate || "",
      notes: expense.notes || "",
    });

    setFormError("");
    setIsModalOpen(true);
  }

  function closeExpenseModal() {
    setIsModalOpen(false);
    setFormError("");
    setExpenseForm(
      emptyExpenseForm,
    );
  }

  function saveExpense(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const description =
      expenseForm.description.trim();

    const supplier =
      expenseForm.supplier.trim();

    const totalAmount =
      normalizeMoney(
        Number(
          expenseForm.totalAmount,
        ),
      );

    let paidAmount =
      normalizeMoney(
        Number(
          expenseForm.paidAmount,
        ),
      );

    if (!description) {
      setFormError(
        "Informe uma descrição para a despesa.",
      );

      return;
    }

    if (!supplier) {
      setFormError(
        "Informe o fornecedor ou responsável.",
      );

      return;
    }

    if (totalAmount <= 0) {
      setFormError(
        "Informe um valor total válido.",
      );

      return;
    }

    if (
      expenseForm.status === "paid"
    ) {
      paidAmount = totalAmount;
    }

    if (
      expenseForm.status ===
        "pending" ||
      expenseForm.status ===
        "estimate"
    ) {
      paidAmount = 0;
    }

    if (
      paidAmount > totalAmount
    ) {
      setFormError(
        "O valor pago não pode ser maior que o valor total.",
      );

      return;
    }

    if (
      expenseForm.status ===
        "partial" &&
      paidAmount <= 0
    ) {
      setFormError(
        "Informe o valor já pago.",
      );

      return;
    }

    const expense: BudgetExpense = {
      id:
        expenseForm.id ||
        `expense-${Date.now()}`,
      description,
      supplier,
      category:
        expenseForm.category,
      totalAmount,
      paidAmount,
      status: expenseForm.status,
      dueDate:
        expenseForm.dueDate ||
        undefined,
      notes:
        expenseForm.notes.trim() ||
        undefined,
    };

    if (expenseForm.id) {
      setExpenses(
        (currentExpenses) =>
          currentExpenses.map(
            (currentExpense) =>
              currentExpense.id ===
              expense.id
                ? expense
                : currentExpense,
          ),
      );

      showFeedback(
        "Despesa atualizada.",
      );
    } else {
      setExpenses(
        (currentExpenses) => [
          expense,
          ...currentExpenses,
        ],
      );

      showFeedback(
        "Nova despesa adicionada.",
      );
    }

    closeExpenseModal();
  }

  function updateExpenseStatus(
    expenseId: string,
    status: ExpenseStatus,
  ) {
    setExpenses(
      (currentExpenses) =>
        currentExpenses.map(
          (expense) => {
            if (
              expense.id !==
              expenseId
            ) {
              return expense;
            }

            let paidAmount =
              expense.paidAmount;

            if (status === "paid") {
              paidAmount =
                expense.totalAmount;
            }

            if (
              status === "pending" ||
              status === "estimate"
            ) {
              paidAmount = 0;
            }

            if (
              status === "partial" &&
              paidAmount <= 0
            ) {
              paidAmount =
                expense.totalAmount /
                2;
            }

            return {
              ...expense,
              status,
              paidAmount,
            };
          },
        ),
    );

    showFeedback(
      "Situação do pagamento atualizada.",
    );
  }

  function deleteExpense(
    expenseId: string,
  ) {
    const expense = expenses.find(
      (item) =>
        item.id === expenseId,
    );

    if (!expense) {
      return;
    }

    const confirmed =
      window.confirm(
        `Excluir a despesa "${expense.description}"?`,
      );

    if (!confirmed) {
      return;
    }

    setExpenses(
      (currentExpenses) =>
        currentExpenses.filter(
          (item) =>
            item.id !== expenseId,
        ),
    );

    showFeedback(
      "Despesa excluída.",
    );
  }

  function saveBudgetLimit() {
    const newBudget =
      normalizeMoney(
        Number(budgetDraft),
      );

    if (newBudget <= 0) {
      showFeedback(
        "Informe um orçamento válido.",
      );

      return;
    }

    setBudgetLimit(newBudget);
    setIsEditingBudget(false);

    showFeedback(
      "Valor do orçamento atualizado.",
    );
  }

  return (
    <div className={styles.page}>
      {feedback && (
        <div
          className={styles.feedback}
          role="status"
          aria-live="polite"
        >
          <span aria-hidden="true">
            ✓
          </span>

          {feedback}
        </div>
      )}

      <header
        className={styles.pageHeader}
      >
        <div className={styles.headerCopy}>
          <span
            className={styles.eyebrow}
          >
            Planejamento financeiro
          </span>

          <h1>Orçamento</h1>

          <p>
            Acompanhe contratos,
            pagamentos e estimativas para
            manter as despesas do casamento
            sob controle.
          </p>
        </div>

        <div
          className={styles.headerActions}
        >
          {isEditingBudget ? (
            <div
              className={
                styles.budgetEditor
              }
            >
              <label>
                <span>Orçamento total</span>

                <input
                  type="number"
                  min={1}
                  value={budgetDraft}
                  onChange={(event) =>
                    setBudgetDraft(
                      event.target.value,
                    )
                  }
                />
              </label>

              <button
                type="button"
                onClick={
                  saveBudgetLimit
                }
              >
                Salvar
              </button>

              <button
                type="button"
                className={
                  styles.cancelBudgetButton
                }
                onClick={() => {
                  setBudgetDraft(
                    String(
                      budgetLimit,
                    ),
                  );

                  setIsEditingBudget(
                    false,
                  );
                }}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={
                styles.secondaryButton
              }
              onClick={() =>
                setIsEditingBudget(
                  true,
                )
              }
            >
              Editar orçamento
            </button>
          )}

          <button
            type="button"
            className={
              styles.primaryButton
            }
            onClick={
              openCreateExpenseModal
            }
          >
            <span aria-hidden="true">
              +
            </span>

            Nova despesa
          </button>
        </div>

        <div
          className={styles.summaryGrid}
        >
          <article
            className={styles.summaryCard}
          >
            <span
              className={`${styles.summaryIcon} ${styles.budgetIcon}`}
              aria-hidden="true"
            >
              R$
            </span>

            <div>
              <span>
                Orçamento total
              </span>

              <strong>
                {formatCurrency(
                  budgetLimit,
                )}
              </strong>
            </div>
          </article>

          <article
            className={styles.summaryCard}
          >
            <span
              className={`${styles.summaryIcon} ${styles.paidIcon}`}
              aria-hidden="true"
            >
              ✓
            </span>

            <div>
              <span>Total pago</span>

              <strong>
                {formatCurrency(
                  paidTotal,
                )}
              </strong>
            </div>
          </article>

          <article
            className={styles.summaryCard}
          >
            <span
              className={`${styles.summaryIcon} ${styles.committedIcon}`}
              aria-hidden="true"
            >
              ◷
            </span>

            <div>
              <span>
                Ainda comprometido
              </span>

              <strong>
                {formatCurrency(
                  committedTotal,
                )}
              </strong>
            </div>
          </article>

          <article
            className={`${styles.summaryCard} ${
              availableTotal < 0
                ? styles.negativeSummary
                : ""
            }`}
          >
            <span
              className={`${styles.summaryIcon} ${styles.availableIcon}`}
              aria-hidden="true"
            >
              =
            </span>

            <div>
              <span>Disponível</span>

              <strong>
                {formatCurrency(
                  availableTotal,
                )}
              </strong>
            </div>
          </article>
        </div>
      </header>

      <section
        className={styles.overviewGrid}
      >
        <article
          className={styles.budgetOverview}
        >
          <header>
            <div>
              <span
                className={
                  styles.eyebrow
                }
              >
                Visão geral
              </span>

              <h2>
                Utilização do orçamento
              </h2>
            </div>

            <span
              className={
                styles.contractCount
              }
            >
              {
                expenses.filter(
                  (expense) =>
                    expense.status !==
                    "estimate",
                ).length
              }{" "}
              compromissos
            </span>
          </header>

          <div
            className={
              styles.overviewContent
            }
          >
            <div
              className={
                styles.budgetRing
              }
              style={{
                background: `conic-gradient(
                  var(--dashboard-accent, #92966f)
                  ${budgetUsage}%,
                  rgba(64, 77, 119, 0.08)
                  ${budgetUsage}%
                )`,
              }}
            >
              <div>
                <strong>
                  {budgetUsage}%
                </strong>

                <span>utilizado</span>
              </div>
            </div>

            <div
              className={
                styles.overviewDetails
              }
            >
              <div>
                <span>
                  Valor contratado
                </span>

                <strong>
                  {formatCurrency(
                    contractedTotal,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Estimativas futuras
                </span>

                <strong>
                  {formatCurrency(
                    estimatedTotal,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Projeção total
                </span>

                <strong>
                  {formatCurrency(
                    contractedTotal +
                      estimatedTotal,
                  )}
                </strong>
              </div>
            </div>
          </div>

          <div
            className={
              styles.budgetProgress
            }
          >
            <div>
              <span>
                {formatCurrency(
                  contractedTotal,
                )}{" "}
                comprometidos
              </span>

              <span>
                {formatCurrency(
                  budgetLimit,
                )}
              </span>
            </div>

            <div
              className={
                styles.progressTrack
              }
            >
              <span
                className={
                  availableTotal < 0
                    ? styles.progressOver
                    : styles.progressFill
                }
                style={{
                  width: `${budgetUsage}%`,
                }}
              />
            </div>
          </div>
        </article>

        <article
          className={
            styles.upcomingCard
          }
        >
          <header>
            <div>
              <span
                className={
                  styles.eyebrow
                }
              >
                Agenda financeira
              </span>

              <h2>
                Próximos vencimentos
              </h2>
            </div>

            <span
              className={
                styles.contractCount
              }
            >
              {upcomingPayments.length}
            </span>
          </header>

          {upcomingPayments.length >
          0 ? (
            <div
              className={
                styles.upcomingList
              }
            >
              {upcomingPayments.map(
                (expense) => {
                  const remaining =
                    Math.max(
                      0,
                      expense.totalAmount -
                        expense.paidAmount,
                    );

                  return (
                    <article
                      key={expense.id}
                      className={
                        styles.upcomingItem
                      }
                    >
                      <div
                        className={
                          styles.upcomingDate
                        }
                      >
                        <strong>
                          {new Intl.DateTimeFormat(
                            "pt-BR",
                            {
                              day: "2-digit",
                            },
                          ).format(
                            new Date(
                              `${expense.dueDate}T12:00:00`,
                            ),
                          )}
                        </strong>

                        <span>
                          {new Intl.DateTimeFormat(
                            "pt-BR",
                            {
                              month:
                                "short",
                            },
                          ).format(
                            new Date(
                              `${expense.dueDate}T12:00:00`,
                            ),
                          )}
                        </span>
                      </div>

                      <div
                        className={
                          styles.upcomingIdentity
                        }
                      >
                        <strong>
                          {
                            expense.description
                          }
                        </strong>

                        <span>
                          {
                            expense.supplier
                          }
                        </span>
                      </div>

                      <strong
                        className={
                          styles.upcomingValue
                        }
                      >
                        {formatCurrency(
                          remaining,
                        )}
                      </strong>
                    </article>
                  );
                },
              )}
            </div>
          ) : (
            <div
              className={
                styles.emptyUpcoming
              }
            >
              <span aria-hidden="true">
                ✓
              </span>

              <strong>
                Nenhum vencimento pendente
              </strong>

              <p>
                Os pagamentos cadastrados
                estão concluídos ou sem data.
              </p>
            </div>
          )}
        </article>
      </section>

      <section
        className={styles.categorySection}
      >
        <header
          className={
            styles.sectionHeader
          }
        >
          <div>
            <span
              className={styles.eyebrow}
            >
              Distribuição
            </span>

            <h2>
              Orçamento por categoria
            </h2>
          </div>

          <span>
            {initialCategories.length}{" "}
            categorias
          </span>
        </header>

        <div
          className={styles.categoryGrid}
        >
          {categorySummaries.map(
            (category) => {
              const isOver =
                category.available < 0;

              return (
                <article
                  key={category.key}
                  className={`${styles.categoryCard} ${
                    isOver
                      ? styles.categoryOver
                      : ""
                  }`}
                >
                  <header>
                    <div>
                      <strong>
                        {category.label}
                      </strong>

                      <span>
                        {formatCurrency(
                          category.used,
                        )}{" "}
                        de{" "}
                        {formatCurrency(
                          category.limit,
                        )}
                      </span>
                    </div>

                    <span>
                      {
                        category.percentage
                      }
                      %
                    </span>
                  </header>

                  <div
                    className={
                      styles.progressTrack
                    }
                  >
                    <span
                      className={
                        isOver
                          ? styles.progressOver
                          : styles.progressFill
                      }
                      style={{
                        width: `${category.percentage}%`,
                      }}
                    />
                  </div>

                  <footer>
                    <span>
                      Pago:{" "}
                      <strong>
                        {formatCurrency(
                          category.paid,
                        )}
                      </strong>
                    </span>

                    <span>
                      {isOver
                        ? "Excedente"
                        : "Disponível"}
                      :{" "}
                      <strong>
                        {formatCurrency(
                          Math.abs(
                            category.available,
                          ),
                        )}
                      </strong>
                    </span>
                  </footer>

                  {category.estimate >
                    0 && (
                    <small>
                      Estimativas adicionais:{" "}
                      {formatCurrency(
                        category.estimate,
                      )}
                    </small>
                  )}
                </article>
              );
            },
          )}
        </div>
      </section>

      <section
        className={styles.expenseSection}
      >
        <header
          className={
            styles.sectionHeader
          }
        >
          <div>
            <span
              className={styles.eyebrow}
            >
              Lançamentos
            </span>

            <h2>
              Despesas do casamento
            </h2>
          </div>

          <span>
            {filteredExpenses.length}{" "}
            {filteredExpenses.length ===
            1
              ? "registro"
              : "registros"}
          </span>
        </header>

        <div
          className={styles.toolbar}
        >
          <label
            className={styles.searchBox}
          >
            <span aria-hidden="true">
              ⌕
            </span>

            <input
              type="search"
              value={search}
              placeholder="Buscar despesa ou fornecedor..."
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
            />
          </label>

          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(
                event.target
                  .value as
                  | BudgetCategoryKey
                  | "all",
              )
            }
            aria-label="Filtrar por categoria"
          >
            <option value="all">
              Todas as categorias
            </option>

            {initialCategories.map(
              (category) => (
                <option
                  key={category.key}
                  value={category.key}
                >
                  {category.label}
                </option>
              ),
            )}
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target
                  .value as
                  | ExpenseStatus
                  | "all",
              )
            }
            aria-label="Filtrar por situação"
          >
            <option value="all">
              Todas as situações
            </option>

            <option value="paid">
              Pago
            </option>

            <option value="partial">
              Parcialmente pago
            </option>

            <option value="pending">
              A pagar
            </option>

            <option value="estimate">
              Estimativa
            </option>
          </select>
        </div>

        {filteredExpenses.length >
        0 ? (
          <>
            <div
              className={
                styles.expenseTableWrapper
              }
            >
              <table
                className={
                  styles.expenseTable
                }
              >
                <thead>
                  <tr>
                    <th>Despesa</th>
                    <th>Categoria</th>
                    <th>Valor total</th>
                    <th>Pago</th>
                    <th>Vencimento</th>
                    <th>Situação</th>
                    <th aria-label="Ações" />
                  </tr>
                </thead>

                <tbody>
                  {filteredExpenses.map(
                    (expense) => (
                      <tr key={expense.id}>
                        <td>
                          <div
                            className={
                              styles.expenseIdentity
                            }
                          >
                            <strong>
                              {
                                expense.description
                              }
                            </strong>

                            <span>
                              {
                                expense.supplier
                              }
                            </span>
                          </div>
                        </td>

                        <td>
                          <span
                            className={
                              styles.categoryBadge
                            }
                          >
                            {
                              categoryMap.get(
                                expense.category,
                              )?.label
                            }
                          </span>
                        </td>

                        <td>
                          <strong>
                            {formatCurrency(
                              expense.totalAmount,
                            )}
                          </strong>
                        </td>

                        <td>
                          <div
                            className={
                              styles.paymentValue
                            }
                          >
                            <strong>
                              {formatCurrency(
                                expense.paidAmount,
                              )}
                            </strong>

                            {expense.status !==
                              "estimate" && (
                              <span>
                                Restante:{" "}
                                {formatCurrency(
                                  Math.max(
                                    0,
                                    expense.totalAmount -
                                      expense.paidAmount,
                                  ),
                                )}
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <span
                            className={
                              styles.dateValue
                            }
                          >
                            {formatDate(
                              expense.dueDate,
                            )}
                          </span>
                        </td>

                        <td>
                          <select
                            value={
                              expense.status
                            }
                            className={`${styles.statusSelect} ${
                              statusClasses[
                                expense.status
                              ]
                            }`}
                            onChange={(
                              event,
                            ) =>
                              updateExpenseStatus(
                                expense.id,
                                event.target
                                  .value as ExpenseStatus,
                              )
                            }
                          >
                            <option value="paid">
                              Pago
                            </option>

                            <option value="partial">
                              Parcialmente pago
                            </option>

                            <option value="pending">
                              A pagar
                            </option>

                            <option value="estimate">
                              Estimativa
                            </option>
                          </select>
                        </td>

                        <td>
                          <div
                            className={
                              styles.rowActions
                            }
                          >
                            <button
                              type="button"
                              onClick={() =>
                                openEditExpenseModal(
                                  expense,
                                )
                              }
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              className={
                                styles.deleteAction
                              }
                              onClick={() =>
                                deleteExpense(
                                  expense.id,
                                )
                              }
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            <div
              className={
                styles.mobileExpenseList
              }
            >
              {filteredExpenses.map(
                (expense) => (
                  <article
                    key={expense.id}
                    className={
                      styles.mobileExpenseCard
                    }
                  >
                    <header>
                      <div>
                        <strong>
                          {
                            expense.description
                          }
                        </strong>

                        <span>
                          {
                            expense.supplier
                          }
                        </span>
                      </div>

                      <span
                        className={
                          styles.categoryBadge
                        }
                      >
                        {
                          categoryMap.get(
                            expense.category,
                          )?.label
                        }
                      </span>
                    </header>

                    <div
                      className={
                        styles.mobileExpenseValues
                      }
                    >
                      <div>
                        <span>Total</span>

                        <strong>
                          {formatCurrency(
                            expense.totalAmount,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Pago</span>

                        <strong>
                          {formatCurrency(
                            expense.paidAmount,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Vencimento
                        </span>

                        <strong>
                          {formatDate(
                            expense.dueDate,
                          )}
                        </strong>
                      </div>
                    </div>

                    <select
                      value={expense.status}
                      className={`${styles.statusSelect} ${
                        statusClasses[
                          expense.status
                        ]
                      }`}
                      onChange={(event) =>
                        updateExpenseStatus(
                          expense.id,
                          event.target
                            .value as ExpenseStatus,
                        )
                      }
                    >
                      {Object.entries(
                        statusLabels,
                      ).map(
                        ([
                          status,
                          label,
                        ]) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {label}
                          </option>
                        ),
                      )}
                    </select>

                    <footer>
                      <button
                        type="button"
                        onClick={() =>
                          openEditExpenseModal(
                            expense,
                          )
                        }
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className={
                          styles.deleteAction
                        }
                        onClick={() =>
                          deleteExpense(
                            expense.id,
                          )
                        }
                      >
                        Excluir
                      </button>
                    </footer>
                  </article>
                ),
              )}
            </div>
          </>
        ) : (
          <div
            className={styles.emptyState}
          >
            <span aria-hidden="true">
              ⌕
            </span>

            <strong>
              Nenhuma despesa encontrada
            </strong>

            <p>
              Altere os filtros ou cadastre
              uma nova despesa.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setCategoryFilter("all");
              }}
            >
              Limpar filtros
            </button>
          </div>
        )}
      </section>

      {isModalOpen && (
        <div
          className={
            styles.modalOverlay
          }
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeExpenseModal();
            }
          }}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="expense-modal-title"
          >
            <header
              className={
                styles.modalHeader
              }
            >
              <div>
                <span
                  className={
                    styles.eyebrow
                  }
                >
                  Controle financeiro
                </span>

                <h2 id="expense-modal-title">
                  {expenseForm.id
                    ? "Editar despesa"
                    : "Nova despesa"}
                </h2>
              </div>

              <button
                type="button"
                className={
                  styles.closeButton
                }
                aria-label="Fechar"
                onClick={
                  closeExpenseModal
                }
              >
                ×
              </button>
            </header>

            <form
              className={styles.form}
              onSubmit={saveExpense}
            >
              <div
                className={
                  styles.formGrid
                }
              >
                <label
                  className={
                    styles.fullField
                  }
                >
                  <span>
                    Descrição
                  </span>

                  <input
                    type="text"
                    value={
                      expenseForm.description
                    }
                    placeholder="Ex.: Sinal do buffet"
                    autoFocus
                    onChange={(event) =>
                      setExpenseForm(
                        (
                          currentForm,
                        ) => ({
                          ...currentForm,
                          description:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Fornecedor
                  </span>

                  <input
                    type="text"
                    value={
                      expenseForm.supplier
                    }
                    placeholder="Nome do fornecedor"
                    onChange={(event) =>
                      setExpenseForm(
                        (
                          currentForm,
                        ) => ({
                          ...currentForm,
                          supplier:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />
                </label>

                <label>
                  <span>Categoria</span>

                  <select
                    value={
                      expenseForm.category
                    }
                    onChange={(event) =>
                      setExpenseForm(
                        (
                          currentForm,
                        ) => ({
                          ...currentForm,
                          category:
                            event.target
                              .value as BudgetCategoryKey,
                        }),
                      )
                    }
                  >
                    {initialCategories.map(
                      (category) => (
                        <option
                          key={
                            category.key
                          }
                          value={
                            category.key
                          }
                        >
                          {
                            category.label
                          }
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label>
                  <span>
                    Valor total
                  </span>

                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={
                      expenseForm.totalAmount
                    }
                    placeholder="0,00"
                    onChange={(event) =>
                      setExpenseForm(
                        (
                          currentForm,
                        ) => ({
                          ...currentForm,
                          totalAmount:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />
                </label>

                <label>
                  <span>Situação</span>

                  <select
                    value={
                      expenseForm.status
                    }
                    onChange={(event) =>
                      setExpenseForm(
                        (
                          currentForm,
                        ) => ({
                          ...currentForm,
                          status:
                            event.target
                              .value as ExpenseStatus,
                        }),
                      )
                    }
                  >
                    <option value="pending">
                      A pagar
                    </option>

                    <option value="partial">
                      Parcialmente pago
                    </option>

                    <option value="paid">
                      Pago
                    </option>

                    <option value="estimate">
                      Estimativa
                    </option>
                  </select>
                </label>

                <label>
                  <span>Valor pago</span>

                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={
                      expenseForm.status ===
                        "paid"
                        ? expenseForm.totalAmount
                        : expenseForm.paidAmount
                    }
                    disabled={
                      expenseForm.status ===
                        "paid" ||
                      expenseForm.status ===
                        "pending" ||
                      expenseForm.status ===
                        "estimate"
                    }
                    placeholder="0,00"
                    onChange={(event) =>
                      setExpenseForm(
                        (
                          currentForm,
                        ) => ({
                          ...currentForm,
                          paidAmount:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />
                </label>

                <label>
                  <span>Vencimento</span>

                  <input
                    type="date"
                    value={
                      expenseForm.dueDate
                    }
                    onChange={(event) =>
                      setExpenseForm(
                        (
                          currentForm,
                        ) => ({
                          ...currentForm,
                          dueDate:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />
                </label>

                <label
                  className={
                    styles.fullField
                  }
                >
                  <span>Observações</span>

                  <textarea
                    value={
                      expenseForm.notes
                    }
                    placeholder="Informações adicionais sobre o pagamento..."
                    onChange={(event) =>
                      setExpenseForm(
                        (
                          currentForm,
                        ) => ({
                          ...currentForm,
                          notes:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />
                </label>
              </div>

              {formError && (
                <div
                  className={
                    styles.modalError
                  }
                  role="alert"
                >
                  <span
                    aria-hidden="true"
                  >
                    !
                  </span>

                  {formError}
                </div>
              )}

              <div
                className={
                  styles.modalActions
                }
              >
                <button
                  type="button"
                  className={
                    styles.cancelButton
                  }
                  onClick={
                    closeExpenseModal
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className={
                    styles.saveButton
                  }
                >
                  {expenseForm.id
                    ? "Salvar alterações"
                    : "Adicionar despesa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}