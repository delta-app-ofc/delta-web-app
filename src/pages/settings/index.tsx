import { FormEvent, useEffect, useId, useMemo, useRef, useState } from "react";

import { AppSidebar } from "../../components/AppSidebar";
import { AsyncFeedback } from "../../components/AsyncFeedback";
import { LoadingLogo } from "../../components/LoadingLogo";
import { ThemeToggle } from "../../components/ThemeToggle";
import arrowIcon from "../../assets/settings/Arrow 1.png";
import organizationIcon from "../../assets/settings/organizations.png";
import settingsIcon from "../../assets/settings/settings.png";
import xIcon from "../../assets/settings/x.png";
import { useDialogFocus } from "../../hooks/useDialogFocus";
import { useSettingsData } from "../../hooks/useSettingsData";
import { useAuth } from "../../contexts/AuthContext/useAuth";
import { deleteCurrentUser, updateCurrentUser } from "../../services/auth";
import { updateOrganization } from "../../services/organizations";
import { ApiError } from "../../services/http";
import type { Organization, OrganizationSegment } from "../../types/organization";
import type { UserSettings } from "../../types/userSettings";
import { validateOrganization, validateProfile } from "../../utils/settingsValidation";
import { useNavigate } from "react-router-dom";

import "./style.css";

const organizationSegments: readonly { value: OrganizationSegment; label: string }[] = [
  { value: "VAREJO", label: "Varejo" },
  { value: "INDUSTRIA", label: "Indústria" },
  { value: "CONDOMINIO", label: "Condomínio" },
  { value: "FACILITIES", label: "Facilities" },
];

const preferenceOptions = {
  language: [
    { value: "pt-BR", label: "Português (Brasil)" },
    { value: "en", label: "English" },
    { value: "es", label: "Español" },
  ],
  timezone: [
    { value: "America/Sao_Paulo", label: "América/São Paulo (GMT-3)" },
    { value: "America/Manaus", label: "América/Manaus (GMT-4)" },
    { value: "UTC", label: "UTC" },
  ],
  dateFormat: [
    { value: "DD/MM/YYYY", label: "DD/MM/AAAA" },
    { value: "MM/DD/YYYY", label: "MM/DD/AAAA" },
    { value: "YYYY-MM-DD", label: "AAAA-MM-DD" },
  ],
  unit: [
    { value: "m3", label: "Metros cúbicos (m³)" },
    { value: "L", label: "Litros (L)" },
    { value: "US_GAL", label: "Galões (US gal)" },
  ],
} as const;

interface SettingsSelectProps {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
  className?: string;
}

interface OrganizationForm {
  legalName: string;
  tradeName: string;
  cnpj: string;
  segment: string;
  declaredUnitCount: string;
}

