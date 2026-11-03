import { useState } from "react";
import type { KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import backArrow from "../../assets/installation-registration/back-arrow.svg";
import consumptionIcon from "../../assets/installation-details/consumption.svg";
import flowIcon from "../../assets/installation-details/flow.svg";
import costIcon from "../../assets/installation-details/cost.svg";
import goalIcon from "../../assets/installation-details/goal.svg";
import editIcon from "../../assets/installation-details/edit.svg";
import exportIcon from "../../assets/installation-details/export.svg";
import type { InstallationDetails } from "../../types/installationDetails";
import { pickReferenceMonth, weightedFlow } from "../../utils/indicators";
import { formatLiters } from "../../utils/installations";
import { usePdfExport } from "../../hooks/usePdfExport";
import styles from "./styles.module.css";

const tabs = ["Consumo", "Vazão", "Alertas & vazamentos", "Previsão & clima", "Histórico"] as const;
const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const month = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" });
const date = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });
const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
const flowFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const severityLabel = { high: "Crítico", medium: "Atenção", low: "Informativo" } as const;

function Indicator({ icon, title, value, caption }: { icon: string; title: string; value?: string; caption: string }) {
  return <article className={styles.indicator}>
    <h2><img src={icon} alt="" />{title}</h2>
    <p className={styles.value}>{value ?? <span aria-label="Não disponível">—</span>}</p>
    <p className={styles.caption}>{caption}</p>
  </article>;
}

