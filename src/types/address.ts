export interface Address {
  id: number;
  city: string;
  state: string;
  cep: string;
  regionId?: number | null;
  latitude: number | null;
  longitude: number | null;
}
