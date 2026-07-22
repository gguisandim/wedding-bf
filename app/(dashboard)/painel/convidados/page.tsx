import GuestList, {
  type GuestItem,
} from "@/components/dashboard/convidados/guest-list";

const guests: GuestItem[] = [
  {
    id: 1,
    name: "Mariana Souza",
    phone: "(91) 99123-4567",
    email: "mariana@email.com",
    group: "Família",
    side: "bride",
    confirmation: "confirmed",
    companions: 1,
    table: "Mesa 03",
  },
  {
    id: 2,
    name: "João Pedro Almeida",
    phone: "(91) 98111-2233",
    group: "Amigos",
    side: "groom",
    confirmation: "pending",
    companions: 0,
  },
  {
    id: 3,
    name: "Carla Mendes",
    phone: "(91) 99234-7766",
    group: "Trabalho",
    side: "bride",
    confirmation: "confirmed",
    companions: 1,
    table: "Mesa 07",
  },
  {
    id: 4,
    name: "Rafael Oliveira",
    phone: "(91) 98876-4455",
    email: "rafael@email.com",
    group: "Amigos",
    side: "both",
    confirmation: "declined",
    companions: 0,
  },
  {
    id: 5,
    name: "Lúcia Tavares",
    phone: "(91) 99987-1212",
    group: "Família",
    side: "groom",
    confirmation: "confirmed",
    companions: 2,
    table: "Mesa 01",
  },
  {
    id: 6,
    name: "Fernando Costa",
    phone: "(91) 98444-7788",
    group: "Faculdade",
    side: "both",
    confirmation: "pending",
    companions: 1,
  },
  {
    id: 7,
    name: "Patrícia Lima",
    phone: "(91) 99321-9087",
    group: "Família",
    side: "bride",
    confirmation: "confirmed",
    companions: 0,
    table: "Mesa 02",
  },
  {
    id: 8,
    name: "Lucas Ferreira",
    group: "Trabalho",
    side: "groom",
    confirmation: "pending",
    companions: 1,
  },
];

export default function ConvidadosPage() {
  return <GuestList guests={guests} />;
}