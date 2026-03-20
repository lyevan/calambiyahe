// lib/calamba.bounds.ts
export const CALAMBA_BOUNDS = {
  latMin: 14.18,
  latMax: 14.25,
  lngMin: 121.1,
  lngMax: 121.18,
};

export const CALAMBA_REGION = {
  latitude: 14.2116,
  longitude: 121.1653,
  latitudeDelta: 0.07,
  longitudeDelta: 0.08,
};

export function isWithinCalamba(lat: number, lng: number): boolean {
  return (
    lat >= CALAMBA_BOUNDS.latMin &&
    lat <= CALAMBA_BOUNDS.latMax &&
    lng >= CALAMBA_BOUNDS.lngMin &&
    lng <= CALAMBA_BOUNDS.lngMax
  );
}
