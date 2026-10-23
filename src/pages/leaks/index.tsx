import { AppSidebar } from "../../components/AppSidebar";
import attentionIcon from "../../assets/leaks/attention.png";
import exportIcon from "../../assets/leaks/export.png";
import impactIcon from "../../assets/leaks/impact.png";
import investigateIcon from "../../assets/leaks/investigate.png";
import leaksIcon from "../../assets/leaks/leaks.png";
import recommendsIcon from "../../assets/leaks/recommends.png";
import urgentIcon from "../../assets/leaks/urgent.png";

import "./style.css";

const indicators = [
  {
    id: "active",
    label: "Vazamentos ativos",
    value: "2",
    detail: "vazamentos",
    icon: leaksIcon,
  },
  {
    id: "investigating",
    label: "Investigando",
    value: "1",
    detail: "vazamento",
    icon: investigateIcon,
  },
  {
    id: "impact",
    label: "Impacto estimado (mês)",
    value: "R$ 600,00",
    icon: impactIcon,
  },
] as const;

const recommendations = [
  {
    id: "main-register",
    label: "Verificar registro geral",
    priority: "Urgente",
    type: "urgent",
    icon: urgentIcon,
  },
  {
    id: "pipes",
    label: "Inspecionar tubulações",
    priority: "Atenção",
    type: "warning",
    icon: attentionIcon,
  },
  {
    id: "disable-alerts",
    label: "Desativar alertas",
    priority: "Recomendado",
    type: "recommended",
    icon: recommendsIcon,
  },
] as const;

const flowData = [
  { id: "00h", value: 18 },
  { id: "01h", value: 27 },
  { id: "02h", value: 68 },
  { id: "03h", value: 100 },
  { id: "04h", value: 88 },
  { id: "05h", value: 26 },
] as const;

const occurrences = [
  {
    id: "leopoldina",
    installation: "Vila Leopoldina",
    location: "São Paulo - SP",
    date: "28/08",
    duration: "2h 10min",
    impact: "R$ 38,00",
    status: "Resolvido",
    statusType: "resolved",
  },
  {
    id: "romana",
    installation: "Vila Romana",
    location: "São Paulo - SP",
    date: "15/08",
    duration: "40min",
    impact: "R$ 9,00",
    status: "Resolvido",
    statusType: "resolved",
  },
  {
    id: "perdizes",
    installation: "Perdizes",
    location: "São Paulo - SP",
    date: "23/09",
    duration: "Em andamento",
    impact: "R$ 41,00/dia",
    status: "Ativo",
    statusType: "active",
  },
] as const;

export function LeaksPage() {
  return (
    <main className="leaks-page">
      <div className="leaks-page__sidebar">
        <AppSidebar
          label="Navegação principal"
          profile={{ name: "Talita", email: "talita@delta.com.br" }}
        />
      </div>

      <section className="leaks-page__content" aria-labelledby="leaks-title">
        <header className="leaks-header">
          <h1 id="leaks-title">Vazamentos</h1>
          <button className="leaks-export" type="button" onClick={() => window.print()}>
            <img src={exportIcon} alt="" />
            <span>Exportar para PDF</span>
          </button>
        </header>

        <section className="leaks-indicators" aria-label="Resumo dos vazamentos">
          {indicators.map((indicator) => (
            <article className="leaks-card leaks-indicator" key={indicator.id}>
              <div className="leaks-indicator__label">
                <img src={indicator.icon} alt="" />
                <span>{indicator.label}</span>
              </div>
              <div className="leaks-indicator__value">
                <strong>{indicator.value}</strong>
                {"detail" in indicator && <small>{indicator.detail}</small>}
              </div>
            </article>
          ))}
        </section>

        <section className="leaks-overview" aria-label="Detalhes do vazamento ativo">
          <article className="leaks-card leak-detail">
            <header className="leak-detail__header">
              <div>
                <h2>Loja Swift - Pinheiros</h2>
                <p>Identificado há 12 min · Fluxo contínuo no banheiro (Bloco A)</p>
              </div>
              <span className="leak-detail__status">Vazamento detectado</span>
            </header>

            <dl className="leak-detail__metrics">
              <div>
                <dt>Intensidade</dt>
                <dd>2,0 L/min</dd>
              </div>
              <div>
                <dt>Duração</dt>
                <dd>47 min</dd>
              </div>
              <div>
                <dt>Impacto estimado</dt>
                <dd className="leak-detail__impact">R$ 41,00/dia</dd>
              </div>
              <div>
                <dt>Confiança da detecção</dt>
                <dd>94%</dd>
              </div>
            </dl>

            <section className="leak-actions" aria-labelledby="leak-actions-title">
              <h3 id="leak-actions-title">Ações recomendadas</h3>
              <ul>
                {recommendations.map((recommendation) => (
                  <li key={recommendation.id}>
                    <span className="leak-actions__icon" aria-hidden="true">
                      <img src={recommendation.icon} alt="" />
                    </span>
                    <span className="leak-actions__label">{recommendation.label}</span>
                    <span className={`leak-actions__badge leak-actions__badge--${recommendation.type}`}>
                      {recommendation.priority}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </article>

          <article className="leaks-card leak-chart-card">
            <header>
              <div>
                <h2>Loja Swift - Vila Romana</h2>
                <p>Em investigação · vazão acima do padrão na madrugada</p>
              </div>
              <span>Possível vazamento</span>
            </header>
            <h3>Fluxo durante a madrugada</h3>

            <div
              className="leak-chart"
              role="img"
              aria-label="Fluxo durante a madrugada, entre meia-noite e cinco horas"
            >
              {flowData.map((period) => (
                <div className="leak-chart__column" key={period.id}>
                  <div className="leak-chart__track">
                    <span style={{ height: `${period.value}%` }} />
                  </div>
                  <small>{period.id}</small>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="leaks-history" aria-labelledby="leaks-history-title">
          <h2 id="leaks-history-title">Histórico de ocorrências</h2>
          <div className="leaks-card leaks-table-wrapper">
            <table className="leaks-table">
              <thead>
                <tr>
                  <th scope="col">Instalação</th>
                  <th scope="col">Data</th>
                  <th scope="col">Duração</th>
                  <th scope="col">Impacto</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {occurrences.map((occurrence) => (
                  <tr key={occurrence.id}>
                    <td>
                      <strong>{occurrence.installation}</strong>
                      <small>{occurrence.location}</small>
                    </td>
                    <td>{occurrence.date}</td>
                    <td>{occurrence.duration}</td>
                    <td>{occurrence.impact}</td>
                    <td>
                      <span className={`leaks-status leaks-status--${occurrence.statusType}`}>
                        {occurrence.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
