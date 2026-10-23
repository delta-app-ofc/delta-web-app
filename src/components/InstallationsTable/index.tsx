import { Link } from "react-router-dom";
import type { Installation } from "../../types/installation";
import { formatLiters } from "../../utils/installations";
import { UnavailableValue } from "../UnavailableValue";
import styles from "./styles.module.css";

interface InstallationsTableProps {
  installations: Installation[];
  monthLabel: string;
  isFiltered: boolean;
}

export function InstallationsTable({ installations, monthLabel, isFiltered }: InstallationsTableProps) {
  return (
    <section className={styles.card} aria-label="Lista de instalações">
      <div className={styles.scroll} tabIndex={0} role="region" aria-label="Tabela de instalações; role horizontalmente em telas pequenas">
        <table className={styles.table}>
          <caption className="sr-only">Instalações e consumo em {monthLabel}. Metas e status ainda não disponíveis.</caption>
          <thead><tr><th scope="col">Instalação</th><th scope="col">Consumo mensal</th><th scope="col">Meta</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Detalhes</span></th></tr></thead>
          <tbody>
            {installations.map((installation) => (
              <tr key={installation.id}>
                <th scope="row"><span className={styles.name}>{installation.name}</span><span className={styles.region}>{installation.city && installation.state ? `${installation.city} - ${installation.state}` : "Região não disponível"}</span></th>
                <td>{installation.monthlyLiters === null ? <UnavailableValue /> : formatLiters(installation.monthlyLiters)}</td>
                <td><UnavailableValue /></td>
                <td><UnavailableValue variant="badge" /></td>
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
