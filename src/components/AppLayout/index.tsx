import type { ReactNode } from "react";
import glow from "../../assets/installations/header-glow.svg";
import { AppHeader } from "../AppHeader";
import { AppSidebar } from "../AppSidebar";
import styles from "./styles.module.css";

interface AppLayoutProps {
  title: string;
  children: ReactNode;
}

export function AppLayout({ title, children }: AppLayoutProps) {
  return (
    <div className={styles.layout}>
      <img className={styles.glow} src={glow} alt="" />
      <a className={styles.skip} href="#page-content">Pular para o conteúdo</a>
      <div className={styles.grid}>
        <AppSidebar label="Navegação principal" />
        <div className={styles.content}>
          <AppHeader title={title} />
          <div className={styles.scrollArea} role="region" aria-label={`Conteúdo de ${title}`} tabIndex={0}>
            <main id="page-content" tabIndex={-1}>{children}</main>
            <footer className={styles.footer}>Delta · Transformando hábitos, gota por gota.</footer>
          </div>
        </div>
      </div>
    </div>
  );
}
