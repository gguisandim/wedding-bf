import FinancialSummary from "@/components/dashboard/financialsummary";
import GuestSummary from "@/components/dashboard/guestsummary";
import MetricsGrid from "@/components/dashboard/metricsgrid";
import ModulesOverview from "@/components/dashboard/overview/modules-overview";
import MonthlyPayments, {
  type MonthlyPaymentItem,
} from "@/components/dashboard/monthlypayments";
import NextSteps, {
  type NextStepItem,
} from "@/components/dashboard/nextsteps";
import WeddingHeader from "@/components/dashboard/weddingheader";

import { requireCurrentWedding } from "@/lib/auth/get-current-wedding";
import { getWeddingOverviewData } from "@/lib/data/overview";
import {
  calculateDaysUntilWedding,
  formatCoupleName,
  formatWeddingDateLong,
} from "@/lib/wedding/presentation";

function canSeePrivateDress(
  memberType: string,
) {
  return (
    memberType === "bride" ||
    memberType === "developer"
  );
}

export default async function PainelPage() {
  const wedding =
    await requireCurrentWedding();

  const overview =
    await getWeddingOverviewData(
      wedding.id,
      {
        timeZone:
          wedding.timezone,

        weddingDate:
          wedding.weddingDate,

        includePrivateDress:
          canSeePrivateDress(
            wedding.memberType,
          ),
      },
    );

  const coupleName =
    formatCoupleName(
      wedding.brideName,
      wedding.groomName,
    );

  const weddingDate =
    formatWeddingDateLong(
      wedding.weddingDate,
    );

  const daysRemaining =
    calculateDaysUntilWedding(
      wedding.weddingDate,
      wedding.timezone,
    );

  const nextSteps:
    NextStepItem[] =
    overview.checklist.nextSteps.map(
      (item) => ({
        ...item,
      }),
    );

  const monthlyPayments:
    MonthlyPaymentItem[] =
    overview.monthlyPayments.map(
      (item) => ({
        ...item,
      }),
    );

  return (
    <div className="dashboard-page">
      <WeddingHeader
        coupleName={coupleName}
        memberName={
          wedding.memberName
        }
        weddingDate={weddingDate}
        daysRemaining={
          daysRemaining
        }
        confirmedGuests={
          overview.guests.confirmed
        }
        pendingGuests={
          overview.guests.pending
        }
      />

      <MetricsGrid
        totalGuests={
          overview.guests.total
        }
        confirmedGuests={
          overview.guests.confirmed
        }
        pendingGuests={
          overview.guests.pending
        }
        totalBudget={
          overview.finance.total
        }
        paidAmount={
          overview.finance.paid
        }
        pendingTasks={
          overview.checklist.pending
        }
        priorityTasks={
          overview.checklist.priority
        }
      />

      <NextSteps
        items={nextSteps}
        completedTasks={
          overview.checklist.completed
        }
        totalTasks={
          overview.checklist.total
        }
      />

      <ModulesOverview
        timeline={
          overview.timeline
        }
        seating={
          overview.seating
        }
        ceremony={
          overview.ceremony
        }
        privateDress={
          overview.privateDress
        }
        timeZone={
          wedding.timezone
        }
      />

      <MonthlyPayments
        items={monthlyPayments}
        referenceDate={
          overview.today
        }
      />

      <section
        className="dashboard-summary-grid"
        aria-label="Resumos do casamento"
      >
        <GuestSummary
          totalGuests={
            overview.guests.total
          }
          confirmedGuests={
            overview.guests.confirmed
          }
          pendingGuests={
            overview.guests.pending
          }
          declinedGuests={
            overview.guests.declined
          }
        />

        <FinancialSummary
          totalBudget={
            overview.finance.total
          }
          paidAmount={
            overview.finance.paid
          }
          remainingAmount={
            overview.finance.remaining
          }
          dueNext30={
            overview.finance.dueNext30
          }
          overdueAmount={
            overview.finance.overdue
          }
          unscheduledAmount={
            overview.finance.unscheduled
          }
        />
      </section>
    </div>
  );
}
