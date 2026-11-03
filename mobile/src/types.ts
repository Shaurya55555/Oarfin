export type Severity = 'Critical' | 'Warning' | 'Watch' | 'Info';

export const SEVERITIES: Severity[] = ['Critical', 'Warning', 'Watch', 'Info'];

export type LatLng = { latitude: number; longitude: number };

export type AlertSource = 'authority' | 'gdacs';

export type DisasterAlert = {
  id: string;
  // Links an alert to the safe locations authorities marked for it on the website.
  eventID: string | null;
  title: string;
  description: string;
  type: string;
  severity: Severity;
  latitude: number;
  longitude: number;
  // Impact radius in km. Estimated for GDACS events, which publish no radius.
  radiusKm: number;
  radiusEstimated: boolean;
  issuedAt: string;
  expiresAt: string | null;
  source: AlertSource;
  sourceLabel: string;
  country?: string;
  reportUrl?: string;
};

export type SafeLocation = {
  id: string;
  eventID: string;
  latitude: number;
  longitude: number;
  type: string;
  description: string;
};

export type Shelter = {
  id: string;
  name: string | null;
  lat: number;
  lng: number;
  type: string;
  address: string | null;
  capacity: number | null;
  source: string;
  distance_km: number;
};

export type User = {
  userID: string;
  email: string;
  displayName: string;
  userType: string;
};

export type Friend = {
  id: string; // friendship id
  userId: string; // the other person's user id
  displayName: string;
  email: string;
  latitude: number | null;
  longitude: number | null;
  lastLocationUpdate: string | null;
  batteryLevel: number | null;
  activeAlertsCount: number;
  isRequestor?: boolean;
};

export type EmergencyContact = { id: string; name: string; phone: string };

export type ChatMessage = { id: string; role: 'user' | 'ai'; text: string; isError?: boolean; retryText?: string };