function SettingsSelect({ label, value, options, onChange, className = "" }: SettingsSelectProps) {
  const [open, setOpen] = useState(false);
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
    requestAnimationFrame(() => optionRefs.current[selectedIndex]?.focus());
  }, [open, options, value]);

  function closeAndReturnFocus() {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function handleOptionKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowDown") next = (index + 1) % options.length;
    else if (event.key === "ArrowUp") next = (index + options.length - 1) % options.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = options.length - 1;
    else if (event.key === "Escape") { event.preventDefault(); closeAndReturnFocus(); return; }
    else return;
    event.preventDefault();
    optionRefs.current[next]?.focus();
  }

  return (
    <div className={`settings-custom-select ${open ? "settings-custom-select--open" : ""} ${className}`} ref={rootRef}>
      <div className="settings-custom-select__field">
        <span>{options.find((option) => option.value === value)?.label ?? value}</span>
        <button ref={triggerRef} type="button" aria-label={`Abrir opções de ${label}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={listboxId} onClick={() => setOpen((current) => !current)} onKeyDown={(event) => { if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) { event.preventDefault(); setOpen(true); } }}>
          <img src={arrowIcon} alt="" />
        </button>
      </div>
      {open && (
        <div className="settings-custom-select__options" id={listboxId} role="listbox" aria-label={label}>
          {options.map((option, index) => (
            <button
              ref={(element) => { optionRefs.current[index] = element; }}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={option.value === value ? "selected" : ""}
              key={option.value}
              onClick={() => { onChange(option.value); closeAndReturnFocus(); }}
              onKeyDown={(event) => handleOptionKeyDown(event, index)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    birthDate: "",
  });
  const [settingsRequestVersion, setSettingsRequestVersion] = useState(0);
  const settingsState = useSettingsData(settingsRequestVersion);
  const [profileSaving, setProfileSaving] = useState(false);
  const profileRequestRef = useRef<AbortController | null>(null);
  const organizationRequestRef = useRef<AbortController | null>(null);
  const [organizationOpen, setOrganizationOpen] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizationDraft, setOrganizationDraft] = useState<OrganizationForm>({ legalName: "", tradeName: "", cnpj: "", segment: "", declaredUnitCount: "" });
  const [organizationSaving, setOrganizationSaving] = useState(false);
  const [generalOpen, setGeneralOpen] = useState(false);
  const [general, setGeneral] = useState<UserSettings>({ language: "pt-BR", timezone: "America/Sao_Paulo", dateFormat: "DD/MM/YYYY", unit: "m3" });
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState("");
  const deleteAccountRequestRef = useRef<AbortController | null>(null);
  const [feedback, setFeedback] = useState("");
  const [formError, setFormError] = useState("");
  const generalDialogRef = useDialogFocus<HTMLElement>(generalOpen, () => setGeneralOpen(false));
  const deleteDialogRef = useDialogFocus<HTMLFormElement>(deleteAccountModalOpen, closeDeleteAccountModal);

  useEffect(() => () => { profileRequestRef.current?.abort(); organizationRequestRef.current?.abort(); deleteAccountRequestRef.current?.abort(); }, []);

  useEffect(() => {
    if (settingsState.status !== "success") return;
    setProfile({
      name: settingsState.user.name,
      email: settingsState.user.email,
      phone: settingsState.user.phone ?? "",
      birthDate: settingsState.user.birthDate ?? "",
    });
    const firstOrganization = settingsState.organizations[0];
    if (firstOrganization) {
      setOrganization(firstOrganization);
      setOrganizationDraft({
        legalName: firstOrganization.corporateName,
        tradeName: firstOrganization.tradeName,
        cnpj: firstOrganization.cnpj,
        segment: firstOrganization.businessSegment ?? "",
        declaredUnitCount: firstOrganization.declaredUnitCount === null ? "" : String(firstOrganization.declaredUnitCount),
      });
    } else {
      setOrganization(null);
      setOrganizationDraft({ legalName: "", tradeName: "", cnpj: "", segment: "", declaredUnitCount: "" });
    }
  }, [settingsState]);

  const generalSummary = useMemo(
    () => `${preferenceOptions.language.find((item) => item.value === general.language)?.label ?? general.language} · ${preferenceOptions.timezone.find((item) => item.value === general.timezone)?.label ?? general.timezone}`,
    [general.language, general.timezone],
  );

  function saveGeneralPreferences() {
    setGeneralOpen(false);
    showFeedback("Preferências aplicadas nesta sessão.");
  }

  function showFeedback(message: string) {
    setFormError("");
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 3000);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateProfile(profile);
    if (error) { setFormError(error); return; }
    if (!profile.birthDate) { setFormError("A data de nascimento do perfil não foi disponibilizada pela API."); return; }
    profileRequestRef.current?.abort();
    const controller = new AbortController();
    profileRequestRef.current = controller;
    setProfileSaving(true);
    try {
      const updated = await updateCurrentUser(profile, controller.signal);
      if (!controller.signal.aborted) {
        setProfile({ name: updated.name, email: updated.email, phone: updated.phone ?? "", birthDate: updated.birthDate ?? "" });
        showFeedback("Alterações do perfil salvas.");
      }
    } catch (requestError: unknown) {
      if (!controller.signal.aborted) setFormError(requestError instanceof ApiError ? requestError.message : "Não foi possível salvar o perfil.");
    } finally {
      if (profileRequestRef.current === controller) profileRequestRef.current = null;
      if (!controller.signal.aborted) setProfileSaving(false);
    }
  }

  function openOrganization() {
    setFormError("");
    if (!organization) { setFormError("Nenhuma organização está associada à sua conta."); return; }
    setOrganizationDraft({
      legalName: organization.corporateName,
      tradeName: organization.tradeName,
      cnpj: organization.cnpj,
      segment: organization.businessSegment ?? "",
      declaredUnitCount: organization.declaredUnitCount === null ? "" : String(organization.declaredUnitCount),
    });
    setOrganizationOpen(true);
  }

  function closeOrganization() {
    if (organization) setOrganizationDraft({ legalName: organization.corporateName, tradeName: organization.tradeName, cnpj: organization.cnpj, segment: organization.businessSegment ?? "", declaredUnitCount: organization.declaredUnitCount === null ? "" : String(organization.declaredUnitCount) });
    setOrganizationOpen(false);
  }

  async function saveOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organization) { setFormError("Nenhuma organização está associada à sua conta."); return; }
    const error = validateOrganization(organizationDraft);
    if (error) { setFormError(error); return; }
    const count = organizationDraft.declaredUnitCount.trim() ? Number(organizationDraft.declaredUnitCount) : null;
    if (count !== null && (!Number.isSafeInteger(count) || count <= 0)) { setFormError("A quantidade de unidades deve ser um número inteiro maior que zero."); return; }
    organizationRequestRef.current?.abort();
    const controller = new AbortController();
    organizationRequestRef.current = controller;
    setOrganizationSaving(true);
    setFormError("");
    try {
      const updated = await updateOrganization(organization.id, {
        corporateName: organizationDraft.legalName,
        tradeName: organizationDraft.tradeName,
        cnpj: organizationDraft.cnpj,
        businessSegment: organizationDraft.segment as OrganizationSegment,
        declaredUnitCount: count,
      }, controller.signal);
      if (!controller.signal.aborted) {
        setOrganization(updated);
        setOrganizationOpen(false);
        showFeedback("Dados da organização salvos.");
      }
    } catch (requestError: unknown) {
      if (!controller.signal.aborted) setFormError(requestError instanceof ApiError ? requestError.message : "Não foi possível salvar a organização.");
    } finally {
      if (organizationRequestRef.current === controller) organizationRequestRef.current = null;
      if (!controller.signal.aborted) setOrganizationSaving(false);
    }
  }

  function openDeleteAccountModal() {
    setDeleteAccountError("");
    setDeleteAccountModalOpen(true);
  }

  function handleSignOut() {
    signOut();
    navigate("/login", { replace: true });
  }

  function closeDeleteAccountModal() {
    if (deleteAccountLoading) return;
    setDeleteAccountModalOpen(false);
    setDeleteAccountError("");
  }

  async function confirmAccountDeletion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (deleteAccountRequestRef.current) return;
    const controller = new AbortController();
    deleteAccountRequestRef.current = controller;
    setDeleteAccountLoading(true);
    setDeleteAccountError("");
    try {
      await deleteCurrentUser(controller.signal);
      if (controller.signal.aborted) return;
      signOut();
      navigate("/login", { replace: true, state: { notice: "Sua conta foi desativada. Os dados associados foram preservados." } });
    } catch (requestError: unknown) {
      if (!controller.signal.aborted) {
        setDeleteAccountError(requestError instanceof ApiError ? requestError.message : "Não foi possível excluir a conta. Tente novamente.");
      }
    } finally {
      if (deleteAccountRequestRef.current === controller) deleteAccountRequestRef.current = null;
      if (!controller.signal.aborted) setDeleteAccountLoading(false);
    }
  }

  return (
    <main className="settings-page">
      <div className="settings-page__sidebar">
        <AppSidebar label="Navegação principal" />
      </div>

      <section id="page-content" tabIndex={-1} className={`settings-page__content${settingsState.status !== "success" ? " settings-page__content--pending" : ""}`} aria-labelledby="settings-title">
        <header className="settings-header">
          <div>
            <h1 id="settings-title">Configurações</h1>
            <p>Gerencie seu perfil, preferências e segurança.</p>
          </div>
          {feedback && <span className="settings-feedback" role="status">{feedback}</span>}
          {formError && <span className="settings-feedback settings-feedback--error" role="alert">{formError}</span>}
        </header>

        {settingsState.status === "loading" && <div className="settings-page__loading" role="status" aria-live="polite"><LoadingLogo /><p>Carregando configurações…</p></div>}
        {settingsState.status === "error" && <div className="settings-page__load-error"><AsyncFeedback status="error" message={settingsState.error} onRetry={() => setSettingsRequestVersion((version) => version + 1)} /></div>}
        {settingsState.status === "success" && <>
        {settingsState.warnings.map((warning) => <p className="settings-data-warning" role="alert" key={warning}>{warning}</p>)}

        <div className="settings-top-grid">
          <form className="settings-card settings-profile" onSubmit={saveProfile}>
            <h2>Perfil do gestor</h2>
            <div className="settings-field-label"><label htmlFor="settings-profile-name">Nome completo</label><input id="settings-profile-name" value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} maxLength={100} required /></div>
            <div className="settings-field-label"><label htmlFor="settings-profile-email">E-mail</label><input id="settings-profile-email" type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} maxLength={255} required /></div>
            <div className="settings-field-label"><label htmlFor="settings-profile-phone">Telefone</label><input id="settings-profile-phone" type="tel" value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} maxLength={20} /></div>
            <button className="settings-primary-button" type="submit" disabled={profileSaving || settingsState.status !== "success"}>{profileSaving ? "Salvando…" : "Salvar alterações"}</button>
          </form>

          <section className="settings-card settings-preferences" aria-labelledby="preferences-title">
            <div className="settings-card-title"><h2 id="preferences-title">Organização e preferências</h2></div>
            {organizationOpen ? (
              <form className="settings-organization-editor" onSubmit={saveOrganization}>
                <header>
                  <h3>Organização</h3>
                  <button className="settings-icon-button" type="button" aria-label="Fechar edição da organização" onClick={closeOrganization}><img src={xIcon} alt="" /></button>
                </header>
                <div className="settings-field-label"><label htmlFor="settings-legal-name">Razão social</label><input id="settings-legal-name" value={organizationDraft.legalName} onChange={(event) => setOrganizationDraft({ ...organizationDraft, legalName: event.target.value })} maxLength={150} required /></div>
                <div className="settings-field-label"><label htmlFor="settings-trade-name">Nome fantasia</label><input id="settings-trade-name" value={organizationDraft.tradeName} onChange={(event) => setOrganizationDraft({ ...organizationDraft, tradeName: event.target.value })} maxLength={150} required /></div>
                <div className="settings-field-label"><label htmlFor="settings-cnpj">CNPJ</label><input id="settings-cnpj" value={organizationDraft.cnpj} onChange={(event) => setOrganizationDraft({ ...organizationDraft, cnpj: event.target.value.replace(/\D/g, "").slice(0, 14) })} inputMode="numeric" maxLength={14} required /></div>
                <div className="settings-field-label"><label htmlFor="settings-segment">Segmento de negócio</label><select id="settings-segment" value={organizationDraft.segment} onChange={(event) => setOrganizationDraft({ ...organizationDraft, segment: event.target.value })} required><option value="">Selecione o segmento</option>{organizationSegments.map((segment) => <option key={segment.value} value={segment.value}>{segment.label}</option>)}</select></div>
                <div className="settings-field-label"><label htmlFor="settings-unit-count">Unidades declaradas</label><input id="settings-unit-count" type="number" inputMode="numeric" min={1} step={1} value={organizationDraft.declaredUnitCount} onChange={(event) => setOrganizationDraft({ ...organizationDraft, declaredUnitCount: event.target.value })} /></div>
                <footer><button className="settings-secondary-button" type="button" onClick={closeOrganization} disabled={organizationSaving}>Cancelar</button><button className="settings-primary-button" type="submit" disabled={organizationSaving}>{organizationSaving ? "Salvando…" : "Salvar alterações"}</button></footer>
              </form>
            ) : (
              <div className="settings-preference-row">
                <img src={organizationIcon} alt="" />
                <div><strong>Organização</strong><span>{organization?.tradeName ?? "Não disponível"}</span></div>
                <button className="settings-row-arrow" type="button" aria-label="Editar organização" onClick={openOrganization} disabled={!organization}><img className="settings-inline-arrow" src={arrowIcon} alt="" /></button>
              </div>
            )}
            <div className="settings-preference-row">
              <img src={settingsIcon} alt="" /><div><strong>Configurações gerais</strong><span>{generalSummary} · Aplicadas nesta sessão</span></div>
              <button className="settings-row-arrow" type="button" aria-label="Editar configurações gerais" onClick={() => setGeneralOpen(true)}><img className="settings-inline-arrow" src={arrowIcon} alt="" /></button>
            </div>
            <div className="settings-preference-row settings-theme-row">
              <img src={settingsIcon} alt="" /><div><strong>Aparência</strong><span>Escolha entre os temas claro e escuro</span></div>
              <ThemeToggle />
            </div>
          </section>
        </div>

        <section className="settings-section settings-data" aria-labelledby="data-title">
          <h2 id="data-title">Dados</h2>
          <section className="settings-card">
            <div className="settings-card-title settings-danger-title"><h3>Dados &amp; privacidade</h3></div>
            <div className="data-row"><div><strong>Sair da conta</strong><span>Encerra sua sessão neste dispositivo. Sua conta e seus dados permanecem.</span></div><button className="settings-secondary-button" type="button" onClick={handleSignOut}>Sair</button></div>
            <div className="data-row"><div><strong>Excluir conta</strong><span>Desativa o acesso à conta; os dados associados são preservados.</span></div><button className="settings-danger-button" type="button" onClick={openDeleteAccountModal}>Excluir</button></div>
          </section>
        </section>
        </>}
      </section>

      {generalOpen && <div className="settings-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setGeneralOpen(false); }}>
        <section ref={generalDialogRef} className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="general-settings-title">
          <header><h2 id="general-settings-title">Configurações gerais</h2><button className="settings-icon-button" type="button" aria-label="Fechar" onClick={() => setGeneralOpen(false)}><img src={xIcon} alt="" /></button></header>
          <p>Essas opções são aplicadas apenas durante esta sessão.</p>
          <div className="settings-field-label"><span>Idioma</span><SettingsSelect label="Idioma" value={general.language} options={preferenceOptions.language} onChange={(value) => setGeneral((current) => ({ ...current, language: value as UserSettings["language"] }))} /></div>
          <div className="settings-field-label"><span>Fuso horário</span><SettingsSelect label="Fuso horário" value={general.timezone} options={preferenceOptions.timezone} onChange={(value) => setGeneral((current) => ({ ...current, timezone: value as UserSettings["timezone"] }))} /></div>
          <div className="settings-field-label"><span>Formato de data</span><SettingsSelect label="Formato de data" value={general.dateFormat} options={preferenceOptions.dateFormat} onChange={(value) => setGeneral((current) => ({ ...current, dateFormat: value as UserSettings["dateFormat"] }))} /></div>
          <div className="settings-field-label"><span>Unidade de medida</span><SettingsSelect label="Unidade de medida" value={general.unit} options={preferenceOptions.unit} onChange={(value) => setGeneral((current) => ({ ...current, unit: value as UserSettings["unit"] }))} /></div>
          <footer><button className="settings-secondary-button" type="button" onClick={() => setGeneralOpen(false)}>Cancelar</button><button className="settings-primary-button" type="button" onClick={saveGeneralPreferences}>Aplicar</button></footer>
        </section>
      </div>}

      {deleteAccountModalOpen && <div className="settings-modal-backdrop settings-modal-backdrop--centered" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDeleteAccountModal(); }}>
        <form ref={deleteDialogRef} className="settings-modal settings-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-account-title" aria-describedby="delete-account-description" onSubmit={confirmAccountDeletion}>
          <header><div><h2 id="delete-account-title">Excluir conta</h2><p id="delete-account-description">O acesso será desativado e você sairá da conta. Os dados associados serão preservados no sistema. Esta ação não pode ser revertida pelo aplicativo.</p></div><button className="settings-icon-button" type="button" aria-label="Fechar" onClick={closeDeleteAccountModal} disabled={deleteAccountLoading}><img src={xIcon} alt="" /></button></header>
          {deleteAccountError && <p className="settings-form-error" role="alert">{deleteAccountError}</p>}
          <footer><button className="settings-secondary-button" type="button" onClick={closeDeleteAccountModal} disabled={deleteAccountLoading}>Cancelar</button><button className="settings-danger-button" type="submit" disabled={deleteAccountLoading}>{deleteAccountLoading ? "Excluindo…" : "Excluir conta"}</button></footer>
        </form>
      </div>}
    </main>
  );
}
