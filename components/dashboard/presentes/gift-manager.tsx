"use client";

import {
  type FormEvent,
  useMemo,
  useState,
} from "react";

import styles from "./gift-manager.module.css";

export type GiftStatus =
  | "available"
  | "reserved"
  | "gifted";

export type GiftCategory =
  | "tour"
  | "gastronomy"
  | "romance"
  | "adventure"
  | "relaxation"
  | "transport";

export type GiftTone =
  | "sage"
  | "blue"
  | "yellow"
  | "rose"
  | "navy";

export type GiftGiver = {
  name: string;
  email?: string;
  message?: string;
  showPublicly: boolean;

  selectedAt?: string;
  reservationExpiresAt?: string;
  giftedAt?: string;
};

export type HoneymoonGift = {
  id: string;

  title: string;
  description: string;
  location: string;

  category: GiftCategory;
  price: number;

  icon: string;
  tone: GiftTone;

  status: GiftStatus;
  isVisible: boolean;

  giver?: GiftGiver;
};

type GiftManagerProps = {
  initialGifts: HoneymoonGift[];
};

type ViewMode =
  | "management"
  | "preview";

type GiftFormState = {
  id: string | null;

  title: string;
  description: string;
  location: string;

  category: GiftCategory;
  price: string;

  icon: string;
  tone: GiftTone;

  isVisible: boolean;
};

type ReservationFormState = {
  name: string;
  email: string;
  message: string;
  showPublicly: boolean;
};

const emptyGiftForm: GiftFormState = {
  id: null,

  title: "",
  description: "",
  location: "",

  category: "tour",
  price: "",

  icon: "✦",
  tone: "sage",

  isVisible: true,
};

const emptyReservationForm: ReservationFormState = {
  name: "",
  email: "",
  message: "",
  showPublicly: true,
};

const statusLabels: Record<
  GiftStatus,
  string
> = {
  available: "Disponível",
  reserved: "Aguardando pagamento",
  gifted: "Presenteado",
};

const categoryLabels: Record<
  GiftCategory,
  string
> = {
  tour: "Passeio",
  gastronomy: "Gastronomia",
  romance: "Experiência romântica",
  adventure: "Aventura",
  relaxation: "Relaxamento",
  transport: "Transporte",
};

const statusClasses: Record<
  GiftStatus,
  string
> = {
  available: styles.statusAvailable,
  reserved: styles.statusReserved,
  gifted: styles.statusGifted,
};

const toneClasses: Record<
  GiftTone,
  string
