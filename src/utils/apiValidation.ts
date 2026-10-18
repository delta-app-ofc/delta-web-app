// JSON externo entra como unknown: só dados verificados chegam à apresentação.
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readId(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error("A API retornou um identificador inválido.");
  }
  return value;
}

export function readOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error("A API retornou um valor numérico inválido.");
  }
  return value;
}

export function readText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") {
    throw new Error("A API retornou um texto inválido.");
  }
  // Remove caracteres de controle; JSX trata o texto sem interpretar HTML.
  return Array.from(value)
    .filter((character) => character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127)
    .join("").trim().slice(0, maxLength);
}

export function readArray<T>(value: unknown, parse: (item: unknown) => T): T[] {
  if (!Array.isArray(value)) throw new Error("A API retornou uma lista inválida.");
  return value.map(parse);
}
