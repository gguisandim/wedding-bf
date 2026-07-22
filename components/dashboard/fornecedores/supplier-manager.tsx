"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useMemo,
  useState,
} from "react";

import styles from "./supplier-manager.module.css";

export type SupplierStatus =
  | "active"
  | "completed"
  | "paused";

export type ServiceCategory =
  | "venue"
  | "buffet"
  | "decor"
  | "photo"
  | "music"
  | "attire"
  | "stationery"
  | "transport"
  | "ceremony"
  | "other";

export type PaymentReceipt = {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
};

export type SupplierPayment = {
  id: string;
  amount: number;
  paidAt: string;
  note?: string;
  receipts: PaymentReceipt[];
};

export type WeddingSupplier = {
  id: string;

  supplierName: string;
  serviceName: string;
  category: ServiceCategory;

  contactName: string;
  phone?: string;
  email?: string;

  totalValue: number;
  status: SupplierStatus;

  contractDate?: string;
  dueDate?: string;
  notes?: string;

  payments: SupplierPayment[];
};

type SupplierManagerProps = {
  initialSuppliers: WeddingSupplier[];
};

type SupplierFormState = {
  id: string | null;

  supplierName: string;
  serviceName: string;
  category: ServiceCategory;

  contactName: string;
  phone: string;
  email: string;

  totalValue: string;
  status: SupplierStatus;

  contractDate: string;
  dueDate: string;
  notes: string;
};

type PaymentFormState = {
  supplierId: string | null;
  amount: string;
  paidAt: string;
  note: string;
};

const emptySupplierForm: SupplierFormState = {
  id: null,

  supplierName: "",
  serviceName: "",
  category: "venue",

  contactName: "",
  phone: "",
  email: "",

  totalValue: "",
  status: "active",

  contractDate: "",
  dueDate: "",
  notes: "",
};

const emptyPaymentForm: PaymentFormState = {
  supplierId: null,
  amount: "",
  paidAt: new Date()
    .toISOString()
    .slice(0, 10),
  note: "",
};

const categoryLabels: Record<
  ServiceCategory,
  string
> = {
  venue: "Espaço",
  buffet: "Buffet",
  decor: "Decoração",
  photo: "Foto e vídeo",
  music: "Música",
  attire: "Trajes",
  stationery: "Papelaria",
  transport: "Transporte",
  ceremony: "Cerimônia",
  other: "Outro serviço",
};

const categoryIcons: Record<
  ServiceCategory,
  string
> = {
  venue: "⌂",
  buffet: "✦",
  decor: "❋",
  photo: "◉",
  music: "♫",
  attire: "◇",
  stationery: "▤",
  transport: "→",
  ceremony: "♡",
  other: "○",
};

const statusLabels: Record<
  SupplierStatus,
  string
> = {
  active: "Em andamento",
  completed: "Quitado",
  paused: "Pausado",
};

const statusClasses: Record<
  SupplierStatus,
  string
