// apps/api/src/lib/calamba.bounds.ts
export const CALAMBA_BOUNDS = {
  latMin: 14.18,
  latMax: 14.25,
  lngMin: 121.1,
  lngMax: 121.18,
};

export function isWithinCalamba(lat: number, lng: number): boolean {
  return (
    lat >= CALAMBA_BOUNDS.latMin &&
    lat <= CALAMBA_BOUNDS.latMax &&
    lng >= CALAMBA_BOUNDS.lngMin &&
    lng <= CALAMBA_BOUNDS.lngMax
  );
}
