import ChecklistGroup from "@/components/dashboard/checklist-group";
import ChecklistHeader from "@/components/dashboard/checklist-header";
import type { ChecklistTaskItem } from "@/components/dashboard/checklist-task";

type ChecklistStage = {
  id: number;
  title: string;
  description: string;
  tone: "blue" | "green" | "yellow" | "terracotta";
  tasks: ChecklistTaskItem[];
};

const checklistStages: ChecklistStage[] = [
  {
    id: 1,
    title: "Primeiras decisões",
    description:
      "Definições essenciais para estruturar o casamento.",
    tone: "blue",
    tasks: [
      {
        id: 1,
        title: "Definir a data do casamento",
        description:
          "Confirmar a data considerando cerimônia e recepção.",
        deadline: "Concluído",
        responsible: "Casal",
        status: "completed",
        priority: "high",
      },
      {
        id: 2,
        title: "Definir o orçamento inicial",
        description:
          "Estabelecer o limite total e a divisão por categorias.",
        deadline: "Concluído",
        responsible: "Bárbara",
        status: "completed",
        priority: "high",
      },
      {
        id: 3,
        title: "Criar lista preliminar de convidados",
        description:
          "Registrar familiares, amigos e acompanhantes.",
        deadline: "28 de julho",
        responsible: "Casal",
        status: "progress",
        priority: "medium",
      },
    ],
  },
  {
    id: 2,
    title: "Fornecedores principais",
    description:
      "Contratações que definem a estrutura do evento.",
    tone: "green",
    tasks: [
      {
        id: 4,
        title: "Contratar o espaço da cerimônia",
        deadline: "Concluído",
        responsible: "Felipe",
        status: "completed",
        priority: "high",
      },
      {
        id: 5,
        title: "Confirmar o buffet",
        description:
          "Definir menu, bebidas e opções para restrições alimentares.",
        deadline: "25 de julho",
        responsible: "Bárbara",
        status: "progress",
        priority: "high",
      },
      {
        id: 6,
        title: "Selecionar fotógrafo e videomaker",
        deadline: "10 de agosto",
        responsible: "Casal",
        status: "pending",
        priority: "medium",
      },
    ],
  },
  {
    id: 3,
    title: "Identidade e experiência",
    description:
      "Elementos visuais e detalhes que dão personalidade ao evento.",
    tone: "yellow",
    tasks: [
      {
        id: 7,
        title: "Definir a paleta de cores",
        deadline: "Concluído",
        responsible: "Bárbara",
        status: "completed",
        priority: "normal",
      },
      {
        id: 8,
        title: "Aprovar decoração da cerimônia",
        deadline: "30 de agosto",
        responsible: "Casal",
        status: "pending",
        priority: "medium",
      },
      {
        id: 9,
        title: "Escolher modelo dos convites",
        deadline: "15 de setembro",
        responsible: "Bárbara",
        status: "pending",
        priority: "normal",
      },
    ],
  },
  {
    id: 4,
    title: "Convidados e confirmações",
    description:
      "Organização da lista, convites e confirmação de presença.",
    tone: "terracotta",
    tasks: [
      {
        id: 10,
        title: "Revisar dados dos convidados",
        deadline: "20 de setembro",
        responsible: "Felipe",
        status: "pending",
        priority: "normal",
      },
      {
        id: 11,
        title: "Enviar os convites",
        deadline: "15 de janeiro",
        responsible: "Casal",
        status: "pending",
        priority: "medium",
      },
      {
        id: 12,
        title: "Acompanhar confirmações de presença",
        deadline: "30 de maio",
        responsible: "Bárbara",
        status: "pending",
        priority: "normal",
      },
    ],
  },
];

export default function ChecklistPage() {
  const allTasks = checklistStages.flatMap(
    (stage) => stage.tasks,
  );

  const completedTasks = allTasks.filter(
    (task) => task.status === "completed",
  ).length;

  const urgentTasks = allTasks.filter(
    (task) =>
      task.priority === "high" &&
      task.status !== "completed",
  ).length;

  return (
    <div className="dashboard-page checklist-page">
      <ChecklistHeader
        completedTasks={completedTasks}
        totalTasks={allTasks.length}
        urgentTasks={urgentTasks}
      />

      <section className="checklist-toolbar">
        <label className="checklist-search">
          <span aria-hidden="true">⌕</span>

          <input
            type="search"
            placeholder="Buscar uma tarefa..."
          />
        </label>

        <div className="checklist-filters">
          <button
            type="button"
            className="checklist-filter checklist-filter-active"
          >
            Todas
          </button>

          <button type="button" className="checklist-filter">
            Pendentes
          </button>

          <button type="button" className="checklist-filter">
            Em andamento
          </button>

          <button type="button" className="checklist-filter">
            Concluídas
          </button>
        </div>

        <button
          type="button"
          className="checklist-new-task"
        >
          <span aria-hidden="true">＋</span>
          Nova tarefa
        </button>
      </section>

      <div className="checklist-groups">
        {checklistStages.map((stage) => (
          <ChecklistGroup
            key={stage.id}
            title={stage.title}
            description={stage.description}
            tasks={stage.tasks}
            tone={stage.tone}
          />
        ))}
      </div>
    </div>
  );
}