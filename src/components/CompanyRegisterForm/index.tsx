import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useCompanyRegister } from "../../contexts/CompanyRegisterContext";
import {
  industryClassifications,
  waterSources,
  waterUses,
  weekDays,
} from "../../types/companyRegister";
import type {
  CompanyRegisterStep,
  CompanyTextField,
} from "../../types/companyRegister";
import {
  sanitizePlainText,
  validateCompanyStep,
} from "../../utils/companyValidation";
import { RegisterButton } from "../RegisterButton";
import { TextInput } from "../TextInput";

import "./style.css";

interface CompanyRegisterFormProps {
  step: CompanyRegisterStep;
}

const stepContent: Record<
  CompanyRegisterStep,
  { title: string; subtitle: string; nextPath: string }
> = {
  company: {
    title: "Cadastre a sua empresa!",
    subtitle: "Crie o acesso da unidade",
    nextPath: "/cadastro/empresa/unidade",
  },
  unit: {
    title: "Unidade industrial",
    subtitle: "Cadastre sua unidade",
    nextPath: "/cadastro/empresa/classificacao",
  },
  classification: {
    title: "Classificação industrial",
    subtitle: "Qual o tipo da sua indústria?",
    nextPath: "/cadastro/empresa/operacao",
  },
  operation: {
    title: "Operação",
    subtitle: "Conte-nos sobre o funcionamento da unidade",
    nextPath: "/cadastro/empresa/turnos",
  },
  shifts: {
    title: "Turnos",
    subtitle: "Conte-nos sobre os turnos da unidade",
    nextPath: "/cadastro/empresa/agua",
  },
  water: {
    title: "Utilização da água",
    subtitle: "Como a unidade utiliza a água?",
    nextPath: "/cadastro/empresa/consumo",
  },
  consumption: {
    title: "Consumo",
    subtitle: "Como é o consumo da água?",
    nextPath: "/cadastro/empresa/dispositivo",
  },
  device: {
    title: "Vincular dispositivo",
    subtitle: "Compartilhe conosco o ID do seu dispositivo",
    nextPath: "/cadastro/empresa/vinculando",
  },
};

function ChoiceError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="company-register__error" role="alert">
      {message}
    </p>
  );
}

