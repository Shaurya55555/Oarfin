import * as Battery from 'expo-battery';
import * as Location from 'expo-location';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { LOCATION_REPORT_MIN_MS } from '../config';
import { reportLocation } from '../lib/api';
import type { LatLng } from '../types';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';

type PermissionState = 'unknown' | 'granted' | 'denied' | 'services-off';

type LocationState = {
  position: LatLng | null;
  accuracy: number | null;
  permission: PermissionState;
  lastReportedAt: number | null;
  requestPermission: () => Promise<void>;
  refresh: () => Promise<LatLng | null>;
};

const LocationContext = createContext<LocationState | null>(null);

async function askLocationPermission(): Promise<PermissionState> {
  const servicesOn = await Location.hasServicesEnabledAsync().catch(() => true);
  if (!servicesOn) return 'services-off';
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted' ? 'granted' : 'denied';
}

async function batteryPercent(): Promise<number | null> {
  try {
    const level = await Battery.getBatteryLevelAsync();
    return level >= 0 ? Math.round(level * 100) : null;
  } catch {
    return null;
  }
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const { signedIn } = useAuth();
  const { settings } = useSettings();
  const [position, setPosition] = useState<LatLng | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [permission, setPermission] = useState<PermissionState>('unknown');
  const [lastReportedAt, setLastReportedAt] = useState<number | null>(null);
  const lastReportRef = useRef(0);

  const applyFix = useCallback((loc: Location.LocationObject) => {
    const next = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    setPosition(next);
    setAccuracy(loc.coords.accuracy ?? null);
    return next;
  }, []);

  const requestPermission = useCallback(async () => {
    setPermission(await askLocationPermission());
  }, []);

  const refresh = useCallback(async () => {
    if (permission !== 'granted') return null;
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      return applyFix(loc);
    } catch {
      return null;
    }
  }, [permission, applyFix]);

  // Ask for location as soon as someone is signed in (or a guest).
  useEffect(() => {
    if (!signedIn || permission !== 'unknown') return;
    let cancelled = false;
    askLocationPermission()
      .then((result) => !cancelled && setPermission(result))
      .catch(() => !cancelled && setPermission('denied'));
    return () => {
      cancelled = true;
    };
  }, [signedIn, permission]);

  // Follow the user while the app is open.
  useEffect(() => {
    if (!signedIn || permission !== 'granted') return;
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;
    (async () => {
      const last = await Location.getLastKnownPositionAsync().catch(() => null);
      if (last && !cancelled) applyFix(last);
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 50, timeInterval: 30000 },
        (loc) => applyFix(loc),
      );
      if (cancelled) sub.remove();
    })().catch(() => undefined);
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [signedIn, permission, applyFix]);

  // Re-send periodically even when standing still, so the server's "last seen" stays fresh.
  const [heartbeat, setHeartbeat] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setHeartbeat((n) => n + 1), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Share the location with the server (throttled) when the user allows it.
  useEffect(() => {
    if (!signedIn || !position || !settings.shareLocation) return;
    const now = Date.now();
    if (now - lastReportRef.current < LOCATION_REPORT_MIN_MS) return;
    lastReportRef.current = now;
    (async () => {
      try {
        await reportLocation({
          latitude: position.latitude,
          longitude: position.longitude,
          radius: settings.alertRadiusKm,
          batteryLevel: await batteryPercent(),
        });
        setLastReportedAt(Date.now());
      } catch {
        // Allow a retry on the next position update.
        lastReportRef.current = 0;
      }
    })();
  }, [signedIn, position, settings.shareLocation, settings.alertRadiusKm, heartbeat]);

  const value = useMemo(
    () => ({ position, accuracy, permission, lastReportedAt, requestPermission, refresh }),
    [position, accuracy, permission, lastReportedAt, requestPermission, refresh],
  );
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used inside LocationProvider');
  return ctx;
}
