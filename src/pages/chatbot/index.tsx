import { FormEvent, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { AppSidebar } from "../../components/AppSidebar";
import { getAiSessionMessages, sendAiMessage, getAiSuggestions } from "../../services/ai";
import { ApiError } from "../../services/http";
import arrowIcon from "../../assets/chatbot/arrow.png";
import historicalIcon from "../../assets/chatbot/historical.png";
import newConversationIcon from "../../assets/chatbot/new-conversation.png";
import sendIcon from "../../assets/chatbot/send.png";
import gluhMascot from "../../assets/mascotes/gluh-animarion.png";
import {
  type ArchivedConversation,
  type ChatMessage,
} from "./conversations";

import "./style.css";

interface ChatbotLocationState {
  conversation?: ArchivedConversation;
}

export function ChatbotPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as ChatbotLocationState | null;
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<readonly ChatMessage[]>(
    () => locationState?.conversation?.messages ?? [],
  );
  const [sessionId, setSessionId] = useState<string | null>(() => locationState?.conversation?.id ?? null);
  const [suggestions, setSuggestions] = useState<readonly string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    void getAiSuggestions(controller.signal).then(setSuggestions).catch((failure: unknown) => {
      if (!controller.signal.aborted) setError(failure instanceof ApiError ? failure.message : "Não foi possível carregar as sugestões.");
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!sessionId || messages.length > 0) return;
    const controller = new AbortController();
    void getAiSessionMessages(sessionId, controller.signal).then((history) => {
      if (!controller.signal.aborted) {
        setMessages(history.map((message, index) => ({
          id: `${message.role}-${index}`,
          author: message.role === "user" ? "user" : "assistant",
          content: message.content,
        })));
      }
    }).catch((failure: unknown) => {
      if (!controller.signal.aborted) setError(failure instanceof ApiError ? failure.message : "Não foi possível carregar a conversa.");
    });
    return () => controller.abort();
  }, [messages.length, sessionId]);

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [messages.length]);

  async function sendMessage(content: string) {
    const normalizedContent = content.trim();

    if (!normalizedContent || isSending) {
      return;
    }
    setQuestion("");
    setError(null);
    setIsSending(true);
    const controller = new AbortController();
    const messageIndex = messages.length;
    setMessages((currentMessages) => [...currentMessages, { id: `user-${messageIndex}`, author: "user", content: normalizedContent }]);
    try {
      const result = await sendAiMessage(normalizedContent, sessionId, controller.signal);
      setSessionId(result.sessionId);
      setMessages((currentMessages) => [...currentMessages, { id: `assistant-${messageIndex + 1}`, author: "assistant", content: result.response }]);
      if (result.suggestions.length > 0) setSuggestions(result.suggestions);
    } catch (failure: unknown) {
      setError(failure instanceof ApiError ? failure.message : "Não foi possível enviar a pergunta.");
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(question);
  }

  function startNewConversation() {
    setMessages([]);
    setSessionId(null);
    setQuestion("");
  }

  const hasConversation = messages.length > 0;

  return (
    <main className="chatbot-page">
      <div className="chatbot-page__sidebar">
        <AppSidebar label="Navegação principal" />
      </div>

      <section
        id="page-content"
        tabIndex={-1}
        className={`chatbot-page__content ${hasConversation ? "chatbot-page__content--conversation" : ""}`}
        aria-labelledby="chatbot-title"
      >
        <header className="chatbot-header">
          <h1 id="chatbot-title">Gluh AI</h1>

          <div className="chatbot-header__actions">
            <button
              className="chatbot-history-button"
              type="button"
              onClick={() => navigate("/gluh/historico")}
            >
              <img src={historicalIcon} alt="" />
              <span>Histórico de conversas</span>
            </button>
            <button className="chatbot-new-button" type="button" onClick={startNewConversation}>
              <img src={newConversationIcon} alt="" />
              <span>Nova conversa</span>
            </button>
          </div>
        </header>

        {!hasConversation && (
          <>
            <section className="chatbot-welcome" aria-labelledby="chatbot-greeting">
              <img src={gluhMascot} alt="Gluh, assistente virtual da Delta" />
              <h2 id="chatbot-greeting">Oie, eu sou o <strong>Gluh!</strong></h2>
              <p>Seu assistente inteligente para gestão de consumo de água. Pergunte sobre unidades, metas, economia ou vazamentos.</p>
            </section>

            <section className="chatbot-suggestions" aria-labelledby="chatbot-suggestions-title">
              <h2 id="chatbot-suggestions-title">Comece com uma pergunta!</h2>
              <div className="chatbot-suggestions__grid">
                {suggestions.map((suggestion) => (
                  <button type="button" key={suggestion} onClick={() => sendMessage(suggestion)}>
                    <span>{suggestion}</span>
                    <img src={arrowIcon} alt="" />
                  </button>
                ))}
              </div>
            </section>
          </>
        )}

        {error && <p className="chatbot-error" role="alert">{error}</p>}

        {hasConversation && (
          <section className="chatbot-messages" aria-label="Conversa com o Gluh" aria-live="polite">
            {messages.map((message) => (
              <article className={`chatbot-message chatbot-message--${message.author}`} key={message.id}>
                <span>{message.author === "user" ? "Você" : "Gluh"}</span>
                <p>{message.content}</p>
              </article>
            ))}
            <div ref={messagesEndRef} className="chatbot-messages__end" aria-hidden="true" />
          </section>
        )}

        <div className="chatbot-composer-dock">
          <div className="chatbot-composer-dock__inner">
            <form className="chatbot-composer" onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor="chatbot-question">Pergunte algo ao Gluh</label>
              <input
                id="chatbot-question"
                type="text"
                placeholder="Pergunte algo ao Gluh!"
                value={question}
                maxLength={1000}
                onChange={(event) => setQuestion(event.target.value)}
                autoComplete="off"
              />
              <button type="submit" aria-label="Enviar pergunta" disabled={!question.trim() || isSending}>
                <img src={sendIcon} alt="" />
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
