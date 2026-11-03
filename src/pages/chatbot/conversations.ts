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
