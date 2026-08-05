"use client";

import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import {
  createBudgetItemAction,
  createInstallmentAction,
  deleteBudgetItemAction,
  deleteInstallmentAction,
  registerPaymentAction,
  resetInstallmentPaymentAction,
  updateBudgetItemAction,
  updateInstallmentAction,
} from "@/lib/actions/budget";

import styles from "./budget-manager.module.css";

export type BudgetSupplier = {
  id: string;
  name: string;
};

export type BudgetInstallment = {
  id: string;
  description: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  paidAmount: number;
  paidAt?: string;
  paymentMethod?: string;

  status:
    | "pending"
    | "partially_paid"
    | "paid"
    | "cancelled";

  notes?: string;
};

export type BudgetItem = {
  id: string;
  name: string;
  category: string;

  plannedAmount: number;
  contractedAmount: number;

  status:
    | "planned"
    | "quoted"
    | "contracted"
    | "completed"
    | "cancelled";

  supplierId?: string;
  supplierName?: string;
  notes?: string;

  installments: BudgetInstallment[];
};

type BudgetManagerProps = {
  initialItems: BudgetItem[];
  initialSuppliers: BudgetSupplier[];
};

type Filter =
  | "all"
  | "overdue"
  | "next30"
  | "open"
  | "paid";

type ServiceForm = {
  id?: string;
  name: string;
  category: string;
  totalAmount: string;
  supplierName: string;
  notes: string;
};

type InstallmentForm = {
  id?: string;
  budgetItemId: string;
  description: string;
  amount: string;
  dueDate: string;
  notes: string;
};

type PaymentForm = {
  installmentId: string;
  paidAmount: string;
  paidAt: string;
  paymentMethod: string;
  notes: string;
};

type ServiceTone =
  | "overdue"
  | "paid"
  | "partial"
  | "pending"
  | "unscheduled"
  | "empty"
  | "cancelled";

type UpcomingEntry = {
  itemId: string;
  serviceName: string;
  supplierName?: string;
  installment: BudgetInstallment;
  remainingAmount: number;
  overdue: boolean;
};

const categories = [
  "Alimentação",
  "Bebidas",
  "Cerimônia",
  "Decoração",
  "Espaço",
  "Fotografia",
  "Música",
  "Papelaria",
  "Presentes",
  "Transporte",
  "Vestuário",
  "Outros",
];

function emptyServiceForm(): ServiceForm {
  return {
    name: "",
    category: "Outros",
    totalAmount: "",
    supplierName: "",
    notes: "",
  };
}

function emptyInstallmentForm(
  budgetItemId: string,
): InstallmentForm {
  return {
    budgetItemId,
    description: "",
    amount: "",
    dueDate: "",
    notes: "",
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  ).format(value);
}

function parseDateOnly(value: string) {
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat(
    "pt-BR",
  ).format(parseDateOnly(value));
}

function getTodayStart() {
  const date = new Date();

  date.setHours(0, 0, 0, 0);

  return date;
}

function getLocalDateTimeInput() {
  const date = new Date();

  date.setMinutes(
    date.getMinutes() -
      date.getTimezoneOffset(),
  );

  return date
    .toISOString()
    .slice(0, 16);
}

function isOpenInstallment(
  installment: BudgetInstallment,
) {
  return (
    installment.status ===
      "pending" ||
    installment.status ===
      "partially_paid"
  );
}

function getInstallmentRemaining(
  installment: BudgetInstallment,
) {
  return Math.max(
    0,
    installment.amount -
      installment.paidAmount,
  );
}

function isPastDue(
  installment: BudgetInstallment,
) {
  if (
    !isOpenInstallment(
      installment,
    )
  ) {
    return false;
  }

  return (
    parseDateOnly(
      installment.dueDate,
    ).getTime() <
    getTodayStart().getTime()
  );
}

function isWithinNext30Days(
  installment: BudgetInstallment,
) {
  if (
    !isOpenInstallment(
      installment,
    )
  ) {
    return false;
  }

  const due =
    parseDateOnly(
      installment.dueDate,
    ).getTime();

  const start =
    getTodayStart().getTime();

  const end =
    start +
    30 * 24 * 60 * 60 * 1000;

  return (
    due >= start &&
    due <= end
  );
}

function getServiceTotal(
  item: BudgetItem,
) {
  return item.contractedAmount > 0
    ? item.contractedAmount
    : item.plannedAmount;
}

function getItemTotals(
  item: BudgetItem,
) {
  const total =
    getServiceTotal(item);

  const activeInstallments =
    item.installments.filter(
      (installment) =>
        installment.status !==
        "cancelled",
    );

  const scheduled =
    activeInstallments.reduce(
      (sum, installment) =>
        sum + installment.amount,
      0,
    );

  const paid =
    activeInstallments.reduce(
      (sum, installment) =>
        sum +
        installment.paidAmount,
      0,
    );

  const remaining =
    Math.max(0, total - paid);

  const unscheduled =
    Math.max(
      0,
      total - scheduled,
    );

  const overScheduled =
    Math.max(
      0,
      scheduled - total,
    );

  const nextInstallment =
    activeInstallments
      .filter(
        isOpenInstallment,
      )
      .sort(
        (first, second) =>
          first.dueDate.localeCompare(
            second.dueDate,
          ),
      )[0];

  const progress =
    total > 0
      ? Math.min(
          100,
          Math.round(
            (paid / total) * 100,
          ),
        )
      : 0;

  return {
    total,
    scheduled,
    paid,
    remaining,
    unscheduled,
    overScheduled,
    nextInstallment,
    progress,
  };
}

