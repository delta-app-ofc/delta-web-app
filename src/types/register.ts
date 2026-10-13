export interface RegisterData {
  name: string;
  birthDate: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export type RegisterField = keyof RegisterData;