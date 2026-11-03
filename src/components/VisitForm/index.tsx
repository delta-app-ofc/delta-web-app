import { useId, useState } from "react";
import { useVisit } from "../../hooks/useVisit";
import styles from "./styles.module.css";

interface VisitFormProps {
  deviceId: string;
}

export function VisitForm({ deviceId }: VisitFormProps) {
  const [until, setUntil] = useState("");
  const inputId = useId();
  const errorId = useId();
  const { busy, errors, failure, success, submit } = useVisit(deviceId);

  return (
    <details className={styles.visit}>
      <summary>Informar visita</summary>
      <label htmlFor={inputId}>Visita até</label>
      <input
        id={inputId}
        type="datetime-local"
        value={until}
        disabled={busy}
        aria-invalid={errors.until ? true : undefined}
        aria-describedby={errors.until ? errorId : undefined}
        onChange={(event) => setUntil(event.target.value)}
      />
      <button type="button" disabled={busy} onClick={() => void submit(until, false)}>Registrar visita</button>
      <button type="button" disabled={busy} onClick={() => void submit(until, true)}>Cancelar visita</button>
      {busy && <p role="status">Salvando visita…</p>}
      {errors.until && <p id={errorId} role="alert">{errors.until}</p>}
      {failure && <p role="alert">{failure}</p>}
      {success && <p role="status">{success}</p>}
    </details>
  );
}
