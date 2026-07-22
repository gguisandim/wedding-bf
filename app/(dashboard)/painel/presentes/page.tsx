import GiftManager, {
  type HoneymoonGift,
} from "@/components/dashboard/presentes/gift-manager";

const gifts: HoneymoonGift[] = [
  {
    id: "gift-01",

    title:
      "Passeio de barco ao pôr do sol",

    description:
      "Um passeio especial pelas águas de Cartagena para assistir ao pôr do sol durante nossa lua de mel.",

    location: "Cartagena",

    category: "tour",
    price: 450,

    icon: "⛵",
    tone: "blue",

    status: "gifted",
    isVisible: true,

    giver: {
      name: "Mariana Souza",
      email: "mariana@email.com",

      message:
        "Desejo que essa viagem seja tão especial quanto vocês dois!",

      showPublicly: true,

      selectedAt:
        "12 de maio de 2027, 18:20",

      giftedAt:
        "12 de maio de 2027, 18:32",
    },
  },
  {
    id: "gift-02",

    title: "Jantar romântico",

    description:
      "Uma noite especial em um restaurante à beira-mar, com menu completo para o casal.",

    location: "Cartagena",

    category: "romance",
    price: 380,

    icon: "♡",
    tone: "rose",

    status: "reserved",
    isVisible: true,

    giver: {
      name: "João Almeida",
      email: "joao@email.com",

      message:
        "Que vocês aproveitem muito esse jantar e celebrem esse novo começo.",

      showPublicly: true,

      selectedAt:
        "14 de maio de 2027, 18:10",

      reservationExpiresAt:
        "14 de maio, 18:40",
    },
  },
  {
    id: "gift-03",

    title:
      "Visita a uma vinícola",

    description:
      "Uma experiência de degustação com visita guiada e almoço harmonizado.",

    location: "Vale do Maipo",

    category: "gastronomy",
    price: 520,

    icon: "♢",
    tone: "sage",

    status: "available",
    isVisible: true,
  },
  {
    id: "gift-04",

    title:
      "Mergulho para o casal",

    description:
      "Um mergulho guiado para conhecer a vida marinha e registrar uma lembrança diferente da viagem.",

    location: "Ilhas do Rosário",

    category: "adventure",
    price: 680,

    icon: "≈",
    tone: "navy",

    status: "available",
    isVisible: true,
  },
  {
    id: "gift-05",

    title:
      "Massagem relaxante para o casal",

    description:
      "Uma tarde de descanso com massagem, sauna e acesso à área de relaxamento.",

    location: "Hotel da lua de mel",

    category: "relaxation",
    price: 600,

    icon: "❋",
    tone: "yellow",

    status: "gifted",
    isVisible: true,

    giver: {
      name: "Carla Mendes",
      email: "carla@email.com",

      message:
        "Depois de toda a correria do casamento, vocês merecem descansar.",

      showPublicly: false,

      selectedAt:
        "10 de maio de 2027, 15:30",

      giftedAt:
        "10 de maio de 2027, 15:38",
    },
  },
  {
    id: "gift-06",

    title:
      "Passeio de balão",

    description:
      "Uma experiência ao amanhecer com vista panorâmica e café da manhã após o voo.",

    location: "Atacama",

    category: "adventure",
    price: 980,

    icon: "◉",
    tone: "rose",

    status: "available",
    isVisible: true,
  },
  {
    id: "gift-07",

    title:
      "Traslado privativo",

    description:
      "Transporte privativo do aeroporto até o hotel para começar a viagem com tranquilidade.",

    location: "Aeroporto",

    category: "transport",
    price: 240,

    icon: "→",
    tone: "blue",

    status: "available",
    isVisible: false,
  },
  {
    id: "gift-08",

    title:
      "Tour gastronômico",

    description:
      "Um roteiro pelos sabores locais com degustações de pratos típicos e doces tradicionais.",

    location: "Centro histórico",

    category: "gastronomy",
    price: 340,

    icon: "✦",
    tone: "sage",

    status: "gifted",
    isVisible: true,

    giver: {
      name: "Patrícia Lima",
      email: "patricia@email.com",

      message:
        "Aproveitem cada sabor e cada momento dessa viagem maravilhosa!",

      showPublicly: true,

      selectedAt:
        "8 de maio de 2027, 20:14",

      giftedAt:
        "8 de maio de 2027, 20:21",
    },
  },
];

export default function GiftsPage() {
  return (
    <GiftManager
      initialGifts={gifts}
    />
  );
}