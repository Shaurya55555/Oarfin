export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://oarfin-server.onrender.com').replace(/\/+$/, '');

export const GDACS_URL = 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH';

// How often the app refreshes alerts while open, and the minimum gap between
// location reports sent to the server.
export const ALERT_REFRESH_MS = 5 * 60 * 1000;
export const LOCATION_REPORT_MIN_MS = 60 * 1000;

// Fallback map centre (New Delhi) when the user's location is unknown.
export const DEFAULT_REGION = {
  latitude: 28.6139,
  longitude: 77.209,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

export const DEFAULT_EMERGENCY_NUMBER = '112';
