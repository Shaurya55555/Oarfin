import * as Haptics from 'expo-haptics';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { ALERT_REFRESH_MS } from '../config';
import { fetchGdacsAlerts, fromServerRow, SEVERITY_RANK } from '../lib/alerts';
import * as api from '../lib/api';
import { distanceKm, formatDistance, isInsideAlert } from '../lib/geo';
import { ensureNotificationPermission, notifyDanger } from '../lib/notifications';
import { getJSONArray, KEYS, setJSON } from '../lib/storage';
import type { DisasterAlert, LatLng, SafeLocation, Shelter } from '../types';
import { useAuth } from './AuthContext';
import { useLocation } from './LocationContext';
import { useSettings } from './SettingsContext';

export type AlertWithDistance = DisasterAlert & { distanceKm: number | null; inside: boolean };

type AlertsState = {
  alerts: AlertWithDistance[]; // every active alert passing the severity filters, nearest first
  nearby: AlertWithDistance[]; // alerts within the user's alert radius
  dangerAlerts: AlertWithDistance[]; // alerts whose zone contains the user
  safeLocations: SafeLocation[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  refresh: () => Promise<void>;
  getAlert: (id: string) => AlertWithDistance | undefined;
  safeLocationsFor: (alert: DisasterAlert) => SafeLocation[];
  alertsAt: (point: LatLng) => DisasterAlert[];
  shelters: Shelter[];
  sheltersLoading: boolean;
  sheltersError: string | null;
  loadShelters: (force?: boolean) => Promise<void>;
};

const AlertsContext = createContext<AlertsState | null>(null);

const SHELTER_RADIUS_KM = 15;

// Authority alerts carry a real expiry. GDACS "todate" is just the latest update,
// so GDACS events are already filtered for recency when fetched.
function dropExpired(list: DisasterAlert[]): DisasterAlert[] {
  const now = Date.now();
  return list.filter((a) => a.source === 'gdacs' || !a.expiresAt || new Date(a.expiresAt).getTime() > now);
}

export function AlertsProvider({ children }: { children: ReactNode }) {
  const { signedIn } = useAuth();
  const { settings } = useSettings();
  const { position } = useLocation();

  const [rawAlerts, setRawAlerts] = useState<DisasterAlert[]>([]);
  const [safeLocations, setSafeLocations] = useState<SafeLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const loadingRef = useRef(false);
  const positionRef = useRef<LatLng | null>(position);
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // Show the last known alerts instantly while fresh ones load.
  useEffect(() => {
    getJSONArray<DisasterAlert>(KEYS.cachedAlerts).then((cached) => {
      setRawAlerts((current) => (current.length ? current : dropExpired(cached)));
    });
  }, []);

  const refresh = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    const pos = positionRef.current;

    const [gdacs, allServer, mine, safe] = await Promise.allSettled([
      fetchGdacsAlerts(),
      api.fetchAllServerDisasters(),
      // Also registers this user against nearby authority alerts on the server.
      pos
        ? api.fetchServerAlerts({ latitude: pos.latitude, longitude: pos.longitude, radius: settings.alertRadiusKm })
        : Promise.resolve(null),
      api.fetchSafeLocations(),
    ]);

    const merged = new Map<string, DisasterAlert>();
    if (allServer.status === 'fulfilled') allServer.value.forEach((r) => merged.set(`srv-${r.id}`, fromServerRow(r)));
    if (mine.status === 'fulfilled' && mine.value) mine.value.alerts.forEach((r) => merged.set(`srv-${r.id}`, fromServerRow(r)));
    if (gdacs.status === 'fulfilled') gdacs.value.forEach((a) => merged.set(a.id, a));

    const failures: string[] = [];
    if (gdacs.status === 'rejected') failures.push('global disaster feed');
    if (allServer.status === 'rejected') failures.push('Oarfin server');

    if (merged.size > 0 || failures.length === 0) {
      const list = dropExpired([...merged.values()]);
      setRawAlerts(list);
      setJSON(KEYS.cachedAlerts, list);
      setLastUpdated(Date.now());
    }
    if (safe.status === 'fulfilled') {
      setSafeLocations(safe.value);
    } else if (mine.status === 'fulfilled' && mine.value) {
      setSafeLocations(mine.value.safeLocations.map(api.toSafeLocation));
    }
    if (failures.length) {
      setError(
        failures.length === 2
          ? 'Could not load alerts. Showing the last saved list.'
          : `Could not reach the ${failures[0]}; some alerts may be missing.`,
      );
    }
    loadingRef.current = false;
    setLoading(false);
  }, [settings.alertRadiusKm]);

  // Refresh on sign-in, on an interval, and once the first location fix arrives.
  const hasPosition = !!position;
  useEffect(() => {
    if (!signedIn) return;
    const first = setTimeout(refresh, 0);
    const id = setInterval(refresh, ALERT_REFRESH_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [signedIn, hasPosition, refresh]);

  const alerts = useMemo<AlertWithDistance[]>(() => {
    return rawAlerts
      .filter((a) => settings.severities[a.severity])
      .map((a) => ({
        ...a,
        distanceKm: position ? distanceKm(position, a) : null,
        inside: position ? isInsideAlert(position, a) : false,
      }))
      .sort((a, b) => {
        if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
        return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
      });
  }, [rawAlerts, settings.severities, position]);

  const nearby = useMemo(
    () => alerts.filter((a) => a.distanceKm !== null && a.distanceKm - a.radiusKm <= settings.alertRadiusKm),
    [alerts, settings.alertRadiusKm],
  );
  const dangerAlerts = useMemo(() => alerts.filter((a) => a.inside), [alerts]);

  // Notify once per alert when the user is found inside its zone.
  useEffect(() => {
    if (!dangerAlerts.length || !settings.notificationsEnabled) return;
    (async () => {
      const notified = new Set(await getJSONArray<string>(KEYS.notifiedAlerts));
      const fresh = dangerAlerts.filter((a) => !notified.has(a.id));
      if (!fresh.length) return;
      if (await ensureNotificationPermission()) {
        for (const a of fresh) {
          const edge = a.radiusKm - (a.distanceKm ?? 0);
          await notifyDanger(
            `⚠️ You are inside a ${a.severity.toLowerCase()} ${a.type.toLowerCase()} zone`,
            `${a.title}. About ${formatDistance(edge)} to the edge of the zone. Open Oarfin for safe places and directions.`,
            a.id,
          );
        }
      }
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      fresh.forEach((a) => notified.add(a.id));
      setJSON(KEYS.notifiedAlerts, [...notified].slice(-200));
    })();
  }, [dangerAlerts, settings.notificationsEnabled]);

  const getAlert = useCallback((id: string) => alerts.find((a) => a.id === id), [alerts]);
  const safeLocationsFor = useCallback(
    (alert: DisasterAlert) => (alert.eventID ? safeLocations.filter((s) => s.eventID === alert.eventID) : []),
    [safeLocations],
  );
  const alertsAt = useCallback((point: LatLng) => alerts.filter((a) => isInsideAlert(point, a)), [alerts]);

  // Nearby shelters, hospitals, police and fire stations (OpenStreetMap / FEMA via the server).
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [sheltersLoading, setSheltersLoading] = useState(false);
  const [sheltersError, setSheltersError] = useState<string | null>(null);
  const sheltersForRef = useRef<LatLng | null>(null);

  const loadShelters = useCallback(async (force = false) => {
    const pos = positionRef.current;
    if (!pos) {
      setSheltersError('Turn on location to find shelters near you.');
      return;
    }
    // Skip if we already searched within 2 km of here.
    if (!force && sheltersForRef.current && distanceKm(sheltersForRef.current, pos) < 2) return;
    setSheltersLoading(true);
    setSheltersError(null);
    try {
      const list = await api.fetchNearbyShelters(pos.latitude, pos.longitude, SHELTER_RADIUS_KM);
      sheltersForRef.current = pos;
      setShelters(list);
      if (!list.length) setSheltersError(`No shelters or emergency services found within ${SHELTER_RADIUS_KM} km.`);
    } catch (e: any) {
      setSheltersError(e?.message || 'Could not load nearby shelters.');
    } finally {
      setSheltersLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      alerts,
      nearby,
      dangerAlerts,
      safeLocations,
      loading,
      error,
      lastUpdated,
      refresh,
      getAlert,
      safeLocationsFor,
      alertsAt,
      shelters,
      sheltersLoading,
      sheltersError,
      loadShelters,
    }),
    [alerts, nearby, dangerAlerts, safeLocations, loading, error, lastUpdated, refresh, getAlert, safeLocationsFor, alertsAt, shelters, sheltersLoading, sheltersError, loadShelters],
  );
  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>;
}

export function useAlerts() {
  const ctx = useContext(AlertsContext);
  if (!ctx) throw new Error('useAlerts must be used inside AlertsProvider');
  return ctx;
}
