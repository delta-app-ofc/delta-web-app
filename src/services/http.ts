export class ApiError extends Error {
  constructor(message: string, public readonly status: number | null = null) {
    super(message);
    this.name = "ApiError";
  }
}

export async function getJson(path: string, signal: AbortSignal): Promise<unknown> {
  try {
    const baseUrl = import.meta.env.VITE_POSTGRES_API_URL?.trim();
    if (!baseUrl) throw new ApiError("O serviço de instalações ainda não foi configurado.");
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
      signal, headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new ApiError(response.status === 401
        ? "É necessário entrar na sua conta para consultar as instalações."
        : response.status === 403 ? "Sua conta não tem permissão para consultar estes dados."
        : "Não foi possível consultar as instalações. Tente novamente.", response.status);
    }
    return await response.json();
  } catch (error: unknown) {
    if (signal.aborted || error instanceof ApiError) throw error;
    throw new ApiError("Não foi possível acessar o serviço. Verifique sua conexão e tente novamente.");
  }
}
