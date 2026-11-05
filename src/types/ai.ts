export interface AiChatMessage {
  role: "user" | "bot";
  content: string;
  timestamp: string | null;
}

export interface AiPlotlyFigure {
  data: readonly Record<string, unknown>[];
  layout: Record<string, unknown>;
}

export interface ChatMarkdownProps {
  content: string;
}

export interface ChatPlotlyProps {
  figure: AiPlotlyFigure;
}

export interface AiChatResponse {
  response: string;
  sessionId: string;
  chartData: AiPlotlyFigure | null;
  suggestions: string[];
}

export interface AiSession {
  sessionId: string;
  title: string;
  preview: string;
  icon: string;
  createdAt: string | null;
  updatedAt: string | null;
  isOpen: boolean;
}
