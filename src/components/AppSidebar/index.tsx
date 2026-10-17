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
  const name = profile?.name || "Minha conta";
  const email = profile?.email || "E-mail não informado";

  return (
    <aside className={styles.sidebar}>
      <SidebarBrand className={styles.brand} />
      <SidebarNavigation label={label} items={navigationItems} />
      <div className={styles.profileRow} aria-label="Perfil da conta">
        <div className={styles.profile} aria-hidden="true">
          {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
            </svg>
          )}
        </div>
        <div className={styles.profileDetails}>
          <span className={styles.profileName} title={name}>{name}</span>
          <span className={styles.profileEmail} title={email}>{email}</span>
        </div>
      </div>
    </aside>
  );
}