export function CompanyRegisterForm({ step }: CompanyRegisterFormProps) {
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const {
    companyData,
    setTextField,
    setClassification,
    toggleOperationDay,
    setShiftCount,
    setShiftTime,
    toggleWaterUse,
    setWaterSource,
  } = useCompanyRegister();
  const content = stepContent[step];

  function updateTextField(field: CompanyTextField, value: string) {
    setTextField(field, sanitizePlainText(value));
    setErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateCompanyStep(step, companyData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    navigate(content.nextPath);
  }

  function renderCompanyFields() {
    return (
      <div className="company-register__fields">
        <TextInput
          id="legalName"
          label="Razão social"
          type="text"
          placeholder="Insira a razão social"
          value={companyData.legalName}
          onChange={(value) => updateTextField("legalName", value)}
          autoComplete="organization"
          maxLength={120}
          error={errors.legalName}
        />
        <TextInput
          id="tradeName"
          label="Nome fantasia"
          type="text"
          placeholder="Insira o nome fantasia"
          value={companyData.tradeName}
          onChange={(value) => updateTextField("tradeName", value)}
          maxLength={120}
          error={errors.tradeName}
        />
        <TextInput
          id="cnpj"
          label="CNPJ"
          type="text"
          placeholder="Insira o CNPJ"
          value={companyData.cnpj}
          onChange={(value) => updateTextField("cnpj", value)}
          inputMode="numeric"
          maxLength={18}
          error={errors.cnpj}
        />
        <TextInput
          id="industrySegment"
          label="Segmento industrial"
          type="text"
          placeholder="Insira o segmento industrial"
          value={companyData.industrySegment}
          onChange={(value) => updateTextField("industrySegment", value)}
          maxLength={80}
          error={errors.industrySegment}
        />
        <TextInput
          id="companySize"
          label="Porte da empresa"
          type="text"
          placeholder="Insira o porte da empresa"
          value={companyData.companySize}
          onChange={(value) => updateTextField("companySize", value)}
          maxLength={40}
          error={errors.companySize}
        />
      </div>
    );
  }

  function renderUnitFields() {
    return (
      <div className="company-register__fields">
        <TextInput
          id="unitName"
          label="Nome da unidade"
          type="text"
          placeholder="Insira o nome da unidade"
          value={companyData.unitName}
          onChange={(value) => updateTextField("unitName", value)}
          maxLength={100}
          error={errors.unitName}
        />
        <TextInput
          id="postalCode"
          label="CEP"
          type="text"
          placeholder="Insira o CEP"
          value={companyData.postalCode}
          onChange={(value) => updateTextField("postalCode", value)}
          inputMode="numeric"
          maxLength={9}
          autoComplete="postal-code"
          error={errors.postalCode}
        />
        <div className="company-register__row company-register__row--equal">
          <TextInput
            id="state"
            label="Estado"
            type="text"
            placeholder="Estado"
            value={companyData.state}
            onChange={(value) => updateTextField("state", value)}
            maxLength={2}
            autoComplete="address-level1"
            error={errors.state}
          />
          <TextInput
            id="city"
            label="Cidade"
            type="text"
            placeholder="Cidade"
            value={companyData.city}
            onChange={(value) => updateTextField("city", value)}
            maxLength={80}
            autoComplete="address-level2"
            error={errors.city}
          />
        </div>
        <div className="company-register__row company-register__row--address">
          <TextInput
            id="streetDistrict"
            label="Rua ou bairro"
            type="text"
            placeholder="Rua/Bairro"
            value={companyData.streetDistrict}
            onChange={(value) => updateTextField("streetDistrict", value)}
            maxLength={120}
            autoComplete="street-address"
            error={errors.streetDistrict}
          />
          <TextInput
            id="number"
            label="Número"
            type="text"
            placeholder="Número"
            value={companyData.number}
            onChange={(value) => updateTextField("number", value)}
            maxLength={10}
            error={errors.number}
          />
        </div>
      </div>
    );
  }

  function renderClassificationFields() {
    return (
      <fieldset className="company-register__fieldset">
        <legend className="sr-only">Tipo da indústria</legend>
        <div className="company-register__choices company-register__choices--stacked">
          {industryClassifications.map((classification, index) => (
            <label className="company-register__choice" htmlFor={`classification-${index}`} key={classification}>
              <input
                id={`classification-${index}`}
                type="radio"
                name="classification"
                value={classification}
                checked={companyData.classification === classification}
                onChange={() => setClassification(classification)}
              />
              <span>{classification}</span>
            </label>
          ))}
        </div>
        <ChoiceError message={errors.classification} />
      </fieldset>
    );
  }

  function renderOperationFields() {
    return (
      <div className="company-register__questions">
        <fieldset className="company-register__fieldset">
          <legend>Quais os dias de operação?</legend>
          <div className="company-register__choices">
            {weekDays.map((day) => (
              <label className="company-register__choice" htmlFor={`operation-day-${day.id}`} key={day.id}>
                <input
                  id={`operation-day-${day.id}`}
                  type="checkbox"
                  checked={companyData.operationDays.includes(day.id)}
                  onChange={() => toggleOperationDay(day.id)}
                />
                <span>{day.label}</span>
              </label>
            ))}
          </div>
          <ChoiceError message={errors.operationDays} />
        </fieldset>
        <fieldset className="company-register__fieldset">
          <legend>Qual o horário de funcionamento total da unidade?</legend>
          <div className="company-register__time-range">
            <label htmlFor="operation-start">
              <span className="sr-only">Horário inicial</span>
              <input
                id="operation-start"
                type="time"
                value={companyData.operationStart}
                onChange={(event) =>
                  updateTextField("operationStart", event.target.value)
                }
                aria-invalid={Boolean(errors.operationStart)}
              />
            </label>
            <span aria-hidden="true">às</span>
            <label htmlFor="operation-end">
              <span className="sr-only">Horário final</span>
              <input
                id="operation-end"
                type="time"
                value={companyData.operationEnd}
                onChange={(event) =>
                  updateTextField("operationEnd", event.target.value)
                }
                aria-invalid={Boolean(errors.operationEnd)}
              />
            </label>
          </div>
          <ChoiceError message={errors.operationStart ?? errors.operationEnd} />
        </fieldset>
      </div>
    );
  }

  function renderShiftFields() {
    return (
      <div className="company-register__questions">
        <fieldset className="company-register__fieldset">
          <legend>Qual a quantidade de turnos?</legend>
          <div className="company-register__choices">
            {([1, 2, 3, 4] as const).map((count) => (
              <label className="company-register__choice" htmlFor={`shift-count-${count}`} key={count}>
                <input
                  id={`shift-count-${count}`}
                  type="radio"
                  name="shiftCount"
                  checked={companyData.shiftCount === count}
                  onChange={() => setShiftCount(count)}
                />
                <span>{count} {count === 1 ? "Turno" : "Turnos"}</span>
              </label>
            ))}
          </div>
          <ChoiceError message={errors.shiftCount} />
        </fieldset>
        {companyData.shifts.length > 0 && (
          <fieldset className="company-register__fieldset">
            <legend>Qual o horário de funcionamento de cada turno?</legend>
            <div className="company-register__shift-list">
              {companyData.shifts.map((shift, position) => (
                <div className="company-register__shift" key={shift.id}>
                  <span>{position + 1}º turno</span>
                  <div className="company-register__time-range">
                    <label htmlFor={`shift-${shift.id}-start`}>
                      <span className="sr-only">Início do {position + 1}º turno</span>
                      <input
                        id={`shift-${shift.id}-start`}
                        type="time"
                        value={shift.start}
                        onChange={(event) =>
                          setShiftTime(shift.id, "start", event.target.value)
                        }
                      />
                    </label>
                    <span aria-hidden="true">às</span>
                    <label htmlFor={`shift-${shift.id}-end`}>
                      <span className="sr-only">Fim do {position + 1}º turno</span>
                      <input
                        id={`shift-${shift.id}-end`}
                        type="time"
                        value={shift.end}
                        onChange={(event) =>
                          setShiftTime(shift.id, "end", event.target.value)
                        }
                      />
                    </label>
                  </div>
                  <ChoiceError message={errors[`shift-${shift.id}`]} />
                </div>
              ))}
            </div>
          </fieldset>
        )}
      </div>
    );
  }

  function renderWaterFields() {
    return (
      <div className="company-register__questions">
        <fieldset className="company-register__fieldset">
          <legend>Para que a indústria usa a água?</legend>
          <div className="company-register__choices company-register__choices--grid">
            {waterUses.map((use, index) => (
              <label className="company-register__choice" htmlFor={`water-use-${index}`} key={use}>
                <input
                  id={`water-use-${index}`}
                  type="checkbox"
                  checked={companyData.waterUses.includes(use)}
                  onChange={() => toggleWaterUse(use)}
                />
                <span>{use}</span>
              </label>
            ))}
          </div>
          <ChoiceError message={errors.waterUses} />
        </fieldset>
        <fieldset className="company-register__fieldset">
          <legend>Qual é a principal fonte de água da unidade?</legend>
          <div className="company-register__choices company-register__choices--grid">
            {waterSources.map((source, index) => (
              <label className="company-register__choice" htmlFor={`water-source-${index}`} key={source}>
                <input
                  id={`water-source-${index}`}
                  type="radio"
                  name="waterSource"
                  checked={companyData.waterSource === source}
                  onChange={() => setWaterSource(source)}
                />
                <span>{source}</span>
              </label>
            ))}
          </div>
          <ChoiceError message={errors.waterSource} />
        </fieldset>
      </div>
    );
  }

  function renderConsumptionFields() {
    return (
      <div className="company-register__questions">
        <div className="company-register__labeled-field">
          <p>Qual o consumo médio mensal?</p>
          <TextInput
            id="averageMonthlyConsumption"
            label="Consumo médio mensal"
            type="text"
            placeholder="Ex. 850 m³ / mês"
            value={companyData.averageMonthlyConsumption}
            onChange={(value) =>
              updateTextField("averageMonthlyConsumption", value)
            }
            inputMode="decimal"
            maxLength={20}
            error={errors.averageMonthlyConsumption}
          />
        </div>
      </div>
    );
  }

  function renderDeviceFields() {
    return (
      <div className="company-register__questions">
        <div className="company-register__labeled-field">
          <p>ID do hidrômetro</p>
          <TextInput
            id="deviceId"
            label="ID do hidrômetro"
            type="text"
            placeholder="Ex. DELTA-ESP32-000184"
            value={companyData.deviceId}
            onChange={(value) => updateTextField("deviceId", value)}
            maxLength={40}
            error={errors.deviceId}
          />
        </div>
      </div>
    );
  }

  const fieldsByStep: Record<CompanyRegisterStep, () => JSX.Element> = {
    company: renderCompanyFields,
    unit: renderUnitFields,
    classification: renderClassificationFields,
    operation: renderOperationFields,
    shifts: renderShiftFields,
    water: renderWaterFields,
    consumption: renderConsumptionFields,
    device: renderDeviceFields,
  };

  return (
    <section className="company-register" aria-labelledby={`company-${step}-title`}>
      <header className="company-register__header">
        <h1 id={`company-${step}-title`}>{content.title}</h1>
        <p>{content.subtitle}</p>
        {step === "company" && (
          <div className="company-register__login">
            <span>Já possui uma conta?</span>
            <button type="button" onClick={() => navigate("/login")}>
              Faça login
            </button>
          </div>
        )}
      </header>

      <form className="company-register__form" onSubmit={handleSubmit} noValidate>
        {fieldsByStep[step]()}
        <RegisterButton>
          {step === "device" ? "Vincular dispositivo" : "Continuar"}
        </RegisterButton>
      </form>
    </section>
  );
}
