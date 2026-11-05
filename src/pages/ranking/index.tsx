import { AppSidebar } from "../../components/AppSidebar";
import exportIcon from "../../assets/monitoring/export.png";
import trophyMascot from "../../assets/mascotes/gluh-trophy.png";
import { useRanking } from "../../hooks/useRanking";
import type { RankingItem } from "../../types/ranking";
import { AsyncFeedback } from "../../components/AsyncFeedback";

import "./style.css";

const period = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

function formatPeriod(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(`${value}-01T12:00:00`));
}

function formatNumber(value: number | null, suffix = ""): string {
  return value === null ? "Não informado" : `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value)}${suffix}`;
}

function formatVariation(value: number | null): string {
  if (value === null) return "Variação não informada";
  return `${value < 0 ? "↓" : "↑"} ${Math.abs(value).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% no mês`;
}

type RankingStatus = "positive" | "warning" | "critical";

function itemStatus(item: RankingItem, totalItems: number): RankingStatus {
  if (item.variationPercent === null) {
    const relativePosition = item.position / Math.max(totalItems, 1);
    if (relativePosition <= 1 / 3) return "positive";
    if (relativePosition <= 2 / 3) return "warning";
    return "critical";
  }
  if (item.variationPercent <= 0) return "positive";
  if (item.variationPercent < 10) return "warning";
  return "critical";
}

function formatStatus(item: RankingItem, status: RankingStatus): string {
  if (item.variationPercent !== null) return formatVariation(item.variationPercent);
  if (status === "positive") return "Entre as mais eficientes";
  if (status === "warning") return "Eficiência intermediária";
  return "Entre as menos eficientes";
}

function displayValue(item: RankingItem): string {
  return formatNumber(item.value, " L/m²");
}

export function RankingPage() {
  const { state, retry } = useRanking(period);
  const items = state.status === "success" ? state.data.items : [];
  const maxValue = Math.max(...items.flatMap((item) => item.value === null ? [] : [item.value]), 0);
  const winner = items[0];

  return (
    <main className="ranking-page">
      <div className="ranking-page__sidebar">
        <AppSidebar label="Navegação principal" />
      </div>

      <section id="page-content" tabIndex={-1} className="ranking-page__content" aria-labelledby="ranking-title">
        <header className="ranking-header">
          <h1 id="ranking-title">Ranking</h1>
        </header>

        <div className="ranking-toolbar">
          <p>{formatPeriod(period)}</p>
          <button className="ranking-export export-pdf-button" type="button" onClick={() => window.print()}>
            <img src={exportIcon} alt="" />
            <span>Exportar para PDF</span>
          </button>
        </div>

        {state.status === "loading" && <AsyncFeedback status="loading" message="Carregando dados do ranking…" />}
        {state.status === "error" && <div className="ranking-state"><p>{state.error}</p><button type="button" onClick={retry}>Tentar novamente</button></div>}
        {state.status === "unavailable" && <p className="ranking-state">{state.message}</p>}

        {state.status === "success" && items.length === 0 && (
          <p className="ranking-state">Ainda não há dados de ranking para este período.</p>
        )}

        {state.status === "success" && items.length > 0 && (
          <>
            <section className="ranking-overview" aria-label="Resumo do ranking">
              <article className="ranking-page-card ranking-winner">
                <img className="ranking-winner__mascot" src={trophyMascot} alt="Gluh segurando um troféu" />
                <small>Mais eficiente!</small>
                <h2>{winner?.name}</h2>
                <p>{winner ? displayValue(winner) : "Não informado"}</p>

                <div className="ranking-winner__metrics">
                  <div>
                    <small>Consumo total</small>
                    <strong>{formatNumber(winner?.consumptionLiters ?? null, " L")}</strong>
                  </div>
                  <div>
                    <small>Área considerada</small>
                    <strong>{formatNumber(winner?.areaM2 ?? null, " m²")}</strong>
                  </div>
                </div>
              </article>

              <article className="ranking-page-card ranking-comparison">
                <h2>Evolução comparada (L/m²)</h2>
                <div className="ranking-comparison__chart" role="img" aria-label="Comparação entre as instalações">
                  {items.slice(0, 5).map((item) => (
                    <div className="ranking-comparison__column" key={item.id}>
                      <div className="ranking-comparison__track">
                        <span style={{ height: `${maxValue && item.value !== null ? item.value / maxValue * 100 : 0}%` }} />
                      </div>
                      <small>{item.name}</small>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="ranking-classification" aria-labelledby="ranking-classification-title">
              <h2 id="ranking-classification-title">Classificação completa</h2>

              <ol className="ranking-page-card ranking-list">
                {items.map((item) => {
                  const status = itemStatus(item, items.length);
                  return (
                    <li key={item.id}>
                      <span className="ranking-position">{item.position}º</span>

                      <div className="ranking-list__main">
                        <strong>{item.name}</strong>
                        <div className="ranking-progress" aria-hidden="true">
                          <span className={`ranking-progress__value ranking-progress__value--${status}`} style={{ width: `${maxValue && item.value !== null ? item.value / maxValue * 100 : 0}%` }} />
                        </div>
                      </div>

                      <div className="ranking-list__result">
                        <strong>{displayValue(item)}</strong>
                        <small className={`ranking-list__variation ranking-list__variation--${status}`}>
                          {formatStatus(item, status)}
                        </small>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          </>
        )}
      </section>
    </main>
  );
}

