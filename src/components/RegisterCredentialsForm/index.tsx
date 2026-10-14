import { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { useRegister } from "../../contexts/RegisterContext";
import { TextInput } from "../TextInput";
import { RegisterButton } from "../RegisterButton";

import "./style.css";

export function RegisterCredentialsForm() {
  const navigate = useNavigate();

  const { registerData, setField } = useRegister();

  function handleEmailChange(email: string) {
    setField("email", email);
  }

  function handlePasswordChange(password: string) {
    setField("password", password);
  }

  function handleConfirmPasswordChange(confirmPassword: string) {
    setField("confirmPassword", confirmPassword);
  }

  function handleLoginClick() {
    navigate("/login");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    navigate("/cadastro/loading");
  }

  return (
    <section
      className="register-credentials-container"
      aria-labelledby="register-credentials-title"
    >
      <div className="register-credentials-header">
        <h1 id="register-credentials-title">
          Olá, seja bem vindo(a)!
        </h1>

        <p className="register-credentials-subtitle">
          Crie a sua conta
        </p>

        <div className="register-credentials-login">
          <span>Já possui uma conta?</span>

          <button
            type="button"
            className="register-credentials-login__button"
            onClick={handleLoginClick}
          >
            Faça login
          </button>
        </div>
      </div>

      <form
        className="register-credentials-form"
        onSubmit={handleSubmit}
      >
        <div className="register-credentials-fields">
          <TextInput
            id="email"
            label="E-mail"
            type="email"
            placeholder="Insira o seu email"
            value={registerData.email}
            onChange={handleEmailChange}
            autoComplete="email"
          />

          <TextInput
            id="password"
            label="Senha"
            type="password"
            placeholder="Crie sua senha"
            value={registerData.password}
            onChange={handlePasswordChange}
            autoComplete="new-password"
          />

          <TextInput
            id="confirmPassword"
            label="Confirmação de senha"
            type="password"
            placeholder="Confirme sua senha"
            value={registerData.confirmPassword}
            onChange={handleConfirmPasswordChange}
            autoComplete="new-password"
          />
        </div>

        <RegisterButton>Cadastrar</RegisterButton>
      </form>
    </section>
  );
}
