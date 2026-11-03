export interface DeviceRecord {
  id: number;
  deviceId: string;
  propertyId: number;
  isActive: boolean;
  installationDate: string | null;
}

export interface DeviceView {
  record: DeviceRecord;
  installationName: string;
  region: string | null;
  telemetry: DeviceTelemetry | null;
}

export interface DeviceTelemetry {
  deviceId: string;
  lastPingAt: string;
  wifiSignalRssi: string;
  firmwareVersion: string;
  connectivityStatus: string;
  batteryLevel: number;
  unavailabilityReason: string | null;
}

export interface UnlinkedInstallationView {
  id: number;
  name: string;
  region: string | null;
}

export interface DevicesResult {
  devices: DeviceView[];
  unlinkedInstallations: UnlinkedInstallationView[];
  warnings: string[];
}

export interface ConsumptionSummary {
  id: string | null;
  deviceId: string;
  windowStartedAt: string;
  windowFinishedAt: string;
  consumptionLiters: number;
  lpmAverage: number | null;
}
