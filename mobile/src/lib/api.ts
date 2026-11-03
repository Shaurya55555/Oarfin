import { API_URL } from '../config';
import type { Friend, SafeLocation, Shelter, User } from '../types';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

let authToken: string | null = null;
let guestId: string | null = null;

// Signed-in requests carry the JWT. Guests have no token, so the server's auth
// middleware falls back to the userID in the body; we send a per-device guest id.
export function setApiIdentity(token: string | null, guest: string | null) {
  authToken = token;
  guestId = guest;
}

type RequestOptions = { method?: string; body?: Record<string, unknown>; timeoutMs?: number };

async function request<T>(path: string, { method = 'GET', body, timeoutMs = 30000 }: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const payload = body && !authToken && guestId ? { userID: guestId, ...body } : body;

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: payload ? JSON.stringify(payload) : undefined,
      signal: controller.signal,
    });
    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    if (!res.ok) {
      const message = data?.error || data?.message || `Request failed (${res.status})`;
      throw new ApiError(message, res.status);
    }
    return data as T;
  } catch (e: any) {
    if (e instanceof ApiError) throw e;
    if (e?.name === 'AbortError') {
      throw new ApiError('The server took too long to respond. It may be waking up, please try again.', 0);
    }
    throw new ApiError('Could not reach the Oarfin server. Check your internet connection.', 0);
  } finally {
    clearTimeout(timer);
  }
}

// ---- Auth ----

export function login(email: string, password: string) {
  return request<{ token: string; user: User }>('/api/users/login', {
    method: 'POST',
    body: { email, password },
    timeoutMs: 60000,
  });
}

export function register(input: {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  password: string;
  userType: string;
}) {
  return request<{ message: string }>('/api/users/register', { method: 'POST', body: input, timeoutMs: 60000 });
}

// ---- Location & alerts ----

export function reportLocation(input: { latitude: number; longitude: number; radius: number; batteryLevel: number | null }) {
  return request<{ message: string }>('/api/users/location', {
    method: 'POST',
    body: { ...input, timestamp: new Date().toISOString() },
  });
}

export type ServerAlertRow = {
  id: string;
  eventID: number | string | null;
  title: string;
  description: string | null;
  severity: string;
  timestamp: string;
  expiryTime: string;
  latitude: number;
  longitude: number;
  radius: number;
  source: string | null;
  type: string | null;
};

export type SafeLocationRow = {
  id?: number;
  eventID: number | string;
  safelat: number;
  safelong: number;
  type: string;
  desc: string;
};

export function fetchServerAlerts(input: { latitude: number; longitude: number; radius: number }) {
  return request<{ alerts: ServerAlertRow[]; safeLocations: SafeLocationRow[] }>('/api/users/alerts', {
    method: 'POST',
    body: input,
  });
}

export function fetchAllServerDisasters() {
  return request<ServerAlertRow[]>('/api/disasters');
}

export async function fetchSafeLocations(): Promise<SafeLocation[]> {
  const rows = await request<SafeLocationRow[]>('/api/disasters/safe-locations');
  return (rows || []).map(toSafeLocation);
}

export function toSafeLocation(row: SafeLocationRow, index = 0): SafeLocation {
  return {
    id: String(row.id ?? `${row.eventID}-${index}`),
    eventID: String(row.eventID),
    latitude: Number(row.safelat),
    longitude: Number(row.safelong),
    type: row.type || 'safe',
    description: row.desc || 'Safe location',
  };
}

export async function fetchNearbyShelters(lat: number, lng: number, radiusKm: number): Promise<Shelter[]> {
  // Shelter lookups race several Overpass mirrors and can take ~20s.
  const data = await request<{ shelters: Shelter[] }>(
    `/api/shelters/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`,
    { timeoutMs: 60000 },
  );
  return data?.shelters || [];
}

// ---- Friends ----

export function fetchFriends(status: 'accepted' | 'pending') {
  return request<Friend[]>(`/api/friends?status=${status}`);
}

export function sendFriendRequest(email: string) {
  return request<{ message: string }>('/api/friends/request', { method: 'POST', body: { email } });
}

export function respondToFriendRequest(requestId: string, accept: boolean) {
  return request<{ message: string }>('/api/friends/respond', {
    method: 'PUT',
    body: { requestId, status: accept ? 'accept' : 'reject' },
  });
}

export function removeFriend(friendshipId: string) {
  return request<{ message: string }>(`/api/friends/${encodeURIComponent(friendshipId)}`, { method: 'DELETE' });
}

// ---- AI assistant ----

export function askAssistant(input: {
  message: string;
  location: string;
  disaster: string;
  shelters: { name: string | null; distance_km: number }[];
}) {
  return request<{ reply: string; error?: string }>('/api/ai/chat', { method: 'POST', body: input, timeoutMs: 45000 });
}
