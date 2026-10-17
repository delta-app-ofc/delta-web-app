import { NavLink } from "react-router-dom";
import dashboard from "../../assets/installations/dashboard.svg";
import installations from "../../assets/installations/installations.svg";
import monitoring from "../../assets/installations/monitoring.svg";
import alerts from "../../assets/installations/alerts.svg";
import leaks from "../../assets/installations/leaks.svg";
import ranking from "../../assets/installations/ranking.svg";
import goals from "../../assets/installations/goals.svg";
import investments from "../../assets/installations/investments.svg";
import devices from "../../assets/installations/devices.svg";
import gluh from "../../assets/installations/gluh.svg";
import settings from "../../assets/installations/menu-settings.svg";
import styles from "./styles.module.css";


export interface SidebarNavigationItem {
  id: string;
  label: string;
  icon: string;
  path?: string;
}

interface SidebarNavigationProps {
  label: string;
  items?: readonly SidebarNavigationItem[];
}

const navigation: readonly SidebarNavigationItem[] = [
  { id: "dashboard", label: "Dashboard", icon: dashboard },
  { id: "installations", label: "Instalações", icon: installations, path: "/instalacoes" },
  { id: "monitoring", label: "Monitoramento", icon: monitoring },
  { id: "alerts", label: "Alertas", icon: alerts },
  { id: "leaks", label: "Vazamentos", icon: leaks },
  { id: "ranking", label: "Ranking", icon: ranking },
  { id: "goals", label: "Metas", icon: goals },
  { id: "investments", label: "Investimentos", icon: investments },
  { id: "devices", label: "Dispositivos", icon: devices },
  { id: "gluh", label: "Gluh", icon: gluh },
  { id: "settings", label: "Configurações", icon: settings },
];

export function SidebarNavigation({ label, items = navigation }: SidebarNavigationProps) {
  return (
      <nav className={styles.navigation} aria-label={label}>
        <ul className={styles.list}>
          {items.map((item) => <li key={item.id}>
            {item.path
              ? <NavLink className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`} to={item.path}><img src={item.icon} alt="" /><span>{item.label}</span></NavLink>
              : <button className={styles.item} type="button" disabled title="Esta seção ainda não está disponível"><img src={item.icon} alt="" /><span>{item.label}</span></button>}
          </li>)}
        </ul>
      </nav>
  );
}
