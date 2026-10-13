import { RegisterForm } from "../../components/RegisterUserForm";
import { RegisterHeroPanel } from "../../components/RegisterHeroPanel";

import "./style.css";

export function RegisterPage() {
  return (
    <main className="register-page">
      <section className="register-page__left">
        <RegisterForm />
      </section>

      <section className="register-page__right">
        <RegisterHeroPanel />
      </section>
    </main>
  );
}