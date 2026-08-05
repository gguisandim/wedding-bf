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
  createBridalDressAppointmentAction,
  createBridalDressOptionAction,
  deleteBridalDressAppointmentAction,
  deleteBridalDressOptionAction,
  updateBridalDressAppointmentAction,
  updateBridalDressOptionAction,
} from "@/lib/actions/bridal-dress";

import styles from "./bridal-dress-manager.module.css";

export type BridalDressOption = {
  id: string;
  title: string;
  atelierName?: string;

  status:
    | "inspiration"
    | "shortlisted"
    | "fitting"
    | "chosen"
    | "discarded";

  estimatedAmount: number;
  finalAmount?: number;
  imageUrl?: string;
  isFavorite: boolean;
  notes?: string;
};

export type BridalDressAppointment = {
  id: string;
  dressOptionId?: string;
  title: string;
  appointmentAt: string;
  location?: string;
  completed: boolean;
  notes?: string;
};

type Props = {
  initialOptions:
    BridalDressOption[];

  initialAppointments:
    BridalDressAppointment[];

  brideName: string;
};

type OptionForm = {
  id?: string;
  title: string;
  atelierName: string;
  status:
    BridalDressOption["status"];
  estimatedAmount: string;
  finalAmount: string;
  imageUrl: string;
  isFavorite: boolean;
  notes: string;
};

type AppointmentForm = {
  id?: string;
  dressOptionId: string;
  title: string;
  appointmentAt: string;
  location: string;
  completed: boolean;
  notes: string;
};

const statusLabels:
  Record<
    BridalDressOption["status"],
    string
  > = {
    inspiration: "Inspiração",
    shortlisted: "Finalista",
    fitting: "Em provas",
    chosen: "Escolhido",
    discarded: "Descartado",
  };

function emptyOptionForm():
  OptionForm {
  return {
    title: "",
    atelierName: "",
    status: "inspiration",
    estimatedAmount: "0",
    finalAmount: "",
    imageUrl: "",
    isFavorite: false,
    notes: "",
  };
}

function emptyAppointmentForm():
  AppointmentForm {
  return {
    dressOptionId: "",
    title: "",
    appointmentAt: "",
    location: "",
    completed: false,
    notes: "",
  };
}

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

function toDateTimeLocal(
  value: string,
) {
  const date = new Date(value);

  const offset =
    date.getTimezoneOffset() *
    60_000;

  return new Date(
    date.getTime() - offset,
  )
    .toISOString()
    .slice(0, 16);
}

function formatDateTime(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "long",
      timeStyle: "short",
    },
  ).format(new Date(value));
}

