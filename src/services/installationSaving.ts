import type { InstallationRegistrationData, RegistrationField } from "../types/installationRegistration";
import type { InstallationRecord } from "../types/installation";
import { isRecord, readId } from "../utils/apiValidation";
import { formatCep, normalizeState, parseCubicMeters, RegistrationSubmitError, validateRegistration } from "../utils/installationRegistration";
import { listAddresses } from "./addresses";
import { getCurrentUser } from "./auth";
import { ApiError, writeJson } from "./http";
import { getInstallation } from "./installations";
import { listOrganizations } from "./organizations";
import { verifyTariffRegion } from "./tariffRegions";
import { saveMonthlyGoal } from "./propertyGoal";

function validate(data: InstallationRegistrationData, mode: "create" | "edit") {
  const errors = validateRegistration(data, mode, true);
  const field = Object.keys(errors)[0] as RegistrationField | undefined;
  if (field) throw new RegistrationSubmitError(errors[field]!, field);
}

function addressBody(data: InstallationRegistrationData) {
  return { cep: data.cep.replace(/\D/g, ""), city: data.city.trim(), state: data.state };
}

function propertyBody(data: InstallationRegistrationData, addressId: number, original?: InstallationRecord, organizationId?: number) {
  return {
    name: data.name.trim(), type: data.type, classification: data.classification, addressId,
    ...(original ? { organizationId: original.organizationId ?? null, builtAreaM2: original.builtAreaM2 ?? null } : organizationId === undefined ? {} : { organizationId }),
  };
}

function completePropertyBody(data: InstallationRegistrationData, organizationId?: number) {
  return {
    name: data.name.trim(), type: data.type, classification: data.classification,
    ...(organizationId === undefined ? {} : { organizationId }),
  };
}

function createdId(value: unknown) {
  if (!isRecord(value)) throw new Error("Resposta inválida.");
  return readId(value.id);
}

function generalSignature(data: InstallationRegistrationData) {
  return JSON.stringify({ ...addressBody(data), name: data.name.trim(), type: data.type, classification: data.classification });
}

function deviceError(error: unknown, id: number): RegistrationSubmitError {
  const message = error instanceof ApiError && error.status === 409
    ? "Este ID de hidrômetro já está cadastrado. Informe outro dispositivo; a instalação já foi salva."
    : "A instalação foi salva, mas não foi possível confirmar o cadastro do hidrômetro. Confira a instalação antes de tentar novamente.";
  return new RegistrationSubmitError(message, "deviceId", id);
}

async function completeFirstRegistration(data: InstallationRegistrationData, organizationId: number | undefined, userId: number, signal: AbortSignal): Promise<number> {
  const result = await writeJson("POST", "/delta/auth/complete-registration", {
    address: addressBody(data),
    property: completePropertyBody(data, organizationId),
    habits: [],
  }, signal);
  if (!isRecord(result) || !isRecord(result.property)) throw new ApiError("A API não confirmou a criação da instalação.");
  const propertyId = readId(result.property.id);
  if (result.userId !== undefined && readId(result.userId) !== userId) throw new ApiError("A API retornou um cadastro de outro usuário.");
  return propertyId;
}

async function validateRegion(id: number, signal: AbortSignal) {
  try { await verifyTariffRegion(id, signal); }
  catch (error) {
    if (error instanceof ApiError && (error.status === 400 || error.status === 404)) {
      throw new RegistrationSubmitError("Não há tarifa disponível para a região selecionada. Confira a região tarifária.", "regionId");
    }
    throw error;
  }
}

async function registerDevice(propertyId: number, deviceId: string, signal: AbortSignal) {
  const value = await writeJson("POST", "/delta/device", { propertyId, deviceId, isActive: true }, signal);
  if (!isRecord(value) || value.propertyId !== propertyId || value.deviceId !== deviceId) throw new ApiError("O cadastro do dispositivo não pôde ser confirmado.");
  readId(value.id);
}

