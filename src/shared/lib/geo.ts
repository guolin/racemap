/*
 * Geo calculation helpers (no leaflet dependency)
 */

/**
 * Calculate destination point given start lat/lng, bearing (deg), distance (metres).
 * Implements the haversine-based formula on a sphere (WGS-84 radius ≈ 6378137 m).
 */
export function destinationPoint(
  lat: number,
  lng: number,
  bearing: number,
  distance: number
): [number, number] {
  const R = 6378137; // earth radius in metres (WGS-84)
  const δ = distance / R; // angular distance in radians
  const θ = (bearing * Math.PI) / 180;
  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lng * Math.PI) / 180;

  const sinφ1 = Math.sin(φ1);
  const cosφ1 = Math.cos(φ1);
  const sinδ = Math.sin(δ);
  const cosδ = Math.cos(δ);

  const sinφ2 = sinφ1 * cosδ + cosφ1 * sinδ * Math.cos(θ);
  const φ2 = Math.asin(sinφ2);
  const y = Math.sin(θ) * sinδ * cosφ1;
  const x = cosδ - sinφ1 * sinφ2;
  const λ2 = λ1 + Math.atan2(y, x);

  return [
    (φ2 * 180) / Math.PI,
    (((λ2 + 3 * Math.PI) % (2 * Math.PI) - Math.PI) * 180) / Math.PI,
  ];
}

/**
 * Calculate initial bearing from (lat1,lng1) to (lat2,lng2).
 * @returns bearing in degrees 0–360 (0 = north, clockwise)
 */
export function calcBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lng2 - lng1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
} 