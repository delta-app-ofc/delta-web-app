import { useLocation, useNavigate } from "react-router-dom";

import { AppSidebar } from "../../components/AppSidebar";
import backArrowIcon from "../../assets/chatbot/arrow2.png";
import conversationIcon from "../../assets/chatbot/conversations.png";
import newConversationIcon from "../../assets/chatbot/new-conversation.png";
import {
  defaultConversations,
  type ArchivedConversation,
} from "../chatbot/conversations";

import "./style.css";

interface HistoryLocationState {
  conversations?: readonly ArchivedConversation[];
}

export function ChatbotHistoryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as HistoryLocationState | null;
  const conversations = locationState?.conversations ?? defaultConversations;

  function openConversation(conversation: ArchivedConversation) {
    navigate("/gluh", { state: { conversation } });
  }

  return (
    <main className="chatbot-history-page">
      <div className="chatbot-history-page__sidebar">
        <AppSidebar
          label="Navegação principal"
          profile={{ name: "Talita", email: "talita@delta.com.br" }}
        />
      </div>

      <section className="chatbot-history-page__content" aria-labelledby="conversation-history-title">
        <header className="chatbot-history-page__header">
          <div className="chatbot-history-page__heading">
            <div className="chatbot-history-page__title-row">
              <button type="button" aria-label="Voltar para o Gluh" onClick={() => navigate("/gluh")}>
                <img src={backArrowIcon} alt="" />
              </button>
              <h1 id="conversation-history-title">Histórico de conversas</h1>
            </div>
            <p>Clique em uma conversa para reabri-la ou inicie uma nova sessão.</p>
          </div>

          <button
            className="chatbot-history-page__new-conversation"
            type="button"
            onClick={() => navigate("/gluh")}
          >
            <img src={newConversationIcon} alt="" />
            <span>Nova conversa</span>
          </button>
        </header>

        <ul className="chatbot-history-page__list" aria-label="Conversas anteriores">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <button type="button" onClick={() => openConversation(conversation)}>
                <span className="chatbot-history-page__icon" aria-hidden="true">
                  <img src={conversationIcon} alt="" />
                </span>
                <span className="chatbot-history-page__details">
                  <strong>{conversation.title}</strong>
                  <time>{conversation.date}</time>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

