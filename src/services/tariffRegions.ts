import { isRecord, readArray, readId, readText } from "../utils/apiValidation";
import { ApiError, getJson } from "./http";

export interface TariffRegion { id: number; name: string; }

export function configuredTariffRegions(): TariffRegion[] {
  const raw = import.meta.env.VITE_TARIFF_REGIONS?.trim();
  // Códigos confirmados pelo responsável pelo projeto; não são IDs inferidos do CEP.
  if (!raw) return [
    { id: 1, name: "Grande São Paulo" }, { id: 2, name: "Lins" },
    { id: 3, name: "Presidente Prudente" }, { id: 4, name: "Adamantina / Pirapozinho" },
    { id: 5, name: "Bragança Paulista" },
  ];
  try {
    const regions = readArray(JSON.parse(raw), value => {
      if (!isRecord(value)) throw new Error();
      const name = readText(value.name, 80);
      if (!name) throw new Error();
      return { id: readId(value.id), name };
    });
    if (new Set(regions.map(region => region.id)).size !== regions.length) throw new Error();
    return regions;
  } catch { throw new ApiError("A configuração das regiões tarifárias é inválida."); }
}

export async function verifyTariffRegion(id: number, signal: AbortSignal): Promise<void> {
  readId(id);
  const rates = await getJson(`/delta/region-rate/${id}`, signal);
  if (!Array.isArray(rates) || rates.length === 0) throw new ApiError("Não há tarifa disponível para a região selecionada.", 404);
}
