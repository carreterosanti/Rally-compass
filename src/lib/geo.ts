const EARTH_RADIUS_M = 6371000;

const toRad = (deg: number) => (deg * Math.PI) / 180;

export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

export function gpsBarsFromAccuracy(accuracy: number | null | undefined): number {
  if (accuracy == null || !Number.isFinite(accuracy)) return 0;
  if (accuracy <= 5) return 5;
  if (accuracy <= 10) return 4;
  if (accuracy <= 20) return 3;
  if (accuracy <= 40) return 2;
  return 1;
}
