export interface PostalCodeAddress {
  city: string;
  state: string;
}

function digits(value: string) {
  return value.replace(/\D/g, "");
}

export async function lookupPostalCode(value: string, signal: AbortSignal): Promise<PostalCodeAddress | null> {
  const postalCode = digits(value);
  if (postalCode.length !== 8) return null;
  const response = await fetch(`https://viacep.com.br/ws/${postalCode}/json/`, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) throw new Error("Não foi possível consultar o CEP.");
  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || Array.isArray(result)) return null;
  const record = result as Record<string, unknown>;
  if (record.erro === true || typeof record.localidade !== "string" || typeof record.uf !== "string") return null;
  return { city: record.localidade, state: record.uf };
}
