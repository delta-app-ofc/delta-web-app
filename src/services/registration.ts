import { ApiError, postPublicJson } from "./http";
import { saveSessionFromResponse } from "./auth";
import { toIsoBirthDate } from "../utils/registerValidation";
import type { RegisterData } from "../types/register";

const createAccountErrors: Readonly<Record<number, string>> = {
  401: "Não foi possível criar a conta. Tente novamente.",
  400: "Confira os dados informados e tente novamente.",
  409: "Já existe uma conta com este e-mail.",
  429: "Muitas tentativas. Aguarde um pouco e tente novamente.",
};

export async function createAccount(data: RegisterData, signal: AbortSignal): Promise<void> {
  const birthDate = toIsoBirthDate(data.birthDate);
  if (!birthDate) throw new ApiError("Informe uma data de nascimento válida.");
  const phone = data.phone.replace(/\D/g, "");
  const response = await postPublicJson("/delta/auth/create-account", {
    name: data.name.trim(), email: data.email.trim(), password: data.password,
    ...(phone ? { phone } : {}), birthDate,
  }, signal, createAccountErrors, "Não foi possível criar a conta. Tente novamente.");
  signal.throwIfAborted();
  saveSessionFromResponse(response);
}
