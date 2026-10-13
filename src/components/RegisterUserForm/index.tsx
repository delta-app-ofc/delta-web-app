import { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { useRegister } from "../../contexts/RegisterContext";
import { TextInput } from "../TextInput";

import "./style.css";

export function RegisterForm() {
  const navigate = useNavigate();

  const { registerData, setField } = useRegister();

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
  }

  function handleBirthDateChange(birthDate: string) {
    const formattedBirthDate = formatBirthDate(birthDate);

    setField("birthDate", formattedBirthDate);
  }

  function handlePhoneChange(phone: string) {
    setField("phone", phone);
  }

  function handleLoginClick() {
    navigate("/login");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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
        className="register-form"
        onSubmit={handleSubmit}
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
          />

          <TextInput
            id="phone"
            label="Telefone"
            type="tel"
            placeholder="Telefone"
            value={registerData.phone}
            onChange={handlePhoneChange}
            autoComplete="tel"
          />
        </div>

        <button
          type="submit"
          className="register-button"
        >
          <span>Continuar</span>

          <span
            className="register-button__arrow"
            aria-hidden="true"
          >
            →
          </span>
        </button>
      </form>
    </section>
  );
}