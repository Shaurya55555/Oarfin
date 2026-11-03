import { router } from 'expo-router';
import type { DisasterAlert, LatLng } from '../types';

// Switch to the Map tab centred on a point. `focus` identifies what to highlight.
export function showOnMap(point: LatLng, spanKm: number, focus?: string) {
  router.navigate({
    pathname: '/map',
    params: {
      lat: String(point.latitude),
      lng: String(point.longitude),
      span: String(spanKm),
      focus: focus ?? '',
      t: String(Date.now()), // makes repeated taps on the same item re-centre the map
    },
  });
}

export function showAlertOnMap(alert: DisasterAlert) {
  showOnMap(alert, Math.max(alert.radiusKm * 3, 20), `a:${alert.id}`);
}

export function openAlert(id: string) {
  router.push({ pathname: '/alert/[id]', params: { id } });
}
