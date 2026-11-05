const knownScenarioNames: Readonly<Record<string, string>> = {
  "AERADORES E REGISTROS ECONOMIZADORES": "Aeradores e registros economizadores",
  "TORNEIRAS ECONOMICAS": "Torneiras econômicas",
  "TORNEIRAS ECONÔMICAS": "Torneiras econômicas",
  "CAPTACAO DE CHUVA": "Captação de chuva",
  "CAPTAÇÃO DE CHUVA": "Captação de chuva",
  "REUSO DE AGUA": "Reúso de água",
  "REÚSO DE ÁGUA": "Reúso de água",
  "CAPTACAO DE AGUA DE CHUVA": "Captação de água de chuva",
  "CAPTAÇÃO DE ÁGUA DE CHUVA": "Captação de água de chuva",
  "REUSO DE AGUA CINZA": "Reúso de água cinza",
  "REÚSO DE ÁGUA CINZA": "Reúso de água cinza",
};

export function formatInvestmentScenarioName(value: string): string {
  const key = value.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().toLocaleUpperCase("pt-BR");
  const knownName = knownScenarioNames[key];
  if (knownName) return knownName;

  return value
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR")
    .replace(/(^|[\s-])([\p{L}\p{N}])/gu, (_match, separator: string, letter: string) => `${separator}${letter.toLocaleUpperCase("pt-BR")}`)
    .replace(/\s+(Da|Das|De|Do|Dos|E)\b/g, (part) => part.toLocaleLowerCase("pt-BR"));
}
