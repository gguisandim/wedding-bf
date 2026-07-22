import SettingsManager, {
  type WeddingSettings,
} from "@/components/dashboard/configuracoes/settings-manager";

const settings: WeddingSettings = {
  event: {
    brideName: "Bárbara",
    groomName: "Felipe",

    weddingDate: "2027-07-18",
    weddingTime: "17:00",

    venueName: "Solar do Bosque",

    venueAddress:
      "Belém, Pará",

    timezone: "America/Belem",
    language: "pt-BR",
  },

  invitation: {
    publicSlug: "barbara-e-felipe",

    rsvpDeadline: "2027-05-18",

    requireInvitationCode: true,
    showCountdown: true,

    allowGuestMessage: true,
    allowDecline: true,

    showVenueMap: true,

    showGuestNamesInConfirmation:
      true,
  },

  gifts: {
    reservationMinutes: 30,

    showGiftedExperiences: true,
    showGiverName: true,
    showGiverMessage: true,

    allowAnonymousGift: true,
    hideReservedGift: false,

    notifyOnReservation: true,
    notifyOnPayment: true,
  },

  finance: {
    budgetLimit: 50000,
    currency: "BRL",

    supplierReminderDays: 7,

    warnWhenBudgetExceeded: true,

    syncSupplierPayments: true,

    includeEstimatedExpenses: true,
  },

  notifications: {
    email: "barbspraxedes@gmail.com",

    newRsvp: true,
    changedRsvp: true,

    giftReserved: true,
    giftPaid: true,

    supplierDue: true,
    weeklySummary: false,
  },

  privacy: {
    invitationVisibility: "code",

    allowSearchEngines: false,
    collectAnalytics: true,

    sessionTimeoutMinutes: 120,

    adminEmails:
      "barbspraxedes@gmail.com",

    hideGuestListFromPublic: true,

    hideGiftValuesAfterPayment:
      false,
  },

  integrations: {
    paymentProvider: "none",

    storageProvider: "supabase",

    enableWebhook: false,

    webhookUrl:
      "https://wedding-bf.vercel.app/api/payments/webhook",

    receiptBucket:
      "supplier-receipts",

    photoBucket:
      "wedding-photos",
  },
};

export default function SettingsPage() {
  return (
    <SettingsManager
      initialSettings={settings}
    />
  );
}