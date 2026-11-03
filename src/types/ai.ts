export interface AiChatMessage {
  role: "user" | "bot";
  content: string;
  timestamp: string | null;
}

export interface AiChatResponse {
  response: string;
  sessionId: string;
  chartData: Record<string, unknown> | null;
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
