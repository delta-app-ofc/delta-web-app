import type { RegisterData } from "../types/register";

export type RegisterErrors = Partial<Record<keyof RegisterData, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegisterProfile(data: RegisterData): RegisterErrors {
  const errors: RegisterErrors = {};
  const name = data.name.trim();
  if (!name) errors.name = "Informe seu nome.";
  else if (name.length > 100) errors.name = "Use até 100 caracteres no nome.";

  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(data.birthDate)) {
    errors.birthDate = "Informe a data no formato DD/MM/AAAA.";
  } else {
    const [day, month, year] = data.birthDate.split("/").map(Number);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day || date > new Date()) {
      errors.birthDate = "Informe uma data de nascimento válida.";
    }
  }

  const phoneDigits = data.phone.replace(/\D/g, "");
  if (phoneDigits.length < 10 || phoneDigits.length > 11) errors.phone = "Informe um telefone com DDD.";
  return errors;
}

export function validateRegisterCredentials(data: RegisterData): RegisterErrors {
  const errors: RegisterErrors = {};
  const email = data.email.trim();
  if (!emailPattern.test(email) || email.length > 255) errors.email = "Informe um e-mail válido.";
  if (data.password.length < 8) errors.password = "A senha deve ter pelo menos 8 caracteres.";
  else if (data.password.length > 128) errors.password = "A senha deve ter no máximo 128 caracteres.";
  if (data.confirmPassword !== data.password) errors.confirmPassword = "As senhas não correspondem.";
  return errors;
}
