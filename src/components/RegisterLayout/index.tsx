import type { ReactNode } from "react";

import { RegisterHeroPanel } from "../RegisterHeroPanel";

import "./style.css";

interface RegisterLayoutProps {
  children: ReactNode;
}

export function RegisterLayout({ children }: RegisterLayoutProps) {
  return (
    <main className="register-layout">
      <section className="register-layout__content">{children}</section>
      <section className="register-layout__hero" aria-label="Mensagem da marca">
        <RegisterHeroPanel />
      </section>
    </main>
  );
}
