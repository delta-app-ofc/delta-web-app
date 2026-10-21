import { FormEvent, useState } from "react";

import { AppSidebar } from "../../components/AppSidebar";
import arrowIcon from "../../assets/chatbot/arrow.png";
import sendIcon from "../../assets/chatbot/send.png";
import gluhMascot from "../../assets/mascotes/gluh-animarion.png";

import "./style.css";

interface ChatMessage {
  id: string;
  author: "user" | "assistant";
  content: string;
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
  if (question in suggestedAnswers) {
    return suggestedAnswers[question as keyof typeof suggestedAnswers];
  }

  return "Recebi sua pergunta. Quando a integração com os dados em tempo real estiver disponível, poderei responder com uma análise completa.";
}

export function ChatbotPage() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<readonly ChatMessage[]>([]);

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

  return (
    <main className="chatbot-page">
      <div className="chatbot-page__sidebar">
        <AppSidebar
          label="Navegação principal"
          profile={{ name: "Talita", email: "talita@delta.com.br" }}
        />
      </div>

      <section className="chatbot-page__content" aria-labelledby="chatbot-title">
        <header className="chatbot-header">
          <h1 id="chatbot-title">Gluh AI</h1>
        </header>

        {messages.length === 0 && (
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

        {messages.length > 0 && (
          <section className="chatbot-messages" aria-label="Conversa com o Gluh" aria-live="polite">
            {messages.map((message) => (
              <article className={`chatbot-message chatbot-message--${message.author}`} key={message.id}>
                <span>{message.author === "user" ? "Você" : "Gluh"}</span>
                <p>{message.content}</p>
              </article>
            ))}
          </section>
        )}

        <form className="chatbot-composer" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="chatbot-question">Pergunte algo ao Gluh</label>
          <input
            id="chatbot-question"
            type="text"
            placeholder="Pergunte algo ao Gluh!"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            autoComplete="off"
          />
          <button type="submit" aria-label="Enviar pergunta" disabled={!question.trim()}>
            <img src={sendIcon} alt="" />
          </button>
        </form>
      </section>
    </main>
  );
}
