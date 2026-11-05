/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POSTGRES_API_URL?: string;
  readonly VITE_RANKING_API_URL?: string;
  readonly VITE_AI_API_URL?: string;
  readonly VITE_TARIFF_REGIONS?: string;
}
