import { Component, type ErrorInfo, type ReactNode } from "react";
import { AsyncFeedback } from "../AsyncFeedback";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  failed: boolean;
}

// Evita a tela em branco: qualquer erro de renderização vira uma mensagem com opção de recarregar.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Erro ao exibir a página:", error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <main>
        <AsyncFeedback status="error" message="Algo deu errado ao exibir esta página." onRetry={() => window.location.reload()} />
      </main>
    );
  }
}
