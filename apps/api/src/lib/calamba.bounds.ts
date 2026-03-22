// apps/api/src/lib/calamba.bounds.ts
export const CALAMBA_BOUNDS = {
  latMin: 14.1377030,
  latMax: 14.2662133,
  lngMin: 121.0218057,
  lngMax: 121.2214277,
};

export function isWithinCalamba(lat: number, lng: number): boolean {
  return (
    lat >= CALAMBA_BOUNDS.latMin &&
    lat <= CALAMBA_BOUNDS.latMax &&
    lng >= CALAMBA_BOUNDS.lngMin &&
    lng <= CALAMBA_BOUNDS.lngMax
  );
}
