import { HeroPanel } from "../../components/HeroPanel";
import { LoginForm } from "../../components/LoginForm";

import "./style.css";

export function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-page__left">
        <LoginForm />
      </section>

      <section className="login-page__right">
        <HeroPanel />
      </section>
    </main>
  );
}