export function createInstallationWorkflow() {
  let userId: number | undefined;
  let address: { id: number; signature: string } | undefined;
  let propertyId: number | undefined;
  let lastProperty: string | undefined;
  let uncertainPost = false;
  let uncertainDevice: string | undefined;
  async function post(path: string, body: unknown, signal: AbortSignal) {
    try { return createdId(await writeJson("POST", path, body, signal)); }
    catch (error) {
      if (!(error instanceof ApiError) || error.status === null || error.status >= 500 || signal.aborted) uncertainPost = true;
      throw error;
    }
  }
  async function postComplete(data: InstallationRegistrationData, organizationId: number | undefined, userId: number, signal: AbortSignal) {
    try { return await completeFirstRegistration(data, organizationId, userId, signal); }
    catch (error) {
      if (!(error instanceof ApiError) || error.status === null || error.status >= 500 || signal.aborted) uncertainPost = true;
      throw error;
    }
  }
  return async (data: InstallationRegistrationData, signal: AbortSignal): Promise<number> => {
    validate(data, "create");
    if (uncertainPost) throw new RegistrationSubmitError("Não foi possível confirmar a tentativa anterior. Confira a lista de instalações antes de iniciar outro cadastro.", undefined, propertyId);
    const user = await getCurrentUser(signal);
    if (userId !== undefined && userId !== user.id) throw new RegistrationSubmitError("A conta mudou. Reabra o cadastro para continuar.");
    userId = user.id;
    const organizations = await listOrganizations(signal);
    const organizationId = organizations.length === 1 ? organizations[0].id : undefined;
    if (propertyId !== undefined) await getInstallation(propertyId, signal);
    try {
      await validateRegion(Number(data.regionId), signal);
      if (propertyId === undefined) {
        // O contrato exige que addressId já esteja vinculado ao usuário.
        // O complete-registration faz o vínculo de endereço e propriedade
        // atomicamente, inclusive para usuários que já possuem instalações.
        propertyId = await postComplete(data, organizationId, user.id, signal);
        lastProperty = "complete-registration";
      } else if (lastProperty !== "complete-registration") {
        const signature = JSON.stringify(addressBody(data));
        if (!address || address.signature !== signature) address = { id: await post("/delta/address", addressBody(data), signal), signature };
        const body = propertyBody(data, address.id, undefined, organizationId);
        // O POST de propriedade cria a associação; confirma-a antes de cadastrar o dispositivo.
        const current = await getInstallation(propertyId, signal);
        if (lastProperty !== JSON.stringify(body)) {
          const updated = await writeJson("PUT", `/delta/property/${propertyId}`, propertyBody(data, address.id, current), signal);
          if (createdId(updated) !== propertyId) throw new ApiError("A atualização não pôde ser confirmada.");
          lastProperty = JSON.stringify(body);
        }
      }
      if (propertyId === undefined) throw new ApiError("A API não retornou o ID da instalação.");
      if (lastProperty === "complete-registration") await getInstallation(propertyId, signal);
      if (uncertainDevice === data.deviceId) throw deviceError(null, propertyId);
      try { await registerDevice(propertyId, data.deviceId, signal); }
      catch (error) {
        if (!(error instanceof ApiError) || error.status === null || error.status >= 500 || signal.aborted) uncertainDevice = data.deviceId;
        throw deviceError(error, propertyId);
      }
      return propertyId;
    } catch (error) {
      if (error instanceof RegistrationSubmitError) throw error;
      throw new RegistrationSubmitError(propertyId === undefined
        ? "Não foi possível concluir o cadastro. Seus dados foram mantidos; confira a lista antes de iniciar outro cadastro se houve falha de conexão."
        : "A instalação já foi criada, mas uma etapa não foi concluída. Tente novamente neste formulário ou confira a instalação salva.", undefined, propertyId);
    }
  };
}

export function createInstallationEditor(id: number, initial: InstallationRegistrationData) {
  let expected = generalSignature(initial);
  let expectedGoal = parseCubicMeters(initial.monthlyGoal);
  let address: { id: number; signature: string } | undefined;
  let uncertainDevice: string | undefined;
  let uncertainAddress = false;
  return async (data: InstallationRegistrationData, signal: AbortSignal): Promise<number> => {
    validate(data, "edit");
    const current = await getInstallation(id, signal);
    const addresses = current.addressId === null ? [] : await listAddresses([current.addressId], signal);
    const currentAddress = addresses[0];
    const currentData: InstallationRegistrationData = {
      ...initial, name: current.name, type: current.type ?? initial.type, classification: current.classification ?? "",
      cep: formatCep(currentAddress?.cep ?? ""), city: currentAddress?.city ?? "", state: normalizeState(currentAddress?.state ?? ""),
      regionId: currentAddress?.regionId == null ? "" : String(currentAddress.regionId),
    };
    const actual = generalSignature(currentData);
    const desired = generalSignature(data);
    if (actual !== expected && actual !== desired) throw new RegistrationSubmitError("Os dados desta instalação foram alterados. Reabra a edição para carregar a versão atual.");
    if (uncertainAddress) throw new RegistrationSubmitError("Não foi possível confirmar o novo endereço. Reabra a edição e confira os dados antes de tentar novamente.", undefined, id);
    let propertySaved = actual === desired;
    let goalSaved = expectedGoal === parseCubicMeters(data.monthlyGoal);
    let goalAttempted = false;
    try {
      if (!propertySaved) {
        const signature = JSON.stringify(addressBody(data));
        let addressId = current.addressId;
        if (signature !== JSON.stringify(addressBody(currentData)) || addressId === null) {
          await validateRegion(Number(data.regionId), signal);
          if (!address || address.signature !== signature) {
            try { address = { id: createdId(await writeJson("POST", "/delta/address", addressBody(data), signal)), signature }; }
            catch (error) {
              if (!(error instanceof ApiError) || error.status === null || error.status >= 500 || signal.aborted) uncertainAddress = true;
              throw error;
            }
          }
          addressId = address.id;
        }
        // Usa outro endereço para não modificar imóveis que compartilhem o registro anterior.
        const updated = await writeJson("PUT", `/delta/property/${id}`, propertyBody(data, addressId, current), signal);
        if (createdId(updated) !== id) throw new ApiError("A atualização não pôde ser confirmada.");
        expected = desired;
        propertySaved = true;
      }
      if (!goalSaved) {
        goalAttempted = true;
        await saveMonthlyGoal(id, parseCubicMeters(data.monthlyGoal)!, signal);
        expectedGoal = parseCubicMeters(data.monthlyGoal);
        goalSaved = true;
      }
      if (data.deviceId) {
        if (uncertainDevice === data.deviceId) throw deviceError(null, id);
        try { await registerDevice(id, data.deviceId, signal); }
        catch (error) {
          if (!(error instanceof ApiError) || error.status === null || error.status >= 500 || signal.aborted) uncertainDevice = data.deviceId;
          throw deviceError(error, id);
        }
      }
      return id;
    } catch (error) {
      if (error instanceof RegistrationSubmitError) throw error;
      if (goalAttempted && !goalSaved) throw new RegistrationSubmitError(error instanceof ApiError ? error.message : "Não foi possível salvar a meta mensal.", "monthlyGoal", id);
      throw new RegistrationSubmitError(propertySaved ? "Os dados gerais foram salvos, mas o dispositivo não pôde ser confirmado." : "Não foi possível confirmar todas as alterações. Seus campos foram mantidos. Confira os detalhes antes de tentar novamente.", undefined, id);
    }
  };
}
