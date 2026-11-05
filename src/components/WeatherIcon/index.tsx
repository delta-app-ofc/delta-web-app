import styles from "./styles.module.css";

interface WeatherIconProps {
  code: number;
}

type WeatherKind = "clear" | "partly-cloudy" | "cloudy" | "fog" | "rain" | "snow" | "storm";

const weatherLabels: Record<WeatherKind, string> = {
  clear: "céu limpo",
  "partly-cloudy": "parcialmente nublado",
  cloudy: "nublado",
  fog: "neblina",
  rain: "chuva",
  snow: "neve",
  storm: "tempestade",
};

function getWeatherKind(code: number): WeatherKind {
  if (code === 0) return "clear";
  if (code === 1 || code === 2) return "partly-cloudy";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "storm";
  return "partly-cloudy";
}

export function WeatherIcon({ code }: WeatherIconProps) {
  const kind = getWeatherKind(code);

  return (
    <svg
      className={`${styles.icon} ${styles[kind]}`}
      viewBox="0 0 96 84"
      role="img"
      aria-label={`Condição do tempo: ${weatherLabels[kind]}`}
    >
      {(kind === "clear" || kind === "partly-cloudy") && <>
        <circle className={styles.sun} cx="35" cy="29" r="15" />
        <path className={styles.sunRays} d="M35 2v8m0 38v8M8 29h8m38 0h8M16 10l6 6m27 27 6 6m0-39-6 6m-27 27-6 6" />
      </>}
      {kind === "storm" && <path className={styles.stormCloud} d="M24 58a17 17 0 0 1 2-34 24 24 0 0 1 46 7 15 15 0 0 1 2 29H24Z" />}
      {kind === "cloudy" && <path className={styles.cloud} d="M18 60a17 17 0 0 1 2-34 24 24 0 0 1 46 7 15 15 0 0 1 2 29H18Z" />}
      {kind === "fog" && <>
        <path className={styles.cloud} d="M18 51a17 17 0 0 1 2-34 24 24 0 0 1 46 7 15 15 0 0 1 2 29H18Z" />
        <path className={styles.fogLine} d="M14 62h60M22 72h48" />
      </>}
      {(kind === "partly-cloudy" || kind === "rain" || kind === "snow" || kind === "storm") &&
        <path className={styles.cloud} d="M18 58a17 17 0 0 1 2-34 24 24 0 0 1 46 7 15 15 0 0 1 2 29H18Z" />}
      {kind === "rain" && <path className={styles.raindrops} d="m31 66-4 9m21-9-4 9m21-9-4 9" />}
      {kind === "snow" && <g className={styles.snowflakes}>
        <path d="M29 66v12m-5-9 10 6m0-6-10 6M49 66v12m-5-9 10 6m0-6-10 6M69 66v12m-5-9 10 6m0-6-10 6" />
      </g>}
      {kind === "storm" && <path className={styles.lightning} d="m51 58-10 15h9l-4 10 15-18h-10l5-7" />}
    </svg>
  );
}