export default function BridalDressManager({
  initialOptions,
  initialAppointments,
  brideName,
}: Props) {
  const router = useRouter();

  const [options, setOptions] =
    useState(initialOptions);

  const [
    appointments,
    setAppointments,
  ] = useState(
    initialAppointments,
  );

  const [
    optionModalOpen,
    setOptionModalOpen,
  ] = useState(false);

  const [
    appointmentModalOpen,
    setAppointmentModalOpen,
  ] = useState(false);

  const [
    optionForm,
    setOptionForm,
  ] = useState<OptionForm>(
    emptyOptionForm,
  );

  const [
    appointmentForm,
    setAppointmentForm,
  ] = useState<AppointmentForm>(
    emptyAppointmentForm,
  );

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

  const [mounted, setMounted] =
    useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOptions(initialOptions);
  }, [initialOptions]);

  useEffect(() => {
    setAppointments(
      initialAppointments,
    );
  }, [initialAppointments]);

  const chosenOption =
    useMemo(
      () =>
        options.find(
          (option) =>
            option.status ===
            "chosen",
        ),
      [options],
    );

  const upcomingAppointments =
    useMemo(
      () =>
        appointments
          .filter(
            (appointment) =>
              !appointment.completed,
          )
          .slice()
          .sort(
            (first, second) =>
              first.appointmentAt.localeCompare(
                second.appointmentAt,
              ),
          ),
      [appointments],
    );

  function showFeedback(
    message: string,
  ) {
    setFeedback(message);

    window.setTimeout(() => {
      setFeedback(null);
    }, 3000);
  }

  function openNewOption() {
    window.dispatchEvent(
      new Event(
        "dashboard:collapse-sidebar",
      ),
    );

    setOptionForm(
      emptyOptionForm(),
    );

    setOptionModalOpen(true);
  }

  function openEditOption(
    option: BridalDressOption,
  ) {
    window.dispatchEvent(
      new Event(
        "dashboard:collapse-sidebar",
      ),
    );

    setOptionForm({
      id: option.id,
      title: option.title,
      atelierName:
        option.atelierName ?? "",
      status: option.status,
      estimatedAmount:
        String(
          option.estimatedAmount,
        ),
      finalAmount:
        option.finalAmount ===
        undefined
          ? ""
          : String(
              option.finalAmount,
            ),
      imageUrl:
        option.imageUrl ?? "",
      isFavorite:
        option.isFavorite,
      notes:
        option.notes ?? "",
    });

    setOptionModalOpen(true);
  }

  function openNewAppointment() {
    window.dispatchEvent(
      new Event(
        "dashboard:collapse-sidebar",
      ),
    );

    setAppointmentForm(
      emptyAppointmentForm(),
    );

    setAppointmentModalOpen(
      true,
    );
  }

  function openEditAppointment(
    appointment:
      BridalDressAppointment,
  ) {
    window.dispatchEvent(
      new Event(
        "dashboard:collapse-sidebar",
      ),
    );

    setAppointmentForm({
      id: appointment.id,
      dressOptionId:
        appointment.dressOptionId ??
        "",
      title:
        appointment.title,
      appointmentAt:
        toDateTimeLocal(
          appointment.appointmentAt,
        ),
      location:
        appointment.location ?? "",
      completed:
        appointment.completed,
      notes:
        appointment.notes ?? "",
    });

    setAppointmentModalOpen(
      true,
    );
  }

  async function saveOption(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const input = {
        title:
          optionForm.title.trim(),
        atelierName:
          optionForm.atelierName.trim(),
        status:
          optionForm.status,
        estimatedAmount:
          Number(
            optionForm.estimatedAmount,
          ),
        finalAmount:
          optionForm.finalAmount
            ? Number(
                optionForm.finalAmount,
              )
            : null,
        imageUrl:
          optionForm.imageUrl.trim(),
        isFavorite:
          optionForm.isFavorite,
        notes:
          optionForm.notes.trim(),
      };

      const result =
        optionForm.id
          ? await updateBridalDressOptionAction({
              id: optionForm.id,
              ...input,
            })
          : await createBridalDressOptionAction(
              input,
            );

      showFeedback(result.message);

      if (result.success) {
        setOptionModalOpen(
          false,
        );

        router.refresh();
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function saveAppointment(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const input = {
        dressOptionId:
          appointmentForm
            .dressOptionId,

        title:
          appointmentForm.title.trim(),

        appointmentAt:
          new Date(
            appointmentForm
              .appointmentAt,
          ).toISOString(),

        location:
          appointmentForm.location.trim(),

        completed:
          appointmentForm.completed,

        notes:
          appointmentForm.notes.trim(),
      };

      const result =
        appointmentForm.id
          ? await updateBridalDressAppointmentAction({
              id:
                appointmentForm.id,
              ...input,
            })
          : await createBridalDressAppointmentAction(
              input,
            );

      showFeedback(result.message);

      if (result.success) {
        setAppointmentModalOpen(
          false,
        );

        router.refresh();
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function removeOption(
    option:
      BridalDressOption,
  ) {
    const confirmed =
      window.confirm(
        `Excluir ${option.title}?`,
      );

    if (!confirmed) {
      return;
    }

    const result =
      await deleteBridalDressOptionAction(
        option.id,
      );

    showFeedback(result.message);

    if (result.success) {
      router.refresh();
    }
  }

  async function removeAppointment(
    appointmentId: string,
  ) {
    const confirmed =
      window.confirm(
        "Excluir este compromisso?",
      );

    if (!confirmed) {
      return;
    }

    const result =
      await deleteBridalDressAppointmentAction(
        appointmentId,
      );

    showFeedback(result.message);

    if (result.success) {
      router.refresh();
    }
  }

  async function toggleCompleted(
    appointment:
      BridalDressAppointment,
  ) {
    const result =
      await updateBridalDressAppointmentAction({
        id: appointment.id,
        dressOptionId:
          appointment.dressOptionId ??
          "",
        title:
          appointment.title,
        appointmentAt:
          appointment.appointmentAt,
        location:
          appointment.location ?? "",
        completed:
          !appointment.completed,
        notes:
          appointment.notes ?? "",
      });

    showFeedback(result.message);

    if (result.success) {
      router.refresh();
    }
  }

  const optionModal =
    optionModalOpen ? (
      <div
        className={
          styles.modalOverlay
        }
      >
        <section
          className={styles.modal}
          role="dialog"
          aria-modal="true"
        >
          <header>
            <div>
              <span>
                Área privada
              </span>

              <h2>
                {optionForm.id
                  ? "Editar vestido"
                  : "Adicionar vestido"}
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                setOptionModalOpen(
                  false,
                )
              }
            >
              ×
            </button>
          </header>

          <form
            className={styles.form}
            onSubmit={saveOption}
          >
            <label
              className={
                styles.fullField
              }
            >
              <span>
                Nome ou referência
              </span>

              <input
                required
                minLength={2}
                value={
                  optionForm.title
                }
                placeholder="Ex.: Vestido princesa com mangas"
                onChange={(event) =>
                  setOptionForm(
                    (current) => ({
                      ...current,
                      title:
                        event.target
                          .value,
                    }),
                  )
                }
              />
            </label>

            <label>
              <span>
                Loja ou ateliê
              </span>

              <input
                value={
                  optionForm.atelierName
                }
                onChange={(event) =>
                  setOptionForm(
                    (current) => ({
                      ...current,
                      atelierName:
                        event.target
                          .value,
                    }),
                  )
                }
              />
            </label>

            <label>
              <span>Status</span>

              <select
                value={
                  optionForm.status
                }
                onChange={(event) =>
                  setOptionForm(
                    (current) => ({
                      ...current,
                      status:
                        event.target
                          .value as
                          OptionForm["status"],
                    }),
                  )
                }
              >
                {Object.entries(
                  statusLabels,
                ).map(
                  ([value, label]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label>
              <span>
                Valor estimado
              </span>

              <input
                type="number"
                min={0}
                step="0.01"
                value={
                  optionForm
                    .estimatedAmount
                }
                onChange={(event) =>
                  setOptionForm(
                    (current) => ({
                      ...current,
                      estimatedAmount:
                        event.target
                          .value,
                    }),
                  )
                }
              />
            </label>

            <label>
              <span>
                Valor final
              </span>

              <input
                type="number"
                min={0}
                step="0.01"
                value={
                  optionForm
                    .finalAmount
                }
                onChange={(event) =>
                  setOptionForm(
                    (current) => ({
                      ...current,
                      finalAmount:
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
                URL da imagem
              </span>

              <input
                type="url"
                value={
                  optionForm.imageUrl
                }
                placeholder="https://..."
                onChange={(event) =>
                  setOptionForm(
                    (current) => ({
                      ...current,
                      imageUrl:
                        event.target
                          .value,
                    }),
                  )
                }
              />
            </label>

            <label
              className={
                styles.favoriteField
              }
            >
              <input
                type="checkbox"
                checked={
                  optionForm.isFavorite
                }
                onChange={(event) =>
                  setOptionForm(
                    (current) => ({
                      ...current,
                      isFavorite:
                        event.target
                          .checked,
                    }),
                  )
                }
              />

              <span>
                Marcar como favorito
              </span>
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
                rows={5}
                value={
                  optionForm.notes
                }
                onChange={(event) =>
                  setOptionForm(
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
                onClick={() =>
                  setOptionModalOpen(
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
                  : "Salvar vestido"}
              </button>
            </div>
          </form>
        </section>
      </div>
    ) : null;

  const appointmentModal =
    appointmentModalOpen ? (
      <div
        className={
          styles.modalOverlay
        }
      >
        <section
          className={styles.modal}
          role="dialog"
          aria-modal="true"
        >
          <header>
            <div>
              <span>
                Agenda privada
              </span>

              <h2>
                {appointmentForm.id
                  ? "Editar compromisso"
                  : "Novo compromisso"}
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                setAppointmentModalOpen(
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
              saveAppointment
            }
          >
            <label
              className={
                styles.fullField
              }
            >
              <span>Título</span>

              <input
                required
                minLength={2}
                placeholder="Ex.: Primeira prova"
                value={
                  appointmentForm.title
                }
                onChange={(event) =>
                  setAppointmentForm(
                    (current) => ({
                      ...current,
                      title:
                        event.target
                          .value,
                    }),
                  )
                }
              />
            </label>

            <label>
              <span>Vestido</span>

              <select
                value={
                  appointmentForm
                    .dressOptionId
                }
                onChange={(event) =>
                  setAppointmentForm(
                    (current) => ({
                      ...current,
                      dressOptionId:
                        event.target
                          .value,
                    }),
                  )
                }
              >
                <option value="">
                  Sem vínculo
                </option>

                {options.map(
                  (option) => (
                    <option
                      key={option.id}
                      value={option.id}
                    >
                      {option.title}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label>
              <span>
                Data e hora
              </span>

              <input
                required
                type="datetime-local"
                value={
                  appointmentForm
                    .appointmentAt
                }
                onChange={(event) =>
                  setAppointmentForm(
                    (current) => ({
                      ...current,
                      appointmentAt:
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
              <span>Local</span>

              <input
                value={
                  appointmentForm
                    .location
                }
                onChange={(event) =>
                  setAppointmentForm(
                    (current) => ({
                      ...current,
                      location:
                        event.target
                          .value,
                    }),
                  )
                }
              />
            </label>

            <label
              className={
                styles.favoriteField
              }
            >
              <input
                type="checkbox"
                checked={
                  appointmentForm
                    .completed
                }
                onChange={(event) =>
                  setAppointmentForm(
                    (current) => ({
                      ...current,
                      completed:
                        event.target
                          .checked,
                    }),
                  )
                }
              />

              <span>
                Compromisso concluído
              </span>
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
                rows={5}
                value={
                  appointmentForm.notes
                }
                onChange={(event) =>
                  setAppointmentForm(
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
                onClick={() =>
                  setAppointmentModalOpen(
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
                  : "Salvar compromisso"}
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
        >
          <span>✓</span>
          {feedback}
        </div>
      )}

      <header
        className={
          styles.hero
        }
      >
        <div>
          <span
            className={
              styles.privateLabel
            }
          >
            Área privada de
            {" "}
            {brideName}
          </span>

          <h1>
            Vestido da noiva
          </h1>

          <p>
            Guarde referências,
            valores, provas e
            decisões sem exibir esta
            área aos demais membros.
          </p>
        </div>

        <div
          className={
            styles.heroActions
          }
        >
          <button
            type="button"
            onClick={
              openNewOption
            }
          >
            + Adicionar vestido
          </button>

          <button
            type="button"
            onClick={
              openNewAppointment
            }
          >
            + Novo compromisso
          </button>
        </div>
      </header>

      <section
        className={
          styles.metrics
        }
      >
        <article>
          <span>
            Opções salvas
          </span>

          <strong>
            {options.length}
          </strong>
        </article>

        <article>
          <span>Favoritos</span>

          <strong>
            {
              options.filter(
                (option) =>
                  option.isFavorite,
              ).length
            }
          </strong>
        </article>

        <article>
          <span>
            Próximas provas
          </span>

          <strong>
            {
              upcomingAppointments.length
            }
          </strong>
        </article>

        <article>
          <span>
            Vestido escolhido
          </span>

          <strong>
            {chosenOption
              ? "Sim"
              : "Não"}
          </strong>
        </article>
      </section>

      <section
        className={
          styles.contentGrid
        }
      >
        <div
          className={
            styles.optionsPanel
          }
        >
          <header
            className={
              styles.sectionHeader
            }
          >
            <div>
              <span>
                Referências
              </span>

              <h2>
                Vestidos salvos
              </h2>
            </div>
          </header>

          {options.length > 0 ? (
            <div
              className={
                styles.optionGrid
              }
            >
              {options.map(
                (option) => (
                  <article
                    key={option.id}
                    className={
                      styles.optionCard
                    }
                  >
                    <div
                      className={
                        styles.optionImage
                      }
                    >
                      {option.imageUrl ? (
                        <img
                          src={
                            option.imageUrl
                          }
                          alt=""
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                        >
                          ♡
                        </span>
                      )}

                      {option.isFavorite && (
                        <b>
                          Favorito
                        </b>
                      )}
                    </div>

                    <div
                      className={
                        styles.optionBody
                      }
                    >
                      <span
                        className={`${styles.statusBadge} ${
                          styles[
                            `status-${option.status}`
                          ]
                        }`}
                      >
                        {
                          statusLabels[
                            option.status
                          ]
                        }
                      </span>

                      <h3>
                        {option.title}
                      </h3>

                      <p>
                        {option.atelierName ||
                          "Loja ou ateliê não informado"}
                      </p>

                      <div
                        className={
                          styles.valueRow
                        }
                      >
                        <span>
                          Estimado
                          <strong>
                            {formatCurrency(
                              option.estimatedAmount,
                            )}
                          </strong>
                        </span>

                        <span>
                          Final
                          <strong>
                            {option.finalAmount !==
                            undefined
                              ? formatCurrency(
                                  option.finalAmount,
                                )
                              : "—"}
                          </strong>
                        </span>
                      </div>

                      {option.notes && (
                        <p
                          className={
                            styles.notes
                          }
                        >
                          {option.notes}
                        </p>
                      )}

                      <div
                        className={
                          styles.cardActions
                        }
                      >
                        <button
                          type="button"
                          onClick={() =>
                            openEditOption(
                              option,
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
                            removeOption(
                              option,
                            )
                          }
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </article>
                ),
              )}
            </div>
          ) : (
            <div
              className={
                styles.emptyState
              }
            >
              <strong>
                Nenhum vestido salvo
              </strong>

              <p>
                Adicione referências,
                valores e observações.
              </p>

              <button
                type="button"
                onClick={
                  openNewOption
                }
              >
                Adicionar primeiro
              </button>
            </div>
          )}
        </div>

        <aside
          className={
            styles.agendaPanel
          }
        >
          <header
            className={
              styles.sectionHeader
            }
          >
            <div>
              <span>
                Agenda privada
              </span>

              <h2>
                Provas e compromissos
              </h2>
            </div>
          </header>

          {appointments.length >
          0 ? (
            <div
              className={
                styles.appointmentList
              }
            >
              {appointments
                .slice()
                .sort(
                  (
                    first,
                    second,
                  ) =>
                    first.appointmentAt.localeCompare(
                      second.appointmentAt,
                    ),
                )
                .map(
                  (appointment) => (
                    <article
                      key={
                        appointment.id
                      }
                      className={
                        appointment.completed
                          ? styles.completedAppointment
                          : ""
                      }
                    >
                      <div>
                        <strong>
                          {
                            appointment.title
                          }
                        </strong>

                        <span>
                          {formatDateTime(
                            appointment.appointmentAt,
                          )}
                        </span>

                        {appointment.location && (
                          <span>
                            {
                              appointment.location
                            }
                          </span>
                        )}
                      </div>

                      <div
                        className={
                          styles.appointmentActions
                        }
                      >
                        <button
                          type="button"
                          onClick={() =>
                            toggleCompleted(
                              appointment,
                            )
                          }
                        >
                          {appointment.completed
                            ? "Reabrir"
                            : "Concluir"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openEditAppointment(
                              appointment,
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
                            removeAppointment(
                              appointment.id,
                            )
                          }
                        >
                          Excluir
                        </button>
                      </div>
                    </article>
                  ),
                )}
            </div>
          ) : (
            <div
              className={
                styles.emptyState
              }
            >
              <strong>
                Nenhum compromisso
              </strong>

              <p>
                Cadastre provas,
                visitas e ajustes.
              </p>

              <button
                type="button"
                onClick={
                  openNewAppointment
                }
              >
                Novo compromisso
              </button>
            </div>
          )}
        </aside>
      </section>

      {mounted &&
        optionModal &&
        createPortal(
          optionModal,
          document.body,
        )}

      {mounted &&
        appointmentModal &&
        createPortal(
          appointmentModal,
          document.body,
        )}
    </div>
  );
}
