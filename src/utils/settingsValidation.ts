export interface ProfileInput { name: string; email: string; phone: string }
export interface OrganizationInput { legalName: string; tradeName: string; cnpj: string; segment: string }
export interface PasswordChangeInput { current: string; next: string; confirmation: string }

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateProfile(input: ProfileInput): string | null {
  if (!input.name.trim()) return "Informe o nome completo.";
  if (input.name.trim().length > 100) return "O nome deve ter no máximo 100 caracteres.";
  if (!emailPattern.test(input.email.trim()) || input.email.trim().length > 255) return "Informe um e-mail válido.";
  const phoneDigits = input.phone.replace(/\D/g, "");
  if (input.phone && (phoneDigits.length < 10 || phoneDigits.length > 11)) return "Informe um telefone válido com DDD.";
  return null;
}

export function validateOrganization(input: OrganizationInput): string | null {
  if (!input.legalName.trim()) return "Informe a razão social.";
  if (!input.tradeName.trim()) return "Informe o nome fantasia.";
  if (!/^\d{2}\.?\d{3}\.?\d{3}\/\d{4}-?\d{2}$/.test(input.cnpj.trim())) return "Informe um CNPJ válido.";
  if (!input.segment.trim()) return "Informe o segmento da organização.";
  return null;
}

export function validatePasswordChange(input: PasswordChangeInput): string | null {
  if (!input.current) return "Informe a senha atual.";
  if (input.next.length < 8) return "A nova senha deve ter pelo menos 8 caracteres.";
  if (input.next.length > 128) return "A nova senha deve ter no máximo 128 caracteres.";
  if (input.next !== input.confirmation) return "A confirmação não corresponde à nova senha.";
  return null;
}

export function validateRecipients(value: string): string | null {
  const recipients = value.split(/[;,]/).map((item) => item.trim()).filter(Boolean);
  if (recipients.length === 0) return "Informe ao menos um destinatário.";
  if (recipients.some((recipient) => !emailPattern.test(recipient))) return "Informe e-mails válidos separados por vírgula ou ponto e vírgula.";
  return null;
}
