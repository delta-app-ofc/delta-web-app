import { FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { LoginButton } from "../LoginButton";
import { TextInput } from "../TextInput";
import { useAuth } from "../../contexts/AuthContext/useAuth";
import { ApiError } from "../../services/http";
import { validateLogin } from "../../utils/authValidation";

import "./style.css";

interface LoginFormData {
  email: string;
  password: string;
}

export function LoginForm() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => () => requestRef.current?.abort(), []);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setError("");
    const validationError = validateLogin(formData);
    if (validationError) {
      setError(validationError);
      requestRef.current = null;
      return;
    }
    setIsLoading(true);
    try {
      await signIn(formData.email, formData.password, controller.signal);
      if (!controller.signal.aborted) navigate("/dashboard", { replace: true });
    } catch (failure: unknown) {
      if (!controller.signal.aborted) setError(failure instanceof ApiError ? failure.message : "Não foi possível entrar. Tente novamente.");
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
      if (requestRef.current === controller) requestRef.current = null;
    }
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
        aria-busy={isLoading}
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
            required
            disabled={isLoading}
            maxLength={255}
          />

          <TextInput
            id="password"
            label="Senha"
            type="password"
            placeholder="Insira sua senha"
            value={formData.password}
            onChange={handlePasswordChange}
            autoComplete="current-password"
            required
            disabled={isLoading}
            maxLength={256}
          />
        </div>

        {error && <p className="login-form-error" role="alert">{error}</p>}
        <LoginButton isLoading={isLoading} />
      </form>
    </section>
  );
}
