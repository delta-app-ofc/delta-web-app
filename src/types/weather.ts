export interface WeatherData {
  city: string;
  temperatureC: number;
  condition: string;
  highC: number | null;
  lowC: number | null;
  precipitationMm: number | null;
}
