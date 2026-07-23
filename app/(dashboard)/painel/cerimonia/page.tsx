import CeremonyManager, {
  type CeremonyBlock,
} from "@/components/dashboard/cerimonia/ceremony-manager";

const ceremonyBlocks: CeremonyBlock[] = [
  {
    id: "ceremony-01",
    time: "16:30",
    durationMinutes: 30,

    title:
      "Recepção dos convidados",

    description:
      "Os convidados serão recebidos e orientados até seus lugares.",

    responsible:
      "Equipe de cerimonial",

    participants:
      "Cerimonialistas e recepcionistas",

    instructions:
      "Confirmar se padrinhos, pais e celebrante já chegaram antes de liberar o início.",

    type: "reception",
    status: "confirmed",
  },
  {
    id: "ceremony-02",
    time: "17:00",
    durationMinutes: 5,

    title:
      "Entrada dos padrinhos",

    description:
      "Entrada alternada dos padrinhos pelo corredor principal.",

    responsible:
      "Ana — cerimonialista",

    participants:
      "Padrinhos e madrinhas",

    instructions:
      "Organizar os casais na ordem definida e liberar a música antes da primeira entrada.",

    type: "entrance",
    status: "confirmed",
  },
  {
    id: "ceremony-03",
    time: "17:05",
    durationMinutes: 3,

    title:
      "Entrada do noivo",

    description:
      "Felipe entrará acompanhado de sua mãe.",

    responsible:
      "Ana — cerimonialista",

    participants:
      "Felipe e mãe do noivo",

    instructions:
      "Aguardar os padrinhos chegarem aos seus lugares antes de iniciar.",

    type: "entrance",
    status: "confirmed",
  },
  {
    id: "ceremony-04",
    time: "17:08",
    durationMinutes: 4,

    title:
      "Entrada da noiva",

    description:
      "Bárbara entrará pelo corredor principal acompanhada de seu pai.",

    responsible:
      "Equipe de cerimonial",

    participants:
      "Bárbara e pai da noiva",

    instructions:
      "Fechar as portas antes do início da música e abri-las no momento combinado.",

    type: "entrance",
    status: "confirmed",
  },
  {
    id: "ceremony-05",
    time: "17:12",
    durationMinutes: 8,

    title:
      "Boas-vindas do celebrante",

    description:
      "Abertura da cerimônia e breve apresentação da história do casal.",

    responsible:
      "Celebrante Marcos",

    participants:
      "Celebrante e casal",

    instructions:
      "Confirmar a versão final do texto com o celebrante.",

    type: "speech",
    status: "attention",
  },
  {
    id: "ceremony-06",
    time: "17:20",
    durationMinutes: 10,

    title:
      "Leitura dos votos",

    description:
      "Bárbara e Felipe farão a leitura dos votos pessoais.",

    responsible:
      "Celebrante Marcos",

    participants:
      "Bárbara e Felipe",

    instructions:
      "Os votos impressos ficarão com a cerimonialista até este momento.",

    type: "vows",
    status: "planned",
  },
  {
    id: "ceremony-07",
    time: "17:30",
    durationMinutes: 6,

    title:
      "Troca das alianças",

    description:
      "Entrega e troca das alianças conduzida pelo celebrante.",

    responsible:
      "Celebrante Marcos",

    participants:
      "Casal e pajem das alianças",

    instructions:
      "Confirmar quem ficará responsável pelas alianças antes da cerimônia.",

    type: "ritual",
    status: "attention",
  },
  {
    id: "ceremony-08",
    time: "17:36",
    durationMinutes: 7,

    title:
      "Assinatura dos documentos",

    description:
      "Assinatura dos documentos da cerimônia e registro com as testemunhas.",

    responsible:
      "Celebrante Marcos",

    participants:
      "Casal e testemunhas",

    instructions:
      "Deixar mesa, documentos e canetas preparados antes da entrada dos convidados.",

    type: "signing",
    status: "planned",
  },
  {
    id: "ceremony-09",
    time: "17:43",
    durationMinutes: 5,

    title:
      "Saída dos noivos",

    description:
      "Encerramento da cerimônia e saída do casal pelo corredor principal.",

    responsible:
      "Equipe de cerimonial",

    participants:
      "Bárbara, Felipe, padrinhos e familiares",

    instructions:
      "Organizar os convidados para as fotos após a saída.",

    type: "exit",
    status: "planned",
  },
];

export default function CeremonyPage() {
  return (
    <CeremonyManager
      initialBlocks={ceremonyBlocks}
    />
  );
}