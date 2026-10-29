import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { getCurrentUser } from "../../services/auth";
import type { CurrentUser } from "../../services/auth";
import bottomGlow from "../../assets/installation-registration/bottom-glow.svg";
import { AppHeader } from "../AppHeader";
import { AppSidebar } from "../AppSidebar";
import styles from "./styles.module.css";

interface AppLayoutProps {
  title: string;
  children: ReactNode;
  registration?: boolean;
  details?: boolean;
}

export function AppLayout({ title, children, registration = false, details = false }: AppLayoutProps) {
  const [user, setUser] = useState<CurrentUser>();

  useEffect(() => {
    const controller = new AbortController();
    void getCurrentUser(controller.signal).then(
      (profile) => { if (!controller.signal.aborted) setUser(profile); },
      () => { /* O perfil indisponível não impede a consulta das instalações. */ },
    );
    return () => controller.abort();
  }, []);

  return (
    <div className={`${styles.layout} ${registration || details ? styles.registration : ""} ${details ? styles.details : ""}`}>
      {(registration || details) && <img className={styles.bottomGlow} src={bottomGlow} alt="" />}
      <div className={styles.grid}>
        <AppSidebar label="Navegação principal" profile={user} />
        <div className={styles.content}>
          <AppHeader title={title} />
          <div className={styles.scrollArea} role="region" aria-label={`Conteúdo de ${title}`} tabIndex={0}>
            <main id="page-content" tabIndex={-1}>{children}</main>
            {!registration && !details && <footer className={styles.footer}>Delta · Transformando hábitos, gota por gota.</footer>}
          </div>
        </div>
      </div>
    </div>
  );
}
