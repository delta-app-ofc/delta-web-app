import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AppSidebar } from "../../components/AppSidebar";
import { AsyncFeedback } from "../../components/AsyncFeedback";
import { listAiSessions } from "../../services/ai";
import { ApiError } from "../../services/http";
import type { AiSession } from "../../types/ai";
import backArrowIcon from "../../assets/chatbot/arrow2.png";
import conversationIcon from "../../assets/chatbot/conversations.png";
import newConversationIcon from "../../assets/chatbot/new-conversation.png";

import "./style.css";

function sessionDate(value: string | null): string {
  if (!value) return "Data não informada";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Data não informada" : new Intl.DateTimeFormat("pt-BR").format(date);
}

export function ChatbotHistoryPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<AiSession[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    void listAiSessions(100, 0, controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      setSessions(result.sessions);
      setStatus("success");
    }).catch((failure: unknown) => {
      if (controller.signal.aborted) return;
      setError(failure instanceof ApiError ? failure.message : "Não foi possível carregar o histórico.");
      setStatus("error");
    });
    return () => controller.abort();
  }, [requestVersion]);

  return (
    <main className="chatbot-history-page">
      <div className="chatbot-history-page__sidebar"><AppSidebar label="Navegação principal" /></div>
      <section id="page-content" tabIndex={-1} className="chatbot-history-page__content" aria-labelledby="conversation-history-title">
        <header className="chatbot-history-page__header">
          <div className="chatbot-history-page__heading"><div className="chatbot-history-page__title-row"><button type="button" aria-label="Voltar para o Gluh" onClick={() => navigate("/gluh")}><img src={backArrowIcon} alt="" /></button><h1 id="conversation-history-title">Histórico de conversas</h1></div><p>Clique em uma conversa para reabri-la ou inicie uma nova sessão.</p></div>
          <button className="chatbot-history-page__new-conversation" type="button" onClick={() => navigate("/gluh")}><img src={newConversationIcon} alt="" /><span>Nova conversa</span></button>
        </header>

        {status === "loading" && <AsyncFeedback status="loading" message="Carregando histórico…" />}
        {status === "error" && <AsyncFeedback status="error" message={error} onRetry={() => setRequestVersion((version) => version + 1)} />}
        {status === "success" && <ul className="chatbot-history-page__list" aria-label="Conversas anteriores">
          {sessions.map((session) => <li key={session.sessionId}><button type="button" onClick={() => navigate("/gluh", { state: { conversation: { id: session.sessionId, title: session.title, date: sessionDate(session.updatedAt), messages: [] } } })}><span className="chatbot-history-page__icon" aria-hidden="true"><img src={conversationIcon} alt="" /></span><span className="chatbot-history-page__details"><strong>{session.title || "Nova conversa"}</strong><time>{sessionDate(session.updatedAt)}</time></span></button></li>)}
          {sessions.length === 0 && <li className="chatbot-history-page__empty">Nenhuma conversa encontrada.</li>}
        </ul>}
      </section>
    </main>
  );
}
