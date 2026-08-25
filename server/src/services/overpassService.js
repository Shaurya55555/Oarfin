const axios = require('axios');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 1800 });

// Render's shared egress IP gets outright connection-refused/timed-out by
// the whole overpass-api.de family (confirmed via Render logs: ETIMEDOUT/
// ECONNREFUSED/ENETUNREACH on all of them, while the same requests succeed
// fine from an unrelated network) -- almost certainly that family's block
// list catching abuse from other tenants sharing Render's IP range, not
// something fixable with more retries/timeout tuning. Mixed in mirrors from
// unrelated operators (openstreetmap.fr, mail.ru) that don't share that
// block list, so Promise.any below still has real candidates to reach.
const OVERPASS_ENDPOINTS = [
  'https://overpass.openstreetmap.fr/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
];

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function queryNearby(lat, lng, radiusKm) {
  const cacheKey = `${Math.round(lat * 20) / 20},${Math.round(lng * 20) / 20},${radiusKm}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const [osmResult, femaResult] = await Promise.allSettled([
    queryOSMWithRetry(lat, lng, radiusKm),
    queryFEMA(lat, lng, radiusKm),
  ]);

  const osm = osmResult.status === 'fulfilled' ? osmResult.value : [];
  const fema = femaResult.status === 'fulfilled' ? femaResult.value : [];

  let combined = [...fema, ...osm].sort((a, b) => a.distance_km - b.distance_km);

  // Deduplicate by proximity
  const unique = [];
  const seen = new Set();
  for (const item of combined) {
    const key = `${Math.round(item.lat * 100)},${Math.round(item.lng * 100)}`;
    if (!seen.has(key)) { seen.add(key); unique.push(item); }
  }

  cache.set(cacheKey, unique);
  return unique;
}

async function queryFEMA(lat, lng, radiusKm) {
  try {
    const res = await axios.get(
      'https://gis.fema.gov/REST/services/NSS/FEMA_NSS/MapServer/0/query',
      {
        params: {
          where: "SHELTER_STATUS = 'Open'",
          outFields: 'SHELTER_NAME,ADDRESS,CITY,STATE,LATITUDE,LONGITUDE,CAPACITY,SHELTER_TYPE',
          f: 'json',
          returnGeometry: false,
        },
        timeout: 8000,
      }
    );
    return (res.data?.features || []).map(item => {
      const elLat = parseFloat(item.attributes.LATITUDE);
      const elLng = parseFloat(item.attributes.LONGITUDE);
      if (!elLat || !elLng) return null;
      const dist = haversine(lat, lng, elLat, elLng);
      if (dist > radiusKm) return null;
      return {
        id: `fema-${elLat}-${elLng}`,
        name: item.attributes.SHELTER_NAME || 'FEMA Shelter',
        lat: elLat, lng: elLng, type: 'shelter',
        address: [item.attributes.ADDRESS, item.attributes.CITY, item.attributes.STATE].filter(Boolean).join(', '),
        capacity: item.attributes.CAPACITY || null,
        source: 'FEMA/Red Cross',
        distance_km: Math.round(dist * 10) / 10,
      };
    }).filter(Boolean);
  } catch { return []; }
}

const OSM_TYPE_MAP = {
  shelter: 'shelter', hospital: 'hospital', clinic: 'clinic', doctors: 'clinic',
  nursing_home: 'nursing_home', social_facility: 'shelter', police: 'police',
  fire_station: 'fire_station', pharmacy: 'pharmacy',
  community_centre: 'shelter', school: 'shelter', stadium: 'shelter',
};

function mapOverpassElements(elements, lat, lng) {
  return elements.map(el => {
    const elLat = el.lat ?? el.center?.lat;
    const elLng = el.lon ?? el.center?.lon;
    if (!elLat || !elLng) return null;
    const amenity = el.tags?.amenity || '';
    const type = el.tags?.emergency ? 'shelter'
      : el.tags?.['disaster:shelter'] ? 'shelter'
      : OSM_TYPE_MAP[amenity] || 'shelter';
    return {
      id: `osm-${el.id}`,
      name: el.tags?.name || null,
      lat: elLat, lng: elLng, type,
      address: el.tags?.['addr:street'] || el.tags?.['addr:full'] || null,
      capacity: null,
      source: 'OpenStreetMap',
      distance_km: Math.round(haversine(lat, lng, elLat, elLng) * 10) / 10,
    };
  }).filter(Boolean).sort((a, b) => a.distance_km - b.distance_km);
}

// This broad multi-tag query genuinely takes 10-20s on a loaded Overpass
// mirror (measured directly: ~13s against overpass-api.de) -- a 10s timeout
// was cutting it off mid-response on every request, which is why shelter
// search kept coming back empty even though the data was there. Racing all
// mirrors in parallel (instead of trying them one at a time, each with its
// own GET-then-POST fallback) both fixes that and cuts worst-case latency
// from ~80s sequential down to whichever mirror answers first.
async function queryOSM(lat, lng, radiusKm) {
  const radiusM = Math.min(radiusKm * 1000, 500000);
  const query = `[out:json][timeout:25];(nwr["amenity"~"^(shelter|hospital|clinic|doctors|nursing_home|social_facility|police|fire_station|pharmacy|community_centre|school|stadium)$"](around:${radiusM},${lat},${lng});nwr["emergency"~"^(shelter|assembly_point|evacuation_point)$"](around:${radiusM},${lat},${lng});nwr["disaster:shelter"="yes"](around:${radiusM},${lat},${lng}););out center 200;`;

  const tryEndpoint = async (endpoint) => {
    const res = await axios.get(`${endpoint}?data=${encodeURIComponent(query)}`, {
      headers: { 'Accept': '*/*', 'User-Agent': 'OarfinApp/1.0' },
      timeout: 22000,
    });
    if (typeof res.data === 'string' && res.data.includes('<html')) throw new Error('html response (blocked/rate-limited)');
    const elements = res.data?.elements || [];
    if (elements.length === 0 && res.data?.remark) throw new Error(res.data.remark);
    return mapOverpassElements(elements, lat, lng);
  };

  try {
    const results = await Promise.any(OVERPASS_ENDPOINTS.map(tryEndpoint));
    console.log(`Overpass OK: ${results.length} results`);
    return results;
  } catch (aggregate) {
    console.warn('All Overpass mirrors failed:', aggregate?.errors?.map(e => e.message).join(' | ') || aggregate.message);
    return [];
  }
}

// One retry pass after a short pause in case every mirror was transiently
// overloaded at the same moment.
async function queryOSMWithRetry(lat, lng, radiusKm) {
  const result = await queryOSM(lat, lng, radiusKm);
  if (result.length > 0) return result;
  await new Promise(r => setTimeout(r, 3000));
  return queryOSM(lat, lng, radiusKm);
}

module.exports = { queryNearby };