> = {
  active: styles.statusActive,
  completed: styles.statusCompleted,
  paused: styles.statusPaused,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(date?: string) {
  if (!date) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(
    new Date(`${date}T12:00:00`),
  );
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(
      size / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    size /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function getPaidTotal(
  supplier: WeddingSupplier,
) {
  return supplier.payments.reduce(
    (total, payment) =>
      total + payment.amount,
    0,
  );
}

function getPaymentPercentage(
  supplier: WeddingSupplier,
) {
  if (supplier.totalValue <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.round(
      (getPaidTotal(supplier) /
        supplier.totalValue) *
        100,
    ),
  );
}

export default function SupplierManager({
  initialSuppliers,
}: SupplierManagerProps) {
  const [suppliers, setSuppliers] =
    useState<WeddingSupplier[]>(
      initialSuppliers,
    );

  const [
    selectedSupplierId,
    setSelectedSupplierId,
  ] = useState<string | null>(
    initialSuppliers[0]?.id ?? null,
  );

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<SupplierStatus | "all">(
      "all",
    );

  const [
    isSupplierModalOpen,
    setIsSupplierModalOpen,
  ] = useState(false);

  const [
    isPaymentModalOpen,
    setIsPaymentModalOpen,
  ] = useState(false);

  const [
    supplierForm,
    setSupplierForm,
  ] = useState<SupplierFormState>(
    emptySupplierForm,
  );

  const [paymentForm, setPaymentForm] =
    useState<PaymentFormState>(
      emptyPaymentForm,
    );

  const [
    pendingReceiptFiles,
    setPendingReceiptFiles,
  ] = useState<File[]>([]);

  const [formError, setFormError] =
    useState("");

  const [feedback, setFeedback] =
    useState<string | null>(null);

  const selectedSupplier =
    suppliers.find(
      (supplier) =>
        supplier.id ===
        selectedSupplierId,
    ) ?? null;

  const totalContracted = useMemo(
    () =>
      suppliers.reduce(
        (total, supplier) =>
          total +
          supplier.totalValue,
        0,
      ),
    [suppliers],
  );

  const totalPaid = useMemo(
    () =>
      suppliers.reduce(
        (total, supplier) =>
          total +
          getPaidTotal(supplier),
        0,
      ),
    [suppliers],
  );

  const totalRemaining =
    totalContracted - totalPaid;

  const globalPercentage =
    totalContracted > 0
      ? Math.min(
          100,
          Math.round(
            (totalPaid /
              totalContracted) *
              100,
          ),
        )
      : 0;

  const activeSuppliers =
    suppliers.filter(
      (supplier) =>
        supplier.status === "active",
    );

  const completedSuppliers =
    suppliers.filter(
      (supplier) =>
        supplier.status ===
        "completed",
    );

  const pausedSuppliers =
    suppliers.filter(
      (supplier) =>
        supplier.status === "paused",
    );

  const filteredSuppliers =
    useMemo(() => {
      const normalizedSearch = search
        .trim()
        .toLocaleLowerCase("pt-BR");

      return suppliers.filter(
        (supplier) => {
          const matchesSearch =
            !normalizedSearch ||
            supplier.supplierName
              .toLocaleLowerCase(
                "pt-BR",
              )
              .includes(
                normalizedSearch,
              ) ||
            supplier.serviceName
              .toLocaleLowerCase(
                "pt-BR",
              )
              .includes(
                normalizedSearch,
              ) ||
            supplier.contactName
              .toLocaleLowerCase(
                "pt-BR",
              )
              .includes(
                normalizedSearch,
              ) ||
            categoryLabels[
              supplier.category
            ]
              .toLocaleLowerCase(
                "pt-BR",
              )
              .includes(
                normalizedSearch,
              );

          const matchesStatus =
            statusFilter === "all" ||
            supplier.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        },
      );
    }, [
      search,
      statusFilter,
      suppliers,
    ]);

  function showFeedback(
    message: string,
  ) {
    setFeedback(message);

    window.setTimeout(() => {
      setFeedback(null);
    }, 2800);
  }

  function openCreateSupplierModal() {
    setSupplierForm(
      emptySupplierForm,
    );

    setFormError("");
    setIsSupplierModalOpen(true);
  }

  function openEditSupplierModal(
    supplier: WeddingSupplier,
  ) {
    setSupplierForm({
      id: supplier.id,

      supplierName:
        supplier.supplierName,

      serviceName:
        supplier.serviceName,

      category:
        supplier.category,

      contactName:
        supplier.contactName,

      phone: supplier.phone || "",
      email: supplier.email || "",

      totalValue: String(
        supplier.totalValue,
      ),

      status: supplier.status,

      contractDate:
        supplier.contractDate || "",

      dueDate:
        supplier.dueDate || "",

      notes: supplier.notes || "",
    });

    setFormError("");
    setIsSupplierModalOpen(true);
  }

  function closeSupplierModal() {
    setSupplierForm(
      emptySupplierForm,
    );

    setFormError("");
    setIsSupplierModalOpen(false);
  }

  function saveSupplier(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const supplierName =
      supplierForm.supplierName.trim();

    const serviceName =
      supplierForm.serviceName.trim();

    const contactName =
      supplierForm.contactName.trim();

    const totalValue = Number(
      supplierForm.totalValue,
    );

    if (!supplierName) {
      setFormError(
        "Informe o nome do fornecedor.",
      );

      return;
    }

    if (!serviceName) {
      setFormError(
        "Informe o tipo de serviço.",
      );

      return;
    }

    if (!contactName) {
      setFormError(
        "Informe o nome do responsável.",
      );

      return;
    }

    if (
      !Number.isFinite(totalValue) ||
      totalValue <= 0
    ) {
      setFormError(
        "Informe um valor total válido.",
      );

      return;
    }

    if (supplierForm.id) {
      const currentSupplier =
        suppliers.find(
          (supplier) =>
            supplier.id ===
            supplierForm.id,
        );

      if (!currentSupplier) {
        return;
      }

      const currentPaid =
        getPaidTotal(
          currentSupplier,
        );

      if (totalValue < currentPaid) {
        setFormError(
          `O valor do serviço não pode ser menor que o total já pago: ${formatCurrency(
            currentPaid,
          )}.`,
        );

        return;
      }

      const nextStatus =
        currentPaid >= totalValue
          ? "completed"
          : supplierForm.status ===
              "completed"
            ? "active"
            : supplierForm.status;

      setSuppliers(
        (currentSuppliers) =>
          currentSuppliers.map(
            (supplier) =>
              supplier.id ===
              supplierForm.id
                ? {
                    ...supplier,

                    supplierName,
                    serviceName,

                    category:
                      supplierForm.category,

                    contactName,

                    phone:
                      supplierForm.phone.trim() ||
                      undefined,

                    email:
                      supplierForm.email.trim() ||
                      undefined,

                    totalValue,
                    status: nextStatus,

                    contractDate:
                      supplierForm.contractDate ||
                      undefined,

                    dueDate:
                      supplierForm.dueDate ||
                      undefined,

                    notes:
                      supplierForm.notes.trim() ||
                      undefined,
                  }
                : supplier,
          ),
      );

      showFeedback(
        "Fornecedor atualizado.",
      );
    } else {
      const newSupplier: WeddingSupplier =
        {
          id: `supplier-${Date.now()}`,

          supplierName,
          serviceName,

          category:
            supplierForm.category,

          contactName,

          phone:
            supplierForm.phone.trim() ||
            undefined,

          email:
            supplierForm.email.trim() ||
            undefined,

          totalValue,
          status:
            supplierForm.status,

          contractDate:
            supplierForm.contractDate ||
            undefined,

          dueDate:
            supplierForm.dueDate ||
            undefined,

          notes:
            supplierForm.notes.trim() ||
            undefined,

          payments: [],
        };

      setSuppliers(
        (currentSuppliers) => [
          newSupplier,
          ...currentSuppliers,
        ],
      );

      setSelectedSupplierId(
        newSupplier.id,
      );

      showFeedback(
        "Novo fornecedor adicionado.",
      );
    }

    closeSupplierModal();
  }

  function deleteSupplier(
    supplierId: string,
  ) {
    const supplier =
      suppliers.find(
        (item) =>
          item.id === supplierId,
      );

    if (!supplier) {
      return;
    }

    const confirmed =
      window.confirm(
        `Excluir o fornecedor "${supplier.supplierName}" e todo o histórico de pagamentos?`,
      );

    if (!confirmed) {
      return;
    }

    const remainingSuppliers =
      suppliers.filter(
        (item) =>
          item.id !== supplierId,
      );

    setSuppliers(
      remainingSuppliers,
    );

    if (
      selectedSupplierId ===
      supplierId
    ) {
      setSelectedSupplierId(
        remainingSuppliers[0]?.id ??
          null,
      );
    }

    showFeedback(
      "Fornecedor excluído.",
    );
  }

  function openPaymentModal(
    supplier: WeddingSupplier,
  ) {
    setPaymentForm({
      ...emptyPaymentForm,
      supplierId: supplier.id,
      paidAt: new Date()
        .toISOString()
        .slice(0, 10),
    });

    setPendingReceiptFiles([]);
    setFormError("");
    setIsPaymentModalOpen(true);
  }

  function closePaymentModal() {
    setPaymentForm(
      emptyPaymentForm,
    );

    setPendingReceiptFiles([]);
    setFormError("");
    setIsPaymentModalOpen(false);
  }

  function handleReceiptSelection(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(
      event.target.files || [],
    );

    const validFiles =
      files.filter((file) => {
        const isPdf =
          file.type ===
          "application/pdf";

        const isImage =
          file.type.startsWith(
            "image/",
          );

        const isWithinLimit =
          file.size <=
          10 * 1024 * 1024;

        return (
          (isPdf || isImage) &&
          isWithinLimit
        );
      });

    setPendingReceiptFiles(
      (currentFiles) => [
        ...currentFiles,
        ...validFiles,
      ].slice(0, 6),
    );

    event.target.value = "";
  }

  function removePendingReceipt(
    index: number,
  ) {
    setPendingReceiptFiles(
      (currentFiles) =>
        currentFiles.filter(
          (_, fileIndex) =>
            fileIndex !== index,
        ),
    );
  }

  function savePayment(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const supplier =
      suppliers.find(
        (item) =>
          item.id ===
          paymentForm.supplierId,
      );

    if (!supplier) {
      setFormError(
        "Fornecedor não encontrado.",
      );

      return;
    }

    const amount = Number(
      paymentForm.amount,
    );

    const paidTotal =
      getPaidTotal(supplier);

    const remaining =
      Math.max(
        0,
        supplier.totalValue -
          paidTotal,
      );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setFormError(
        "Informe um valor pago válido.",
      );

      return;
    }

    if (amount > remaining) {
      setFormError(
        `O valor é maior que o saldo restante de ${formatCurrency(
          remaining,
        )}.`,
      );

      return;
    }

    if (!paymentForm.paidAt) {
      setFormError(
        "Informe a data do pagamento.",
      );

      return;
    }

    const receipts: PaymentReceipt[] =
      pendingReceiptFiles.map(
        (file, index) => ({
          id: `receipt-${Date.now()}-${index}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(
            file,
          ),
        }),
      );

    const payment: SupplierPayment =
      {
        id: `payment-${Date.now()}`,
        amount,

        paidAt:
          paymentForm.paidAt,

        note:
          paymentForm.note.trim() ||
          undefined,

        receipts,
      };

    const newPaidTotal =
      paidTotal + amount;

    setSuppliers(
      (currentSuppliers) =>
        currentSuppliers.map(
          (currentSupplier) =>
            currentSupplier.id ===
            supplier.id
              ? {
                  ...currentSupplier,

                  status:
                    newPaidTotal >=
                    currentSupplier.totalValue
                      ? "completed"
                      : currentSupplier.status ===
                          "completed"
                        ? "active"
                        : currentSupplier.status,

                  payments: [
                    payment,
                    ...currentSupplier.payments,
                  ],
                }
              : currentSupplier,
        ),
    );

    setSelectedSupplierId(
      supplier.id,
    );

    showFeedback(
      `Pagamento de ${formatCurrency(
        amount,
      )} registrado.`,
    );

    closePaymentModal();
  }

  function deletePayment(
    supplierId: string,
    paymentId: string,
  ) {
    const confirmed =
      window.confirm(
        "Excluir este pagamento e seus comprovantes?",
      );

    if (!confirmed) {
      return;
    }

    setSuppliers(
      (currentSuppliers) =>
        currentSuppliers.map(
          (supplier) => {
            if (
              supplier.id !==
              supplierId
            ) {
              return supplier;
            }

            const nextPayments =
              supplier.payments.filter(
                (payment) =>
                  payment.id !==
                  paymentId,
              );

            const nextPaidTotal =
              nextPayments.reduce(
                (total, payment) =>
                  total +
                  payment.amount,
                0,
              );

            return {
              ...supplier,

              payments: nextPayments,

              status:
                nextPaidTotal >=
                supplier.totalValue
                  ? "completed"
                  : supplier.status ===
                      "paused"
                    ? "paused"
                    : "active",
            };
          },
        ),
    );

    showFeedback(
      "Pagamento excluído.",
    );
  }

  function addReceiptsToPayment(
    supplierId: string,
    paymentId: string,
    files: FileList | null,
  ) {
    if (!files) {
      return;
    }

    const receipts =
      Array.from(files)
        .filter(
          (file) =>
            (file.type ===
              "application/pdf" ||
              file.type.startsWith(
                "image/",
              )) &&
            file.size <=
              10 * 1024 * 1024,
        )
        .slice(0, 6)
        .map((file, index) => ({
          id: `receipt-${Date.now()}-${index}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(
            file,
          ),
        }));

    setSuppliers(
      (currentSuppliers) =>
        currentSuppliers.map(
          (supplier) =>
            supplier.id ===
            supplierId
              ? {
                  ...supplier,

                  payments:
                    supplier.payments.map(
                      (payment) =>
                        payment.id ===
                        paymentId
                          ? {
                              ...payment,

                              receipts: [
                                ...payment.receipts,
                                ...receipts,
                              ].slice(0, 6),
                            }
                          : payment,
                    ),
                }
              : supplier,
        ),
    );

    showFeedback(
      "Comprovante anexado.",
    );
  }

  function removeReceipt(
    supplierId: string,
    paymentId: string,
    receiptId: string,
  ) {
    setSuppliers(
      (currentSuppliers) =>
        currentSuppliers.map(
          (supplier) =>
            supplier.id ===
            supplierId
              ? {
                  ...supplier,

                  payments:
                    supplier.payments.map(
                      (payment) =>
                        payment.id ===
                        paymentId
                          ? {
                              ...payment,

                              receipts:
                                payment.receipts.filter(
                                  (
                                    receipt,
                                  ) =>
                                    receipt.id !==
                                    receiptId,
                                ),
                            }
                          : payment,
                    ),
                }
              : supplier,
        ),
    );

    showFeedback(
      "Comprovante removido.",
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
            Serviços do casamento
          </span>

          <h1>Fornecedores</h1>

          <p>
            Organize os contratos,
            responsáveis, pagamentos e
            comprovantes de cada serviço do
            casamento.
          </p>
        </div>

        <div
          className={styles.headerActions}
        >
          <button
            type="button"
            className={
              styles.primaryButton
            }
            onClick={
              openCreateSupplierModal
            }
          >
            <span aria-hidden="true">
              +
            </span>

            Novo fornecedor
          </button>
        </div>

        <div
          className={styles.summaryGrid}
        >
          <article
            className={styles.summaryCard}
          >
            <span
              className={`${styles.summaryIcon} ${styles.contractsIcon}`}
              aria-hidden="true"
            >
              ◫
            </span>

            <div>
              <strong>
                {suppliers.length}
              </strong>

              <span>
                Fornecedores cadastrados
              </span>
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
              <strong>
                {formatCurrency(
                  totalPaid,
                )}
              </strong>

              <span>Total pago</span>
            </div>
          </article>

          <article
            className={styles.summaryCard}
          >
            <span
              className={`${styles.summaryIcon} ${styles.remainingIcon}`}
              aria-hidden="true"
            >
              ◷
            </span>

            <div>
              <strong>
                {formatCurrency(
                  totalRemaining,
                )}
              </strong>

              <span>
                Saldo restante
              </span>
            </div>
          </article>

          <article
            className={styles.summaryCard}
          >
            <span
              className={`${styles.summaryIcon} ${styles.progressIcon}`}
              aria-hidden="true"
            >
              %
            </span>

            <div>
              <strong>
                {globalPercentage}%
              </strong>

              <span>
                Progresso geral
              </span>
            </div>
          </article>
        </div>
      </header>

      <section
        className={styles.contentCard}
      >
        <div className={styles.toolbar}>
          <label
            className={styles.searchBox}
          >
            <span aria-hidden="true">
              ⌕
            </span>

            <input
              type="search"
              value={search}
              placeholder="Buscar fornecedor, serviço ou responsável..."
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
            />
          </label>

          <div
            className={styles.filterGroup}
          >
            <button
              type="button"
              className={`${styles.filterButton} ${
                statusFilter === "all"
                  ? styles.activeFilter
                  : ""
              }`}
              onClick={() =>
                setStatusFilter("all")
              }
            >
              Todos
              <span>
                {suppliers.length}
              </span>
            </button>

            <button
              type="button"
              className={`${styles.filterButton} ${
                statusFilter === "active"
                  ? styles.activeFilter
                  : ""
              }`}
              onClick={() =>
                setStatusFilter(
                  "active",
                )
              }
            >
              Em andamento
              <span>
                {activeSuppliers.length}
              </span>
            </button>

            <button
              type="button"
              className={`${styles.filterButton} ${
                statusFilter ===
                "completed"
                  ? styles.activeFilter
                  : ""
              }`}
              onClick={() =>
                setStatusFilter(
                  "completed",
                )
              }
            >
              Quitados
              <span>
                {
                  completedSuppliers.length
                }
              </span>
            </button>

            <button
              type="button"
              className={`${styles.filterButton} ${
                statusFilter === "paused"
                  ? styles.activeFilter
                  : ""
              }`}
              onClick={() =>
                setStatusFilter(
                  "paused",
                )
              }
            >
              Pausados
              <span>
                {pausedSuppliers.length}
              </span>
            </button>
          </div>
        </div>

        <div className={styles.workspace}>
          <div
            className={styles.supplierList}
          >
            <header
              className={styles.listHeader}
            >
              <div
                className={
                  styles.listHeaderCopy
                }
              >
                <span
                  className={
                    styles.eyebrow
                  }
                >
                  Contratos
                </span>

                <h2>
                  Serviços contratados
                </h2>
              </div>

              <span
                className={styles.listCount}
              >
                {filteredSuppliers.length}
              </span>
            </header>

            {filteredSuppliers.length >
            0 ? (
              <div
                className={
                  styles.supplierCards
                }
              >
                {filteredSuppliers.map(
                  (supplier) => {
                    const paid =
                      getPaidTotal(
                        supplier,
                      );

                    const remaining =
                      Math.max(
                        0,
                        supplier.totalValue -
                          paid,
                      );

                    const percentage =
                      getPaymentPercentage(
                        supplier,
                      );

                    return (
                      <article
                        key={supplier.id}
                        className={`${styles.supplierCard} ${
                          selectedSupplierId ===
                          supplier.id
                            ? styles.selectedSupplierCard
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedSupplierId(
                            supplier.id,
                          )
                        }
                      >
                        <div
                          className={
                            styles.supplierCardTop
                          }
                        >
                          <span
                            className={
                              styles.serviceIcon
                            }
                            aria-hidden="true"
                          >
                            {
                              categoryIcons[
                                supplier
                                  .category
                              ]
                            }
                          </span>

                          <div
                            className={
                              styles.supplierIdentity
                            }
                          >
                            <span>
                              {
                                categoryLabels[
                                  supplier
                                    .category
                                ]
                              }
                            </span>

                            <h3>
                              {
                                supplier.serviceName
                              }
                            </h3>

                            <p>
                              {
                                supplier.supplierName
                              }
                            </p>
                          </div>

                          <span
                            className={`${styles.statusBadge} ${
                              statusClasses[
                                supplier
                                  .status
                              ]
                            }`}
                          >
                            <i />

                            {
                              statusLabels[
                                supplier.status
                              ]
                            }
                          </span>
                        </div>

                        <div
                          className={
                            styles.supplierMeta
                          }
                        >
                          <div
                            className={
                              styles.contactLine
                            }
                          >
                            <span>
                              Responsável
                            </span>

                            <strong>
                              {
                                supplier.contactName
                              }
                            </strong>
                          </div>

                          <div
                            className={
                              styles.financialBlock
                            }
                          >
                            <div
                              className={
                                styles.financialRow
                              }
                            >
                              <span>
                                Valor total
                              </span>

                              <strong>
                                {formatCurrency(
                                  supplier.totalValue,
                                )}
                              </strong>
                            </div>

                            <div
                              className={
                                styles.financialRow
                              }
                            >
                              <span>
                                Já pago
                              </span>

                              <strong>
                                {formatCurrency(
                                  paid,
                                )}
                              </strong>
                            </div>

                            <div
                              className={
                                styles.financialRow
                              }
                            >
                              <span>
                                Restante
                              </span>

                              <strong>
                                {formatCurrency(
                                  remaining,
                                )}
                              </strong>
                            </div>
                          </div>

                          <div
                            className={
                              styles.progressHeader
                            }
                          >
                            <span>
                              Progresso do
                              pagamento
                            </span>

                            <strong>
                              {percentage}%
                            </strong>
                          </div>

                          <div
                            className={
                              styles.progressTrack
                            }
                          >
                            <span
                              className={
                                percentage >=
                                100
                                  ? styles.progressComplete
                                  : styles.progressFill
                              }
                              style={{
                                width: `${percentage}%`,
                              }}
                            />
                          </div>
                        </div>

                        <footer
                          className={
                            styles.cardFooter
                          }
                        >
                          <button
                            type="button"
                            className={
                              styles.cardAction
                            }
                            onClick={(
                              event,
                            ) => {
                              event.stopPropagation();

                              setSelectedSupplierId(
                                supplier.id,
                              );

                              openPaymentModal(
                                supplier,
                              );
                            }}
                          >
                            Registrar pagamento
                          </button>

                          <button
                            type="button"
                            className={
                              styles.cardAction
                            }
                            onClick={(
                              event,
                            ) => {
                              event.stopPropagation();

                              openEditSupplierModal(
                                supplier,
                              );
                            }}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className={
                              styles.deleteGhost
                            }
                            onClick={(
                              event,
                            ) => {
                              event.stopPropagation();

                              deleteSupplier(
                                supplier.id,
                              );
                            }}
                          >
                            Excluir
                          </button>
                        </footer>
                      </article>
                    );
                  },
                )}
              </div>
            ) : (
              <div
                className={styles.emptyState}
              >
                <span aria-hidden="true">
                  ⌕
                </span>

                <strong>
                  Nenhum fornecedor encontrado
                </strong>

                <p>
                  Altere a busca ou os
                  filtros selecionados.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter(
                      "all",
                    );
                  }}
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </div>

          <aside
            className={styles.detailPanel}
          >
            {selectedSupplier ? (
              <>
                <header
                  className={
                    styles.detailHeader
                  }
                >
                  <span
                    className={
                      styles.serviceIcon
                    }
                    aria-hidden="true"
                  >
                    {
                      categoryIcons[
                        selectedSupplier
                          .category
                      ]
                    }
                  </span>

                  <div
                    className={
                      styles.detailTitle
                    }
                  >
                    <span
                      className={
                        styles.eyebrow
                      }
                    >
                      Fornecedor selecionado
                    </span>

                    <h2>
                      {
                        selectedSupplier.serviceName
                      }
                    </h2>

                    <p>
                      {
                        selectedSupplier.supplierName
                      }
                    </p>
                  </div>

                  <button
                    type="button"
                    className={
                      styles.iconButton
                    }
                    aria-label="Editar fornecedor"
                    onClick={() =>
                      openEditSupplierModal(
                        selectedSupplier,
                      )
                    }
                  >
                    ✎
                  </button>
                </header>

                <div
                  className={
                    styles.detailSummary
                  }
                >
                  <div
                    className={
                      styles.detailAmount
                    }
                  >
                    <span>
                      Valor contratado
                    </span>

                    <strong>
                      {formatCurrency(
                        selectedSupplier.totalValue,
                      )}
                    </strong>
                  </div>

                  <div
                    className={
                      styles.detailAmount
                    }
                  >
                    <span>Valor pago</span>

                    <strong>
                      {formatCurrency(
                        getPaidTotal(
                          selectedSupplier,
                        ),
                      )}
                    </strong>
                  </div>

                  <div
                    className={
                      styles.detailAmount
                    }
                  >
                    <span>
                      Saldo restante
                    </span>

                    <strong>
                      {formatCurrency(
                        Math.max(
                          0,
                          selectedSupplier.totalValue -
                            getPaidTotal(
                              selectedSupplier,
                            ),
                        ),
                      )}
                    </strong>
                  </div>
                </div>

                <div
                  className={
                    styles.detailProgress
                  }
                >
                  <div
                    className={
                      styles.progressHeader
                    }
                  >
                    <span>
                      Progresso do pagamento
                    </span>

                    <strong>
                      {getPaymentPercentage(
                        selectedSupplier,
                      )}
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
                        getPaymentPercentage(
                          selectedSupplier,
                        ) >= 100
                          ? styles.progressComplete
                          : styles.progressFill
                      }
                      style={{
                        width: `${getPaymentPercentage(
                          selectedSupplier,
                        )}%`,
                      }}
                    />
                  </div>

                  <p>
                    {formatCurrency(
                      getPaidTotal(
                        selectedSupplier,
                      ),
                    )}{" "}
                    de{" "}
                    {formatCurrency(
                      selectedSupplier.totalValue,
                    )}{" "}
                    pagos
                  </p>
                </div>

                <div
                  className={
                    styles.detailInfoGrid
                  }
                >
                  <div
                    className={
                      styles.infoItem
                    }
                  >
                    <span>
                      Responsável
                    </span>

                    <strong>
                      {
                        selectedSupplier.contactName
                      }
                    </strong>
                  </div>

                  <div
                    className={
                      styles.infoItem
                    }
                  >
                    <span>Telefone</span>

                    <strong>
                      {selectedSupplier.phone ||
                        "Não informado"}
                    </strong>
                  </div>

                  <div
                    className={
                      styles.infoItem
                    }
                  >
                    <span>E-mail</span>

                    <strong>
                      {selectedSupplier.email ||
                        "Não informado"}
                    </strong>
                  </div>

                  <div
                    className={
                      styles.infoItem
                    }
                  >
                    <span>
                      Vencimento final
                    </span>

                    <strong>
                      {formatDate(
                        selectedSupplier.dueDate,
                      )}
                    </strong>
                  </div>
                </div>

                <section
                  className={
                    styles.paymentSection
                  }
                >
                  <header
                    className={
                      styles.paymentSectionHeader
                    }
                  >
                    <div>
                      <strong>
                        Histórico de pagamentos
                      </strong>

                      <span>
                        {
                          selectedSupplier
                            .payments
                            .length
                        }{" "}
                        {selectedSupplier
                          .payments
                          .length === 1
                          ? "pagamento"
                          : "pagamentos"}
                      </span>
                    </div>

                    <button
                      type="button"
                      className={
                        styles.addPaymentButton
                      }
                      onClick={() =>
                        openPaymentModal(
                          selectedSupplier,
                        )
                      }
                    >
                      + Pagamento
                    </button>
                  </header>

                  {selectedSupplier
                    .payments.length >
                  0 ? (
                    <div
                      className={
                        styles.paymentList
                      }
                    >
                      {selectedSupplier.payments.map(
                        (payment) => (
                          <article
                            key={
                              payment.id
                            }
                            className={
                              styles.paymentItem
                            }
                          >
                            <div
                              className={
                                styles.paymentDate
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
                                    `${payment.paidAt}T12:00:00`,
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
                                    `${payment.paidAt}T12:00:00`,
                                  ),
                                )}
                              </span>
                            </div>

                            <div
                              className={
                                styles.paymentIdentity
                              }
                            >
                              <strong>
                                Pagamento
                                registrado
                              </strong>

                              <span>
                                {payment.note ||
                                  "Sem observações"}
                              </span>
                            </div>

                            <strong
                              className={
                                styles.paymentValue
                              }
                            >
                              {formatCurrency(
                                payment.amount,
                              )}
                            </strong>

                            <button
                              type="button"
                              className={
                                styles.deletePaymentButton
                              }
                              aria-label="Excluir pagamento"
                              onClick={() =>
                                deletePayment(
                                  selectedSupplier.id,
                                  payment.id,
                                )
                              }
                            >
                              ×
                            </button>

                            <div
                              className={
                                styles.paymentActions
                              }
                            >
                              <div
                                className={
                                  styles.receiptList
                                }
                              >
                                {payment.receipts.map(
                                  (
                                    receipt,
                                  ) => (
                                    <div
                                      key={
                                        receipt.id
                                      }
                                      className={
                                        styles.receiptChip
                                      }
                                    >
                                      {receipt.url ? (
                                        <a
                                          href={
                                            receipt.url
                                          }
                                          target="_blank"
                                          rel="noreferrer"
                                        >
                                          <span>
                                            ▤
                                          </span>

                                          <div>
                                            <strong>
                                              {
                                                receipt.name
                                              }
                                            </strong>

                                            <small>
                                              {formatFileSize(
                                                receipt.size,
                                              )}
                                            </small>
                                          </div>
                                        </a>
                                      ) : (
                                        <div>
                                          <span>
                                            ▤
                                          </span>

                                          <div>
                                            <strong>
                                              {
                                                receipt.name
                                              }
                                            </strong>

                                            <small>
                                              {formatFileSize(
                                                receipt.size,
                                              )}
                                            </small>
                                          </div>
                                        </div>
                                      )}

                                      <button
                                        type="button"
                                        className={
                                          styles.removeReceiptButton
                                        }
                                        aria-label="Remover comprovante"
                                        onClick={() =>
                                          removeReceipt(
                                            selectedSupplier.id,
                                            payment.id,
                                            receipt.id,
                                          )
                                        }
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ),
                                )}
                              </div>

                              <label
                                className={
                                  styles.uploadReceiptLabel
                                }
                              >
                                <input
                                  type="file"
                                  accept="application/pdf,image/*"
                                  multiple
                                  onChange={(
                                    event,
                                  ) =>
                                    addReceiptsToPayment(
                                      selectedSupplier.id,
                                      payment.id,
                                      event
                                        .target
                                        .files,
                                    )
                                  }
                                />

                                + Comprovante
                              </label>
                            </div>
                          </article>
                        ),
                      )}
                    </div>
                  ) : (
                    <div
                      className={
                        styles.emptyPayments
                      }
                    >
                      <span
                        aria-hidden="true"
                      >
                        ▤
                      </span>

                      <strong>
                        Nenhum pagamento registrado
                      </strong>

                      <p>
                        Registre o primeiro
                        pagamento deste
                        fornecedor.
                      </p>
                    </div>
                  )}
                </section>

                <footer
                  className={
                    styles.detailFooter
                  }
                >
                  <button
                    type="button"
                    className={
                      styles.editButton
                    }
                    onClick={() =>
                      openEditSupplierModal(
                        selectedSupplier,
                      )
                    }
                  >
                    Editar fornecedor
                  </button>

                  <button
                    type="button"
                    className={
                      styles.deleteButton
                    }
                    onClick={() =>
                      deleteSupplier(
                        selectedSupplier.id,
                      )
                    }
                  >
                    Excluir
                  </button>
                </footer>
              </>
            ) : (
              <div
                className={styles.emptyState}
              >
                <span aria-hidden="true">
                  ○
                </span>

                <strong>
                  Selecione um fornecedor
                </strong>

                <p>
                  Clique em um serviço para
                  visualizar seus pagamentos
                  e comprovantes.
                </p>
              </div>
            )}
          </aside>
        </div>
      </section>

      {isSupplierModalOpen && (
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
              closeSupplierModal();
            }
          }}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="supplier-modal-title"
          >
            <header
              className={styles.modalHeader}
            >
              <div>
                <span
                  className={
                    styles.eyebrow
                  }
                >
                  Serviços contratados
                </span>

                <h2 id="supplier-modal-title">
                  {supplierForm.id
                    ? "Editar fornecedor"
                    : "Novo fornecedor"}
                </h2>
              </div>

              <button
                type="button"
                className={
                  styles.closeButton
                }
                aria-label="Fechar"
                onClick={
                  closeSupplierModal
                }
              >
                ×
              </button>
            </header>

            <form
              className={styles.form}
              onSubmit={saveSupplier}
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
                    Nome do fornecedor
                  </span>

                  <input
                    type="text"
                    value={
                      supplierForm.supplierName
                    }
                    placeholder="Ex.: Solar do Bosque"
                    autoFocus
                    onChange={(event) =>
                      setSupplierForm(
                        (
                          currentForm,
                        ) => ({
                          ...currentForm,

                          supplierName:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Tipo de serviço
                  </span>

                  <input
                    type="text"
                    value={
                      supplierForm.serviceName
                    }
                    placeholder="Ex.: Espaço e recepção"
                    onChange={(event) =>
                      setSupplierForm(
                        (
                          currentForm,
                        ) => ({
                          ...currentForm,

                          serviceName:
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
                      supplierForm.category
                    }
                    onChange={(event) =>
                      setSupplierForm(
                        (
                          currentForm,
                        ) => ({
                          ...currentForm,

                          category:
                            event.target
                              .value as ServiceCategory,
                        }),
                      )
                    }
                  >
                    {Object.entries(
                      categoryLabels,
                    ).map(
                      ([
                        category,
                        label,
                      ]) => (
                        <option
                          key={category}
                          value={category}
                        >
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label>
                  <span>
                    Responsável pelo serviço
                  </span>

                  <input
                    type="text"
                    value={
                      supplierForm.contactName
                    }
                    placeholder="Nome de quem atende vocês"
                    onChange={(event) =>
                      setSupplierForm(
                        (
                          currentForm,
                        ) => ({
                          ...currentForm,

                          contactName:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />
                </label>

                <label>
                  <span>Telefone</span>

                  <input
                    type="tel"
                    value={
                      supplierForm.phone
                    }
                    placeholder="(91) 99999-9999"
                    onChange={(event) =>
                      setSupplierForm(
                        (
                          currentForm,
                        ) => ({
                          ...currentForm,

                          phone:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />
                </label>

                <label>
                  <span>E-mail</span>

                  <input
                    type="email"
                    value={
                      supplierForm.email
                    }
                    placeholder="contato@fornecedor.com"
                    onChange={(event) =>
                      setSupplierForm(
                        (
                          currentForm,
                        ) => ({
                          ...currentForm,

                          email:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Valor total do serviço
                  </span>

                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={
                      supplierForm.totalValue
                    }
                    placeholder="0,00"
                    onChange={(event) =>
                      setSupplierForm(
                        (
                          currentForm,
                        ) => ({
                          ...currentForm,

                          totalValue:
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
                      supplierForm.status
                    }
                    onChange={(event) =>
                      setSupplierForm(
                        (
                          currentForm,
                        ) => ({
                          ...currentForm,

                          status:
                            event.target
                              .value as SupplierStatus,
                        }),
                      )
                    }
                  >
                    <option value="active">
                      Em andamento
                    </option>

                    <option value="paused">
                      Pausado
                    </option>

                    <option value="completed">
                      Quitado
                    </option>
                  </select>
                </label>

                <label>
                  <span>
                    Data do contrato
                  </span>

                  <input
                    type="date"
                    value={
                      supplierForm.contractDate
                    }
                    onChange={(event) =>
                      setSupplierForm(
                        (
                          currentForm,
                        ) => ({
                          ...currentForm,

                          contractDate:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Vencimento final
                  </span>

                  <input
                    type="date"
                    value={
                      supplierForm.dueDate
                    }
                    onChange={(event) =>
                      setSupplierForm(
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
                      supplierForm.notes
                    }
                    placeholder="Informações importantes sobre contrato, entregas ou condições..."
                    onChange={(event) =>
                      setSupplierForm(
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
                    closeSupplierModal
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
                  {supplierForm.id
                    ? "Salvar alterações"
                    : "Adicionar fornecedor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPaymentModalOpen && (
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
              closePaymentModal();
            }
          }}
        >
          <div
            className={`${styles.modal} ${styles.paymentModal}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
          >
            <header
              className={styles.modalHeader}
            >
              <div>
                <span
                  className={
                    styles.eyebrow
                  }
                >
                  Controle financeiro
                </span>

                <h2 id="payment-modal-title">
                  Registrar pagamento
                </h2>
              </div>

              <button
                type="button"
                className={
                  styles.closeButton
                }
                aria-label="Fechar"
                onClick={
                  closePaymentModal
                }
              >
                ×
              </button>
            </header>

            <form
              className={styles.form}
              onSubmit={savePayment}
            >
              {selectedSupplier && (
                <div
                  className={
                    styles.paymentPreview
                  }
                >
                  <div>
                    <span>Fornecedor</span>

                    <strong>
                      {
                        selectedSupplier.supplierName
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Saldo restante
                    </span>

                    <strong>
                      {formatCurrency(
                        Math.max(
                          0,
                          selectedSupplier.totalValue -
                            getPaidTotal(
                              selectedSupplier,
                            ),
                        ),
                      )}
                    </strong>
                  </div>
                </div>
              )}

              <div
                className={
                  styles.formGrid
                }
              >
                <label>
                  <span>Valor pago</span>

                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={
                      paymentForm.amount
                    }
                    placeholder="0,00"
                    autoFocus
                    onChange={(event) =>
                      setPaymentForm(
                        (
                          currentForm,
                        ) => ({
                          ...currentForm,

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
                    Data do pagamento
                  </span>

                  <input
                    type="date"
                    value={
                      paymentForm.paidAt
                    }
                    onChange={(event) =>
                      setPaymentForm(
                        (
                          currentForm,
                        ) => ({
                          ...currentForm,

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
                  <span>Observação</span>

                  <textarea
                    value={
                      paymentForm.note
                    }
                    placeholder="Ex.: Segunda parcela do contrato"
                    onChange={(event) =>
                      setPaymentForm(
                        (
                          currentForm,
                        ) => ({
                          ...currentForm,

                          note:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />
                </label>

                <div
                  className={`${styles.fullField} ${styles.receiptDropzone}`}
                >
                  <input
                    id="payment-receipts"
                    type="file"
                    accept="application/pdf,image/*"
                    multiple
                    onChange={
                      handleReceiptSelection
                    }
                  />

                  <label htmlFor="payment-receipts">
                    <span
                      aria-hidden="true"
                    >
                      ⇧
                    </span>

                    <strong>
                      Anexar comprovantes
                    </strong>

                    <small>
                      PDF, JPG ou PNG de até
                      10 MB. Máximo de seis
                      arquivos.
                    </small>
                  </label>
                </div>

                {pendingReceiptFiles.length >
                  0 && (
                  <div
                    className={`${styles.fullField} ${styles.pendingFiles}`}
                  >
                    {pendingReceiptFiles.map(
                      (
                        file,
                        index,
                      ) => (
                        <div
                          key={`${file.name}-${index}`}
                          className={
                            styles.pendingFile
                          }
                        >
                          <span>
                            ▤
                          </span>

                          <div>
                            <strong>
                              {
                                file.name
                              }
                            </strong>

                            <small>
                              {formatFileSize(
                                file.size,
                              )}
                            </small>
                          </div>

                          <button
                            type="button"
                            className={
                              styles.removePendingFile
                            }
                            onClick={() =>
                              removePendingReceipt(
                                index,
                              )
                            }
                          >
                            ×
                          </button>
                        </div>
                      ),
                    )}
                  </div>
                )}
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
                    closePaymentModal
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
                  Registrar pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}