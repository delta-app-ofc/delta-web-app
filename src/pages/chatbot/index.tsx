import { FormEvent, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { AppSidebar } from "../../components/AppSidebar";
import arrowIcon from "../../assets/chatbot/arrow.png";
import historicalIcon from "../../assets/chatbot/historical.png";
import newConversationIcon from "../../assets/chatbot/new-conversation.png";
import sendIcon from "../../assets/chatbot/send.png";
import gluhMascot from "../../assets/mascotes/gluh-animarion.png";
import {
  defaultConversations,
  type ArchivedConversation,
  type ChatMessage,
} from "./conversations";

import "./style.css";

interface ChatbotLocationState {
  conversation?: ArchivedConversation;
}

const suggestions = [
  "Onde investir para economizar mais?",
  "Tem algum vazamento crítico no momento?",
  "Qual foi o maior consumo entre as unidades?",
  "Iremos ultrapassar a meta?",
] as const;

const suggestedAnswers: Record<(typeof suggestions)[number], string> = {
  "Onde investir para economizar mais?":
    "A unidade de Pinheiros deve ser priorizada: ela apresenta o maior consumo e também possui um vazamento ativo.",
  "Tem algum vazamento crítico no momento?":
    "Sim. Existem dois vazamentos ativos, e o caso de Pinheiros requer atenção imediata.",
  "Qual foi o maior consumo entre as unidades?":
    "A Loja Swift de Pinheiros registrou o maior consumo mensal, com 12.300 litros.",
  "Iremos ultrapassar a meta?":
    "A unidade Vila Leopoldina está acima da referência, com 112% da meta de consumo.",
};

function getAnswer(question: string) {
  const normalizedQuestion = question.toLocaleLowerCase("pt-BR");

  if (normalizedQuestion.includes("unidades") && normalizedQuestion.includes("crític")) {
    return "Encontrei 2 unidades em estado crítico:\n• Loja Swift - Pinheiros — 112% da meta, consumo de 12.300 L\n• Centro de Distribuição - Campinas — 118% da meta, consumo de 15.680 L\nRecomendo priorizar a inspeção dessas unidades esta semana.";
  }

  if (question in suggestedAnswers) {
    return suggestedAnswers[question as keyof typeof suggestedAnswers];
  }

  return "Recebi sua pergunta. Quando a integração com os dados em tempo real estiver disponível, poderei responder com uma análise completa.";
}

export function ChatbotPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as ChatbotLocationState | null;
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<readonly ChatMessage[]>(
    () => locationState?.conversation?.messages ?? [],
  );
  const [conversationHistory, setConversationHistory] = useState<readonly ArchivedConversation[]>(
    defaultConversations,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  function sendMessage(content: string) {
    const normalizedContent = content.trim();

    if (!normalizedContent) {
      return;
    }

    setMessages((currentMessages) => {
      const messageIndex = currentMessages.length;

      return [
        ...currentMessages,
        {
          id: `user-${messageIndex}`,
          author: "user",
          content: normalizedContent,
        },
        {
          id: `assistant-${messageIndex + 1}`,
          author: "assistant",
          content: getAnswer(normalizedContent),
        },
      ];
    });
    setQuestion("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(question);
  }

  function startNewConversation() {
    if (messages.length > 0) {
      const firstUserMessage = messages.find((message) => message.author === "user");

      setConversationHistory((currentHistory) => [
        {
          id: `conversation-${currentHistory.length}`,
          title: firstUserMessage?.content ?? "Conversa com o Gluh",
          date: new Date().toLocaleDateString("pt-BR"),
          messages,
        },
        ...currentHistory,
      ]);
    }

    setMessages([]);
    setQuestion("");
  }

  const hasConversation = messages.length > 0;

  return (
    <main className="chatbot-page">
      <div className="chatbot-page__sidebar">
        <AppSidebar
          label="Navegação principal"
          profile={{ name: "Talita", email: "talita@delta.com.br" }}
        />
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
              onClick={() => navigate("/gluh/historico", { state: { conversations: conversationHistory } })}
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
              <button type="submit" aria-label="Enviar pergunta" disabled={!question.trim()}>
                <img src={sendIcon} alt="" />
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
