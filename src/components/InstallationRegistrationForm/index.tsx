import { useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link } from "react-router-dom";
import backArrow from "../../assets/installation-registration/back-arrow.svg";
import unitChevron from "../../assets/installation-registration/unit-chevron.svg";
import { brazilianStates, initialRegistrationData, tariffClassifications } from "../../types/installationRegistration";
import { configuredTariffRegions } from "../../services/tariffRegions";
import type { InstallationRegistrationData, RegistrationErrors, RegistrationField } from "../../types/installationRegistration";
import { formatCep, RegistrationSubmitError, validateRegistration } from "../../utils/installationRegistration";
import styles from "./styles.module.css";

interface InstallationRegistrationFormProps {
  onSave?: (data: InstallationRegistrationData) => Promise<void>;
  mode?: "create" | "edit";
  initialData?: InstallationRegistrationData;
  installationName?: string;
  returnTo?: string;
  apiConnected?: boolean;
}

function Field({ name, label, error, children }: {
  name: RegistrationField; label: string; error?: string; children: ReactNode;
}) {
  return <div className={styles.field}>
    <label className="sr-only" htmlFor={`installation-${name}`}>{label}</label>
    {children}
    {error && <p className={styles.fieldError} id={`installation-${name}-error`}>{error}</p>}
  </div>;
}