function getServiceStatus(
  item: BudgetItem,
): {
  label: string;
  tone: ServiceTone;
} {
  const totals =
    getItemTotals(item);

  if (
    item.status === "cancelled"
  ) {
    return {
      label: "Cancelado",
      tone: "cancelled",
    };
  }

  if (
    item.installments.some(
      isPastDue,
    )
  ) {
    return {
      label: "Atrasado",
      tone: "overdue",
    };
  }

  if (
    totals.total > 0 &&
    totals.remaining === 0
  ) {
    return {
      label: "Pago",
      tone: "paid",
    };
  }

  if (totals.paid > 0) {
    return {
      label: "Em pagamento",
      tone: "partial",
    };
  }

  if (
    totals.nextInstallment
  ) {
    return {
      label: "A pagar",
      tone: "pending",
    };
  }

  if (
    totals.unscheduled > 0
  ) {
    return {
      label:
        "Falta programar",
      tone: "unscheduled",
    };
  }

  return {
    label: "Sem contas",
    tone: "empty",
  };
}

export default function BudgetManager({
  initialItems,
  initialSuppliers,
}: BudgetManagerProps) {
  const router = useRouter();

  const [
    items,
    setItems,
  ] = useState<BudgetItem[]>(
    initialItems,
  );

  const [
    suppliers,
    setSuppliers,
  ] = useState<
    BudgetSupplier[]
  >(initialSuppliers);

  const [
    expandedItemIds,
    setExpandedItemIds,
  ] = useState<Set<string>>(
    new Set(),
  );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    filter,
    setFilter,
  ] = useState<Filter>("all");

  const [
    serviceModalOpen,
    setServiceModalOpen,
  ] = useState(false);

  const [
    installmentModalOpen,
    setInstallmentModalOpen,
  ] = useState(false);

  const [
    paymentModalOpen,
    setPaymentModalOpen,
  ] = useState(false);

  const [
    serviceForm,
    setServiceForm,
  ] = useState<ServiceForm>(
    emptyServiceForm,
  );

  const [
    installmentForm,
    setInstallmentForm,
  ] = useState<InstallmentForm>(
    emptyInstallmentForm(""),
  );

  const [
    paymentForm,
    setPaymentForm,
  ] = useState<PaymentForm>({
    installmentId: "",
    paidAmount: "",
    paidAt:
      getLocalDateTimeInput(),
    paymentMethod: "",
    notes: "",
  });

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    feedback,
    setFeedback,
  ] = useState<string | null>(
    null,
  );

  const [
    mounted,
    setMounted,
  ] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    setSuppliers(
      initialSuppliers,
    );
  }, [initialSuppliers]);

  const totals = useMemo(() => {
    const activeItems =
      items.filter(
        (item) =>
          item.status !==
          "cancelled",
      );

    const total =
      activeItems.reduce(
        (sum, item) =>
          sum +
          getItemTotals(item)
            .total,
        0,
      );

    const paid =
      activeItems.reduce(
        (sum, item) =>
          sum +
          getItemTotals(item)
            .paid,
        0,
      );

    const remaining =
      activeItems.reduce(
        (sum, item) =>
          sum +
          getItemTotals(item)
            .remaining,
        0,
      );

    const unscheduled =
      activeItems.reduce(
        (sum, item) =>
          sum +
          getItemTotals(item)
            .unscheduled,
        0,
      );

    const dueNext30 =
      activeItems
        .flatMap(
          (item) =>
            item.installments,
        )
        .filter(
          isWithinNext30Days,
        )
        .reduce(
          (sum, installment) =>
            sum +
            getInstallmentRemaining(
              installment,
            ),
          0,
        );

    const overdue =
      activeItems
        .flatMap(
          (item) =>
            item.installments,
        )
        .filter(isPastDue)
        .reduce(
          (sum, installment) =>
            sum +
            getInstallmentRemaining(
              installment,
            ),
          0,
        );

    return {
      total,
      paid,
      remaining,
      unscheduled,
      dueNext30,
      overdue,
    };
  }, [items]);

  const upcomingEntries =
    useMemo<
      UpcomingEntry[]
    >(() => {
      const entries:
        UpcomingEntry[] = [];

      for (const item of items) {
        if (
          item.status ===
          "cancelled"
        ) {
          continue;
        }

        for (
          const installment
          of item.installments
        ) {
          if (
            !isOpenInstallment(
              installment,
            )
          ) {
            continue;
          }

          entries.push({
            itemId: item.id,
            serviceName:
              item.name,
            installment,
            remainingAmount:
              getInstallmentRemaining(
                installment,
              ),
            overdue:
              isPastDue(
                installment,
              ),

            ...(item.supplierName
              ? {
                  supplierName:
                    item.supplierName,
                }
              : {}),
          });
        }
      }

      return entries
        .sort(
          (first, second) =>
            first.installment
              .dueDate.localeCompare(
                second.installment
                  .dueDate,
              ),
        )
        .slice(0, 8);
    }, [items]);

  const filteredItems =
    useMemo(() => {
      const normalized =
        search
          .trim()
          .toLocaleLowerCase(
            "pt-BR",
          );

      return items.filter(
        (item) => {
          const itemTotals =
            getItemTotals(item);

          const searchable = [
            item.name,
            item.category,
            item.supplierName,
            ...item.installments.map(
              (installment) =>
                installment.description,
            ),
          ]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase(
              "pt-BR",
            );

          const matchesSearch =
            normalized.length === 0 ||
            searchable.includes(
              normalized,
            );

          const matchesFilter =
            filter === "all" ||
            (
              filter ===
                "overdue" &&
              item.installments.some(
                isPastDue,
              )
            ) ||
            (
              filter ===
                "next30" &&
              item.installments.some(
                isWithinNext30Days,
              )
            ) ||
            (
              filter === "open" &&
              itemTotals.remaining >
                0
            ) ||
            (
              filter === "paid" &&
              itemTotals.total > 0 &&
              itemTotals.remaining ===
                0
            );

          return (
            matchesSearch &&
            matchesFilter
          );
        },
      );
    }, [
      items,
      search,
      filter,
    ]);

  function showFeedback(
    message: string,
  ) {
    setFeedback(message);

    window.setTimeout(() => {
      setFeedback(null);
    }, 3200);
  }

  function expandItem(
    itemId: string,
  ) {
    setExpandedItemIds(
      (current) => {
        const next =
          new Set(current);

        next.add(itemId);

        return next;
      },
    );
  }

  function toggleItem(
    itemId: string,
  ) {
    setExpandedItemIds(
      (current) => {
        const next =
          new Set(current);

        if (next.has(itemId)) {
          next.delete(itemId);
        } else {
          next.add(itemId);
        }

        return next;
      },
    );
  }

  function openNewService() {
    window.dispatchEvent(
      new Event(
        "dashboard:collapse-sidebar",
      ),
    );

    setServiceForm(
      emptyServiceForm(),
    );

    setServiceModalOpen(true);
  }

  function openEditService(
    item: BudgetItem,
  ) {
    window.dispatchEvent(
      new Event(
        "dashboard:collapse-sidebar",
      ),
    );

    setServiceForm({
      id: item.id,
      name: item.name,
      category: item.category,
      totalAmount: String(
        getServiceTotal(item),
      ),
      supplierName:
        item.supplierName ?? "",
      notes: item.notes ?? "",
    });

    setServiceModalOpen(true);
  }

  function openNewInstallment(
    itemId: string,
  ) {
    window.dispatchEvent(
      new Event(
        "dashboard:collapse-sidebar",
      ),
    );

    setInstallmentForm(
      emptyInstallmentForm(
        itemId,
      ),
    );

    setInstallmentModalOpen(
      true,
    );
  }

  function openEditInstallment(
    itemId: string,
    installment:
      BudgetInstallment,
  ) {
    window.dispatchEvent(
      new Event(
        "dashboard:collapse-sidebar",
      ),
    );

    setInstallmentForm({
      id: installment.id,
      budgetItemId: itemId,
      description:
        installment.description,
      amount: String(
        installment.amount,
      ),
      dueDate:
        installment.dueDate,
      notes:
        installment.notes ?? "",
    });

    setInstallmentModalOpen(
      true,
    );
  }

  function openPayment(
    installment:
      BudgetInstallment,
  ) {
    window.dispatchEvent(
      new Event(
        "dashboard:collapse-sidebar",
      ),
    );

    setPaymentForm({
      installmentId:
        installment.id,
      paidAmount: String(
        getInstallmentRemaining(
          installment,
        ),
      ),
      paidAt:
        getLocalDateTimeInput(),
      paymentMethod:
        installment.paymentMethod ??
        "",
      notes: "",
    });

    setPaymentModalOpen(true);
  }

  async function saveService(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    const totalAmount =
      Number(
        serviceForm.totalAmount,
      );

    if (
      !Number.isFinite(
        totalAmount,
      ) ||
      totalAmount <= 0
    ) {
      showFeedback(
        "Informe o valor total do serviço.",
      );
      return;
    }

    setIsSaving(true);

    try {
      const input = {
        name:
          serviceForm.name.trim(),
        category:
          serviceForm.category,

        plannedAmount:
          totalAmount,

        contractedAmount:
          totalAmount,

        status:
          "contracted" as const,

        supplierId: "",

        supplierName:
          serviceForm.supplierName.trim(),

        notes:
          serviceForm.notes.trim(),
      };

      const result =
        serviceForm.id
          ? await updateBudgetItemAction({
              id: serviceForm.id,
              ...input,
            })
          : await createBudgetItemAction(
              input,
            );

      showFeedback(
        result.message,
      );

      if (result.success) {
        setServiceModalOpen(
          false,
        );

        router.refresh();
      }
    } catch (error) {
      console.error(
        "Erro ao salvar serviço:",
        error,
      );

      showFeedback(
        "Não foi possível salvar o serviço.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function saveInstallment(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    const amount =
      Number(
        installmentForm.amount,
      );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      showFeedback(
        "Informe o valor da conta.",
      );
      return;
    }

    setIsSaving(true);

    try {
      const input = {
        budgetItemId:
          installmentForm
            .budgetItemId,

        description:
          installmentForm
            .description
            .trim(),

        amount,

        dueDate:
          installmentForm
            .dueDate,

        notes:
          installmentForm
            .notes
            .trim(),
      };

      const result =
        installmentForm.id
          ? await updateInstallmentAction({
              id:
                installmentForm.id,
              ...input,
            })
          : await createInstallmentAction(
              input,
            );

      showFeedback(
        result.message,
      );

      if (result.success) {
        setInstallmentModalOpen(
          false,
        );

        expandItem(
          installmentForm
            .budgetItemId,
        );

        router.refresh();
      }
    } catch (error) {
      console.error(
        "Erro ao salvar conta:",
        error,
      );

      showFeedback(
        "Não foi possível salvar a conta.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function savePayment(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    const paidAmount =
      Number(
        paymentForm.paidAmount,
      );

    if (
      !Number.isFinite(
        paidAmount,
      ) ||
      paidAmount <= 0
    ) {
      showFeedback(
        "Informe o valor pago agora.",
      );
      return;
    }

    setIsSaving(true);

    try {
      const result =
        await registerPaymentAction({
          installmentId:
            paymentForm
              .installmentId,

          paidAmount,

          paidAt:
            new Date(
              paymentForm.paidAt,
            ).toISOString(),

          paymentMethod:
            paymentForm
              .paymentMethod
              .trim(),

          notes:
            paymentForm.notes
              .trim(),
        });

      showFeedback(
        result.message,
      );

      if (result.success) {
        setPaymentModalOpen(
          false,
        );

        router.refresh();
      }
    } catch (error) {
      console.error(
        "Erro ao registrar pagamento:",
        error,
      );

      showFeedback(
        "Não foi possível registrar o pagamento.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function removeItem(
    item: BudgetItem,
  ) {
    const confirmed =
      window.confirm(
        `Excluir ${item.name} e todas as contas vinculadas?`,
      );

    if (!confirmed) {
      return;
    }

    const result =
      await deleteBudgetItemAction(
        item.id,
      );

    showFeedback(
      result.message,
    );

    if (result.success) {
      router.refresh();
    }
  }

  async function removeInstallment(
    installmentId: string,
  ) {
    const confirmed =
      window.confirm(
        "Excluir esta conta?",
      );

    if (!confirmed) {
      return;
    }

    const result =
      await deleteInstallmentAction(
        installmentId,
      );

    showFeedback(
      result.message,
    );

    if (result.success) {
      router.refresh();
    }
  }

  async function reopenInstallment(
    installmentId: string,
  ) {
    const confirmed =
      window.confirm(
        "Remover todos os pagamentos registrados nesta conta?",
      );

    if (!confirmed) {
      return;
    }

    const result =
      await resetInstallmentPaymentAction(
        installmentId,
      );

    showFeedback(
      result.message,
    );

    if (result.success) {
      router.refresh();
    }
  }

  const serviceModal =
    serviceModalOpen ? (
      <div
        className={
          styles.modalOverlay
        }
        role="presentation"
        onMouseDown={(event) => {
          if (
            event.target ===
            event.currentTarget &&
            !isSaving
          ) {
            setServiceModalOpen(
              false,
            );
          }
        }}
      >
        <section
          className={styles.modal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-modal-title"
        >
          <header
            className={
              styles.modalHeader
            }
          >
            <div>
              <span>
                Serviço
              </span>

              <h2 id="service-modal-title">
                {serviceForm.id
                  ? "Editar serviço"
                  : "Adicionar serviço"}
              </h2>

              <p>
                Informe o valor total.
                As datas e parcelas
                serão cadastradas
                dentro do serviço.
              </p>
            </div>

            <button
              type="button"
              aria-label="Fechar"
              disabled={isSaving}
              onClick={() =>
                setServiceModalOpen(
                  false,
                )
              }
            >
              ×
            </button>
          </header>

          <form
            className={styles.form}
            onSubmit={saveService}
          >
            <label
              className={
                styles.fullField
              }
            >
              <span>
                Nome do serviço
              </span>

              <input
                required
                minLength={2}
                value={
                  serviceForm.name
                }
                placeholder="Ex.: Decoração"
                onChange={(event) =>
                  setServiceForm(
                    (current) => ({
                      ...current,
                      name:
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
                  serviceForm.category
                }
                onChange={(event) =>
                  setServiceForm(
                    (current) => ({
                      ...current,
                      category:
                        event.target
                          .value,
                    }),
                  )
                }
              >
                {categories.map(
                  (category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
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
                required
                type="number"
                min={0.01}
                step="0.01"
                value={
                  serviceForm
                    .totalAmount
                }
                placeholder="0,00"
                onChange={(event) =>
                  setServiceForm(
                    (current) => ({
                      ...current,
                      totalAmount:
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
              <span>
                Empresa ou profissional
                — opcional
              </span>

              <input
                list="budget-provider-options"
                value={
                  serviceForm
                    .supplierName
                }
                placeholder="Ex.: Flores da Amazônia"
                onChange={(event) =>
                  setServiceForm(
                    (current) => ({
                      ...current,
                      supplierName:
                        event.target
                          .value,
                    }),
                  )
                }
              />

              <datalist id="budget-provider-options">
                {suppliers.map(
                  (supplier) => (
                    <option
                      key={
                        supplier.id
                      }
                      value={
                        supplier.name
                      }
                    />
                  ),
                )}
              </datalist>

              <small>
                Serve apenas para
                identificar quem presta
                o serviço.
              </small>
            </label>

            <label
              className={
                styles.fullField
              }
            >
              <span>
                Observações
              </span>

              <textarea
                rows={4}
                value={
                  serviceForm.notes
                }
                placeholder="Informações importantes sobre o serviço..."
                onChange={(event) =>
                  setServiceForm(
                    (current) => ({
                      ...current,
                      notes:
                        event.target
                          .value,
                    }),
                  )
                }
              />
            </label>

            <div
              className={
                styles.modalActions
              }
            >
              <button
                type="button"
                disabled={isSaving}
                onClick={() =>
                  setServiceModalOpen(
                    false,
                  )
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSaving}
              >
                {isSaving
                  ? "Salvando..."
                  : "Salvar serviço"}
              </button>
            </div>
          </form>
        </section>
      </div>
    ) : null;

  const installmentModal =
    installmentModalOpen ? (
      <div
        className={
          styles.modalOverlay
        }
        role="presentation"
        onMouseDown={(event) => {
          if (
            event.target ===
            event.currentTarget &&
            !isSaving
          ) {
            setInstallmentModalOpen(
              false,
            );
          }
        }}
      >
        <section
          className={styles.modal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="installment-modal-title"
        >
          <header
            className={
              styles.modalHeader
            }
          >
            <div>
              <span>
                Conta a pagar
              </span>

              <h2 id="installment-modal-title">
                {installmentForm.id
                  ? "Editar conta"
                  : "Nova conta"}
              </h2>

              <p>
                Cadastre entrada,
                parcela ou pagamento
                futuro com sua data
                limite.
              </p>
            </div>

            <button
              type="button"
              aria-label="Fechar"
              disabled={isSaving}
              onClick={() =>
                setInstallmentModalOpen(
                  false,
                )
              }
            >
              ×
            </button>
          </header>

          <form
            className={styles.form}
            onSubmit={
              saveInstallment
            }
          >
            <label
              className={
                styles.fullField
              }
            >
              <span>
                Descrição da conta
              </span>

              <input
                required
                minLength={2}
                placeholder="Ex.: Segunda parcela"
                value={
                  installmentForm
                    .description
                }
                onChange={(event) =>
                  setInstallmentForm(
                    (current) => ({
                      ...current,
                      description:
                        event.target
                          .value,
                    }),
                  )
                }
              />
            </label>

            <label>
              <span>Valor</span>

              <input
                required
                type="number"
                min={0.01}
                step="0.01"
                value={
                  installmentForm
                    .amount
                }
                onChange={(event) =>
                  setInstallmentForm(
                    (current) => ({
                      ...current,
                      amount:
                        event.target
                          .value,
                    }),
                  )
                }
              />
            </label>

            <label>
              <span>
                Data limite
              </span>

              <input
                required
                type="date"
                value={
                  installmentForm
                    .dueDate
                }
                onChange={(event) =>
                  setInstallmentForm(
                    (current) => ({
                      ...current,
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
              <span>
                Observações
              </span>

              <textarea
                rows={4}
                value={
                  installmentForm.notes
                }
                onChange={(event) =>
                  setInstallmentForm(
                    (current) => ({
                      ...current,
                      notes:
                        event.target
                          .value,
                    }),
                  )
                }
              />
            </label>

            <div
              className={
                styles.modalActions
              }
            >
              <button
                type="button"
                disabled={isSaving}
                onClick={() =>
                  setInstallmentModalOpen(
                    false,
                  )
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSaving}
              >
                {isSaving
                  ? "Salvando..."
                  : "Salvar conta"}
              </button>
            </div>
          </form>
        </section>
      </div>
    ) : null;

  const paymentModal =
    paymentModalOpen ? (
      <div
        className={
          styles.modalOverlay
        }
        role="presentation"
        onMouseDown={(event) => {
          if (
            event.target ===
            event.currentTarget &&
            !isSaving
          ) {
            setPaymentModalOpen(
              false,
            );
          }
        }}
      >
        <section
          className={styles.modal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-modal-title"
        >
          <header
            className={
              styles.modalHeader
            }
          >
            <div>
              <span>
                Pagamento
              </span>

              <h2 id="payment-modal-title">
                Registrar pagamento
              </h2>

              <p>
                Informe o valor pago
                agora. Em pagamento
                parcial, o sistema soma
                ao valor já registrado.
              </p>
            </div>

            <button
              type="button"
              aria-label="Fechar"
              disabled={isSaving}
              onClick={() =>
                setPaymentModalOpen(
                  false,
                )
              }
            >
              ×
            </button>
          </header>

          <form
            className={styles.form}
            onSubmit={savePayment}
          >
            <label>
              <span>
                Valor pago agora
              </span>

              <input
                required
                type="number"
                min={0.01}
                step="0.01"
                value={
                  paymentForm
                    .paidAmount
                }
                onChange={(event) =>
                  setPaymentForm(
                    (current) => ({
                      ...current,
                      paidAmount:
                        event.target
                          .value,
                    }),
                  )
                }
              />
            </label>

            <label>
              <span>
                Data do pagamento
              </span>

              <input
                required
                type="datetime-local"
                value={
                  paymentForm.paidAt
                }
                onChange={(event) =>
                  setPaymentForm(
                    (current) => ({
                      ...current,
                      paidAt:
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
              <span>
                Forma de pagamento
              </span>

              <input
                value={
                  paymentForm
                    .paymentMethod
                }
                placeholder="Ex.: PIX"
                onChange={(event) =>
                  setPaymentForm(
                    (current) => ({
                      ...current,
                      paymentMethod:
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
              <span>
                Observações do pagamento
              </span>

              <textarea
                rows={4}
                value={
                  paymentForm.notes
                }
                onChange={(event) =>
                  setPaymentForm(
                    (current) => ({
                      ...current,
                      notes:
                        event.target
                          .value,
                    }),
                  )
                }
              />
            </label>

            <div
              className={
                styles.modalActions
              }
            >
              <button
                type="button"
                disabled={isSaving}
                onClick={() =>
                  setPaymentModalOpen(
                    false,
                  )
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSaving}
              >
                {isSaving
                  ? "Salvando..."
                  : "Registrar pagamento"}
              </button>
            </div>
          </form>
        </section>
      </div>
    ) : null;

  return (
    <div className={styles.page}>
      {feedback && (
        <div
          className={
            styles.feedback
          }
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
        className={styles.hero}
      >
        <div
          className={
            styles.heroCopy
          }
        >
          <span
            className={
              styles.eyebrow
            }
          >
            Financeiro
          </span>

          <h1>
            Contas a pagar
          </h1>

          <p>
            Organize cada serviço,
            registre as parcelas e
            acompanhe as próximas datas
            limite sem misturar
            planejamento com pagamento.
          </p>
        </div>

        <div
          className={
            styles.heroSide
          }
        >
          <div
            className={
              styles.heroBalance
            }
          >
            <span>
              Falta pagar
            </span>

            <strong>
              {formatCurrency(
                totals.remaining,
              )}
            </strong>

            <small>
              de
              {" "}
              {formatCurrency(
                totals.total,
              )}
              {" "}
              em serviços
            </small>
          </div>

          <button
            type="button"
            className={
              styles.primaryButton
            }
            onClick={
              openNewService
            }
          >
            <span aria-hidden="true">
              +
            </span>

            Adicionar serviço
          </button>
        </div>
      </header>

      <section
        className={
          styles.summaryGrid
        }
        aria-label="Resumo financeiro"
      >
        <article>
          <span>
            Total dos serviços
          </span>

          <strong>
            {formatCurrency(
              totals.total,
            )}
          </strong>

          <small>
            Valor combinado
          </small>
        </article>

        <article>
          <span>
            Total pago
          </span>

          <strong>
            {formatCurrency(
              totals.paid,
            )}
          </strong>

          <small>
            Pagamentos registrados
          </small>
        </article>

        <article>
          <span>
            Próximos 30 dias
          </span>

          <strong>
            {formatCurrency(
              totals.dueNext30,
            )}
          </strong>

          <small>
            Contas com data próxima
          </small>
        </article>

        <article
          className={
            totals.overdue > 0
              ? styles.summaryDanger
              : ""
          }
        >
          <span>
            Em atraso
          </span>

          <strong>
            {formatCurrency(
              totals.overdue,
            )}
          </strong>

          <small>
            Valores vencidos
          </small>
        </article>
      </section>

      {(totals.overdue > 0 ||
        totals.unscheduled > 0) && (
        <section
          className={
            styles.attentionBar
          }
        >
          {totals.overdue > 0 && (
            <div
              className={
                styles.attentionDanger
              }
            >
              <span aria-hidden="true">
                !
              </span>

              <p>
                <strong>
                  {formatCurrency(
                    totals.overdue,
                  )}
                </strong>
                {" "}
                está com data vencida.
              </p>

              <button
                type="button"
                onClick={() =>
                  setFilter(
                    "overdue",
                  )
                }
              >
                Ver atrasadas
              </button>
            </div>
          )}

          {totals.unscheduled > 0 && (
            <div>
              <span aria-hidden="true">
                ○
              </span>

              <p>
                <strong>
                  {formatCurrency(
                    totals.unscheduled,
                  )}
                </strong>
                {" "}
                ainda não possui data de
                pagamento definida.
              </p>
            </div>
          )}
        </section>
      )}

      <section
        className={
          styles.workspace
        }
      >
        <div
          className={
            styles.mainColumn
          }
        >
          <div
            className={
              styles.toolbar
            }
          >
            <label
              className={
                styles.search
              }
            >
              <span
                aria-hidden="true"
              >
                ⌕
              </span>

              <input
                type="search"
                value={search}
                placeholder="Buscar serviço, empresa ou conta..."
                onChange={(event) =>
                  setSearch(
                    event.target
                      .value,
                  )
                }
              />
            </label>

            <div
              className={
                styles.filters
              }
            >
              {(
                [
                  ["all", "Todos"],
                  [
                    "overdue",
                    "Atrasados",
                  ],
                  [
                    "next30",
                    "Próximos 30 dias",
                  ],
                  [
                    "open",
                    "Em aberto",
                  ],
                  ["paid", "Pagos"],
                ] as const
              ).map(
                ([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={
                      filter === value
                        ? styles.filterActive
                        : ""
                    }
                    onClick={() =>
                      setFilter(
                        value,
                      )
                    }
                  >
                    {label}
                  </button>
                ),
              )}
            </div>
          </div>

          <section
            className={
              styles.servicePanel
            }
          >
            <header
              className={
                styles.panelHeader
              }
            >
              <div>
                <span
                  className={
                    styles.eyebrow
                  }
                >
                  Serviços
                </span>

                <h2>
                  {filteredItems.length}
                  {" "}
                  {filteredItems.length ===
                  1
                    ? "serviço"
                    : "serviços"}
                </h2>
              </div>

              <p>
                Abra um serviço para
                cadastrar entrada,
                parcelas e pagamentos.
              </p>
            </header>

            {filteredItems.length >
            0 ? (
              <div
                className={
                  styles.serviceList
                }
              >
                <div
                  className={
                    styles.tableHead
                  }
                >
                  <span>Serviço</span>
                  <span>Total</span>
                  <span>Pago</span>
                  <span>Restante</span>
                  <span>
                    Próxima conta
                  </span>
                  <span>Status</span>
                  <span />
                </div>

                {filteredItems.map(
                  (item) => {
                    const itemTotals =
                      getItemTotals(item);

                    const financialStatus =
                      getServiceStatus(
                        item,
                      );

                    const expanded =
                      expandedItemIds.has(
                        item.id,
                      );

                    return (
                      <article
                        key={item.id}
                        className={
                          styles.serviceCard
                        }
                      >
                        <button
                          type="button"
                          className={
                            styles.serviceRow
                          }
                          aria-expanded={
                            expanded
                          }
                          onClick={() =>
                            toggleItem(
                              item.id,
                            )
                          }
                        >
                          <span
                            className={
                              styles.serviceIdentity
                            }
                          >
                            <strong>
                              {item.name}
                            </strong>

                            <small>
                              {item.category}
                              {item.supplierName
                                ? ` · ${item.supplierName}`
                                : ""}
                            </small>
                          </span>

                          <span
                            className={
                              styles.moneyCell
                            }
                          >
                            {formatCurrency(
                              itemTotals.total,
                            )}
                          </span>

                          <span
                            className={
                              styles.moneyCell
                            }
                          >
                            {formatCurrency(
                              itemTotals.paid,
                            )}
                          </span>

                          <span
                            className={
                              styles.moneyCell
                            }
                          >
                            {formatCurrency(
                              itemTotals.remaining,
                            )}
                          </span>

                          <span
                            className={
                              styles.nextCell
                            }
                          >
                            {itemTotals.nextInstallment ? (
                              <>
                                <strong>
                                  {formatCurrency(
                                    getInstallmentRemaining(
                                      itemTotals
                                        .nextInstallment,
                                    ),
                                  )}
                                </strong>

                                <small>
                                  {formatDate(
                                    itemTotals
                                      .nextInstallment
                                      .dueDate,
                                  )}
                                </small>
                              </>
                            ) : (
                              <small>
                                Sem próxima conta
                              </small>
                            )}
                          </span>

                          <span
                            className={`${styles.statusBadge} ${
                              styles[
                                `status-${financialStatus.tone}`
                              ]
                            }`}
                          >
                            {
                              financialStatus.label
                            }
                          </span>

                          <span
                            className={
                              styles.expandIcon
                            }
                            aria-hidden="true"
                          >
                            {expanded
                              ? "−"
                              : "+"}
                          </span>
                        </button>

                        <div
                          className={
                            styles.progressTrack
                          }
                          aria-label={`${itemTotals.progress}% pago`}
                        >
                          <span
                            style={{
                              width:
                                `${itemTotals.progress}%`,
                            }}
                          />
                        </div>

                        {expanded && (
                          <div
                            className={
                              styles.serviceDetails
                            }
                          >
                            <div
                              className={
                                styles.detailSummary
                              }
                            >
                              <div>
                                <span>
                                  Programado em
                                  contas
                                </span>

                                <strong>
                                  {formatCurrency(
                                    itemTotals.scheduled,
                                  )}
                                </strong>
                              </div>

                              <div>
                                <span>
                                  Sem data definida
                                </span>

                                <strong>
                                  {formatCurrency(
                                    itemTotals.unscheduled,
                                  )}
                                </strong>
                              </div>

                              <div>
                                <span>
                                  Progresso
                                </span>

                                <strong>
                                  {itemTotals.progress}%
                                </strong>
                              </div>

                              {itemTotals.overScheduled >
                                0 && (
                                <div
                                  className={
                                    styles.detailWarning
                                  }
                                >
                                  <span>
                                    Acima do total
                                  </span>

                                  <strong>
                                    {formatCurrency(
                                      itemTotals.overScheduled,
                                    )}
                                  </strong>
                                </div>
                              )}
                            </div>

                            <header
                              className={
                                styles.detailHeader
                              }
                            >
                              <div>
                                <strong>
                                  Contas e parcelas
                                </strong>

                                <span>
                                  Cada conta possui
                                  seu próprio valor e
                                  data limite.
                                </span>
                              </div>

                              <div
                                className={
                                  styles.detailActions
                                }
                              >
                                <button
                                  type="button"
                                  className={
                                    styles.addAccountButton
                                  }
                                  onClick={() =>
                                    openNewInstallment(
                                      item.id,
                                    )
                                  }
                                >
                                  + Nova conta
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditService(
                                      item,
                                    )
                                  }
                                >
                                  Editar serviço
                                </button>

                                <button
                                  type="button"
                                  className={
                                    styles.deleteButton
                                  }
                                  onClick={() =>
                                    removeItem(
                                      item,
                                    )
                                  }
                                >
                                  Excluir
                                </button>
                              </div>
                            </header>

                            {item.installments
                              .length > 0 ? (
                              <div
                                className={
                                  styles.installmentList
                                }
                              >
                                {item.installments
                                  .slice()
                                  .sort(
                                    (
                                      first,
                                      second,
                                    ) =>
                                      first.dueDate.localeCompare(
                                        second.dueDate,
                                      ),
                                  )
                                  .map(
                                    (
                                      installment,
                                    ) => {
                                      const overdue =
                                        isPastDue(
                                          installment,
                                        );

                                      const remainingAmount =
                                        getInstallmentRemaining(
                                          installment,
                                        );

                                      return (
                                        <article
                                          key={
                                            installment.id
                                          }
                                          className={`${styles.installmentRow} ${
                                            overdue
                                              ? styles.overdueInstallment
                                              : ""
                                          }`}
                                        >
                                          <div
                                            className={
                                              styles.installmentIdentity
                                            }
                                          >
                                            <strong>
                                              {
                                                installment.description
                                              }
                                            </strong>

                                            <span>
                                              Limite:
                                              {" "}
                                              {formatDate(
                                                installment.dueDate,
                                              )}
                                            </span>

                                            {installment.paidAt && (
                                              <small>
                                                Último pagamento:
                                                {" "}
                                                {new Intl.DateTimeFormat(
                                                  "pt-BR",
                                                  {
                                                    dateStyle:
                                                      "short",
                                                    timeStyle:
                                                      "short",
                                                  },
                                                ).format(
                                                  new Date(
                                                    installment.paidAt,
                                                  ),
                                                )}
                                                {installment.paymentMethod
                                                  ? ` · ${installment.paymentMethod}`
                                                  : ""}
                                              </small>
                                            )}
                                          </div>

                                          <div>
                                            <span>
                                              Conta
                                            </span>

                                            <strong>
                                              {formatCurrency(
                                                installment.amount,
                                              )}
                                            </strong>
                                          </div>

                                          <div>
                                            <span>
                                              Pago
                                            </span>

                                            <strong>
                                              {formatCurrency(
                                                installment.paidAmount,
                                              )}
                                            </strong>
                                          </div>

                                          <div>
                                            <span>
                                              Falta
                                            </span>

                                            <strong>
                                              {formatCurrency(
                                                remainingAmount,
                                              )}
                                            </strong>
                                          </div>

                                          <span
                                            className={`${styles.installmentStatus} ${
                                              overdue
                                                ? styles.installmentOverdue
                                                : styles[
                                                    `installment-${installment.status}`
                                                  ]
                                            }`}
                                          >
                                            {overdue
                                              ? "Atrasada"
                                              : installment.status ===
                                                  "paid"
                                                ? "Paga"
                                                : installment.status ===
                                                    "partially_paid"
                                                  ? "Parcial"
                                                  : installment.status ===
                                                      "cancelled"
                                                    ? "Cancelada"
                                                    : "Pendente"}
                                          </span>

                                          <div
                                            className={
                                              styles.installmentActions
                                            }
                                          >
                                            {isOpenInstallment(
                                              installment,
                                            ) && (
                                              <button
                                                type="button"
                                                className={
                                                  styles.payButton
                                                }
                                                onClick={() =>
                                                  openPayment(
                                                    installment,
                                                  )
                                                }
                                              >
                                                Registrar pagamento
                                              </button>
                                            )}

                                            {installment.paidAmount >
                                              0 && (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  reopenInstallment(
                                                    installment.id,
                                                  )
                                                }
                                              >
                                                Zerar pagamentos
                                              </button>
                                            )}

                                            <button
                                              type="button"
                                              onClick={() =>
                                                openEditInstallment(
                                                  item.id,
                                                  installment,
                                                )
                                              }
                                            >
                                              Editar
                                            </button>

                                            <button
                                              type="button"
                                              className={
                                                styles.deleteButton
                                              }
                                              onClick={() =>
                                                removeInstallment(
                                                  installment.id,
                                                )
                                              }
                                            >
                                              Excluir
                                            </button>
                                          </div>
                                        </article>
                                      );
                                    },
                                  )}
                              </div>
                            ) : (
                              <div
                                className={
                                  styles.emptyInstallments
                                }
                              >
                                <div>
                                  <strong>
                                    Nenhuma conta cadastrada
                                  </strong>

                                  <p>
                                    Cadastre a entrada
                                    ou a primeira parcela
                                    desse serviço.
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openNewInstallment(
                                      item.id,
                                    )
                                  }
                                >
                                  + Adicionar conta
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  },
                )}
              </div>
            ) : (
              <div
                className={
                  styles.emptyState
                }
              >
                <span
                  aria-hidden="true"
                >
                  $
                </span>

                <strong>
                  Nenhum serviço encontrado
                </strong>

                <p>
                  Cadastre um serviço e
                  depois adicione as contas
                  com suas datas limite.
                </p>

                <button
                  type="button"
                  onClick={
                    openNewService
                  }
                >
                  Adicionar serviço
                </button>
              </div>
            )}
          </section>
        </div>

        <aside
          className={
            styles.agendaPanel
          }
        >
          <header>
            <div>
              <span
                className={
                  styles.eyebrow
                }
              >
                Agenda
              </span>

              <h2>
                Próximas contas
              </h2>
            </div>

            <small>
              Por data limite
            </small>
          </header>

          {upcomingEntries.length >
          0 ? (
            <div
              className={
                styles.agendaList
              }
            >
              {upcomingEntries.map(
                (entry) => (
                  <button
                    key={
                      entry.installment.id
                    }
                    type="button"
                    className={
                      entry.overdue
                        ? styles.agendaOverdue
                        : ""
                    }
                    onClick={() =>
                      expandItem(
                        entry.itemId,
                      )
                    }
                  >
                    <span
                      className={
                        styles.dateBlock
                      }
                    >
                      <strong>
                        {parseDateOnly(
                          entry.installment
                            .dueDate,
                        )
                          .getDate()
                          .toString()
                          .padStart(
                            2,
                            "0",
                          )}
                      </strong>

                      <small>
                        {new Intl.DateTimeFormat(
                          "pt-BR",
                          {
                            month:
                              "short",
                          },
                        )
                          .format(
                            parseDateOnly(
                              entry.installment
                                .dueDate,
                            ),
                          )
                          .replace(
                            ".",
                            "",
                          )
                          .toUpperCase()}
                      </small>
                    </span>

                    <span
                      className={
                        styles.agendaIdentity
                      }
                    >
                      <strong>
                        {
                          entry.serviceName
                        }
                      </strong>

                      <small>
                        {
                          entry.installment
                            .description
                        }
                        {entry.supplierName
                          ? ` · ${entry.supplierName}`
                          : ""}
                      </small>
                    </span>

                    <span
                      className={
                        styles.agendaAmount
                      }
                    >
                      <strong>
                        {formatCurrency(
                          entry.remainingAmount,
                        )}
                      </strong>

                      <small>
                        {entry.overdue
                          ? "Atrasada"
                          : "A pagar"}
                      </small>
                    </span>
                  </button>
                ),
              )}
            </div>
          ) : (
            <div
              className={
                styles.emptyAgenda
              }
            >
              <strong>
                Nenhuma conta pendente
              </strong>

              <p>
                As próximas datas
                aparecerão aqui.
              </p>
            </div>
          )}

          <div
            className={
              styles.unscheduledCard
            }
          >
            <span>
              Sem data definida
            </span>

            <strong>
              {formatCurrency(
                totals.unscheduled,
              )}
            </strong>

            <p>
              Parte do valor total ainda
              não foi distribuída em
              contas ou parcelas.
            </p>
          </div>
        </aside>
      </section>

      {mounted &&
        serviceModal &&
        createPortal(
          serviceModal,
          document.body,
        )}

      {mounted &&
        installmentModal &&
        createPortal(
          installmentModal,
          document.body,
        )}

      {mounted &&
        paymentModal &&
        createPortal(
          paymentModal,
          document.body,
        )}
    </div>
  );
}
