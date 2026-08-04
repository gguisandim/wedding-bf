import FinancialSummary from "@/components/dashboard/financialsummary";
import GuestSummary from "@/components/dashboard/guestsummary";
import MetricsGrid from "@/components/dashboard/metricsgrid";
import MonthlyPayments, {
  type MonthlyPaymentItem,
} from "@/components/dashboard/monthlypayments";
import NextSteps, {
  type NextStepItem,
} from "@/components/dashboard/nextsteps";
import WeddingHeader from "@/components/dashboard/weddingheader";

import { requireCurrentWedding } from "@/lib/auth/get-current-wedding";
import {
  calculateDaysUntilWedding,
  formatCoupleName,
  formatWeddingDateLong,
} from "@/lib/wedding/presentation";

/*
 * Esses dados estão vazios até os respectivos módulos
 * serem conectados ao Supabase.
 */
const nextSteps: NextStepItem[] = [];

const monthlyPayments: MonthlyPaymentItem[] = [];

export default async function PainelPage() {
  const wedding = await requireCurrentWedding();

  const coupleName = formatCoupleName(
    wedding.brideName,
    wedding.groomName,
  );

  const weddingDate = formatWeddingDateLong(
    wedding.weddingDate,
  );

  const daysRemaining = calculateDaysUntilWedding(
    wedding.weddingDate,
    wedding.timezone,
  );

  return (
    <div className="dashboard-page">
      <WeddingHeader
        coupleName={coupleName}
        weddingDate={weddingDate}
        daysRemaining={daysRemaining}
        confirmedGuests={0}
        pendingGuests={0}
      />

      <MetricsGrid
        totalGuests={0}
        confirmedGuests={0}
        pendingGuests={0}
        totalBudget={0}
        paidAmount={0}
        pendingTasks={0}
        priorityTasks={0}
      />

      <NextSteps
        items={nextSteps}
        completedTasks={0}
        totalTasks={0}
      />

      <MonthlyPayments
        items={monthlyPayments}
      />

      <section
        className="dashboard-summary-grid"
        aria-label="Resumos do casamento"
      >
        <GuestSummary
          totalGuests={0}
          confirmedGuests={0}
          pendingGuests={0}
          declinedGuests={0}
        />

        <FinancialSummary
          totalBudget={0}
          paidAmount={0}
          committedAmount={0}
        />
      </section>
    </div>
  );
}