> = {
  sage: styles.toneSage,
  blue: styles.toneBlue,
  yellow: styles.toneYellow,
  rose: styles.toneRose,
  navy: styles.toneNavy,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getCurrentDateTimeLabel() {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function getReservationExpirationLabel() {
  const expiration = new Date();

  expiration.setMinutes(
    expiration.getMinutes() + 30,
  );

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(expiration);
}

export default function GiftManager({
  initialGifts,
}: GiftManagerProps) {
  const [gifts, setGifts] =
    useState<HoneymoonGift[]>(
      initialGifts,
    );

  const [viewMode, setViewMode] =
    useState<ViewMode>("management");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<GiftStatus | "all">(
      "all",
    );

  const [feedback, setFeedback] =
    useState<string | null>(null);

  const [
    isGiftModalOpen,
    setIsGiftModalOpen,
  ] = useState(false);

  const [
    isReservationModalOpen,
    setIsReservationModalOpen,
  ] = useState(false);

  const [giftForm, setGiftForm] =
    useState<GiftFormState>(
      emptyGiftForm,
    );

  const [
    reservationForm,
    setReservationForm,
  ] =
    useState<ReservationFormState>(
      emptyReservationForm,
    );

  const [
    selectedGiftId,
    setSelectedGiftId,
  ] = useState<string | null>(null);

  const [formError, setFormError] =
    useState("");

  const availableGifts = useMemo(
    () =>
      gifts.filter(
        (gift) =>
          gift.status === "available",
      ),
    [gifts],
  );

  const reservedGifts = useMemo(
    () =>
      gifts.filter(
        (gift) =>
          gift.status === "reserved",
      ),
    [gifts],
  );

  const giftedGifts = useMemo(
    () =>
      gifts.filter(
        (gift) =>
          gift.status === "gifted",
      ),
    [gifts],
  );

  const receivedTotal = useMemo(
    () =>
      giftedGifts.reduce(
        (total, gift) =>
          total + gift.price,
        0,
      ),
    [giftedGifts],
  );

  const reservedTotal = useMemo(
    () =>
      reservedGifts.reduce(
        (total, gift) =>
          total + gift.price,
        0,
      ),
    [reservedGifts],
  );

  const filteredGifts = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLocaleLowerCase("pt-BR");

    return gifts.filter((gift) => {
      const matchesSearch =
        !normalizedSearch ||
        gift.title
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch) ||
        gift.description
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch) ||
        gift.location
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch) ||
        categoryLabels[gift.category]
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        gift.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    gifts,
    search,
    statusFilter,
  ]);

  const publicGifts = useMemo(
    () =>
      gifts.filter(
        (gift) => gift.isVisible,
      ),
    [gifts],
  );

  const selectedGift =
    gifts.find(
      (gift) =>
        gift.id === selectedGiftId,
    ) ?? null;

  function showFeedback(
    message: string,
  ) {
    setFeedback(message);

    window.setTimeout(() => {
      setFeedback(null);
    }, 2800);
  }

  function openCreateGiftModal() {
    setGiftForm(emptyGiftForm);
    setFormError("");
    setIsGiftModalOpen(true);
  }

  function openEditGiftModal(
    gift: HoneymoonGift,
  ) {
    setGiftForm({
      id: gift.id,

      title: gift.title,
      description: gift.description,
      location: gift.location,

      category: gift.category,
      price: String(gift.price),

      icon: gift.icon,
      tone: gift.tone,

      isVisible: gift.isVisible,
    });

    setFormError("");
    setIsGiftModalOpen(true);
  }

  function closeGiftModal() {
    setGiftForm(emptyGiftForm);
    setFormError("");
    setIsGiftModalOpen(false);
  }

  function saveGift(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const title =
      giftForm.title.trim();

    const description =
      giftForm.description.trim();

    const location =
      giftForm.location.trim();

    const price = Number(
      giftForm.price,
    );

    if (!title) {
      setFormError(
        "Informe o nome do passeio.",
      );

      return;
    }

    if (!description) {
      setFormError(
        "Informe uma descrição para o passeio.",
      );

      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setFormError(
        "Informe um valor válido.",
      );

      return;
    }

    if (giftForm.id) {
      setGifts((currentGifts) =>
        currentGifts.map((gift) =>
          gift.id === giftForm.id
            ? {
                ...gift,

                title,
                description,
                location,

                category:
                  giftForm.category,

                price,

                icon:
                  giftForm.icon.trim() ||
                  "✦",

                tone: giftForm.tone,

                isVisible:
                  giftForm.isVisible,
              }
            : gift,
        ),
      );

      showFeedback(
        "Passeio atualizado.",
      );
    } else {
      const newGift: HoneymoonGift = {
        id: `gift-${Date.now()}`,

        title,
        description,
        location,

        category:
          giftForm.category,

        price,

        icon:
          giftForm.icon.trim() ||
          "✦",

        tone: giftForm.tone,

        status: "available",
        isVisible:
          giftForm.isVisible,
      };

      setGifts((currentGifts) => [
        newGift,
        ...currentGifts,
      ]);

      showFeedback(
        "Novo passeio adicionado.",
      );
    }

    closeGiftModal();
  }

  function toggleGiftVisibility(
    giftId: string,
  ) {
    const gift = gifts.find(
      (item) => item.id === giftId,
    );

    setGifts((currentGifts) =>
      currentGifts.map((item) =>
        item.id === giftId
          ? {
              ...item,
              isVisible:
                !item.isVisible,
            }
          : item,
      ),
    );

    if (gift) {
      showFeedback(
        gift.isVisible
          ? "Passeio ocultado do convite."
          : "Passeio exibido no convite.",
      );
    }
  }

  function deleteGift(
    giftId: string,
  ) {
    const gift = gifts.find(
      (item) => item.id === giftId,
    );

    if (!gift) {
      return;
    }

    const confirmed =
      window.confirm(
        `Excluir o passeio "${gift.title}"?`,
      );

    if (!confirmed) {
      return;
    }

    setGifts((currentGifts) =>
      currentGifts.filter(
        (item) =>
          item.id !== giftId,
      ),
    );

    showFeedback(
      "Passeio excluído.",
    );
  }

  function openReservationModal(
    giftId: string,
  ) {
    const gift = gifts.find(
      (item) => item.id === giftId,
    );

    if (
      !gift ||
      gift.status !== "available"
    ) {
      return;
    }

    setSelectedGiftId(giftId);
    setReservationForm(
      emptyReservationForm,
    );

    setFormError("");
    setIsReservationModalOpen(true);
  }

  function closeReservationModal() {
    setSelectedGiftId(null);
    setReservationForm(
      emptyReservationForm,
    );

    setFormError("");
    setIsReservationModalOpen(false);
  }

  function reserveGift(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedGift) {
      return;
    }

    const name =
      reservationForm.name.trim();

    const email =
      reservationForm.email.trim();

    const message =
      reservationForm.message.trim();

    if (!name) {
      setFormError(
        "Informe o nome da pessoa que está presenteando.",
      );

      return;
    }

    if (!email) {
      setFormError(
        "Informe um e-mail para continuar.",
      );

      return;
    }

    setGifts((currentGifts) =>
      currentGifts.map((gift) =>
        gift.id === selectedGift.id
          ? {
              ...gift,

              status: "reserved",

              giver: {
                name,
                email,

                message:
                  message || undefined,

                showPublicly:
                  reservationForm.showPublicly,

                selectedAt:
                  getCurrentDateTimeLabel(),

                reservationExpiresAt:
                  getReservationExpirationLabel(),
              },
            }
          : gift,
      ),
    );

    showFeedback(
      "Passeio reservado. Aguardando pagamento.",
    );

    closeReservationModal();
  }

  function confirmGiftPayment(
    giftId: string,
  ) {
    setGifts((currentGifts) =>
      currentGifts.map((gift) =>
        gift.id === giftId &&
        gift.giver
          ? {
              ...gift,

              status: "gifted",

              giver: {
                ...gift.giver,
                giftedAt:
                  getCurrentDateTimeLabel(),
                reservationExpiresAt:
                  undefined,
              },
            }
          : gift,
      ),
    );

    showFeedback(
      "Presente confirmado.",
    );
  }

  function releaseGift(
    giftId: string,
  ) {
    setGifts((currentGifts) =>
      currentGifts.map((gift) =>
        gift.id === giftId
          ? {
              ...gift,
              status: "available",
              giver: undefined,
            }
          : gift,
      ),
    );

    showFeedback(
      "O passeio voltou a ficar disponível.",
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

      <header className={styles.pageHeader}>
        <div className={styles.headerCopy}>
          <span className={styles.eyebrow}>
            Lua de mel
          </span>

          <h1>Presentes e experiências</h1>

          <p>
            Cadastre passeios da lua de mel para que
            os convidados possam presentear vocês
            diretamente pelo convite.
          </p>
        </div>

        <div className={styles.headerActions}>
          <div
            className={styles.viewToggle}
            aria-label="Modo de visualização"
          >
            <button
              type="button"
              className={
                viewMode === "management"
                  ? styles.activeView
                  : ""
              }
              aria-pressed={
                viewMode === "management"
              }
              onClick={() =>
                setViewMode("management")
              }
            >
              <span aria-hidden="true">
                ◫
              </span>

              Gestão
            </button>

            <button
              type="button"
              className={
                viewMode === "preview"
                  ? styles.activeView
                  : ""
              }
              aria-pressed={
                viewMode === "preview"
              }
              onClick={() =>
                setViewMode("preview")
              }
            >
              <span aria-hidden="true">
                ◉
              </span>

              Prévia do convite
            </button>
          </div>

          <button
            type="button"
            className={styles.primaryButton}
            onClick={openCreateGiftModal}
          >
            <span aria-hidden="true">
              +
            </span>

            Novo passeio
          </button>
        </div>

        <div className={styles.summaryGrid}>
          <article className={styles.summaryCard}>
            <span
              className={`${styles.summaryIcon} ${styles.totalIcon}`}
              aria-hidden="true"
            >
              ✦
            </span>

            <div>
              <strong>{gifts.length}</strong>
              <span>Experiências cadastradas</span>
            </div>
          </article>

          <article className={styles.summaryCard}>
            <span
              className={`${styles.summaryIcon} ${styles.availableIcon}`}
              aria-hidden="true"
            >
              ○
            </span>

            <div>
              <strong>
                {availableGifts.length}
              </strong>

              <span>Disponíveis</span>
            </div>
          </article>

          <article className={styles.summaryCard}>
            <span
              className={`${styles.summaryIcon} ${styles.reservedIcon}`}
              aria-hidden="true"
            >
              ◷
            </span>

            <div>
              <strong>
                {reservedGifts.length}
              </strong>

              <span>
                Aguardando pagamento
              </span>
            </div>
          </article>

          <article className={styles.summaryCard}>
            <span
              className={`${styles.summaryIcon} ${styles.giftedIcon}`}
              aria-hidden="true"
            >
              ✓
            </span>

            <div>
              <strong>
                {giftedGifts.length}
              </strong>

              <span>Presenteados</span>
            </div>
          </article>

          <article
            className={`${styles.summaryCard} ${styles.valueSummary}`}
          >
            <span
              className={`${styles.summaryIcon} ${styles.moneyIcon}`}
              aria-hidden="true"
            >
              R$
            </span>

            <div>
              <strong>
                {formatCurrency(
                  receivedTotal,
                )}
              </strong>

              <span>Valor recebido</span>
            </div>
          </article>
        </div>
      </header>

      {viewMode === "management" ? (
        <>
          <section className={styles.financeStrip}>
            <div>
              <span>
                Presentes confirmados
              </span>

              <strong>
                {formatCurrency(
                  receivedTotal,
                )}
              </strong>
            </div>

            <i aria-hidden="true" />

            <div>
              <span>
                Aguardando confirmação
              </span>

              <strong>
                {formatCurrency(
                  reservedTotal,
                )}
              </strong>
            </div>

            <i aria-hidden="true" />

            <div>
              <span>Projeção total</span>

              <strong>
                {formatCurrency(
                  receivedTotal +
                    reservedTotal,
                )}
              </strong>
            </div>

            <div className={styles.financeNotice}>
              <span aria-hidden="true">
                i
              </span>

              <p>
                Na integração real, somente o
                webhook do pagamento poderá
                confirmar um presente.
              </p>
            </div>
          </section>

          <section className={styles.managementSection}>
            <header className={styles.sectionHeader}>
              <div>
                <span className={styles.eyebrow}>
                  Experiências
                </span>

                <h2>
                  Lista de presentes
                </h2>
              </div>

              <span>
                {filteredGifts.length}{" "}
                {filteredGifts.length === 1
                  ? "passeio"
                  : "passeios"}
              </span>
            </header>

            <div className={styles.toolbar}>
              <label className={styles.searchBox}>
                <span aria-hidden="true">
                  ⌕
                </span>

                <input
                  type="search"
                  value={search}
                  placeholder="Buscar passeio ou local..."
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                />
              </label>

              <div className={styles.filters}>
                <button
                  type="button"
                  className={
                    statusFilter === "all"
                      ? styles.activeFilter
                      : ""
                  }
                  onClick={() =>
                    setStatusFilter("all")
                  }
                >
                  Todos
                  <span>{gifts.length}</span>
                </button>

                <button
                  type="button"
                  className={
                    statusFilter ===
                    "available"
                      ? styles.activeFilter
                      : ""
                  }
                  onClick={() =>
                    setStatusFilter(
                      "available",
                    )
                  }
                >
                  Disponíveis
                  <span>
                    {availableGifts.length}
                  </span>
                </button>

                <button
                  type="button"
                  className={
                    statusFilter ===
                    "reserved"
                      ? styles.activeFilter
                      : ""
                  }
                  onClick={() =>
                    setStatusFilter(
                      "reserved",
                    )
                  }
                >
                  Aguardando
                  <span>
                    {reservedGifts.length}
                  </span>
                </button>

                <button
                  type="button"
                  className={
                    statusFilter ===
                    "gifted"
                      ? styles.activeFilter
                      : ""
                  }
                  onClick={() =>
                    setStatusFilter(
                      "gifted",
                    )
                  }
                >
                  Presenteados
                  <span>
                    {giftedGifts.length}
                  </span>
                </button>
              </div>
            </div>

            {filteredGifts.length > 0 ? (
              <div className={styles.giftGrid}>
                {filteredGifts.map(
                  (gift) => (
                    <article
                      key={gift.id}
                      className={`${styles.giftCard} ${
                        !gift.isVisible
                          ? styles.hiddenGiftCard
                          : ""
                      }`}
                    >
                      <div
                        className={`${styles.giftCover} ${
                          toneClasses[
                            gift.tone
                          ]
                        }`}
                      >
                        <span
                          className={
                            styles.giftIcon
                          }
                          aria-hidden="true"
                        >
                          {gift.icon}
                        </span>

                        <span
                          className={`${styles.statusBadge} ${
                            statusClasses[
                              gift.status
                            ]
                          }`}
                        >
                          <i />

                          {
                            statusLabels[
                              gift.status
                            ]
                          }
                        </span>

                        {!gift.isVisible && (
                          <span
                            className={
                              styles.hiddenBadge
                            }
                          >
                            Oculto no convite
                          </span>
                        )}
                      </div>

                      <div className={styles.giftBody}>
                        <div
                          className={
                            styles.giftCategory
                          }
                        >
                          <span>
                            {
                              categoryLabels[
                                gift.category
                              ]
                            }
                          </span>

                          {gift.location && (
                            <>
                              <i
                                aria-hidden="true"
                              />

                              <span>
                                {gift.location}
                              </span>
                            </>
                          )}
                        </div>

                        <h3>{gift.title}</h3>

                        <p>{gift.description}</p>

                        <strong
                          className={
                            styles.giftPrice
                          }
                        >
                          {formatCurrency(
                            gift.price,
                          )}
                        </strong>

                        {gift.status ===
                          "available" && (
                          <div
                            className={
                              styles.availableInformation
                            }
                          >
                            <span
                              aria-hidden="true"
                            >
                              ○
                            </span>

                            <p>
                              Nenhum convidado
                              selecionou este
                              passeio.
                            </p>
                          </div>
                        )}

                        {gift.status ===
                          "reserved" &&
                          gift.giver && (
                            <div
                              className={
                                styles.reservationInformation
                              }
                            >
                              <header>
                                <span>
                                  Selecionado por
                                </span>

                                <strong>
                                  {
                                    gift.giver
                                      .name
                                  }
                                </strong>
                              </header>

                              {gift.giver
                                .message && (
                                <blockquote>
                                  “
                                  {
                                    gift.giver
                                      .message
                                  }
                                  ”
                                </blockquote>
                              )}

                              <footer>
                                <span>
                                  Reserva até{" "}
                                  <strong>
                                    {
                                      gift.giver
                                        .reservationExpiresAt
                                    }
                                  </strong>
                                </span>
                              </footer>
                            </div>
                          )}

                        {gift.status ===
                          "gifted" &&
                          gift.giver && (
                            <div
                              className={
                                styles.giftedInformation
                              }
                            >
                              <header>
                                <span>
                                  Presenteado por
                                </span>

                                <strong>
                                  {
                                    gift.giver
                                      .name
                                  }
                                </strong>
                              </header>

                              {gift.giver
                                .message && (
                                <blockquote>
                                  “
                                  {
                                    gift.giver
                                      .message
                                  }
                                  ”
                                </blockquote>
                              )}

                              <footer>
                                Confirmado em{" "}
                                <strong>
                                  {
                                    gift.giver
                                      .giftedAt
                                  }
                                </strong>
                              </footer>
                            </div>
                          )}
                      </div>

                      <footer
                        className={
                          styles.giftActions
                        }
                      >
                        <button
                          type="button"
                          onClick={() =>
                            openEditGiftModal(
                              gift,
                            )
                          }
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleGiftVisibility(
                              gift.id,
                            )
                          }
                        >
                          {gift.isVisible
                            ? "Ocultar"
                            : "Exibir"}
                        </button>

                        {gift.status ===
                          "available" && (
                          <button
                            type="button"
                            className={
                              styles.simulateButton
                            }
                            onClick={() =>
                              openReservationModal(
                                gift.id,
                              )
                            }
                          >
                            Simular seleção
                          </button>
                        )}

                        {gift.status ===
                          "reserved" && (
                          <>
                            <button
                              type="button"
                              className={
                                styles.confirmButton
                              }
                              onClick={() =>
                                confirmGiftPayment(
                                  gift.id,
                                )
                              }
                            >
                              Confirmar presente
                            </button>

                            <button
                              type="button"
                              className={
                                styles.releaseButton
                              }
                              onClick={() =>
                                releaseGift(
                                  gift.id,
                                )
                              }
                            >
                              Liberar
                            </button>
                          </>
                        )}

                        {gift.status ===
                          "gifted" && (
                          <button
                            type="button"
                            className={
                              styles.releaseButton
                            }
                            onClick={() =>
                              releaseGift(
                                gift.id,
                              )
                            }
                          >
                            Reabrir
                          </button>
                        )}

                        <button
                          type="button"
                          className={
                            styles.deleteButton
                          }
                          onClick={() =>
                            deleteGift(gift.id)
                          }
                        >
                          Excluir
                        </button>
                      </footer>
                    </article>
                  ),
                )}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <span aria-hidden="true">
                  ⌕
                </span>

                <strong>
                  Nenhum passeio encontrado
                </strong>

                <p>
                  Altere a busca ou os filtros
                  selecionados.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </section>
        </>
      ) : (
        <section className={styles.publicPreview}>
          <header className={styles.previewHeader}>
            <span className={styles.previewEyebrow}>
              Bárbara &amp; Felipe
            </span>

            <h2>
              Experiências da nossa lua de mel
            </h2>

            <p>
              Em vez de presentes tradicionais,
              escolhemos algumas experiências que
              gostaríamos de viver durante nossa
              viagem. Você pode fazer parte dessas
              memórias.
            </p>

            <div className={styles.previewDivider}>
              <span />
              <i>✦</i>
              <span />
            </div>
          </header>

          <div className={styles.publicGiftGrid}>
            {publicGifts.map((gift) => (
              <article
                key={gift.id}
                className={styles.publicGiftCard}
              >
                <div
                  className={`${styles.publicGiftCover} ${
                    toneClasses[gift.tone]
                  }`}
                >
                  <span
                    className={
                      styles.publicGiftIcon
                    }
                    aria-hidden="true"
                  >
                    {gift.icon}
                  </span>

                  <span
                    className={
                      styles.publicGiftCategory
                    }
                  >
                    {
                      categoryLabels[
                        gift.category
                      ]
                    }
                  </span>
                </div>

                <div
                  className={
                    styles.publicGiftBody
                  }
                >
                  <span
                    className={
                      styles.publicLocation
                    }
                  >
                    {gift.location ||
                      "Lua de mel"}
                  </span>

                  <h3>{gift.title}</h3>

                  <p>{gift.description}</p>

                  <strong>
                    {formatCurrency(
                      gift.price,
                    )}
                  </strong>

                  {gift.status ===
                    "available" && (
                    <button
                      type="button"
                      className={
                        styles.publicGiftButton
                      }
                      onClick={() =>
                        openReservationModal(
                          gift.id,
                        )
                      }
                    >
                      Presentear este passeio

                      <span
                        aria-hidden="true"
                      >
                        →
                      </span>
                    </button>
                  )}

                  {gift.status ===
                    "reserved" && (
                    <div
                      className={
                        styles.publicReservedState
                      }
                    >
                      <span
                        aria-hidden="true"
                      >
                        ◷
                      </span>

                      <div>
                        <strong>
                          Presente em andamento
                        </strong>

                        <p>
                          Outro convidado está
                          concluindo este
                          presente.
                        </p>
                      </div>
                    </div>
                  )}

                  {gift.status ===
                    "gifted" && (
                    <div
                      className={
                        styles.publicGiftedState
                      }
                    >
                      <span
                        aria-hidden="true"
                      >
                        ✓
                      </span>

                      <div>
                        <strong>
                          Experiência
                          presenteada
                        </strong>

                        <p>
                          {gift.giver
                            ?.showPublicly
                            ? `Presenteado por ${gift.giver.name}.`
                            : "Presenteado por um convidado especial."}
                        </p>
                      </div>
                    </div>
                  )}

                  {gift.status ===
                    "gifted" &&
                    gift.giver
                      ?.showPublicly &&
                    gift.giver.message && (
                      <blockquote
                        className={
                          styles.publicMessage
                        }
                      >
                        “
                        {
                          gift.giver
                            .message
                        }
                        ”
                      </blockquote>
                    )}
                </div>
              </article>
            ))}
          </div>

          <footer className={styles.previewFooter}>
            <span aria-hidden="true">
              ♡
            </span>

            <p>
              O carinho de vocês fará parte de cada
              momento dessa viagem.
            </p>
          </footer>
        </section>
      )}

      {isGiftModalOpen && (
        <div
          className={styles.modalOverlay}
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeGiftModal();
            }
          }}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="gift-modal-title"
          >
            <header className={styles.modalHeader}>
              <div>
                <span className={styles.eyebrow}>
                  Lua de mel
                </span>

                <h2 id="gift-modal-title">
                  {giftForm.id
                    ? "Editar passeio"
                    : "Novo passeio"}
                </h2>
              </div>

              <button
                type="button"
                className={styles.closeButton}
                aria-label="Fechar"
                onClick={closeGiftModal}
              >
                ×
              </button>
            </header>

            <form
              className={styles.form}
              onSubmit={saveGift}
            >
              <div className={styles.formGrid}>
                <label
                  className={styles.fullField}
                >
                  <span>
                    Nome do passeio
                  </span>

                  <input
                    type="text"
                    value={giftForm.title}
                    placeholder="Ex.: Passeio de barco ao pôr do sol"
                    autoFocus
                    onChange={(event) =>
                      setGiftForm(
                        (currentForm) => ({
                          ...currentForm,
                          title:
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
                      giftForm.category
                    }
                    onChange={(event) =>
                      setGiftForm(
                        (currentForm) => ({
                          ...currentForm,
                          category:
                            event.target
                              .value as GiftCategory,
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
                  <span>Valor</span>

                  <input
                    type="number"
                    min={1}
                    step="0.01"
                    value={giftForm.price}
                    placeholder="0,00"
                    onChange={(event) =>
                      setGiftForm(
                        (currentForm) => ({
                          ...currentForm,
                          price:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />
                </label>

                <label>
                  <span>Local</span>

                  <input
                    type="text"
                    value={
                      giftForm.location
                    }
                    placeholder="Ex.: Cartagena"
                    onChange={(event) =>
                      setGiftForm(
                        (currentForm) => ({
                          ...currentForm,
                          location:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />
                </label>

                <label>
                  <span>Ícone</span>

                  <input
                    type="text"
                    maxLength={4}
                    value={giftForm.icon}
                    placeholder="✦"
                    onChange={(event) =>
                      setGiftForm(
                        (currentForm) => ({
                          ...currentForm,
                          icon:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />
                </label>

                <label>
                  <span>Cor do card</span>

                  <select
                    value={giftForm.tone}
                    onChange={(event) =>
                      setGiftForm(
                        (currentForm) => ({
                          ...currentForm,
                          tone:
                            event.target
                              .value as GiftTone,
                        }),
                      )
                    }
                  >
                    <option value="sage">
                      Verde sálvia
                    </option>

                    <option value="blue">
                      Azul suave
                    </option>

                    <option value="yellow">
                      Amarelo
                    </option>

                    <option value="rose">
                      Terracota
                    </option>

                    <option value="navy">
                      Azul profundo
                    </option>
                  </select>
                </label>

                <label
                  className={`${styles.fullField} ${styles.checkboxField}`}
                >
                  <input
                    type="checkbox"
                    checked={
                      giftForm.isVisible
                    }
                    onChange={(event) =>
                      setGiftForm(
                        (currentForm) => ({
                          ...currentForm,
                          isVisible:
                            event.target
                              .checked,
                        }),
                      )
                    }
                  />

                  <span>
                    Exibir este passeio no convite
                  </span>
                </label>

                <label
                  className={styles.fullField}
                >
                  <span>Descrição</span>

                  <textarea
                    value={
                      giftForm.description
                    }
                    placeholder="Descreva a experiência que vocês gostariam de viver..."
                    onChange={(event) =>
                      setGiftForm(
                        (currentForm) => ({
                          ...currentForm,
                          description:
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
                  className={styles.modalError}
                  role="alert"
                >
                  <span aria-hidden="true">
                    !
                  </span>

                  {formError}
                </div>
              )}

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={closeGiftModal}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className={styles.saveButton}
                >
                  {giftForm.id
                    ? "Salvar alterações"
                    : "Adicionar passeio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isReservationModalOpen &&
        selectedGift && (
          <div
            className={styles.modalOverlay}
            role="presentation"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeReservationModal();
              }
            }}
          >
            <div
              className={`${styles.modal} ${styles.reservationModal}`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="reservation-modal-title"
            >
              <header
                className={
                  styles.reservationModalHeader
                }
              >
                <div
                  className={`${styles.reservationModalIcon} ${
                    toneClasses[
                      selectedGift.tone
                    ]
                  }`}
                  aria-hidden="true"
                >
                  {selectedGift.icon}
                </div>

                <div>
                  <span
                    className={
                      styles.eyebrow
                    }
                  >
                    Presentear experiência
                  </span>

                  <h2 id="reservation-modal-title">
                    {selectedGift.title}
                  </h2>

                  <strong>
                    {formatCurrency(
                      selectedGift.price,
                    )}
                  </strong>
                </div>

                <button
                  type="button"
                  className={styles.closeButton}
                  aria-label="Fechar"
                  onClick={
                    closeReservationModal
                  }
                >
                  ×
                </button>
              </header>

              <form
                className={styles.form}
                onSubmit={reserveGift}
              >
                <div
                  className={
                    styles.reservationNotice
                  }
                >
                  <span aria-hidden="true">
                    i
                  </span>

                  <p>
                    Após continuar, este passeio
                    ficará reservado por 30 minutos
                    enquanto o pagamento é
                    concluído.
                  </p>
                </div>

                <div
                  className={styles.formGrid}
                >
                  <label>
                    <span>Seu nome</span>

                    <input
                      type="text"
                      value={
                        reservationForm.name
                      }
                      placeholder="Nome completo"
                      autoFocus
                      onChange={(event) =>
                        setReservationForm(
                          (
                            currentForm,
                          ) => ({
                            ...currentForm,
                            name:
                              event.target
                                .value,
                          }),
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>Seu e-mail</span>

                    <input
                      type="email"
                      value={
                        reservationForm.email
                      }
                      placeholder="seuemail@exemplo.com"
                      onChange={(event) =>
                        setReservationForm(
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

                  <label
                    className={styles.fullField}
                  >
                    <span>
                      Mensagem para os noivos
                    </span>

                    <textarea
                      value={
                        reservationForm.message
                      }
                      placeholder="Deixe uma mensagem especial..."
                      onChange={(event) =>
                        setReservationForm(
                          (
                            currentForm,
                          ) => ({
                            ...currentForm,
                            message:
                              event.target
                                .value,
                          }),
                        )
                      }
                    />
                  </label>

                  <label
                    className={`${styles.fullField} ${styles.checkboxField}`}
                  >
                    <input
                      type="checkbox"
                      checked={
                        reservationForm.showPublicly
                      }
                      onChange={(event) =>
                        setReservationForm(
                          (
                            currentForm,
                          ) => ({
                            ...currentForm,
                            showPublicly:
                              event.target
                                .checked,
                          }),
                        )
                      }
                    />

                    <span>
                      Exibir meu nome e mensagem no
                      convite
                    </span>
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
                      closeReservationModal
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
                    Continuar para pagamento
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}