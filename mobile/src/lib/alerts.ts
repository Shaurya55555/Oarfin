import { GDACS_URL } from '../config';
import type { DisasterAlert, Severity } from '../types';
import type { ServerAlertRow } from './api';
import { capitalize } from './format';

const GDACS_TYPES: Record<string, string> = {
  EQ: 'Earthquake',
  TC: 'Tropical Cyclone',
  FL: 'Flood',
  VO: 'Volcano',
  DR: 'Drought',
  WF: 'Wildfire',
};

// GDACS publishes no impact radius, so danger zones use a per-hazard estimate
// scaled by alert level. Shown as "estimated" everywhere in the UI.
const GDACS_BASE_RADIUS_KM: Record<string, number> = { EQ: 100, TC: 250, FL: 60, VO: 30, DR: 300, WF: 25 };
const GDACS_LEVEL_SCALE: Record<string, number> = { Green: 0.5, Orange: 1, Red: 1.5 };
const GDACS_SEVERITY: Record<string, Severity> = { Red: 'Critical', Orange: 'Warning', Green: 'Watch' };

// GDACS keeps old episodes in its list; only events touched in the last few days count as active.
const GDACS_ACTIVE_WINDOW_DAYS = 7;

export function normalizeSeverity(value: string | null | undefined): Severity {
  const s = (value || '').toLowerCase();
  if (s === 'critical') return 'Critical';
  if (s === 'warning') return 'Warning';
  if (s === 'watch') return 'Watch';
  return 'Info';
}

export function fromServerRow(row: ServerAlertRow): DisasterAlert {
  const type = row.type ? capitalize(row.type) : 'Disaster';
  return {
    id: `srv-${row.id}`,
    eventID: row.eventID != null ? String(row.eventID) : null,
    title: row.title || `${type} Alert`,
    description: row.description || 'Issued by local authorities through Oarfin.',
    type,
    severity: normalizeSeverity(row.severity),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    radiusKm: Number(row.radius) || 10,
    radiusEstimated: false,
    issuedAt: row.timestamp,
    expiresAt: row.expiryTime,
    source: 'authority',
    sourceLabel: 'Local authorities',
  };
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function fetchGdacsAlerts(daysBack = 14): Promise<DisasterAlert[]> {
  const from = new Date(Date.now() - daysBack * 86400000).toISOString().split('T')[0];
  const url = `${GDACS_URL}?eventlist=EQ,FL,TC,VO,DR,WF&fromdate=${from}&todate=&alertlevel=&country=&limit=500`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`GDACS responded ${res.status}`);
    const data = await res.json();
    const cutoff = Date.now() - GDACS_ACTIVE_WINDOW_DAYS * 86400000;
    const seen = new Set<string>();
    const alerts: DisasterAlert[] = [];

    for (const f of data?.features || []) {
      const p = f?.properties || {};
      const c = f?.geometry?.coordinates;
      const id = String(p.eventid ?? '');
      if (!id || seen.has(id) || !Array.isArray(c) || typeof c[0] !== 'number' || typeof c[1] !== 'number') continue;
      const lastSeen = new Date(p.todate || p.datemodified || p.fromdate).getTime();
      if (p.iscurrent !== 'true' && !(lastSeen >= cutoff)) continue;
      seen.add(id);

      const code = String(p.eventtype || '');
      const level = String(p.alertlevel || 'Green');
      const type = GDACS_TYPES[code] || 'Disaster';
      const radiusKm = Math.round((GDACS_BASE_RADIUS_KM[code] ?? 50) * (GDACS_LEVEL_SCALE[level] ?? 1));

      alerts.push({
        id: `gdacs-${id}`,
        eventID: id,
        title: p.eventname ? `${type}: ${p.eventname}` : p.name || type,
        description: stripHtml(p.htmldescription || p.description || p.name || ''),
        type,
        severity: GDACS_SEVERITY[level] || 'Info',
        latitude: c[1],
        longitude: c[0],
        radiusKm,
        radiusEstimated: true,
        issuedAt: p.fromdate ? `${p.fromdate}Z` : new Date().toISOString(),
        expiresAt: p.todate ? `${p.todate}Z` : null,
        source: 'gdacs',
        sourceLabel: 'GDACS (UN / EU global disaster alerts)',
        country: (p.country || '').replace(/,\s*$/, ''),
        reportUrl: p.url?.report,
      });
    }
    return alerts;
  } finally {
    clearTimeout(timer);
  }
}

export const SEVERITY_RANK: Record<Severity, number> = { Critical: 0, Warning: 1, Watch: 2, Info: 3 };