export function InstallationRegistrationForm({ onSave, mode = "create", initialData = initialRegistrationData, installationName, returnTo = "/instalacoes", apiConnected = false }: InstallationRegistrationFormProps) {
  const editing = mode === "edit";
  const [data, setData] = useState<InstallationRegistrationData>(initialData);
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [partialId, setPartialId] = useState<number>();
  const [regions] = useState(() => {
    try { return configuredTariffRegions(); } catch { return []; }
  });
  const submitting = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  function update(name: RegistrationField, value: string) {
    setData((previous) => ({ ...previous, [name]: name === "cep" ? formatCep(value) : value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
    setMessage("");
  }

  function attributes(name: RegistrationField) {
    return {
      id: `installation-${name}`, name, value: data[name] ?? "", disabled: saving,
      "aria-invalid": Boolean(errors[name]),
      "aria-describedby": [
        name === "monthlyConsumption" ? "installation-monthlyConsumption-help" : undefined,
        name === "deviceId" && editing ? "installation-device-help" : undefined,
        errors[name] ? `installation-${name}-error` : undefined,
      ].filter(Boolean).join(" ") || undefined,
      onChange: (event: { target: { value: string } }) => update(name, event.target.value),
    };
  }

  function focusFirstError() {
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const validation = validateRegistration(data, mode, apiConnected);
    setErrors(validation);
    setMessage("");
    if (Object.keys(validation).length) { focusFirstError(); return; }
    if (!onSave) {
      setMessage(`${editing ? "O salvamento das alterações" : "O cadastro"} está indisponível no momento. Os dados permanecem neste formulário enquanto você estiver nesta página.`);
      return;
    }
    submitting.current = true;
    setSaving(true);
    try { await onSave({ ...data, name: data.name.trim(), city: data.city.trim() }); }
    catch (error: unknown) {
      if (error instanceof RegistrationSubmitError && error.installationId) setPartialId(error.installationId);
      if (error instanceof RegistrationSubmitError && error.field) {
        setErrors({ [error.field]: error.message }); focusFirstError();
      } else setMessage(error instanceof RegistrationSubmitError ? error.message : "Não foi possível salvar a instalação. Tente novamente.");
    } finally { submitting.current = false; setSaving(false); }
  }

  return <div className={`${styles.registration} ${editing ? styles.editing : ""} ${apiConnected ? styles.connected : ""}`}>
    <Link className={styles.back} to={returnTo} aria-label={editing ? "Voltar para detalhes da instalação" : "Voltar para Instalações"} aria-disabled={saving || undefined} onClick={(event) => { if (saving) event.preventDefault(); }}>
      <span className={styles.arrow}><img src={backArrow} alt="" /></span><span>{editing ? `Editar - ${installationName || initialData.name || "Instalação"}` : "Nova instalação"}</span>
    </Link>
    <form ref={formRef} className={styles.form} noValidate onSubmit={submit} aria-busy={saving}>
      <fieldset className={`${styles.card} ${styles.general}`} disabled={saving} aria-labelledby="general-title">
        <h2 id="general-title">Dados gerais</h2>
        <div className={styles.fields}>
          <Field name="name" label="Nome da unidade" error={errors.name}><input {...attributes("name")} placeholder="Nome da unidade" maxLength={100} autoComplete="organization" required /></Field>
          <Field name="type" label="Tipo de imóvel" error={errors.type}><select {...attributes("type")} required><option value="" disabled>Tipo de imóvel</option><option value="CASA">Casa</option><option value="PRÉDIO">Prédio</option></select></Field>
          <Field name="cep" label="CEP" error={errors.cep}><input {...attributes("cep")} placeholder="Insira o CEP" inputMode="numeric" autoComplete="postal-code" maxLength={9} required /></Field>
          <div className={styles.cityState}>
            <Field name="city" label="Cidade" error={errors.city}><input {...attributes("city")} placeholder="Cidade" autoComplete="address-level2" maxLength={60} required /></Field>
            <Field name="state" label="Estado" error={errors.state}><select {...attributes("state")} autoComplete="address-level1" required><option value="" disabled>Estado</option>{brazilianStates.map((state) => <option key={state} value={state}>{state}</option>)}</select></Field>
          </div>
          {apiConnected && <>
            <Field name="classification" label="Classificação tarifária" error={errors.classification}><select {...attributes("classification")} required><option value="" disabled>Classificação tarifária</option>{tariffClassifications.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
            <Field name="regionId" label="Região tarifária" error={errors.regionId}><select {...attributes("regionId")} required><option value="" disabled>Região tarifária</option>{initialData.regionId && !regions.some(item => String(item.id) === initialData.regionId) && <option value={initialData.regionId}>Região atual</option>}{regions.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
          </>}
        </div>
      </fieldset>
      <fieldset className={`${styles.card} ${styles.consumption}`} disabled={saving} aria-labelledby="consumption-title">
        <h2 id="consumption-title">Consumo</h2>
        <div className={styles.fields}>
          <Field name="monthlyConsumption" label="Consumo mensal em metros cúbicos (opcional)" error={errors.monthlyConsumption}>
            <input {...attributes("monthlyConsumption")} placeholder={apiConnected ? "Sem leituras disponíveis" : "Consumo mensal (m³)"} readOnly={apiConnected} inputMode="decimal" maxLength={16} />
            <p className={editing && !apiConnected ? "sr-only" : styles.hint} id="installation-monthlyConsumption-help">{apiConnected ? "O consumo é calculado a partir das leituras do hidrômetro e não pode ser editado aqui." : "Deixe em branco se a unidade ainda não tem histórico de leituras."}</p>
          </Field>
          {editing ? <div className={styles.unit}>
            <label className="sr-only" htmlFor="installation-consumption-unit">Unidade do consumo</label>
            <select id="installation-consumption-unit" defaultValue="m3" disabled={saving}><option value="m3">Metros cúbicos</option></select>
            <img src={unitChevron} alt="" />
          </div> : <Field name="monthlyGoal" label="Meta mensal em metros cúbicos" error={errors.monthlyGoal}><input {...attributes("monthlyGoal")} placeholder={apiConnected ? "Meta ainda indisponível" : "Meta mensal"} disabled={saving || apiConnected} inputMode="decimal" maxLength={16} required={!apiConnected} />{apiConnected && <p className={styles.hint}>O cadastro de metas ainda não está disponível.</p>}</Field>}
        </div>
      </fieldset>
      <fieldset className={`${styles.card} ${styles.device} ${errors.deviceId ? styles.invalidCard : ""}`} disabled={saving} aria-labelledby="device-title">
        <h2 id="device-title">{editing && apiConnected ? "Cadastrar outro dispositivo" : "Vincular dispositivo"}</h2>
        <label className={editing && errors.deviceId ? "sr-only" : styles.deviceLabel} htmlFor="installation-deviceId">ID do hidrômetro</label>
        {editing && errors.deviceId && <p className={styles.deviceErrorTitle} id="installation-deviceId-error">{errors.deviceId}</p>}
        <input {...attributes("deviceId")} className={styles.deviceInput} placeholder="Ex. DELTA-ESP32-000184" autoCapitalize="none" spellCheck={false} maxLength={100} required={!editing} />
        {!editing && errors.deviceId && <p className={styles.fieldError} id="installation-deviceId-error">{errors.deviceId}</p>}
        {editing && <p className={styles.hint} id="installation-device-help">{apiConnected ? "Opcional. Informe um dispositivo novo para cadastrá-lo nesta instalação. Os dispositivos atuais serão mantidos." : "O vínculo atual ainda não está disponível para consulta. Deixe em branco para mantê-lo."}</p>}
      </fieldset>
      {message && <p className={styles.feedback} role="alert">{message}</p>}
      {partialId && <p className={styles.feedback}><Link to={`/instalacoes/${partialId}`}>Conferir os dados da instalação</Link></p>}
      <div className={styles.actions}>
        {saving ? <button className={styles.cancel} type="button" disabled>Cancelar</button> : <Link className={styles.cancel} to={returnTo}>Cancelar</Link>}
        <button className={styles.save} type="submit" disabled={saving}>{saving ? "Salvando…" : editing ? "Salvar alterações" : "Salvar instalação"}</button>
      </div>
    </form>
  </div>;
}
