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
import { LEAK_ALERT_TYPE } from "../../types/alerts";
import { WeatherIcon } from "../WeatherIcon";
import { useInstallationWeather } from "../../hooks/useInstallationWeather";
import { pickReferenceMonth, weightedFlow } from "../../utils/indicators";
import { formatInstallationLabel, formatLiters } from "../../utils/installations";
import { usePdfExport } from "../../hooks/usePdfExport";
import styles from "./styles.module.css";

const tabs = ["Consumo", "Vazão", "Alertas & vazamentos", "Previsão & clima", "Histórico"] as const;
const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const month = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" });
const date = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });
const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
const forecastDate = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short", timeZone: "UTC" });
const flowFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const severityLabel = { high: "Crítico", medium: "Atenção", low: "Informativo" } as const;

function formatLeakDuration(minutes: number): string {
  const rounded = Math.max(0, Math.round(minutes));
  return rounded >= 60 ? `${Math.floor(rounded / 60)}h ${rounded % 60}min` : `${rounded} min`;
}

function areConsecutiveMonths(previousMonth: string, currentMonth: string): boolean {
  const previous = new Date(`${currentMonth}T00:00:00Z`);
  previous.setUTCMonth(previous.getUTCMonth() - 1);
  return previous.toISOString().slice(0, 10) === previousMonth;
}

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
  // data.monthly vem de /delta/analytics/monthly-variation/{id}, alimentada por dw.vw_ft_monthly_variation.
  const history = data.monthly.filter(row => row.referenceMonth <= referenceMonth);
  const latestMonth = history[history.length - 1];
  const previousMonth = history[history.length - 2];
  const reading = indicator ? { totalLiters: indicator.totalLiters } : undefined;
  const cost = indicator?.totalCost ?? null;
  const flow = weightedFlow(data.hourly);
  const goalPct = indicator?.goalPct ?? null;
  const projectedLitersValue = latestMonth && previousMonth && areConsecutiveMonths(previousMonth.referenceMonth, latestMonth.referenceMonth) &&
    Number.isFinite(latestMonth.totalLiters) && Number.isFinite(previousMonth.totalLiters)
    ? Math.max(latestMonth.totalLiters * 2 - previousMonth.totalLiters, 0)
    : null;
  const projectedLiters = projectedLitersValue !== null && Number.isFinite(projectedLitersValue)
    ? projectedLitersValue
    : null;
  const projectedCostValue = projectedLiters !== null && latestMonth && indicator && indicator.referenceMonth === latestMonth.referenceMonth &&
    latestMonth.totalLiters > 0 && indicator.totalCost !== null && Number.isFinite(indicator.totalCost)
    ? projectedLiters * indicator.totalCost / latestMonth.totalLiters
    : null;
  const projectedCost = projectedCostValue !== null && Number.isFinite(projectedCostValue) ? projectedCostValue : null;
  const weather = useInstallationWeather(active === 3 ? data.address : null);
  const leakAlertIds = new Set(data.leaks.map(leak => String(leak.alertKey)));
  const installationAlerts = data.alerts.filter(alert => !(alert.alertType === LEAK_ALERT_TYPE && leakAlertIds.has(alert.id)));
  const maximum = Math.max(1, ...history.map(row => row.totalLiters));
  const region = [formatInstallationLabel(data.address?.city ?? null), data.address?.state?.toLocaleUpperCase("pt-BR")].filter(Boolean).join(" · ");
  const installationName = formatInstallationLabel(data.installation.name) ?? "Instalação";
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
        <div><h2>{installationName}</h2>{region && <p>{region}</p>}</div>
      </div>
      <div className={styles.actions}>
        <button className="export-pdf-button" type="button" disabled={exporting} onClick={downloadReport} aria-busy={exporting}><img src={exportIcon} alt="" />{exporting ? "Gerando PDF…" : "Exportar para PDF"}</button>
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
            <div className={styles.chartScroll} tabIndex={0} role="region" aria-label="Histórico mensal de consumo; role horizontalmente para consultar os meses">
              <div className={styles.chart} aria-hidden="true">
                {history.map(row => <div className={styles.column} key={row.referenceMonth}>
                  <span className={styles.amount}>{number.format(row.totalLiters / 1000)}</span>
                  <div className={styles.track}><div className={styles.bar} style={{ height: `${row.totalLiters / maximum * 100}%` }} /></div>
                  <span>{month.format(new Date(`${row.referenceMonth}T00:00:00Z`))}</span>
                </div>)}
              </div>
            </div>
            <table className="sr-only"><caption>Histórico mensal de consumo disponível, em metros cúbicos</caption><thead><tr><th>Mês</th><th>Consumo (m³)</th></tr></thead><tbody>{history.map(row => <tr key={row.referenceMonth}><th>{month.format(new Date(`${row.referenceMonth}T00:00:00Z`))}</th><td>{number.format(row.totalLiters / 1000)}</td></tr>)}</tbody></table>
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
        {installationAlerts.length === 0 && data.leaks.length === 0 ? <p className={styles.empty}>Nenhum alerta ou vazamento registrado para esta instalação.</p> : <div className={styles.occurrenceGroups}>
          <section className={styles.occurrenceGroup} aria-labelledby="installation-alert-list-title">
            <h4 id="installation-alert-list-title">Alertas</h4>
            {installationAlerts.length === 0 ? <p className={styles.occurrenceEmpty}>Nenhum alerta registrado.</p> : <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Alertas; role horizontalmente em telas pequenas">
              <table className={styles.table}><caption className="sr-only">Alertas desta instalação</caption><thead><tr><th scope="col">Ocorrência</th><th scope="col">Data</th><th scope="col">Severidade</th><th scope="col">Situação</th></tr></thead>
                <tbody>{installationAlerts.map(alert => <tr key={alert.id}><th scope="row">{alert.title}</th><td>{dateTime.format(new Date(alert.triggeredAt))}</td><td>{severityLabel[alert.severity]}</td><td>{alert.resolvedAt ? "Resolvido" : "Ativo"}</td></tr>)}</tbody>
              </table>
            </div>}
          </section>
          <section className={styles.occurrenceGroup} aria-labelledby="installation-leak-list-title">
            <h4 id="installation-leak-list-title">Vazamentos</h4>
            {data.leaks.length === 0 ? <p className={styles.occurrenceEmpty}>Nenhum vazamento registrado.</p> : <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Vazamentos; role horizontalmente em telas pequenas">
              <table className={styles.table}><caption className="sr-only">Vazamentos desta instalação</caption><thead><tr><th scope="col">Identificado em</th><th scope="col">Duração</th><th scope="col">Perda estimada</th><th scope="col">Impacto estimado</th><th scope="col">Situação</th></tr></thead>
                <tbody>{data.leaks.map(leak => <tr key={leak.alertKey}><th scope="row">{dateTime.format(new Date(leak.triggeredAt))}</th><td>{formatLeakDuration(leak.durationMinutes)}</td><td>{number.format(leak.estimatedLossLiters)} L</td><td>{currency.format(leak.estimatedLossCost)}</td><td>{leak.isActive ? "Ativo" : "Resolvido"}</td></tr>)}</tbody>
              </table>
            </div>}
          </section>
        </div>}
      </section>}
      {active === 3 && <div className={styles.forecastGrid}>
        <section className={`${styles.card} ${styles.forecastCard}`} aria-labelledby="consumption-forecast-title">
          <h3 id="consumption-forecast-title">Projeção de consumo</h3>
          <p className={styles.forecastSubtitle}>Estimativa para o próximo mês, com base nos meses consolidados.</p>
          <div className={styles.forecastMetrics}>
            <div><span>Consumo estimado</span><strong>{projectedLiters === null ? "—" : formatLiters(projectedLiters)}</strong></div>
            <div><span>Custo estimado</span><strong>{projectedCost === null ? "—" : currency.format(projectedCost)}</strong></div>
          </div>
          <p className={styles.forecastNote}>
            {projectedLiters === null
              ? "A projeção aparece após haver dados de um mês fechado e do mês anterior."
              : "Estimativa linear; o consumo real pode variar."}
          </p>
        </section>

        <section className={`${styles.card} ${styles.weatherCard}`} aria-labelledby="local-weather-title" aria-live="polite">
          <h3 id="local-weather-title">Clima da instalação</h3>
          {weather.state.status === "loading" && <p className={styles.forecastStatus} role="status">Consultando as condições do tempo…</p>}
          {weather.state.status === "unavailable" && <div className={styles.forecastStatus} role="status"><p>{weather.state.message}</p><button className={styles.weatherRetry} type="button" onClick={weather.retry}>Tentar novamente</button></div>}
          {weather.state.status === "success" && <>
            <div className={styles.currentWeather}>
              <WeatherIcon code={weather.state.data.weatherCode} />
              <strong>{number.format(weather.state.data.temperatureC)} °C</strong>
              <span>{weather.state.data.condition} · {formatInstallationLabel(weather.state.data.city) ?? weather.state.data.city}</span>
            </div>
            <div className={styles.weatherForecast}>
              {weather.state.data.forecast.map((day) => <article key={day.date}>
                <h4>{forecastDate.format(new Date(`${day.date}T12:00:00Z`))}</h4>
                <WeatherIcon code={day.weatherCode} />
                <span>{day.condition}</span>
                <strong>{day.highC === null ? "—" : `${number.format(day.highC)}°`} / {day.lowC === null ? "—" : `${number.format(day.lowC)}°`}</strong>
                <small>Chuva: {day.precipitationMm === null ? "—" : `${number.format(day.precipitationMm)} mm`}</small>
              </article>)}
            </div>
          </>}
        </section>
      </div>}
    </div>
  </div>;
}
