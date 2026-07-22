import FinancialSummary from "@/components/dashboard/financialsummary";
import GuestSummary from "@/components/dashboard/guestsummary";
import MetricsGrid from "@/components/dashboard/metricsgrid";
import NextSteps, {
  type NextStepItem,
} from "@/components/dashboard/nextsteps";
import WeddingHeader from "@/components/dashboard/weddingheader";

const WEDDING_DATE = new Date(Date.UTC(2027, 6, 18));

const nextSteps: NextStepItem[] = [
  {
    id: 1,
    title: "Confirmar o buffet",
    description:
      "Definir o menu final e confirmar as opções para convidados com restrições alimentares.",
    deadline: "25 de julho",
    category: "Fornecedores",
    priority: "urgent",
  },
  {
    id: 2,
    title: "Enviar lembrete aos convidados",
    description:
      "Ainda existem 35 convidados que não responderam à confirmação de presença.",
    deadline: "Esta semana",
    category: "Convidados",
    priority: "soon",
  },
  {
    id: 3,
    title: "Pagar a segunda parcela da decoração",
    description:
      "Pagamento de R$ 2.500,00 referente à decoração da cerimônia.",
    deadline: "30 de julho",
    category: "Financeiro",
    priority: "normal",
  },
];

function calculateDaysRemaining() {
  const today = new Date();

  const todayAtMidnight = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );

  const difference =
    WEDDING_DATE.getTime() - todayAtMidnight;

  return Math.max(
    0,
    Math.ceil(difference / (1000 * 60 * 60 * 24)),
  );
}

export default function PainelPage() {
  const daysRemaining = calculateDaysRemaining();

  return (
    <div className="dashboard-page">
      <WeddingHeader
        coupleName="Bárbara & Felipe"
        weddingDate="18 de julho de 2027"
        daysRemaining={daysRemaining}
        confirmedGuests={84}
        pendingGuests={35}
      />

      <MetricsGrid
        totalGuests={126}
        confirmedGuests={84}
        pendingGuests={35}
        totalBudget={50000}
        paidAmount={18750}
        pendingTasks={12}
        priorityTasks={3}
      />

      <NextSteps
        items={nextSteps}
        completedTasks={34}
        totalTasks={46}
      />

      <section
        className="dashboard-summary-grid"
        aria-label="Resumos do casamento"
      >
        <GuestSummary
          totalGuests={126}
          confirmedGuests={84}
          pendingGuests={35}
          declinedGuests={7}
        />

        <FinancialSummary
          totalBudget={50000}
          paidAmount={18750}
          committedAmount={12200}
        />
      </section>
    </div>
  );
}