import { useCallback, useEffect, useState } from "react";
import type { Address } from "../types/address";
import type { WeatherData } from "../types/weather";
import { geocodeCity } from "../services/geocoding";
import { getCurrentWeather } from "../services/weather";

type State =
  | { status: "loading" }
  | { status: "success"; data: WeatherData }
  | { status: "unavailable"; message: string };

export function useInstallationWeather(address: Address | null) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [version, setVersion] = useState(0);
  const city = address?.city ?? "";
  const region = address?.state ?? "";
  const latitude = address?.latitude ?? null;
  const longitude = address?.longitude ?? null;

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function load(): Promise<void> {
      if (!city.trim()) {
        setState({ status: "unavailable", message: "Cadastre a cidade da instalação para consultar o clima local." });
        return;
      }
      setState({ status: "loading" });
      try {
        const coordinates = latitude !== null && longitude !== null
          ? { latitude, longitude }
          : await geocodeCity(city, region, signal);
        const data = await getCurrentWeather(coordinates.latitude, coordinates.longitude, city, signal);
        if (!signal.aborted) setState({ status: "success", data });
      } catch {
        if (!signal.aborted) setState({ status: "unavailable", message: "Não foi possível consultar o clima desta instalação agora." });
      }
    }

    void load();
    return () => controller.abort();
  }, [city, region, latitude, longitude, version]);

  const retry = useCallback(() => setVersion((current) => current + 1), []);
  return { state, retry };
}
