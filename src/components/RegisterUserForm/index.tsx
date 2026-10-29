import { FormEvent, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useRegister } from "../../contexts/RegisterContext/useRegister";
import { TextInput } from "../TextInput";
import { RegisterButton } from "../RegisterButton";

import "./style.css";
import { validateRegisterProfile, type RegisterErrors } from "../../utils/registerValidation";

export function RegisterForm() {
  const navigate = useNavigate();

  const { registerData, setField } = useRegister();
  const [errors, setErrors] = useState<RegisterErrors>({});
  const formRef = useRef<HTMLFormElement>(null);

  function clearError(field: keyof RegisterErrors) {
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function formatBirthDate(value: string) {
    const numbersOnly = value.replace(/\D/g, "");

    if (numbersOnly.length <= 2) {
      return numbersOnly;
    }

    if (numbersOnly.length <= 4) {
      return `${numbersOnly.slice(0, 2)}/${numbersOnly.slice(2)}`;
    }

    return `${numbersOnly.slice(0, 2)}/${numbersOnly.slice(
      2,
      4,
    )}/${numbersOnly.slice(4, 8)}`;
  }

  function handleNameChange(name: string) {
    setField("name", name);
    clearError("name");
  }

  function handleBirthDateChange(birthDate: string) {
    const formattedBirthDate = formatBirthDate(birthDate);

    setField("birthDate", formattedBirthDate);
    clearError("birthDate");
  }

  function handlePhoneChange(phone: string) {
    setField("phone", phone);
    clearError("phone");
  }

  function handleLoginClick() {
    navigate("/login");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateRegisterProfile(registerData);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    navigate("/cadastro/credenciais");
  }

  return (
    <section
      className="register-form-container"
      aria-labelledby="register-title"
    >
      <div className="register-form-header">
        <h1 id="register-title">
          Olá, seja bem vindo(a)!
        </h1>

        <p className="register-form-subtitle">
          Crie a sua conta
        </p>

        <div className="register-login">
          <span>Já possui uma conta?</span>

          <button
            type="button"
            className="register-login__button"
            onClick={handleLoginClick}
          >
            Faça login
          </button>
        </div>
      </div>

      <form
        ref={formRef}
        className="register-form"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="register-form-fields">
          <TextInput
            id="name"
            label="Nome"
            type="text"
            placeholder="Insira o seu nome"
            value={registerData.name}
            onChange={handleNameChange}
            autoComplete="name"
            required
            maxLength={100}
            error={errors.name}
          />

          <TextInput
            id="birthDate"
            label="Data de nascimento"
            type="text"
            placeholder="Data de nascimento"
            value={registerData.birthDate}
            onChange={handleBirthDateChange}
            autoComplete="bday"
            inputMode="numeric"
            maxLength={10}
            required
            error={errors.birthDate}
          />

          <TextInput
            id="phone"
            label="Telefone"
            type="tel"
            placeholder="Telefone"
            value={registerData.phone}
            onChange={handlePhoneChange}
            autoComplete="tel"
            inputMode="tel"
            maxLength={20}
            required
            error={errors.phone}
          />
        </div>

        <RegisterButton />
      </form>
    </section>
  );
}
