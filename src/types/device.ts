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
