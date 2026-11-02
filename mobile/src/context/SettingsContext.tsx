import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_EMERGENCY_NUMBER } from '../config';
import { makeId } from '../lib/format';
import { getJSON, getJSONArray, KEYS, setJSON } from '../lib/storage';
import type { EmergencyContact, Severity } from '../types';

export type Settings = {
  notificationsEnabled: boolean;
  // Report this device's location to the Oarfin server so authorities can see
  // how many people are in an affected area, and friends can see you.
  shareLocation: boolean;
  // "Near me" alerts list covers this many km around the user.
  alertRadiusKm: number;
  severities: Record<Severity, boolean>;
  emergencyNumber: string;
};

const DEFAULT_SETTINGS: Settings = {
  notificationsEnabled: true,
  shareLocation: true,
  alertRadiusKm: 500,
  severities: { Critical: true, Warning: true, Watch: true, Info: true },
  emergencyNumber: DEFAULT_EMERGENCY_NUMBER,
};

type SettingsState = {
  settings: Settings;
  loaded: boolean;
  update: (patch: Partial<Settings>) => void;
  contacts: EmergencyContact[];
  addContact: (name: string, phone: string) => void;
  removeContact: (id: string) => void;
};

const SettingsContext = createContext<SettingsState | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const [s, c] = await Promise.all([
        getJSON<Settings>(KEYS.settings, DEFAULT_SETTINGS),
        getJSONArray<EmergencyContact>(KEYS.contacts),
      ]);
      setSettings({ ...s, severities: { ...DEFAULT_SETTINGS.severities, ...s.severities } });
      setContacts(c);
      setLoaded(true);
    })();
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      setJSON(KEYS.settings, next);
      return next;
    });
  }, []);

  const addContact = useCallback((name: string, phone: string) => {
    setContacts((prev) => {
      const next = [...prev, { id: makeId(), name: name.trim(), phone: phone.trim() }];
      setJSON(KEYS.contacts, next);
      return next;
    });
  }, []);

  const removeContact = useCallback((id: string) => {
    setContacts((prev) => {
      const next = prev.filter((c) => c.id !== id);
      setJSON(KEYS.contacts, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ settings, loaded, update, contacts, addContact, removeContact }),
    [settings, loaded, update, contacts, addContact, removeContact],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
