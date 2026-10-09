import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { LoginButton } from "../LoginButton";
import { TextInput } from "../TextInput";

import "./style.css";

interface LoginFormData {
  email: string;
  password: string;
}

export function LoginForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  function handleEmailChange(email: string) {
    setFormData((previousData) => ({
      ...previousData,
      email,
    }));
  }

  function handlePasswordChange(password: string) {
    setFormData((previousData) => ({
      ...previousData,
      password,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    navigate("/loading");

    /*
      Por enquanto não estamos chamando a API.

      Quando conectarmos o login ao backend,
      a comunicação ficará dentro de src/services/,
      como exige o trabalho.
    */
  }

  return (
    <section
      className="login-form-container"
      aria-labelledby="login-title"
    >
      <div className="login-form-header">
        <h1 id="login-title">
          Oie, bom te ver de novo!
        </h1>

        <p>Acesse com suas informações</p>
      </div>

      <form
        className="login-form"
        onSubmit={handleSubmit}
      >
        <div className="login-form-fields">
          <TextInput
            id="email"
            label="E-mail"
            type="email"
            placeholder="Insira o seu email"
            value={formData.email}
            onChange={handleEmailChange}
            autoComplete="email"
          />

          <TextInput
            id="password"
            label="Senha"
            type="password"
            placeholder="Insira sua senha"
            value={formData.password}
            onChange={handlePasswordChange}
            autoComplete="current-password"
          />
        </div>

        <LoginButton />
      </form>
    </section>
  );
}