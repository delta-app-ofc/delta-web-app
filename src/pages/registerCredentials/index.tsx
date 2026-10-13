import { RegisterCredentialsForm } from "../../components/RegisterCredentialsForm";
import { RegisterHeroPanel } from "../../components/RegisterHeroPanel";

import "./style.css";

export function RegisterCredentialsPage() {
  return (
    <main className="register-credentials-page">
      <section className="register-credentials-page__left">
        <RegisterCredentialsForm />
      </section>

      <section className="register-credentials-page__right">
        <RegisterHeroPanel />
      </section>
    </main>
  );
}