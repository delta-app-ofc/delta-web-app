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
import { formatLiters, getCurrentReferenceMonth } from "../../utils/installations";
import { usePdfExport } from "../../hooks/usePdfExport";
import styles from "./styles.module.css";

const tabs = ["Consumo", "Vazão", "Alertas & vazamentos", "Previsão & clima", "Histórico"] as const;
const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const month = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" });
const date = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

function Indicator({ icon, title, value, caption }: { icon: string; title: string; value?: string; caption: string }) {
  return <article className={styles.indicator}>
    <h2><img src={icon} alt="" />{title}</h2>
    <p className={styles.value}>{value ?? <span aria-label="Não disponível">—</span>}</p>
    <p className={styles.caption}>{caption}</p>
  </article>;
}

export function InstallationDetailsContent({ data, onRetry }: { data: InstallationDetails; onRetry: () => void }) {
  const [active, setActive] = useState(0);
  const referenceMonth = getCurrentReferenceMonth();
  const reading = data.monthly.find(row => row.referenceMonth === referenceMonth);
  const currentDays = data.daily.filter(row => row.fullDate.slice(0, 7) === referenceMonth.slice(0, 7));
  const cost = currentDays.length > 0 && currentDays.every(row => row.costValue !== null)
    ? currentDays.reduce((sum, row) => sum + (row.costValue ?? 0), 0) : null;
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
      <Indicator icon={consumptionIcon} title="Consumo no mês" value={reading ? formatLiters(reading.totalLiters) : undefined} caption={reading ? "Acumulado do mês atual" : "Sem leituras no mês atual"} />
      <Indicator icon={flowIcon} title="Vazão média" caption="Vazão ainda não disponível" />
      <Indicator icon={costIcon} title="Custo no mês" value={cost === null ? undefined : currency.format(cost)} caption={cost === null ? "Custo ainda não disponível" : "Acumulado das leituras disponíveis"} />
      <Indicator icon={goalIcon} title="Meta geral" caption="Meta ainda não disponível" />
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
          <div className={styles.goalContent}><div className={styles.ring} aria-hidden="true">—<small>Da meta</small></div>
            <div className={styles.goalDescription}><p>Limite diário<strong>—</strong></p><p>Restante para meta<strong>—</strong></p></div>
          </div>
          <p className={styles.note}>A meta de consumo ainda não está disponível.</p>
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
      {active > 0 && active < 4 && <section className={styles.card}>
        <h3>{tabs[active]}</h3><p className={styles.empty}>{active === 1 ? "As medições de vazão ainda não estão disponíveis para esta instalação." : active === 2 ? "Os dados de alertas e vazamentos ainda não estão disponíveis para esta instalação." : "A previsão de consumo e os dados de clima ainda não estão disponíveis para esta instalação."}</p>
      </section>}
    </div>
  </div>;
}
