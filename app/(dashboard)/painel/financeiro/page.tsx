import BudgetManager, {
  type BudgetCategory,
  type BudgetExpense,
} from "@/components/dashboard/financeiro/budget-manager";

const categories: BudgetCategory[] = [
  {
    key: "venue",
    label: "Espaço",
    limit: 12000,
  },
  {
    key: "buffet",
    label: "Buffet",
    limit: 15000,
  },
  {
    key: "decor",
    label: "Decoração",
    limit: 7000,
  },
  {
    key: "photo",
    label: "Foto e vídeo",
    limit: 5000,
  },
  {
    key: "music",
    label: "Música",
    limit: 3000,
  },
  {
    key: "attire",
    label: "Trajes",
    limit: 4000,
  },
  {
    key: "stationery",
    label: "Convites e papelaria",
    limit: 1500,
  },
  {
    key: "other",
    label: "Outros",
    limit: 2500,
  },
];

const expenses: BudgetExpense[] = [
  {
    id: "expense-01",
    description:
      "Locação do espaço",
    supplier:
      "Solar do Bosque",
    category: "venue",

    totalAmount: 9500,
    paidAmount: 9500,

    status: "paid",

    dueDate: "2026-08-15",
    notes:
      "Contrato e caução quitados.",
  },
  {
    id: "expense-02",
    description:
      "Serviço de buffet",
    supplier:
      "Sabores da Amazônia",
    category: "buffet",

    totalAmount: 12000,
    paidAmount: 5000,

    status: "partial",

    dueDate: "2027-06-18",
    notes:
      "Saldo final até 30 dias antes do evento.",
  },
  {
    id: "expense-03",
    description:
      "Fotografia e filmagem",
    supplier:
      "Memórias Filmes",
    category: "photo",

    totalAmount: 4500,
    paidAmount: 2250,

    status: "partial",

    dueDate: "2027-07-10",
  },
  {
    id: "expense-04",
    description:
      "Decoração da cerimônia",
    supplier:
      "Folha & Flor",
    category: "decor",

    totalAmount: 4950,
    paidAmount: 2000,

    status: "partial",

    dueDate: "2027-06-30",
  },
  {
    id: "expense-05",
    description:
      "DJ e sonorização",
    supplier:
      "Som Norte Eventos",
    category: "music",

    totalAmount: 2800,
    paidAmount: 0,

    status: "estimate",

    dueDate: "2027-05-15",
  },
  {
    id: "expense-06",
    description:
      "Vestido e traje",
    supplier:
      "A definir",
    category: "attire",

    totalAmount: 3500,
    paidAmount: 0,

    status: "estimate",
  },
  {
    id: "expense-07",
    description:
      "Convites impressos",
    supplier:
      "Papelaria Aurora",
    category: "stationery",

    totalAmount: 1200,
    paidAmount: 0,

    status: "estimate",

    dueDate: "2027-02-20",
  },
];

export default function FinancialPage() {
  return (
    <BudgetManager
      initialBudget={50000}
      initialCategories={categories}
      initialExpenses={expenses}
    />
  );
}