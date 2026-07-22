import SupplierManager, {
  type WeddingSupplier,
} from "@/components/dashboard/fornecedores/supplier-manager";

const suppliers: WeddingSupplier[] = [
  {
    id: "supplier-01",

    supplierName:
      "Solar do Bosque",

    serviceName:
      "Espaço e recepção",

    category: "venue",

    contactName:
      "Ana Paula Ribeiro",

    phone:
      "(91) 99123-4567",

    email:
      "ana@solardobosque.com",

    totalValue: 10000,

    status: "active",

    contractDate: "2026-07-20",
    dueDate: "2027-06-18",

    notes:
      "O saldo final deverá ser pago até 30 dias antes do casamento.",

    payments: [
      {
        id: "payment-01",

        amount: 2000,

        paidAt: "2026-07-20",

        note:
          "Pagamento do sinal para reserva da data.",

        receipts: [
          {
            id: "receipt-01",

            name:
              "comprovante-sinal-espaco.pdf",

            size: 385000,

            type:
              "application/pdf",
          },
        ],
      },
    ],
  },
  {
    id: "supplier-02",

    supplierName:
      "Sabores da Amazônia",

    serviceName:
      "Buffet completo",

    category: "buffet",

    contactName:
      "Ricardo Almeida",

    phone:
      "(91) 98876-1020",

    email:
      "ricardo@saboresamazonia.com",

    totalValue: 15000,

    status: "active",

    contractDate: "2026-08-05",
    dueDate: "2027-06-30",

    notes:
      "Serviço para 126 convidados, incluindo jantar, bebidas não alcoólicas e equipe.",

    payments: [
      {
        id: "payment-02",

        amount: 3000,

        paidAt: "2026-08-05",

        note: "Primeira parcela.",

        receipts: [],
      },
      {
        id: "payment-03",

        amount: 2500,

        paidAt: "2026-12-10",

        note: "Segunda parcela.",

        receipts: [
          {
            id: "receipt-02",

            name:
              "pix-buffet-dezembro.png",

            size: 840000,

            type: "image/png",
          },
        ],
      },
    ],
  },
  {
    id: "supplier-03",

    supplierName:
      "Memórias Filmes",

    serviceName:
      "Fotografia e filmagem",

    category: "photo",

    contactName:
      "Carolina Mendes",

    phone:
      "(91) 99932-8812",

    email:
      "carolina@memoriasfilmes.com",

    totalValue: 4500,

    status: "completed",

    contractDate: "2026-09-12",
    dueDate: "2027-05-30",

    payments: [
      {
        id: "payment-04",

        amount: 2250,

        paidAt: "2026-09-12",

        note:
          "Entrada do contrato.",

        receipts: [],
      },
      {
        id: "payment-05",

        amount: 2250,

        paidAt: "2027-05-22",

        note:
          "Pagamento final.",

        receipts: [
          {
            id: "receipt-03",

            name:
              "comprovante-final-fotografia.pdf",

            size: 510000,

            type:
              "application/pdf",
          },
        ],
      },
    ],
  },
  {
    id: "supplier-04",

    supplierName:
      "Folha & Flor",

    serviceName:
      "Decoração da cerimônia e recepção",

    category: "decor",

    contactName:
      "Beatriz Costa",

    phone:
      "(91) 98421-7781",

    totalValue: 7000,

    status: "active",

    contractDate: "2026-10-02",
    dueDate: "2027-07-01",

    payments: [
      {
        id: "payment-06",

        amount: 1500,

        paidAt: "2026-10-02",

        note:
          "Sinal da decoração.",

        receipts: [],
      },
    ],
  },
  {
    id: "supplier-05",

    supplierName:
      "Som Norte Eventos",

    serviceName:
      "DJ e sonorização",

    category: "music",

    contactName:
      "Marcos Oliveira",

    phone:
      "(91) 99110-3344",

    totalValue: 3000,

    status: "paused",

    contractDate: "2027-01-15",

    notes:
      "Aguardando definição sobre iluminação da pista.",

    payments: [],
  },
];

export default function SuppliersPage() {
  return (
    <SupplierManager
      initialSuppliers={suppliers}
    />
  );
}