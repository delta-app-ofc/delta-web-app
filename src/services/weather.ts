import type { WeatherData, WeatherForecastDay } from "../types/weather";
import { isRecord, readOptionalNumber } from "../utils/apiValidation";
import { ApiError, getPublicJsonFrom } from "./http";

const weatherApiUrl = import.meta.env.VITE_WEATHER_API_URL?.trim();

function weatherCondition(code: number): string {
  if (code === 0) return "Céu limpo";
  if ([1, 2, 3].includes(code)) return "Parcialmente nublado";
  if ([45, 48].includes(code)) return "Neblina";
  if ([51, 53, 55, 56, 57].includes(code)) return "Garoa";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Chuva";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Neve";
  if ([95, 96, 99].includes(code)) return "Tempestade";
  return "Condição não informada";
}

function readNumber(value: unknown, label: string): number {
  const number = readOptionalNumber(value);
  if (number === null) throw new ApiError(`A API de clima retornou ${label} inválido.`);
  return number;
}

export async function getCurrentWeather(latitude: number, longitude: number, city: string, signal: AbortSignal): Promise<WeatherData> {
  if (!weatherApiUrl || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new ApiError("A API de clima ainda não foi configurada.");
  }
  const query = new URLSearchParams({
    latitude: String(latitude), longitude: String(longitude),
    current: "temperature_2m,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
    forecast_days: "3", timezone: "auto",
  });
  const value = await getPublicJsonFrom(weatherApiUrl, `?${query.toString()}`, signal);
  if (!isRecord(value) || !isRecord(value.current) || !isRecord(value.daily) ||
    !Array.isArray(value.daily.time) || !Array.isArray(value.daily.weather_code) ||
    !Array.isArray(value.daily.temperature_2m_max) || !Array.isArray(value.daily.temperature_2m_min) ||
    !Array.isArray(value.daily.precipitation_sum)) throw new ApiError("A API de clima retornou dados inválidos.");
  const code = readNumber(value.current.weather_code, "código do clima");
  const dailyTimes = value.daily.time as unknown[];
  const dailyCodes = value.daily.weather_code as unknown[];
  const dailyMax = value.daily.temperature_2m_max as unknown[];
  const dailyMin = value.daily.temperature_2m_min as unknown[];
  const dailyPrecipitation = value.daily.precipitation_sum as unknown[];
  const forecast: WeatherForecastDay[] = dailyTimes.flatMap((day, index): WeatherForecastDay[] => {
    if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return [];
    const dailyCode = readOptionalNumber(dailyCodes[index]);
    if (dailyCode === null) return [];
    return [{
      date: day,
      weatherCode: dailyCode,
      condition: weatherCondition(dailyCode),
      highC: readOptionalNumber(dailyMax[index]),
      lowC: readOptionalNumber(dailyMin[index]),
      precipitationMm: readOptionalNumber(dailyPrecipitation[index]),
    }];
  });
  const today = forecast[0];
  return {
    city, temperatureC: readNumber(value.current.temperature_2m, "temperatura"), weatherCode: code,
    condition: weatherCondition(code), highC: today?.highC ?? null, lowC: today?.lowC ?? null,
    precipitationMm: today?.precipitationMm ?? null, forecast,
  };
}
