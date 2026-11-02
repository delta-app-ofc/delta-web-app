import { useEffect, useRef, useState } from "react";
import { declareVisit } from "../../services/alerts";

export function VisitForm({deviceId}: {deviceId: string}) {
  const [until,setUntil]=useState("");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const pending=useRef<AbortController|null>(null);
  useEffect(()=>()=>pending.current?.abort(),[]);
  async function save(cancel:boolean) {
    const timestamp=Date.parse(until);
    const value=Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
    if (!cancel && !value) {setMessage("Informe quando a visita termina.");return;}
    const controller=new AbortController();pending.current=controller;setBusy(true);setMessage("");
    try {
      await declareVisit(deviceId,cancel?null:value,controller.signal);
      if(!controller.signal.aborted)setMessage(cancel?"Visita cancelada.":"Visita registrada. A detecção de vazamentos continua ativa.");
    } catch {if(!controller.signal.aborted)setMessage("Não foi possível atualizar a visita. Use uma data futura de até 90 dias.");}
    finally {if(!controller.signal.aborted)setBusy(false);}
  }
  return <details><summary>Informar visita</summary>
    <label>Visita até <input type="datetime-local" value={until} onChange={e=>setUntil(e.target.value)} disabled={busy}/></label>
    <button type="button" disabled={busy} onClick={()=>void save(false)}>Registrar visita</button>
    <button type="button" disabled={busy} onClick={()=>void save(true)}>Cancelar visita</button>
    <p role="status">{message}</p>
  </details>;
}
