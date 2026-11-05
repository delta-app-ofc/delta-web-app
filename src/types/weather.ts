export interface WeatherData {
  city: string;
  temperatureC: number;
  weatherCode: number;
  condition: string;
  highC: number | null;
  lowC: number | null;
  precipitationMm: number | null;
  forecast: WeatherForecastDay[];
}

export interface WeatherForecastDay {
  date: string;
  weatherCode: number;
  condition: string;
  highC: number | null;
  lowC: number | null;
  precipitationMm: number | null;
}
