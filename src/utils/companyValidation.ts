import type {
  CompanyRegisterData,
  CompanyRegisterStep,
} from "../types/companyRegister";

export type CompanyValidationErrors = Record<string, string>;

export function sanitizePlainText(value: string) {
  return value.replace(/[<>]/g, "").replace(/\s{2,}/g, " ");
}

function requireValue(
  errors: CompanyValidationErrors,
  field: string,
  value: string,
  message: string,
) {
  if (!value.trim()) {
    errors[field] = message;
  }
}

export function validateCompanyStep(
  step: CompanyRegisterStep,
  data: CompanyRegisterData,
): CompanyValidationErrors {
  const errors: CompanyValidationErrors = {};

  if (step === "company") {
    requireValue(errors, "legalName", data.legalName, "Informe a razão social.");
    requireValue(errors, "tradeName", data.tradeName, "Informe o nome fantasia.");
    requireValue(errors, "cnpj", data.cnpj, "Informe o CNPJ.");
    requireValue(
      errors,
      "industrySegment",
      data.industrySegment,
      "Informe o segmento industrial.",
    );
    requireValue(errors, "companySize", data.companySize, "Informe o porte da empresa.");
  }

  if (step === "unit") {
    requireValue(errors, "unitName", data.unitName, "Informe o nome da unidade.");
    requireValue(errors, "postalCode", data.postalCode, "Informe o CEP.");
    requireValue(errors, "state", data.state, "Informe o estado.");
    requireValue(errors, "city", data.city, "Informe a cidade.");
    requireValue(
      errors,
      "streetDistrict",
      data.streetDistrict,
      "Informe a rua ou o bairro.",
    );
    requireValue(errors, "number", data.number, "Informe o número.");
  }

  if (step === "classification" && !data.classification) {
    errors.classification = "Selecione o tipo da indústria.";
  }

  if (step === "operation") {
    if (data.operationDays.length === 0) {
      errors.operationDays = "Selecione pelo menos um dia de operação.";
    }
    requireValue(errors, "operationStart", data.operationStart, "Informe o horário inicial.");
    requireValue(errors, "operationEnd", data.operationEnd, "Informe o horário final.");
  }

  if (step === "shifts") {
    if (!data.shiftCount) {
      errors.shiftCount = "Selecione a quantidade de turnos.";
    }

    data.shifts.forEach((shift) => {
      if (!shift.start || !shift.end) {
        errors[`shift-${shift.id}`] = "Informe o início e o fim deste turno.";
      }
    });
  }

  if (step === "water") {
    if (data.waterUses.length === 0) {
      errors.waterUses = "Selecione ao menos uma utilização da água.";
    }
    if (!data.waterSource) {
      errors.waterSource = "Selecione a principal fonte de água.";
    }
  }

  if (step === "consumption") {
    requireValue(
      errors,
      "averageMonthlyConsumption",
      data.averageMonthlyConsumption,
      "Informe o consumo médio mensal.",
    );
  }

  if (step === "device") {
    requireValue(
      errors,
      "deviceId",
      data.deviceId,
      "Informe o ID do hidrômetro.",
    );
  }

  return errors;
}
