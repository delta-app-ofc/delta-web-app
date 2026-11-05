import { Link } from "react-router-dom";
import type { Installation, InstallationSort } from "../../types/installation";
import { formatLiters } from "../../utils/installations";
import { UnavailableValue } from "../UnavailableValue";
import styles from "./styles.module.css";

const statusLabel = { OK: "Normal", ATENCAO: "Atenção", CRITICO: "Crítico" } as const;
const statusClass = { OK: "ok", ATENCAO: "warning", CRITICO: "critical" } as const;

interface InstallationsTableProps {
  installations: Installation[];
  monthLabel: string;
  isFiltered: boolean;
  sort: InstallationSort;
}

export function InstallationsTable({ installations, monthLabel, isFiltered, sort }: InstallationsTableProps) {
  const measureLabel = sort === "consumption" ? "Consumo mensal" : "Consumo por área (L/m²)";
  return (
    <section className={styles.card} aria-label="Lista de instalações">
      <div className={styles.scroll} tabIndex={0} role="region" aria-label="Tabela de instalações; role horizontalmente em telas pequenas">
        <table className={styles.table}>
          <caption className="sr-only">Instalações e {measureLabel} em {monthLabel}. Meta e status calculados sobre a meta mensal de cada unidade.</caption>
          <thead><tr><th scope="col">Instalação</th><th scope="col">{measureLabel}</th><th scope="col">Meta</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Detalhes</span></th></tr></thead>
          <tbody>
            {installations.map((installation) => (
              <tr key={installation.id}>
                <th scope="row"><span className={styles.name}>{installation.name}</span><span className={styles.region}>{installation.city && installation.state ? `${installation.city} - ${installation.state}` : "Região não disponível"}</span></th>
                <td>{sort === "consumption"
                  ? installation.monthlyLiters === null ? <UnavailableValue /> : formatLiters(installation.monthlyLiters)
                  : installation.litersPerM2 === null ? <UnavailableValue /> : `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(installation.litersPerM2)} L/m²`}</td>
                <td>{installation.goalPct === null ? <UnavailableValue /> : `${Math.round(installation.goalPct)}%`}</td>
                <td>{installation.goalStatus === null || installation.goalStatus === "SEM_META" ? <UnavailableValue variant="badge" /> : <span className={`${styles.status} ${styles[statusClass[installation.goalStatus]]}`}>{statusLabel[installation.goalStatus]}</span>}</td>
                <td><Link className={styles.details} to={`/instalacoes/${installation.id}`} aria-label={`Ver detalhes de ${installation.name}`}>Ver tudo</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {installations.length === 0 && <p className={styles.empty} role="status">{isFiltered ? "Nenhuma instalação corresponde à sua busca." : "Nenhuma instalação associada à sua conta."}</p>}
    </section>
  );
}
