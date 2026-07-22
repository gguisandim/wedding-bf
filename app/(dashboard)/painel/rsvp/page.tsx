import RSVPManager, {
  type RSVPInvitation,
} from "@/components/dashboard/rsvp/rsvp-manager";

const invitations: RSVPInvitation[] = [
  {
    id: 100,
    groupName: "Família Souza",

    contactName: "Mariana Souza",
    phone: "(91) 99123-4567",
    email: "mariana@email.com",

    members: [
      {
        id: 1,
        name: "Mariana Souza",

        isPrimary: true,

        status: "confirmed",
        responseDate: "20 de julho",
        responseChannel: "site",

        dietaryRestriction: "Vegetariana",
      },
      {
        id: 2,
        name: "João Souza",

        isPrimary: false,

        relationship: "Marido",
        relatedToName: "Mariana",

        status: "confirmed",
        responseDate: "20 de julho",
        responseChannel: "site",
      },
      {
        id: 3,
        name: "Ana Souza",

        isPrimary: false,

        relationship: "Filha",
        relatedToName: "Mariana",

        status: "pending",
      },
    ],
  },
  {
    id: 101,
    groupName: "João Pedro e Camila",

    contactName: "João Pedro Almeida",
    phone: "(91) 98111-2233",

    lastReminder: "18 de julho",

    members: [
      {
        id: 4,
        name: "João Pedro Almeida",

        isPrimary: true,

        status: "pending",
      },
      {
        id: 5,
        name: "Camila Ferreira",

        isPrimary: false,

        relationship: "Namorada",
        relatedToName: "João Pedro",

        status: "pending",
      },
    ],
  },
  {
    id: 102,
    groupName: "Carla Mendes",

    contactName: "Carla Mendes",
    phone: "(91) 99234-7766",

    members: [
      {
        id: 6,
        name: "Carla Mendes",

        isPrimary: true,

        status: "confirmed",
        responseDate: "19 de julho",
        responseChannel: "whatsapp",
      },
    ],
  },
  {
    id: 103,
    groupName: "Família Oliveira",

    contactName: "Rafael Oliveira",
    phone: "(91) 98876-4455",

    members: [
      {
        id: 7,
        name: "Rafael Oliveira",

        isPrimary: true,

        status: "declined",
        responseDate: "17 de julho",
        responseChannel: "phone",

        note: "Estará viajando.",
      },
      {
        id: 8,
        name: "Fernanda Oliveira",

        isPrimary: false,

        relationship: "Esposa",
        relatedToName: "Rafael",

        status: "declined",
        responseDate: "17 de julho",
        responseChannel: "phone",
      },
    ],
  },
  {
    id: 104,
    groupName: "Família Tavares",

    contactName: "Lúcia Tavares",
    phone: "(91) 99987-1212",

    members: [
      {
        id: 9,
        name: "Lúcia Tavares",

        isPrimary: true,

        status: "confirmed",
        responseDate: "16 de julho",
        responseChannel: "manual",

        dietaryRestriction: "Sem lactose",
      },
      {
        id: 10,
        name: "Carlos Tavares",

        isPrimary: false,

        relationship: "Marido",
        relatedToName: "Lúcia",

        status: "confirmed",
        responseDate: "16 de julho",
        responseChannel: "manual",
      },
    ],
  },
];

export default function RSVPPage() {
  return (
    <RSVPManager
      invitations={invitations}
    />
  );
}