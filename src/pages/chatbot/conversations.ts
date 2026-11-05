import type { AiPlotlyFigure } from "../../types/ai";

export interface ChatMessage {
  id: string;
  author: "user" | "assistant";
  content: string;
  chartData?: AiPlotlyFigure | null;
}

export interface ArchivedConversation {
  id: string;
  title: string;
  date: string;
  messages: readonly ChatMessage[];
}
