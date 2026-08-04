"use client";

import {
  type ReactNode,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { updateWeddingAction } from "@/lib/actions/wedding";
import type { UpdateWeddingInput } from "@/lib/validations/wedding";

import styles from "./settings-manager.module.css";

export type SettingsSection =
  | "event"
  | "invitation"
  | "gifts"
  | "finance"
  | "notifications"
  | "privacy"
  | "integrations";

export type WeddingSettings = {
  event: {
    brideName: string;
    groomName: string;

    weddingDate: string;
    weddingTime: string;

    venueName: string;
    venueAddress: string;

    timezone: UpdateWeddingInput["timezone"];
    language: string;
  };

  invitation: {
    publicSlug: string;
    rsvpDeadline: string;

    requireInvitationCode: boolean;
    showCountdown: boolean;
    allowGuestMessage: boolean;
    allowDecline: boolean;
    showVenueMap: boolean;
    showGuestNamesInConfirmation: boolean;
  };

  gifts: {
    reservationMinutes: number;

    showGiftedExperiences: boolean;
    showGiverName: boolean;
    showGiverMessage: boolean;

    allowAnonymousGift: boolean;
    hideReservedGift: boolean;
    notifyOnReservation: boolean;
    notifyOnPayment: boolean;
  };

  finance: {
    budgetLimit: number;
    currency: string;

    supplierReminderDays: number;

    warnWhenBudgetExceeded: boolean;
    syncSupplierPayments: boolean;
    includeEstimatedExpenses: boolean;
  };

  notifications: {
    email: string;

    newRsvp: boolean;
    changedRsvp: boolean;

    giftReserved: boolean;
    giftPaid: boolean;

    supplierDue: boolean;
    weeklySummary: boolean;
  };

  privacy: {
    invitationVisibility:
      | "code"
      | "link"
      | "public";

    allowSearchEngines: boolean;
    collectAnalytics: boolean;

    sessionTimeoutMinutes: number;
    adminEmails: string;

    hideGuestListFromPublic: boolean;
    hideGiftValuesAfterPayment: boolean;
  };

  integrations: {
    paymentProvider:
      | "none"
      | "mercadopago"
      | "stripe"
      | "pagseguro";

    storageProvider:
      | "supabase"
      | "cloudinary";

    enableWebhook: boolean;
    webhookUrl: string;

    receiptBucket: string;
    photoBucket: string;
  };
};

type SettingsManagerProps = {
  initialSettings: WeddingSettings;
};

type NavigationItem = {
  id: SettingsSection;
  label: string;
  description: string;
  icon: string;
};

type SwitchFieldProps = {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  badge?: string;
};

const navigationItems: NavigationItem[] = [
  {
    id: "event",
    label: "Evento",
    description: "Informações gerais",
    icon: "♡",
  },
  {
    id: "invitation",
    label: "Convite e RSVP",
    description: "Confirmações e acesso",
    icon: "✉",
  },
  {
    id: "gifts",
    label: "Presentes",
    description: "Experiências da viagem",
    icon: "✦",
  },
  {
    id: "finance",
    label: "Financeiro",
    description: "Orçamento e pagamentos",
    icon: "R$",
  },
  {
    id: "notifications",
    label: "Notificações",
    description: "Alertas do sistema",
    icon: "◉",
  },
  {
    id: "privacy",
    label: "Privacidade e acesso",
    description: "Dados e administradores",
    icon: "◇",
  },
  {
    id: "integrations",
    label: "Integrações",
    description: "Pagamento e arquivos",
    icon: "⌘",
  },
];

function SwitchField({
  title,
  description,
  checked,
  onChange,
  badge,
}: SwitchFieldProps) {
  return (
    <div className={styles.switchField}>
      <div className={styles.switchCopy}>
        <div className={styles.switchTitle}>
          <strong>{title}</strong>

          {badge && (
            <span className={styles.fieldBadge}>
              {badge}
            </span>
          )}
        </div>

        <p>{description}</p>
      </div>

      <button
        type="button"
        className={`${styles.switch} ${
          checked ? styles.switchActive : ""
        }`}
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>
    </div>
  );
}

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.settingsCard}>
      <header className={styles.cardHeader}>
        <div>
          <h2>{title}</h2>

          {description && <p>{description}</p>}
        </div>
      </header>

      <div className={styles.cardContent}>
        {children}
      </div>
    </section>
  );
}

