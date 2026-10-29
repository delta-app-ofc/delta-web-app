export interface LoginInput {
  email: string;
  password: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin(input: LoginInput): string | null {
  const email = input.email.trim();
  if (!email) return "Informe o e-mail.";
  if (email.length > 255 || !emailPattern.test(email)) return "Informe um e-mail válido.";
  if (!input.password) return "Informe a senha.";
  if (input.password.length > 256) return "A senha deve ter no máximo 256 caracteres.";
  return null;
}
