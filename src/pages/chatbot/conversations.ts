export interface ChatMessage {
  id: string;
  author: "user" | "assistant";
  content: string;
}

export interface ArchivedConversation {
  id: string;
  title: string;
  date: string;
  messages: readonly ChatMessage[];
}

export const defaultConversations: readonly ArchivedConversation[] = [
  {
    id: "investments-savings",
    title: "Investimentos para economia",
    date: "03/03/2026",
    messages: [
      {
        id: "investments-user",
        author: "user",
        content: "Onde investir para economizar mais?",
      },
      {
        id: "investments-assistant",
        author: "assistant",
        content: "A unidade de Pinheiros deve ser priorizada: ela apresenta o maior consumo e também possui um vazamento ativo.",
      },
    ],
  },
  {
    id: "cost-forecast",
    title: "Previsão do custo",
    date: "03/04/2026",
    messages: [
      {
        id: "cost-user",
        author: "user",
        content: "Qual é a previsão de custo para este mês?",
      },
      {
        id: "cost-assistant",
        author: "assistant",
        content: "A projeção atual indica aumento de custo nas unidades que estão acima da meta. Pinheiros e Vila Leopoldina exigem maior atenção.",
      },
    ],
  },
  {
    id: "environmental-impact",
    title: "Impacto ambiental",
    date: "03/05/2026",
    messages: [
      {
        id: "impact-user",
        author: "user",
        content: "Qual é o impacto ambiental do consumo atual?",
      },
      {
        id: "impact-assistant",
        author: "assistant",
        content: "A redução do consumo nas unidades críticas representa a maior oportunidade de diminuir o impacto ambiental neste período.",
      },
    ],
  },
];