function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function SettingsManager({
  initialSettings,
}: SettingsManagerProps) {
  const router = useRouter();

  const [activeSection, setActiveSection] =
    useState<SettingsSection>("event");

  const [settings, setSettings] =
    useState<WeddingSettings>(
      initialSettings,
    );

  const [
    savedSettings,
    setSavedSettings,
  ] =
    useState<WeddingSettings>(
      initialSettings,
    );

  const [feedback, setFeedback] =
    useState<string | null>(null);

  const [isSaving, setIsSaving] =
    useState(false);

  const hasChanges = useMemo(
    () =>
      JSON.stringify(settings) !==
      JSON.stringify(savedSettings),
    [savedSettings, settings],
  );

  const publicInvitationUrl = useMemo(
    () =>
      `https://wedding-bf.vercel.app/convite/${settings.invitation.publicSlug}`,
    [settings.invitation.publicSlug],
  );

  function showFeedback(message: string) {
    setFeedback(message);

    window.setTimeout(() => {
      setFeedback(null);
    }, 2800);
  }

  function updateEvent<
    Key extends keyof WeddingSettings["event"],
  >(
    key: Key,
    value: WeddingSettings["event"][Key],
  ) {
    setSettings((current) => ({
      ...current,
      event: {
        ...current.event,
        [key]: value,
      },
    }));
  }

  function updateInvitation<
    Key extends keyof WeddingSettings["invitation"],
  >(
    key: Key,
    value: WeddingSettings["invitation"][Key],
  ) {
    setSettings((current) => ({
      ...current,
      invitation: {
        ...current.invitation,
        [key]: value,
      },
    }));
  }

  function updateGifts<
    Key extends keyof WeddingSettings["gifts"],
  >(
    key: Key,
    value: WeddingSettings["gifts"][Key],
  ) {
    setSettings((current) => ({
      ...current,
      gifts: {
        ...current.gifts,
        [key]: value,
      },
    }));
  }

  function updateFinance<
    Key extends keyof WeddingSettings["finance"],
  >(
    key: Key,
    value: WeddingSettings["finance"][Key],
  ) {
    setSettings((current) => ({
      ...current,
      finance: {
        ...current.finance,
        [key]: value,
      },
    }));
  }

  function updateNotifications<
    Key extends keyof WeddingSettings["notifications"],
  >(
    key: Key,
    value: WeddingSettings["notifications"][Key],
  ) {
    setSettings((current) => ({
      ...current,
      notifications: {
        ...current.notifications,
        [key]: value,
      },
    }));
  }

  function updatePrivacy<
    Key extends keyof WeddingSettings["privacy"],
  >(
    key: Key,
    value: WeddingSettings["privacy"][Key],
  ) {
    setSettings((current) => ({
      ...current,
      privacy: {
        ...current.privacy,
        [key]: value,
      },
    }));
  }

  function updateIntegrations<
    Key extends keyof WeddingSettings["integrations"],
  >(
    key: Key,
    value: WeddingSettings["integrations"][Key],
  ) {
    setSettings((current) => ({
      ...current,
      integrations: {
        ...current.integrations,
        [key]: value,
      },
    }));
  }

  async function saveSettings() {
    if (!hasChanges || isSaving) {
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const result = await updateWeddingAction({
        brideName:
          settings.event.brideName,

        groomName:
          settings.event.groomName,

        weddingDate:
          settings.event.weddingDate,

        weddingTime:
          settings.event.weddingTime,

        venueName:
          settings.event.venueName,

        venueAddress:
          settings.event.venueAddress,

        timezone:
          settings.event.timezone,
      });

      if (!result.success) {
        showFeedback(result.message);
        return;
      }

      setSavedSettings(settings);
      showFeedback(result.message);

      router.refresh();
    } catch (error) {
      console.error(
        "Erro ao salvar configurações:",
        error,
      );

      showFeedback(
        "Não foi possível salvar as configurações.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function discardChanges() {
    setSettings(savedSettings);

    showFeedback(
      "Alterações descartadas.",
    );
  }

  async function copyInvitationLink() {
    try {
      await navigator.clipboard.writeText(
        publicInvitationUrl,
      );

      showFeedback(
        "Link do convite copiado.",
      );
    } catch {
      showFeedback(
        "Não foi possível copiar o link.",
      );
    }
  }

  function renderEventSettings() {
    return (
      <>
        <SettingsCard
          title="Informações do casamento"
          description="Esses dados serão utilizados no painel e no convite público."
        >
          <div className={styles.formGrid}>
            <label>
              <span>Nome da noiva</span>

              <input
                type="text"
                value={
                  settings.event.brideName
                }
                onChange={(event) =>
                  updateEvent(
                    "brideName",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              <span>Nome do noivo</span>

              <input
                type="text"
                value={
                  settings.event.groomName
                }
                onChange={(event) =>
                  updateEvent(
                    "groomName",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              <span>Data do casamento</span>

              <input
                type="date"
                value={
                  settings.event.weddingDate
                }
                onChange={(event) =>
                  updateEvent(
                    "weddingDate",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              <span>Horário</span>

              <input
                type="time"
                value={
                  settings.event.weddingTime
                }
                onChange={(event) =>
                  updateEvent(
                    "weddingTime",
                    event.target.value,
                  )
                }
              />
            </label>
          </div>
        </SettingsCard>

        <SettingsCard
          title="Local do evento"
          description="Informações exibidas no convite e usadas para gerar o mapa."
        >
          <div className={styles.formGrid}>
            <label>
              <span>Nome do local</span>

              <input
                type="text"
                value={
                  settings.event.venueName
                }
                placeholder="Ex.: Solar do Bosque"
                onChange={(event) =>
                  updateEvent(
                    "venueName",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              <span>Fuso horário</span>

              <select
                value={
                  settings.event.timezone
                }
                onChange={(event) =>
                  updateEvent(
                    "timezone",
                    event.target
                      .value as UpdateWeddingInput["timezone"],
                  )
                }
              >
                <option value="America/Belem">
                  Belém — GMT-3
                </option>

                <option value="America/Sao_Paulo">
                  Brasília — GMT-3
                </option>

                <option value="America/Manaus">
                  Manaus — GMT-4
                </option>
              </select>
            </label>

            <label className={styles.fullField}>
              <span>Endereço completo</span>

              <input
                type="text"
                value={
                  settings.event.venueAddress
                }
                placeholder="Rua, número, bairro e cidade"
                onChange={(event) =>
                  updateEvent(
                    "venueAddress",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              <span>Idioma</span>

              <select
                value={
                  settings.event.language
                }
                onChange={(event) =>
                  updateEvent(
                    "language",
                    event.target.value,
                  )
                }
              >
                <option value="pt-BR">
                  Português do Brasil
                </option>

                <option value="en-US">
                  Inglês
                </option>

                <option value="es">
                  Espanhol
                </option>
              </select>
            </label>
          </div>
        </SettingsCard>
      </>
    );
  }

  function renderInvitationSettings() {
    return (
      <>
        <SettingsCard
          title="Endereço do convite"
          description="Defina o link público que será enviado aos convidados."
        >
          <div className={styles.slugField}>
            <div className={styles.slugInput}>
              <span>
                wedding-bf.vercel.app/convite/
              </span>

              <input
                type="text"
                value={
                  settings.invitation
                    .publicSlug
                }
                onChange={(event) =>
                  updateInvitation(
                    "publicSlug",
                    normalizeSlug(
                      event.target.value,
                    ),
                  )
                }
              />
            </div>

            <button
              type="button"
              onClick={copyInvitationLink}
            >
              Copiar link
            </button>
          </div>

          <p className={styles.fieldHint}>
            Link atual: {publicInvitationUrl}
          </p>
        </SettingsCard>

        <SettingsCard
          title="Regras do RSVP"
          description="Controle como os convidados poderão confirmar presença."
        >
          <div className={styles.formGrid}>
            <label>
              <span>
                Data limite para confirmar
              </span>

              <input
                type="date"
                value={
                  settings.invitation
                    .rsvpDeadline
                }
                onChange={(event) =>
                  updateInvitation(
                    "rsvpDeadline",
                    event.target.value,
                  )
                }
              />
            </label>
          </div>

          <div className={styles.switchList}>
            <SwitchField
              title="Exigir código do convite"
              description="Somente pessoas com um código válido poderão acessar o RSVP."
              checked={
                settings.invitation
                  .requireInvitationCode
              }
              onChange={(checked) =>
                updateInvitation(
                  "requireInvitationCode",
                  checked,
                )
              }
              badge="Recomendado"
            />

            <SwitchField
              title="Permitir mensagem para os noivos"
              description="O convidado poderá deixar uma observação junto da confirmação."
              checked={
                settings.invitation
                  .allowGuestMessage
              }
              onChange={(checked) =>
                updateInvitation(
                  "allowGuestMessage",
                  checked,
                )
              }
            />

            <SwitchField
              title="Permitir recusar o convite"
              description="Mostra a opção de informar que a pessoa não poderá comparecer."
              checked={
                settings.invitation
                  .allowDecline
              }
              onChange={(checked) =>
                updateInvitation(
                  "allowDecline",
                  checked,
                )
              }
            />

            <SwitchField
              title="Exibir nomes na confirmação"
              description="Mostra todos os integrantes cadastrados no grupo do convite."
              checked={
                settings.invitation
                  .showGuestNamesInConfirmation
              }
              onChange={(checked) =>
                updateInvitation(
                  "showGuestNamesInConfirmation",
                  checked,
                )
              }
            />
          </div>
        </SettingsCard>

        <SettingsCard
          title="Conteúdo do convite"
          description="Elementos adicionais exibidos na página pública."
        >
          <div className={styles.switchList}>
            <SwitchField
              title="Contagem regressiva"
              description="Exibe quantos dias faltam para o casamento."
              checked={
                settings.invitation
                  .showCountdown
              }
              onChange={(checked) =>
                updateInvitation(
                  "showCountdown",
                  checked,
                )
              }
            />

            <SwitchField
              title="Mapa do local"
              description="Exibe um botão para abrir o endereço do casamento no mapa."
              checked={
                settings.invitation
                  .showVenueMap
              }
              onChange={(checked) =>
                updateInvitation(
                  "showVenueMap",
                  checked,
                )
              }
            />
          </div>
        </SettingsCard>
      </>
    );
  }

  function renderGiftSettings() {
    return (
      <>
        <SettingsCard
          title="Reserva dos passeios"
          description="Defina quanto tempo uma experiência ficará bloqueada enquanto o pagamento é concluído."
        >
          <div className={styles.formGrid}>
            <label>
              <span>
                Tempo de reserva
              </span>

              <div
                className={
                  styles.inputWithSuffix
                }
              >
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={
                    settings.gifts
                      .reservationMinutes
                  }
                  onChange={(event) =>
                    updateGifts(
                      "reservationMinutes",
                      Number(
                        event.target.value,
                      ),
                    )
                  }
                />

                <span>minutos</span>
              </div>
            </label>
          </div>
        </SettingsCard>

        <SettingsCard
          title="Exibição pública"
          description="Controle quais informações aparecerão no convite."
        >
          <div className={styles.switchList}>
            <SwitchField
              title="Mostrar experiências presenteadas"
              description="Mantém os passeios pagos visíveis no convite, marcados como presenteados."
              checked={
                settings.gifts
                  .showGiftedExperiences
              }
              onChange={(checked) =>
                updateGifts(
                  "showGiftedExperiences",
                  checked,
                )
              }
            />

            <SwitchField
              title="Mostrar nome de quem presenteou"
              description="Exibe publicamente o nome autorizado pelo convidado."
              checked={
                settings.gifts.showGiverName
              }
              onChange={(checked) =>
                updateGifts(
                  "showGiverName",
                  checked,
                )
              }
            />

            <SwitchField
              title="Mostrar mensagens"
              description="Exibe mensagens deixadas pelos convidados nos presentes."
              checked={
                settings.gifts
                  .showGiverMessage
              }
              onChange={(checked) =>
                updateGifts(
                  "showGiverMessage",
                  checked,
                )
              }
            />

            <SwitchField
              title="Permitir presente anônimo"
              description="O casal verá os dados no painel, mas o nome poderá ficar oculto no convite."
              checked={
                settings.gifts
                  .allowAnonymousGift
              }
              onChange={(checked) =>
                updateGifts(
                  "allowAnonymousGift",
                  checked,
                )
              }
            />

            <SwitchField
              title="Ocultar passeio reservado"
              description="Remove temporariamente da lista pública enquanto o pagamento está em andamento."
              checked={
                settings.gifts
                  .hideReservedGift
              }
              onChange={(checked) =>
                updateGifts(
                  "hideReservedGift",
                  checked,
                )
              }
            />
          </div>
        </SettingsCard>

        <SettingsCard
          title="Alertas de presentes"
          description="Notificações específicas para as experiências da lua de mel."
        >
          <div className={styles.switchList}>
            <SwitchField
              title="Avisar quando um passeio for reservado"
              description="Envia uma notificação quando alguém iniciar o pagamento."
              checked={
                settings.gifts
                  .notifyOnReservation
              }
              onChange={(checked) =>
                updateGifts(
                  "notifyOnReservation",
                  checked,
                )
              }
            />

            <SwitchField
              title="Avisar quando o pagamento for confirmado"
              description="Envia uma notificação após a confirmação do webhook."
              checked={
                settings.gifts
                  .notifyOnPayment
              }
              onChange={(checked) =>
                updateGifts(
                  "notifyOnPayment",
                  checked,
                )
              }
            />
          </div>
        </SettingsCard>
      </>
    );
  }

  function renderFinanceSettings() {
    return (
      <>
        <SettingsCard
          title="Orçamento principal"
          description="Configuração utilizada nos indicadores financeiros do painel."
        >
          <div className={styles.formGrid}>
            <label>
              <span>Orçamento total</span>

              <input
                type="number"
                min={0}
                step="0.01"
                value={
                  settings.finance
                    .budgetLimit
                }
                onChange={(event) =>
                  updateFinance(
                    "budgetLimit",
                    Number(
                      event.target.value,
                    ),
                  )
                }
              />
            </label>

            <label>
              <span>Moeda</span>

              <select
                value={
                  settings.finance.currency
                }
                onChange={(event) =>
                  updateFinance(
                    "currency",
                    event.target.value,
                  )
                }
              >
                <option value="BRL">
                  Real brasileiro — BRL
                </option>

                <option value="USD">
                  Dólar americano — USD
                </option>

                <option value="EUR">
                  Euro — EUR
                </option>
              </select>
            </label>

            <label>
              <span>
                Avisar antes do vencimento
              </span>

              <div
                className={
                  styles.inputWithSuffix
                }
              >
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={
                    settings.finance
                      .supplierReminderDays
                  }
                  onChange={(event) =>
                    updateFinance(
                      "supplierReminderDays",
                      Number(
                        event.target.value,
                      ),
                    )
                  }
                />

                <span>dias</span>
              </div>
            </label>
          </div>
        </SettingsCard>

        <SettingsCard
          title="Automação financeira"
          description="Regras para fornecedores, despesas e orçamento."
        >
          <div className={styles.switchList}>
            <SwitchField
              title="Sincronizar pagamentos de fornecedores"
              description="Cada pagamento registrado no fornecedor também será contabilizado no orçamento."
              checked={
                settings.finance
                  .syncSupplierPayments
              }
              onChange={(checked) =>
                updateFinance(
                  "syncSupplierPayments",
                  checked,
                )
              }
              badge="Recomendado"
            />

            <SwitchField
              title="Incluir estimativas na projeção"
              description="Valores ainda não contratados entram no cálculo da projeção financeira."
              checked={
                settings.finance
                  .includeEstimatedExpenses
              }
              onChange={(checked) =>
                updateFinance(
                  "includeEstimatedExpenses",
                  checked,
                )
              }
            />

            <SwitchField
              title="Alertar ao ultrapassar o orçamento"
              description="Exibe avisos quando o valor contratado ultrapassar o limite definido."
              checked={
                settings.finance
                  .warnWhenBudgetExceeded
              }
              onChange={(checked) =>
                updateFinance(
                  "warnWhenBudgetExceeded",
                  checked,
                )
              }
            />
          </div>
        </SettingsCard>
      </>
    );
  }

  function renderNotificationSettings() {
    return (
      <>
        <SettingsCard
          title="Destino dos alertas"
          description="E-mail principal usado para receber notificações."
        >
          <div className={styles.formGrid}>
            <label className={styles.fullField}>
              <span>E-mail de notificação</span>

              <input
                type="email"
                value={
                  settings.notifications.email
                }
                onChange={(event) =>
                  updateNotifications(
                    "email",
                    event.target.value,
                  )
                }
              />
            </label>
          </div>
        </SettingsCard>

        <SettingsCard
          title="Eventos que geram notificações"
          description="Escolha quais movimentações devem enviar alertas."
        >
          <div className={styles.switchList}>
            <SwitchField
              title="Nova confirmação de presença"
              description="Avisar quando um convidado responder ao RSVP."
              checked={
                settings.notifications
                  .newRsvp
              }
              onChange={(checked) =>
                updateNotifications(
                  "newRsvp",
                  checked,
                )
              }
            />

            <SwitchField
              title="Alteração de RSVP"
              description="Avisar quando um convidado mudar uma resposta já registrada."
              checked={
                settings.notifications
                  .changedRsvp
              }
              onChange={(checked) =>
                updateNotifications(
                  "changedRsvp",
                  checked,
                )
              }
            />

            <SwitchField
              title="Passeio reservado"
              description="Avisar quando o processo de pagamento de um presente começar."
              checked={
                settings.notifications
                  .giftReserved
              }
              onChange={(checked) =>
                updateNotifications(
                  "giftReserved",
                  checked,
                )
              }
            />

            <SwitchField
              title="Presente pago"
              description="Avisar quando o pagamento de uma experiência for confirmado."
              checked={
                settings.notifications
                  .giftPaid
              }
              onChange={(checked) =>
                updateNotifications(
                  "giftPaid",
                  checked,
                )
              }
            />

            <SwitchField
              title="Pagamento de fornecedor próximo"
              description="Avisar antes do vencimento de parcelas e contratos."
              checked={
                settings.notifications
                  .supplierDue
              }
              onChange={(checked) =>
                updateNotifications(
                  "supplierDue",
                  checked,
                )
              }
            />

            <SwitchField
              title="Resumo semanal"
              description="Enviar um resumo com RSVP, despesas, tarefas e presentes."
              checked={
                settings.notifications
                  .weeklySummary
              }
              onChange={(checked) =>
                updateNotifications(
                  "weeklySummary",
                  checked,
                )
              }
            />
          </div>
        </SettingsCard>
      </>
    );
  }

  function renderPrivacySettings() {
    return (
      <>
        <SettingsCard
          title="Visibilidade do convite"
          description="Defina como as pessoas poderão acessar o convite."
        >
          <div className={styles.radioGrid}>
            <label
              className={`${styles.radioCard} ${
                settings.privacy
                  .invitationVisibility ===
                "code"
                  ? styles.selectedRadioCard
                  : ""
              }`}
            >
              <input
                type="radio"
                name="invitation-visibility"
                value="code"
                checked={
                  settings.privacy
                    .invitationVisibility ===
                  "code"
                }
                onChange={() =>
                  updatePrivacy(
                    "invitationVisibility",
                    "code",
                  )
                }
              />

              <span className={styles.radioIcon}>
                ◇
              </span>

              <div>
                <strong>
                  Somente com código
                </strong>

                <p>
                  Cada grupo precisa de um código
                  válido.
                </p>
              </div>
            </label>

            <label
              className={`${styles.radioCard} ${
                settings.privacy
                  .invitationVisibility ===
                "link"
                  ? styles.selectedRadioCard
                  : ""
              }`}
            >
              <input
                type="radio"
                name="invitation-visibility"
                value="link"
                checked={
                  settings.privacy
                    .invitationVisibility ===
                  "link"
                }
                onChange={() =>
                  updatePrivacy(
                    "invitationVisibility",
                    "link",
                  )
                }
              />

              <span className={styles.radioIcon}>
                → 
              </span>

              <div>
                <strong>
                  Quem tiver o link
                </strong>

                <p>
                  O convite pode ser acessado pelo
                  endereço compartilhado.
                </p>
              </div>
            </label>

            <label
              className={`${styles.radioCard} ${
                settings.privacy
                  .invitationVisibility ===
                "public"
                  ? styles.selectedRadioCard
                  : ""
              }`}
            >
              <input
                type="radio"
                name="invitation-visibility"
                value="public"
                checked={
                  settings.privacy
                    .invitationVisibility ===
                  "public"
                }
                onChange={() =>
                  updatePrivacy(
                    "invitationVisibility",
                    "public",
                  )
                }
              />

              <span className={styles.radioIcon}>
                ◉
              </span>

              <div>
                <strong>Público</strong>

                <p>
                  Qualquer pessoa poderá abrir o
                  convite.
                </p>
              </div>
            </label>
          </div>
        </SettingsCard>

        <SettingsCard
          title="Administradores"
          description="Pessoas autorizadas a acessar o painel."
        >
          <div className={styles.formGrid}>
            <label className={styles.fullField}>
              <span>
                E-mails dos administradores
              </span>

              <textarea
                value={
                  settings.privacy
                    .adminEmails
                }
                placeholder="email1@exemplo.com, email2@exemplo.com"
                onChange={(event) =>
                  updatePrivacy(
                    "adminEmails",
                    event.target.value,
                  )
                }
              />

              <small>
                Separe os e-mails por vírgula.
              </small>
            </label>

            <label>
              <span>
                Encerrar sessão após
              </span>

              <div
                className={
                  styles.inputWithSuffix
                }
              >
                <input
                  type="number"
                  min={15}
                  max={1440}
                  value={
                    settings.privacy
                      .sessionTimeoutMinutes
                  }
                  onChange={(event) =>
                    updatePrivacy(
                      "sessionTimeoutMinutes",
                      Number(
                        event.target.value,
                      ),
                    )
                  }
                />

                <span>minutos</span>
              </div>
            </label>
          </div>
        </SettingsCard>

        <SettingsCard
          title="Dados públicos"
          description="Controle a exposição de informações no convite."
        >
          <div className={styles.switchList}>
            <SwitchField
              title="Ocultar lista de convidados"
              description="Nenhuma página pública poderá expor a relação de convidados."
              checked={
                settings.privacy
                  .hideGuestListFromPublic
              }
              onChange={(checked) =>
                updatePrivacy(
                  "hideGuestListFromPublic",
                  checked,
                )
              }
              badge="Recomendado"
            />

            <SwitchField
              title="Ocultar valor de presentes pagos"
              description="Após o pagamento, o convite mostra a experiência sem informar o valor."
              checked={
                settings.privacy
                  .hideGiftValuesAfterPayment
              }
              onChange={(checked) =>
                updatePrivacy(
                  "hideGiftValuesAfterPayment",
                  checked,
                )
              }
            />

            <SwitchField
              title="Permitir mecanismos de busca"
              description="Autoriza indexação pública do convite por Google e outros buscadores."
              checked={
                settings.privacy
                  .allowSearchEngines
              }
              onChange={(checked) =>
                updatePrivacy(
                  "allowSearchEngines",
                  checked,
                )
              }
            />

            <SwitchField
              title="Coletar métricas de acesso"
              description="Registra visualizações e interações sem expor dados sensíveis."
              checked={
                settings.privacy
                  .collectAnalytics
              }
              onChange={(checked) =>
                updatePrivacy(
                  "collectAnalytics",
                  checked,
                )
              }
            />
          </div>
        </SettingsCard>
      </>
    );
  }

  function renderIntegrationSettings() {
    return (
      <>
        <SettingsCard
          title="Plataforma de pagamento"
          description="Serviço que será usado para receber os presentes da lua de mel."
        >
          <div className={styles.formGrid}>
            <label>
              <span>Provedor</span>

              <select
                value={
                  settings.integrations
                    .paymentProvider
                }
                onChange={(event) =>
                  updateIntegrations(
                    "paymentProvider",
                    event.target
                      .value as WeddingSettings["integrations"]["paymentProvider"],
                  )
                }
              >
                <option value="none">
                  Nenhum configurado
                </option>

                <option value="mercadopago">
                  Mercado Pago
                </option>

                <option value="stripe">
                  Stripe
                </option>

                <option value="pagseguro">
                  PagSeguro
                </option>
              </select>
            </label>
          </div>

          <div className={styles.integrationStatus}>
            <span
              className={
                settings.integrations
                  .paymentProvider === "none"
                  ? styles.integrationOffline
                  : styles.integrationOnline
              }
            />

            <div>
              <strong>
                {settings.integrations
                  .paymentProvider === "none"
                  ? "Pagamento não configurado"
                  : "Provedor selecionado"}
              </strong>

              <p>
                As chaves secretas deverão ser
                armazenadas apenas nas variáveis de
                ambiente da Vercel.
              </p>
            </div>
          </div>
        </SettingsCard>

        <SettingsCard
          title="Webhook de pagamento"
          description="Recebe confirmações automáticas da plataforma financeira."
        >
          <div className={styles.switchList}>
            <SwitchField
              title="Ativar webhook"
              description="Permite que o servidor confirme automaticamente os presentes pagos."
              checked={
                settings.integrations
                  .enableWebhook
              }
              onChange={(checked) =>
                updateIntegrations(
                  "enableWebhook",
                  checked,
                )
              }
              badge="Backend necessário"
            />
          </div>

          <div className={styles.formGrid}>
            <label className={styles.fullField}>
              <span>Endereço do webhook</span>

              <input
                type="text"
                readOnly
                value={
                  settings.integrations
                    .webhookUrl
                }
              />

              <small>
                Esse endereço será informado na
                plataforma de pagamento.
              </small>
            </label>
          </div>
        </SettingsCard>

        <SettingsCard
          title="Armazenamento de arquivos"
          description="Configuração futura para comprovantes, contratos e fotografias."
        >
          <div className={styles.formGrid}>
            <label>
              <span>Provedor</span>

              <select
                value={
                  settings.integrations
                    .storageProvider
                }
                onChange={(event) =>
                  updateIntegrations(
                    "storageProvider",
                    event.target
                      .value as WeddingSettings["integrations"]["storageProvider"],
                  )
                }
              >
                <option value="supabase">
                  Supabase Storage
                </option>

                <option value="cloudinary">
                  Cloudinary
                </option>
              </select>
            </label>

            <label>
              <span>
                Bucket de comprovantes
              </span>

              <input
                type="text"
                value={
                  settings.integrations
                    .receiptBucket
                }
                onChange={(event) =>
                  updateIntegrations(
                    "receiptBucket",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              <span>Bucket de fotos</span>

              <input
                type="text"
                value={
                  settings.integrations
                    .photoBucket
                }
                onChange={(event) =>
                  updateIntegrations(
                    "photoBucket",
                    event.target.value,
                  )
                }
              />
            </label>
          </div>
        </SettingsCard>
      </>
    );
  }

  function renderActiveSection() {
    if (activeSection === "event") {
      return renderEventSettings();
    }

    if (activeSection === "invitation") {
      return renderInvitationSettings();
    }

    if (activeSection === "gifts") {
      return renderGiftSettings();
    }

    if (activeSection === "finance") {
      return renderFinanceSettings();
    }

    if (activeSection === "notifications") {
      return renderNotificationSettings();
    }

    if (activeSection === "privacy") {
      return renderPrivacySettings();
    }

    return renderIntegrationSettings();
  }

  const currentNavigation =
    navigationItems.find(
      (item) =>
        item.id === activeSection,
    );

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
            Preferências do sistema
          </span>

          <h1>Configurações</h1>

          <p>
            Defina regras do convite, RSVP,
            presentes, orçamento, notificações e
            integrações do casamento.
          </p>
        </div>

        <div className={styles.headerStatus}>
          <span
            className={
              hasChanges
                ? styles.unsavedIndicator
                : styles.savedIndicator
            }
          />

          <div>
            <strong>
              {hasChanges
                ? "Alterações não salvas"
                : "Configurações atualizadas"}
            </strong>

            <span>
              {hasChanges
                ? "Salve para manter as novas preferências."
                : "Nenhuma alteração pendente."}
            </span>
          </div>
        </div>
      </header>

      <section className={styles.settingsWorkspace}>
        <aside className={styles.settingsNavigation}>
          <header>
            <span className={styles.eyebrow}>
              Categorias
            </span>

            <h2>Preferências</h2>
          </header>

          <nav>
            {navigationItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={
                  activeSection === item.id
                    ? styles.activeNavigationItem
                    : ""
                }
                onClick={() =>
                  setActiveSection(item.id)
                }
              >
                <span
                  className={
                    styles.navigationIcon
                  }
                  aria-hidden="true"
                >
                  {item.icon}
                </span>

                <div>
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                </div>

                <i aria-hidden="true">
                  ›
                </i>
              </button>
            ))}
          </nav>

          <div className={styles.navigationNotice}>
            <span aria-hidden="true">
              i
            </span>

            <p>
              Nesta etapa, somente os dados da seção
              Evento são persistidos no Supabase.
            </p>
          </div>
        </aside>

        <main className={styles.settingsContent}>
          <header className={styles.contentHeader}>
            <div>
              <span className={styles.eyebrow}>
                Configurações
              </span>

              <h2>
                {currentNavigation?.label}
              </h2>

              <p>
                {currentNavigation?.description}
              </p>
            </div>
          </header>

          <div className={styles.cardsContainer}>
            {renderActiveSection()}
          </div>
        </main>
      </section>

      <footer className={styles.saveBar}>
        <div>
          <strong>
            {hasChanges
              ? "Existem alterações pendentes."
              : "Todas as alterações estão salvas."}
          </strong>

          <span>
            Somente os dados da seção Evento são
            persistidos no Supabase nesta etapa.
          </span>
        </div>

        <div className={styles.saveActions}>
          <button
            type="button"
            className={styles.discardButton}
            disabled={!hasChanges || isSaving}
            onClick={discardChanges}
          >
            Descartar
          </button>

          <button
            type="button"
            className={styles.saveButton}
            disabled={!hasChanges || isSaving}
            onClick={saveSettings}
          >
            {isSaving
              ? "Salvando..."
              : "Salvar configurações"}
          </button>
        </div>
      </footer>
    </div>
  );
}