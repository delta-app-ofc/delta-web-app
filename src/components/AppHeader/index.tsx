import styles from "./styles.module.css";

interface AppHeaderProps {
  title: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  return (
    <header className={styles.header}>
      <h1>{title}</h1>
    </header>
  );
}
