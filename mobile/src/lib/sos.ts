import * as SMS from 'expo-sms';
import { Alert, Linking, Platform, Share } from 'react-native';
import type { EmergencyContact, LatLng } from '../types';
import { mapsLink } from './geo';

export function sosMessage(name: string | undefined, position: LatLng | null, situation?: string) {
  const who = name ? `${name} needs help` : 'I need help';
  const where = position ? `My location: ${mapsLink(position)}` : 'My location is unavailable right now.';
  const what = situation ? ` I am in a ${situation} zone.` : '';
  return `SOS from Oarfin: ${who}.${what} ${where}`;
}

// Opens the SMS composer addressed to every emergency contact; the user still
// taps Send. Falls back to the share sheet when SMS isn't available.
export async function sendSos(contacts: EmergencyContact[], message: string) {
  const phones = contacts.map((c) => c.phone).filter(Boolean);
  if (phones.length && Platform.OS !== 'web' && (await SMS.isAvailableAsync())) {
    await SMS.sendSMSAsync(phones, message);
    return;
  }
  await Share.share({ message });
}

export function callNumber(number: string) {
  Linking.openURL(`tel:${number}`).catch(() => Alert.alert('Cannot place call', `Please dial ${number} manually.`));
}

export function openUrl(url: string) {
  Linking.openURL(url).catch(() => Alert.alert('Could not open link', url));
}
