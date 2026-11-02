import {useEffect,useState} from "react";
import {listEvidence,type EvidencePoint} from "../../services/alerts";

export function EvidenceChart({deviceId}:{deviceId:string}) {
  const [open,setOpen]=useState(false);
  const [points,setPoints]=useState<EvidencePoint[]>([]);
  const [status,setStatus]=useState("");
  useEffect(()=>{
    if(!open)return;
    const controller=new AbortController();setStatus("Carregando evidências…");
    listEvidence(deviceId,controller.signal).then(data=>{if(!controller.signal.aborted){setPoints(data);setStatus(data.length?"":"Sem medições nas últimas 24 horas.");}})
      .catch(()=>{if(!controller.signal.aborted)setStatus("Não foi possível consultar as evidências.");});
    return ()=>controller.abort();
  },[open,deviceId]);
  const max=Math.max(1,...points.flatMap(p=>[p.liters,p.baseline??0]));
  const first=points.length?Date.parse(points[0].time):0;
  const span=Math.max(1,points.length?Date.parse(points[points.length-1].time)-first:1);
  const x=(p:EvidencePoint)=>20+560*(Date.parse(p.time)-first)/span;
  const y=(value:number)=>170-150*value/max;
  return <div><button type="button" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>{open?"Ocultar evidências":"Ver evidências"}</button>
    {open&&<section aria-label="Evidências das últimas 24 horas"><p role="status">{status}</p>
      {points.length>0&&<><p>Litros por janela · azul: medido · laranja: baseline disponível</p>
        <svg viewBox="0 0 600 190" role="img" aria-label="Consumo por janela e baseline nas últimas 24 horas" style={{width:"100%",maxWidth:600}}>
          {points.map(p=><g key={p.time}><circle cx={x(p)} cy={y(p.liters)} r="3" fill="#1459a6"><title>{new Date(p.time).toLocaleString("pt-BR")}: {p.liters} L</title></circle>
            {p.baseline!==null&&<circle cx={x(p)} cy={y(p.baseline)} r="2" fill="#b45c00"/>}</g>)}</svg>
        <p>Janelas ausentes não são preenchidas com zero. Baseline ausente não é estimado nesta tela.</p>
      </>}
    </section>}
  </div>;
}
