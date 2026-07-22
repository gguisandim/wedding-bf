import CronogramaHeader from "@/components/dashboard/cronograma/cronograma-header";
import CronogramaMonth from "@/components/dashboard/cronograma/cronograma-month";
import type { CronogramaEventItem } from "@/components/dashboard/cronograma/cronograma-event";

import styles from "@/components/dashboard/cronograma/cronograma.module.css";

type CronogramaMonthData = {
  id: number;
  month: string;
  year: number;
  description: string;
  current?: boolean;
  events: CronogramaEventItem[];
};

const months: CronogramaMonthData[] = [
  {
    id: 1,
    month: "Julho",
    year: 2026,
    description:
      "Decisões e compromissos prioritários desta etapa.",
    current: true,
    events: [
      {
        id: 1,
        day: "25",
        weekday: "Sáb",
        title: "Confirmar o buffet",
        description:
          "Definir o menu final, bebidas e opções para convidados com restrições alimentares.",
        category: "Fornecedores",
        status: "upcoming",
        time: "15h",
        location: "Ateliê do Sabor",
        responsible: "Bárbara",
      },
      {
        id: 2,
        day: "30",
        weekday: "Qui",
        title: "Pagar segunda parcela da decoração",
        description:
          "Pagamento de R$ 2.500,00 referente à decoração da cerimônia.",
        category: "Financeiro",
        status: "planned",
        time: "Até 18h",
        responsible: "Felipe",
      },
    ],
  },
  {
    id: 2,
    month: "Agosto",
    year: 2026,
    description:
      "Contratações e alinhamentos com fornecedores principais.",
    events: [
      {
        id: 3,
        day: "10",
        weekday: "Seg",
        title: "Reunião com fotógrafo e videomaker",
        description:
          "Conhecer propostas, portfólios e condições de pagamento.",
        category: "Fornecedores",
        status: "planned",
        time: "19h",
        location: "Reunião on-line",
        responsible: "Casal",
      },
      {
        id: 4,
        day: "18",
        weekday: "Ter",
        title: "Visita técnica ao espaço",
        description:
          "Revisar acessos, iluminação, montagem das mesas e estrutura da cerimônia.",
        category: "Evento",
        status: "planned",
        time: "16h",
        location: "Espaço Jardim",
        responsible: "Casal",
      },
      {
        id: 5,
        day: "30",
        weekday: "Dom",
        title: "Aprovar proposta de decoração",
        description:
          "Validar flores, mobiliário, altar e composição das mesas.",
        category: "Decoração",
        status: "planned",
        responsible: "Bárbara",
      },
    ],
  },
  {
    id: 3,
    month: "Setembro",
    year: 2026,
    description:
      "Identidade visual e preparação da comunicação com os convidados.",
    events: [
      {
        id: 6,
        day: "15",
        weekday: "Ter",
        title: "Aprovar modelo dos convites",
        description:
          "Escolher papel, acabamento, tipografia e versão digital.",
        category: "Identidade visual",
        status: "planned",
        responsible: "Casal",
      },
      {
        id: 7,
        day: "20",
        weekday: "Dom",
        title: "Revisar dados dos convidados",
        description:
          "Conferir nomes, telefones, acompanhantes e informações de contato.",
        category: "Convidados",
        status: "planned",
        responsible: "Felipe",
      },
    ],
  },
  {
    id: 4,
    month: "Janeiro",
    year: 2027,
    description:
      "Envio dos convites e início das confirmações.",
    events: [
      {
        id: 8,
        day: "15",
        weekday: "Sex",
        title: "Enviar os convites",
        description:
          "Iniciar o envio dos convites físicos e digitais para os convidados.",
        category: "Convidados",
        status: "planned",
        responsible: "Casal",
      },
    ],
  },
  {
    id: 5,
    month: "Maio",
    year: 2027,
    description:
      "Conclusão das confirmações e organização final dos convidados.",
    events: [
      {
        id: 9,
        day: "30",
        weekday: "Dom",
        title: "Encerrar confirmações de presença",
        description:
          "Finalizar o RSVP e entrar em contato com convidados que ainda não responderam.",
        category: "Confirmações",
        status: "planned",
        responsible: "Bárbara",
      },
    ],
  },
  {
    id: 6,
    month: "Julho",
    year: 2027,
    description:
      "Últimos preparativos e realização do casamento.",
    events: [
      {
        id: 10,
        day: "17",
        weekday: "Sáb",
        title: "Montagem e conferência do evento",
        description:
          "Acompanhar decoração, mobiliário, som, iluminação e estrutura.",
        category: "Evento",
        status: "planned",
        time: "10h",
        location: "Espaço Jardim",
        responsible: "Assessoria",
      },
      {
        id: 11,
        day: "18",
        weekday: "Dom",
        title: "Bárbara & Felipe",
        description:
          "Cerimônia e celebração do casamento.",
        category: "Nosso casamento",
        status: "wedding",
        time: "17h",
        location: "Espaço Jardim",
        responsible: "Todos",
      },
    ],
  },
];

export default function CronogramaPage() {
  const allEvents = months.flatMap(
    (month) => month.events,
  );

  return (
    <div className={`dashboard-page ${styles.page}`}>
      <CronogramaHeader
        nextEventDay="25"
        nextEventMonth="Jul"
        nextEventTitle="Confirmar o buffet"
        totalEvents={allEvents.length}
        upcomingEvents={3}
      />

      <section className={styles.toolbar}>
        <label className={styles.search}>
          <span aria-hidden="true">⌕</span>

          <input
            type="search"
            placeholder="Buscar compromisso..."
          />
        </label>

        <div className={styles.filters}>
          <button
            type="button"
            className={`${styles.filterButton} ${styles.filterButtonActive}`}
          >
            Todos
          </button>

          <button
            type="button"
            className={styles.filterButton}
          >
            Próximos
          </button>

          <button
            type="button"
            className={styles.filterButton}
          >
            Concluídos
          </button>
        </div>

        <button
          type="button"
          className={styles.todayButton}
        >
          Hoje
        </button>
      </section>

      <main className={styles.timeline}>
        {months.map((month) => (
          <CronogramaMonth
            key={month.id}
            month={month.month}
            year={month.year}
            description={month.description}
            events={month.events}
            current={month.current}
          />
        ))}
      </main>
    </div>
  );
}