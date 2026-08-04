import SettingsManager, {
  type WeddingSettings,
} from "@/components/dashboard/configuracoes/settings-manager";

import { requireCurrentWedding } from "@/lib/auth/get-current-wedding";

function createPublicSlug(
  brideName: string,
  groomName: string,
): string {
  return `${brideName}-${groomName}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default async function SettingsPage() {
  const wedding = await requireCurrentWedding();

  const settings: WeddingSettings = {
    event: {
      brideName: wedding.brideName,
      groomName: wedding.groomName,

      weddingDate: wedding.weddingDate,

      weddingTime:
        wedding.weddingTime?.slice(0, 5) ?? "",

      venueName:
        wedding.venueName ?? "",

      venueAddress:
        wedding.venueAddress ?? "",

      timezone: wedding.timezone,
      language: "pt-BR",
    },

    invitation: {
      publicSlug: createPublicSlug(
        wedding.brideName,
        wedding.groomName,
      ),

      rsvpDeadline: "",

      requireInvitationCode: false,
      showCountdown: false,

      allowGuestMessage: false,
      allowDecline: false,

      showVenueMap: false,

      showGuestNamesInConfirmation: false,
    },

    gifts: {
      reservationMinutes: 0,

      showGiftedExperiences: false,
      showGiverName: false,
      showGiverMessage: false,

      allowAnonymousGift: false,
      hideReservedGift: false,

      notifyOnReservation: false,
      notifyOnPayment: false,
    },

    finance: {
      budgetLimit: 0,
      currency: wedding.currency,

      supplierReminderDays: 0,

      warnWhenBudgetExceeded: false,

      syncSupplierPayments: false,

      includeEstimatedExpenses: false,
    },

    notifications: {
      email: "",

      newRsvp: false,
      changedRsvp: false,

      giftReserved: false,
      giftPaid: false,

      supplierDue: false,
      weeklySummary: false,
    },

    privacy: {
      invitationVisibility: "code",

      allowSearchEngines: false,
      collectAnalytics: false,

      sessionTimeoutMinutes: 0,

      adminEmails: "",

      hideGuestListFromPublic: false,

      hideGiftValuesAfterPayment: false,
    },

    integrations: {
      paymentProvider: "none",

      storageProvider: "supabase",

      enableWebhook: false,

      webhookUrl: "",

      receiptBucket: "",

      photoBucket: "",
    },
  };

  return (
    <SettingsManager
      initialSettings={settings}
    />
  );
}