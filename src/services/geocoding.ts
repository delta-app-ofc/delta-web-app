import { isRecord, readOptionalNumber, readText } from "../utils/apiValidation";
import { ApiError, getPublicJsonFrom } from "./http";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Geocodificação do Open-Meteo (a mesma origem do clima): precisão de cidade, suficiente para o clima da instalação.
const GEOCODING_URL = "https://geocoding-api.open-meteo.com";

const stateNames: Readonly<Record<string, string>> = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará", DF: "Distrito Federal",
  ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais",
  PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte", RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina",
  SP: "São Paulo", SE: "Sergipe", TO: "Tocantins",
};

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export async function geocodeCity(city: string, state: string, signal: AbortSignal): Promise<Coordinates> {
  const name = city.trim();
  if (!name) throw new ApiError("Informe a cidade para localizar a unidade.");
  const query = new URLSearchParams({ name, count: "10", language: "pt", countryCode: "BR" });
  let data: unknown;
  try {
    data = await getPublicJsonFrom(GEOCODING_URL, `/v1/search?${query}`, signal);
  } catch (error: unknown) {
    if (signal.aborted) throw error;
    throw new ApiError("Não foi possível localizar a cidade da unidade. Tente novamente.");
  }
  const results = isRecord(data) && Array.isArray(data.results) ? data.results : [];
  const wanted = normalize(stateNames[state.trim().toUpperCase()] ?? state);
  const candidates = results.flatMap((item) => {
    if (!isRecord(item)) return [];
    const latitude = readOptionalNumber(item.latitude);
    const longitude = readOptionalNumber(item.longitude);
    if (latitude === null || longitude === null) return [];
    return [{ latitude, longitude, state: typeof item.admin1 === "string" ? normalize(readText(item.admin1, 80)) : "" }];
  });
  const match = candidates.find((item) => item.state === wanted) ?? candidates[0];
  if (!match) throw new ApiError("Não encontramos a cidade informada. Confira a cidade e o estado.");
  return { latitude: match.latitude, longitude: match.longitude };
}