export function InstallationDetailsContent({ data, onRetry }: { data: InstallationDetails; onRetry: () => void }) {
  const [active, setActive] = useState(0);
  // Mês, custo e meta vêm da view dw.vw_ft_property_monthly (último mês fechado).
  const referenceMonth = pickReferenceMonth(data.indicators.map(row => ({ referenceMonth: row.referenceMonth, isComplete: row.isCompleteMonth }))) ?? "";
  const indicator = data.indicators.find(row => row.referenceMonth === referenceMonth);
  const reading = indicator ? { totalLiters: indicator.totalLiters } : undefined;
  const cost = indicator?.totalCost ?? null;
  const flow = weightedFlow(data.hourly);
  const goalPct = indicator?.goalPct ?? null;
  const history = data.monthly.filter(row => row.referenceMonth <= referenceMonth).slice(-6);
  const maximum = Math.max(1, ...history.map(row => row.totalLiters));
  const region = [data.address?.city, data.address?.state].filter(Boolean).join(" · ");
  const { exporting, message: exportMessage, exportPdf } = usePdfExport();

  function downloadReport() {
    void exportPdf(async () => {
      const { buildInstallationDetailsPdf } = await import("../../services/installationPdf");
      const document = buildInstallationDetailsPdf(data, referenceMonth);
      await document.save(`delta-instalacao-${data.installation.id}.pdf`, { returnPromise: true });
    });
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    setActive(next);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role=tab]")[next]?.focus();
  }

  return <div className={styles.details}>
    <div className={styles.toolbar}>
      <div className={styles.heading}>
        <Link className={styles.back} to="/instalacoes" aria-label="Voltar para instalações"><img src={backArrow} alt="" /></Link>
        <div><h2>{data.installation.name || "Instalação"}</h2>{region && <p>{region}</p>}</div>
      </div>
      <div className={styles.actions}>
        <button type="button" disabled={exporting} onClick={downloadReport} aria-busy={exporting}><img src={exportIcon} alt="" />{exporting ? "Gerando PDF…" : "Exportar para PDF"}</button>
        <Link className={styles.primary} to={`/instalacoes/${data.installation.id}/editar`}><img src={editIcon} alt="" />Editar instalação</Link>
      </div>
    </div>
    {exportMessage && <p className={styles.note} role="status">{exportMessage}</p>}
    {data.warnings.length > 0 && <div className={styles.warning} role="status">
      <p>{data.warnings.join(" ")}</p><button type="button" onClick={onRetry}>Tentar novamente</button>
    </div>}
    <div className={styles.indicators}>
      <Indicator icon={consumptionIcon} title="Consumo no mês" value={reading ? formatLiters(reading.totalLiters) : undefined} caption={reading ? `Mês fechado: ${month.format(new Date(`${referenceMonth}T00:00:00Z`))}` : "Sem leituras consolidadas"} />
      <Indicator icon={flowIcon} title="Vazão média" value={flow === null ? undefined : `${flowFormat.format(flow)} L/min`} caption={flow === null ? "Sem leituras nas últimas 24 h" : "Média das últimas 24 h"} />
      <Indicator icon={costIcon} title="Custo no mês" value={cost === null ? undefined : currency.format(cost)} caption={cost === null ? "Custo ainda não disponível" : "Pela tarifa vigente de cada dia"} />
      <Indicator icon={goalIcon} title="Meta geral" value={goalPct === null ? undefined : `${Math.round(goalPct)}%`} caption={goalPct === null ? "Meta ainda não definida" : "Do consumo previsto para o mês"} />
    </div>
    <div className={styles.tabs} role="tablist" aria-label="Informações da instalação">
      {tabs.map((tab, index) => <button type="button" role="tab" key={tab} id={`detail-tab-${index}`} aria-selected={active === index} aria-controls="detail-panel" tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={event => onTabKeyDown(event, index)}>{tab}</button>)}
    </div>
    <div id="detail-panel" role="tabpanel" aria-labelledby={`detail-tab-${active}`} tabIndex={0} className={styles.panel}>
      {active === 0 && <div className={styles.consumption}>
        <section className={styles.card} aria-labelledby="history-title">
          <h3 id="history-title">Evolução histórica (m³)</h3>
          {history.length === 0 ? <p className={styles.empty}>Nenhuma leitura mensal disponível para esta instalação.</p> : <>
            <div className={styles.chart} aria-hidden="true">
              {history.map(row => <div className={styles.column} key={row.referenceMonth}>
                <span className={styles.amount}>{number.format(row.totalLiters / 1000)}</span>
                <div className={styles.track}><div className={styles.bar} style={{ height: `${row.totalLiters / maximum * 100}%` }} /></div>
                <span>{month.format(new Date(`${row.referenceMonth}T00:00:00Z`))}</span>
              </div>)}
            </div>
            <table className="sr-only"><caption>Consumo dos últimos seis meses com leituras, em metros cúbicos</caption><thead><tr><th>Mês</th><th>Consumo (m³)</th></tr></thead><tbody>{history.map(row => <tr key={row.referenceMonth}><th>{month.format(new Date(`${row.referenceMonth}T00:00:00Z`))}</th><td>{number.format(row.totalLiters / 1000)}</td></tr>)}</tbody></table>
          </>}
        </section>
        <section className={styles.card} aria-labelledby="goal-title">
          <h3 id="goal-title">Meta de consumo</h3>
          <div className={styles.goalContent}><div className={styles.ring} aria-hidden="true">{goalPct === null ? "—" : `${Math.round(goalPct)}%`}<small>Da meta</small></div>
            <div className={styles.goalDescription}>
              <p>Limite diário<strong>{indicator?.dailyLimitLiters == null ? "—" : formatLiters(indicator.dailyLimitLiters)}</strong></p>
              <p>Restante para meta<strong>{indicator?.remainingLiters == null ? "—" : formatLiters(indicator.remainingLiters)}</strong></p>
            </div>
          </div>
          <p className={styles.note}>{indicator?.monthlyTargetLiters == null ? "A meta mensal desta instalação ainda não foi definida." : `Meta mensal de ${formatLiters(indicator.monthlyTargetLiters)}.`}</p>
        </section>
      </div>}
      {active === 4 && <section className={styles.card} aria-labelledby="daily-title">
        <h3 id="daily-title">Histórico de leituras diárias</h3>
        {data.daily.length === 0 ? <p className={styles.empty}>Nenhuma leitura diária disponível para esta instalação.</p> : <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Histórico diário; role horizontalmente em telas pequenas">
          <table className={styles.table}><caption className="sr-only">Consumo e custo por dia</caption><thead><tr><th scope="col">Data</th><th scope="col">Consumo</th><th scope="col">Custo</th></tr></thead>
            <tbody>{[...data.daily].reverse().map(row => <tr key={row.fullDate}><th scope="row">{date.format(new Date(`${row.fullDate}T00:00:00Z`))}</th><td>{formatLiters(row.totalLiters)}</td><td>{row.costValue === null ? "Não disponível" : currency.format(row.costValue)}</td></tr>)}</tbody>
          </table>
        </div>}
      </section>}
      {active === 1 && <section className={styles.card} aria-labelledby="flow-title">
        <h3 id="flow-title">Vazão nas últimas 24 horas</h3>
        {data.hourly.length === 0 ? <p className={styles.empty}>Nenhuma leitura de vazão consolidada para esta instalação.</p> : <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Vazão por hora; role horizontalmente em telas pequenas">
          <table className={styles.table}><caption className="sr-only">Consumo e vazão média por hora</caption><thead><tr><th scope="col">Hora</th><th scope="col">Consumo</th><th scope="col">Vazão média</th></tr></thead>
            <tbody>{[...data.hourly].reverse().map(row => <tr key={row.readingHour}><th scope="row">{dateTime.format(new Date(row.readingHour))}</th><td>{formatLiters(row.totalLiters)}</td><td>{row.avgFlowLmin === null ? "Não disponível" : `${flowFormat.format(row.avgFlowLmin)} L/min`}</td></tr>)}</tbody>
          </table>
        </div>}
      </section>}
      {active === 2 && <section className={styles.card} aria-labelledby="alerts-title">
        <h3 id="alerts-title">Alertas e vazamentos</h3>
        {data.alerts.length === 0 ? <p className={styles.empty}>Nenhum alerta registrado para esta instalação.</p> : <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Alertas; role horizontalmente em telas pequenas">
          <table className={styles.table}><caption className="sr-only">Alertas e vazamentos da instalação</caption><thead><tr><th scope="col">Ocorrência</th><th scope="col">Data</th><th scope="col">Severidade</th><th scope="col">Situação</th></tr></thead>
            <tbody>{data.alerts.map(alert => <tr key={alert.id}><th scope="row">{alert.title}</th><td>{dateTime.format(new Date(alert.triggeredAt))}</td><td>{severityLabel[alert.severity]}</td><td>{alert.resolvedAt ? "Resolvido" : "Ativo"}</td></tr>)}</tbody>
          </table>
        </div>}
      </section>}
      {active === 3 && <section className={styles.card}>
        <h3>{tabs[active]}</h3><p className={styles.empty}>A previsão de consumo e os dados de clima ainda não estão disponíveis para esta instalação.</p>
      </section>}
    </div>
  </div>;
}
