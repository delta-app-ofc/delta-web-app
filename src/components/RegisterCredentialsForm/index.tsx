import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useRegister } from "../../contexts/RegisterContext/useRegister";
import { TextInput } from "../TextInput";
import { RegisterButton } from "../RegisterButton";

import { createAccount } from "../../services/registration";
import { ApiError } from "../../services/http";

import "./style.css";
import { validateRegisterCredentials, type RegisterErrors } from "../../utils/registerValidation";

export function RegisterCredentialsForm() {
  const navigate = useNavigate();

  const { registerData, setField } = useRegister();
  const [errors, setErrors] = useState<RegisterErrors>({});
  const formRef = useRef<HTMLFormElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => () => requestRef.current?.abort(), []);

  function clearError(field: keyof RegisterErrors) {
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleEmailChange(email: string) {
    setField("email", email);
    clearError("email");
  }

  function handlePasswordChange(password: string) {
    setField("password", password);
    clearError("password");
  }

  function handleConfirmPasswordChange(confirmPassword: string) {
    setField("confirmPassword", confirmPassword);
    clearError("confirmPassword");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requestRef.current) return;
    const validation = validateRegisterCredentials(registerData);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    const controller = new AbortController();
    requestRef.current = controller;
    setSubmitError("");
    setIsLoading(true);
    try {
      await createAccount(registerData, controller.signal);
      if (!controller.signal.aborted) navigate("/cadastro/loading");
    } catch (failure: unknown) {
      if (!controller.signal.aborted) setSubmitError(failure instanceof ApiError ? failure.message : "Não foi possível criar a conta. Tente novamente.");
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
      if (requestRef.current === controller) requestRef.current = null;
    }
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
      </div>

      <form
        ref={formRef}
        className="register-credentials-form"
        onSubmit={handleSubmit}
        noValidate
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
            required
            maxLength={255}
            error={errors.email}
          />

          <TextInput
            id="password"
            label="Senha"
            type="password"
            placeholder="Crie sua senha"
            value={registerData.password}
            onChange={handlePasswordChange}
            autoComplete="new-password"
            required
            maxLength={128}
            error={errors.password}
          />

          <TextInput
            id="confirmPassword"
            label="Confirmação de senha"
            type="password"
            placeholder="Confirme sua senha"
            value={registerData.confirmPassword}
            onChange={handleConfirmPasswordChange}
            autoComplete="new-password"
            required
            maxLength={128}
            error={errors.confirmPassword}
          />
        </div>

        {submitError && <p className="register-credentials-error" role="alert">{submitError}</p>}

        <RegisterButton disabled={isLoading}>{isLoading ? "Cadastrando..." : "Cadastrar"}</RegisterButton>
        <div className="register-credentials-login">
          <span>Já possui uma conta?</span>
          <Link className="register-credentials-login__link" to="/login">Faça login</Link>
        </div>
      </form>
    </section>
  );
}
