import { Link } from "react-router-dom";
import { useRanking } from "../../hooks/useRanking";
import { getCurrentPeriod } from "../../utils/installations";
import { AsyncFeedback } from "../AsyncFeedback";

const PREVIEW_SIZE = 5;
const formatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

export function DashboardRankingCard() {
  const { state, retry } = useRanking(getCurrentPeriod());

  return (
    <article className="dashboard-card ranking-card">
      <header className="dashboard-card__header">
        <h2>Ranking rápido</h2>
        <Link className="dashboard-card__link" to="/ranking">Ver tudo</Link>
      </header>
      {state.status === "loading" && <AsyncFeedback status="loading" message="Carregando ranking…" />}
      {state.status === "error" && <AsyncFeedback status="error" message={state.error} onRetry={retry} />}
      {state.status === "unavailable" && <p className="dashboard-unavailable">{state.message}</p>}
      {state.status === "success" && state.data.items.length === 0 && <p className="dashboard-unavailable">Sem dados de ranking neste mês.</p>}
      {state.status === "success" && state.data.items.length > 0 && (
        <ol className="ranking-card__list">
          {state.data.items.slice(0, PREVIEW_SIZE).map((item) => (
            <li key={item.id}>
              <span className="ranking-card__icon">{item.position}º</span>
              <div className="ranking-card__details">
                <strong>{item.name}</strong>
              </div>
              <span className="ranking-card__value">{item.value === null ? "Não disponível" : `${formatter.format(item.value)} L/m²`}</span>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}
