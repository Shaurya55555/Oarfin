import type { DisasterAlert, LatLng } from '../types';

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

export function distanceKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// Initial compass bearing (0-360, 0 = north) from a to b.
export function bearingDeg(a: LatLng, b: LatLng): number {
  const φ1 = toRad(a.latitude);
  const φ2 = toRad(b.latitude);
  const Δλ = toRad(b.longitude - a.longitude);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

const COMPASS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];

export function compassName(bearing: number): string {
  return COMPASS[Math.round(bearing / 45) % 8];
}

export function isInsideAlert(point: LatLng, alert: DisasterAlert): boolean {
  return distanceKm(point, alert) <= alert.radiusKm;
}

// Escape guidance for someone inside a zone: head directly away from its centre.
export function escapeRoute(point: LatLng, alert: DisasterAlert) {
  const fromCentre = distanceKm(alert, point);
  const awayBearing = fromCentre < 0.05 ? null : bearingDeg(alert, point);
  return {
    kmToEdge: Math.max(0, alert.radiusKm - fromCentre),
    direction: awayBearing === null ? null : compassName(awayBearing),
  };
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km).toLocaleString()} km`;
}

export function directionsUrl(to: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${to.latitude},${to.longitude}`;
}

export function mapsLink(at: LatLng): string {
  return `https://maps.google.com/?q=${at.latitude.toFixed(5)},${at.longitude.toFixed(5)}`;
}
