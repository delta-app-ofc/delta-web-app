import { useEffect, useRef, useState } from "react";
import { AppSidebar } from "../../components/AppSidebar";
import attentionIcon from "../../assets/alerts/attention.png";
import criticalIcon from "../../assets/alerts/critical.png";
import informationIcon from "../../assets/alerts/information.png";
import { listAlerts, leakSummary, dismissAlert, type AlertPage, type LeakSummary, type Severity } from "../../services/alerts";
import "./style.css";
import { VisitForm } from "./VisitForm";
import { EvidenceChart } from "./EvidenceChart";

const filters: {id: Severity | null; label: string}[] = [{id:null,label:"Todos"},{id:"high",label:"Crítico"},{id:"medium",label:"Atenção"},{id:"low",label:"Informativo"}];
const content = {high:{icon:criticalIcon,label:"Crítico",css:"critical"},medium:{icon:attentionIcon,label:"Atenção",css:"warning"},low:{icon:informationIcon,label:"Informativo",css:"information"}};
export function AlertsPage() {
  const [severity,setSeverity] = useState<Severity|null>(null);
  const [page,setPage] = useState(0);
  const [data,setData] = useState<AlertPage>({content:[],totalElements:0,totalPages:0});
  const [summary,setSummary] = useState<LeakSummary|null>(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState<string|null>(null);
  const [busy,setBusy] = useState<string|null>(null);
  const [refresh,setRefresh] = useState(0);
  const writes = useRef(new Set<AbortController>());
  useEffect(() => { const pending = writes.current; return () => { pending.forEach(c=>c.abort()); }; },[]);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(null);
    Promise.all([listAlerts(severity,page,controller.signal),leakSummary(controller.signal)])
      .then(([list,total])=>{ if (!controller.signal.aborted) { setData(list);setSummary(total); } })
      .catch(()=>{ if (!controller.signal.aborted) setError("Não foi possível carregar os alertas. Tente novamente."); })
      .finally(()=>{ if (!controller.signal.aborted) setLoading(false); });
    return ()=>controller.abort();
  },[severity,page,refresh]);
  async function dismiss(id:string) {
    const controller = new AbortController(); writes.current.add(controller);setBusy(id);setError(null);
    try { await dismissAlert(id,controller.signal); if (!controller.signal.aborted) {
      if (data.content.length===1 && page>0) setPage(p=>p-1); else setRefresh(n=>n+1);
    } } catch { if (!controller.signal.aborted) setError("Não foi possível dispensar o alerta."); }
    finally { writes.current.delete(controller); if (!controller.signal.aborted) setBusy(null); }
  }
  return <main className="alerts-page"><div className="alerts-page__sidebar"><AppSidebar label="Navegação principal" /></div>
    <section id="page-content" tabIndex={-1} className="alerts-page__content" aria-labelledby="alerts-title">
      <header className="alerts-page__header"><h1 id="alerts-title">Alertas</h1></header>
      {summary && <section className="alerts-page__summary" aria-label="Resumo de vazamentos"><h2>Vazamentos identificados</h2>
        <p>{summary.litersPerDay.toLocaleString("pt-BR")} L/dia estimados · {summary.points} medidor(es)</p>
        <small>Alertas abertos e registros das últimas {summary.windowHours} horas. A projeção não é volume já desperdiçado.</small></section>}
      <div className="alerts-page__toolbar"><div className="alerts-filters" role="group" aria-label="Filtrar alertas">
        {filters.map(f=><button type="button" key={f.label} className={`alerts-filter ${severity===f.id?"alerts-filter--active":""}`} aria-pressed={severity===f.id}
          onClick={()=>{setSeverity(f.id);setPage(0);}}>{f.label}</button>)}</div>
        <span>{data.totalElements} alerta(s)</span></div>
      {error && <div role="alert"><p>{error}</p><button type="button" onClick={()=>setRefresh(n=>n+1)}>Tentar novamente</button></div>}
      <section className="alerts-page__panel" aria-live="polite" aria-busy={loading}>
        {loading ? <p>Carregando alertas…</p> : !error && data.content.length===0 ? <p className="alerts-page__empty">Nenhum alerta nesta categoria.</p> : !error &&
          <ul className="alerts-page__list">{data.content.map(a=>{ const type=content[a.severity];return <li key={a.id}>
            <span className={`alerts-page__icon alerts-page__icon--${type.css}`} aria-hidden="true"><img src={type.icon} alt="" /></span>
            <div className="alerts-page__details"><strong>{a.title}</strong><span>{a.message}</span>
              <small>{a.propertyId ? `Unidade ${a.propertyId}` : "Geral"} · {new Date(a.triggeredAt).toLocaleString("pt-BR")}</small>
              {a.deviceId && <><EvidenceChart deviceId={a.deviceId}/><VisitForm deviceId={a.deviceId}/></>}</div>
            <span className={`alerts-page__badge alerts-page__badge--${type.css}`}>{type.label}</span>
            <button className="alerts-page__dismiss" type="button" disabled={busy!==null} aria-label={`Dispensar alerta: ${a.title}`} onClick={()=>void dismiss(a.id)}>×</button>
          </li>;})}</ul>}
      </section>
      <nav aria-label="Paginação de alertas"><button type="button" disabled={loading||page===0} onClick={()=>setPage(n=>n-1)}>Anterior</button>
        <span> Página {page+1} </span><button type="button" disabled={loading||page+1>=data.totalPages} onClick={()=>setPage(n=>n+1)}>Próxima</button></nav>
    </section></main>;
}
