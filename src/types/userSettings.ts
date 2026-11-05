export type UserLanguage = "pt-BR" | "en" | "es";
export type UserTimezone = "America/Sao_Paulo" | "America/Manaus" | "UTC";
export type UserDateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
export type UserVolumeUnit = "m3" | "L" | "US_GAL";

export interface UserSettings {
  language: UserLanguage;
  timezone: UserTimezone;
  dateFormat: UserDateFormat;
  unit: UserVolumeUnit;
}
