import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// SecureStore has no web implementation, so the web build (used only for
// quick previews) falls back to AsyncStorage for secrets.
export async function getSecure(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return AsyncStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

export async function setSecure(key: string, value: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    if (value === null) await AsyncStorage.removeItem(key);
    else await AsyncStorage.setItem(key, value);
    return;
  }
  if (value === null) await SecureStore.deleteItemAsync(key);
  else await SecureStore.setItemAsync(key, value);
}

export async function getJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function getJSONArray<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function setJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage is a convenience (cache, preferences); losing a write is not fatal.
  }
}

export const KEYS = {
  token: 'oarfin.token',
  user: 'oarfin.user',
  guestId: 'oarfin.guestId',
  settings: 'oarfin.settings',
  contacts: 'oarfin.contacts',
  cachedAlerts: 'oarfin.cachedAlerts',
  notifiedAlerts: 'oarfin.notifiedAlerts',
};
