import { AppSidebar } from "../../components/AppSidebar";
import exportIcon from "../../assets/monitoring/export.png";
import trophyMascot from "../../assets/mascotes/gluh-trophy.png";

import "./style.css";

const comparisonData = [
  { id: "leopoldina", label: "Vila Leop.", value: 58 },
  { id: "moema", label: "Moema", value: 50 },
  { id: "perdizes", label: "Perdizes", value: 67 },
  { id: "vila-romana", label: "Vila Rom.", value: 100 },
  { id: "pinheiros", label: "Pinheiros", value: 86 },
] as const;

const rankingData = [
  {
    id: "leopoldina",
    position: "1º",
    name: "Loja swift - Vila Leopoldina",
    consumption: "4.680 L/m²",
    variation: "↓ 12% no mês",
    progress: 70,
    status: "positive",
  },
  {
    id: "moema",
    position: "2º",
    name: "Loja swift - Moema",
    consumption: "3.920 L/m²",
    variation: "↓ 8% no mês",
    progress: 77,
    status: "positive",
  },
  {
    id: "perdizes",
    position: "3º",
    name: "Loja swift - Perdizes",
    consumption: "6.150 L/m²",
    variation: "↑ 4% no mês",
    progress: 84,
    status: "warning",
  },
  {
    id: "vila-romana",
    position: "4º",
    name: "Loja swift - Vila Romana",
    consumption: "8.420 L/m²",
    variation: "↑ 16% no mês",
    progress: 84,
    status: "critical",
  },
  {
    id: "pinheiros",
    position: "5º",
    name: "Loja swift - Pinheiros",
    consumption: "12.300 L/m²",
    variation: "↑ 31% no mês",
    progress: 100,
    status: "critical",
  },
] as const;

export function RankingPage() {
  return (
    <main className="ranking-page">
      <div className="ranking-page__sidebar">
        <AppSidebar
          label="Navegação principal"
          profile={{ name: "Talita", email: "talita@delta.com.br" }}
        />
      </div>

      <section className="ranking-page__content" aria-labelledby="ranking-title">
        <header className="ranking-header">
          <h1 id="ranking-title">Ranking</h1>
        </header>

        <div className="ranking-toolbar">
          <p>Setembro 2026</p>
          <button className="ranking-export" type="button" onClick={() => window.print()}>
            <img src={exportIcon} alt="" />
            <span>Exportar para PDF</span>
          </button>
        </div>

        <section className="ranking-overview" aria-label="Resumo do ranking">
          <article className="ranking-page-card ranking-winner">
            <img className="ranking-winner__mascot" src={trophyMascot} alt="Gluh segurando um troféu" />
            <small>Mais eficiente!</small>
            <h2>Loja swift - Vila Leopoldina</h2>
            <p>150 L/dia por limpeza</p>

            <div className="ranking-winner__metrics">
              <div>
                <small>Consumo total</small>
                <strong>4.600 L</strong>
              </div>
              <div>
                <small>Economia</small>
                <strong>R$ 142,90</strong>
              </div>
            </div>
          </article>

          <article className="ranking-page-card ranking-comparison">
            <h2>Evolução comparada (m³)</h2>
            <div className="ranking-comparison__chart" aria-label="Comparação entre as cinco instalações">
              {comparisonData.map((installation) => (
                <div className="ranking-comparison__column" key={installation.id}>
                  <div className="ranking-comparison__track">
                    <span style={{ height: `${installation.value}%` }} />
                  </div>
                  <small>{installation.label}</small>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="ranking-classification" aria-labelledby="ranking-classification-title">
          <h2 id="ranking-classification-title">Classificação completa</h2>

          <ol className="ranking-page-card ranking-list">
            {rankingData.map((installation) => (
              <li key={installation.id}>
                <span className="ranking-position">{installation.position}</span>

                <div className="ranking-list__main">
                  <strong>{installation.name}</strong>
                  <div className="ranking-progress" aria-hidden="true">
                    <span
                      className={`ranking-progress__value ranking-progress__value--${installation.status}`}
                      style={{ width: `${installation.progress}%` }}
                    />
                  </div>
                </div>

                <div className="ranking-list__result">
                  <strong>{installation.consumption}</strong>
                  <small className={`ranking-list__variation ranking-list__variation--${installation.status}`}>
                    {installation.variation}
                  </small>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </section>
    </main>
  );
}
