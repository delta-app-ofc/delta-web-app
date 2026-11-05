import { SidebarBrand } from "../SidebarBrand";
import { SidebarNavigation } from "../SidebarNavigation";
import type { SidebarNavigationItem } from "../SidebarNavigation";
import styles from "./styles.module.css";

export type { SidebarNavigationItem } from "../SidebarNavigation";

export interface AppSidebarProps {
  label: string;
  navigationItems?: readonly SidebarNavigationItem[];
  profile?: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

export function AppSidebar({ label, navigationItems, profile }: AppSidebarProps) {
  const [loadedProfile, setLoadedProfile] = useState(profile);

  useEffect(() => {
    if (profile) {
      setLoadedProfile(profile);
      return;
    }
    const controller = new AbortController();
    void getCurrentUser(controller.signal).then(
      (currentUser) => { if (!controller.signal.aborted) setLoadedProfile(currentUser); },
      () => { /* O fallback visual não impede a navegação. */ },
    );
    return () => controller.abort();
  }, [profile]);

  const name = loadedProfile?.name || "Minha conta";
  const displayName = name.trim().split(/\s+/).slice(0, 2).join(" ");
  const email = loadedProfile?.email || "E-mail não informado";

  return (
    <aside className={styles.sidebar}>
      <a className={styles.skip} href="#page-content">Pular para o conteúdo</a>
      <SidebarBrand className={styles.brand} />
      <SidebarNavigation label={label} items={navigationItems} />
      <div className={styles.profileRow} role="group" aria-label="Perfil da conta">
        <div className={styles.profile} aria-hidden="true">
          {loadedProfile?.avatarUrl ? <img src={loadedProfile.avatarUrl} alt="" /> : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
            </svg>
          )}
        </div>
        <div className={styles.profileDetails}>
          <span className={styles.profileName} title={name}>{displayName}</span>
          <span className={styles.profileEmail} title={email}>{email}</span>
        </div>
      </div>
    </aside>
  );
}
import { useEffect, useState } from "react";
import { getCurrentUser } from "../../services/auth";
