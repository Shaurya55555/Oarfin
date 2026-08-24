const axios = require('axios');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 1800 });

// Use GET-based Overpass API — less rate-limited than POST
// overpass.private.coffee is a reliable community instance
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
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

async function queryOSM(lat, lng, radiusKm) {
  const radiusM = Math.min(radiusKm * 1000, 500000);

  // Compact single-union query — covers global shelter/emergency facility tags
  const query = `[out:json][timeout:20];(nwr["amenity"~"^(shelter|hospital|clinic|doctors|nursing_home|social_facility|police|fire_station|pharmacy|community_centre|school|stadium)$"](around:${radiusM},${lat},${lng});nwr["emergency"~"^(shelter|assembly_point|evacuation_point)$"](around:${radiusM},${lat},${lng});nwr["disaster:shelter"="yes"](around:${radiusM},${lat},${lng}););out center 200;`;

  const typeMap = {
    shelter: 'shelter', hospital: 'hospital', clinic: 'clinic', doctors: 'clinic',
    nursing_home: 'nursing_home', social_facility: 'shelter', police: 'police',
    fire_station: 'fire_station', pharmacy: 'pharmacy',
    community_centre: 'shelter', school: 'shelter', stadium: 'shelter',
  };

  // Try GET first (less rate-limited), then POST as fallback
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      // Use GET with encoded query — avoids POST rate limits on some mirrors
      const getUrl = `${endpoint}?data=${encodeURIComponent(query)}`;
      const res = await axios.get(getUrl, {
        headers: { 'Accept': '*/*', 'User-Agent': 'OarfinApp/1.0' },
        timeout: 10000,
      });

      if (typeof res.data === 'string' && res.data.includes('<html')) continue;
      const elements = res.data?.elements || [];
      if (elements.length === 0 && res.data?.remark) continue;

      const results = elements.map(el => {
        const elLat = el.lat ?? el.center?.lat;
        const elLng = el.lon ?? el.center?.lon;
        if (!elLat || !elLng) return null;
        const amenity = el.tags?.amenity || '';
        const type = el.tags?.emergency ? 'shelter'
          : el.tags?.['disaster:shelter'] ? 'shelter'
          : typeMap[amenity] || 'shelter';
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

      console.log(`Overpass ${endpoint.slice(8, 35)} OK: ${results.length} results`);
      return results;

    } catch (err) {
      console.warn(`Overpass ${endpoint.slice(8, 35)} failed: ${err.response?.status || err.message}`);
      // Try POST as fallback for this endpoint
      try {
        const res = await axios.post(
          endpoint,
          `data=${encodeURIComponent(query)}`,
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 }
        );
        if (typeof res.data === 'string' && res.data.includes('<html')) continue;
        const elements = res.data?.elements || [];
        if (elements.length === 0 && res.data?.remark) continue;

        const results = elements.map(el => {
          const elLat = el.lat ?? el.center?.lat;
          const elLng = el.lon ?? el.center?.lon;
          if (!elLat || !elLng) return null;
          const amenity = el.tags?.amenity || '';
          const type = el.tags?.emergency ? 'shelter'
            : el.tags?.['disaster:shelter'] ? 'shelter'
            : typeMap[amenity] || 'shelter';
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

        console.log(`Overpass ${endpoint.slice(8, 35)} POST OK: ${results.length} results`);
        return results;
      } catch (err2) {
        console.warn(`Overpass ${endpoint.slice(8, 35)} POST also failed: ${err2.response?.status || err2.message}`);
        continue;
      }
    }
  }

  return [];
}


// If all endpoints are rate-limited, wait 3s and try once more with the most reliable one
async function queryOSMWithRetry(lat, lng, radiusKm) {
  const result = await queryOSM(lat, lng, radiusKm);
  if (result.length > 0) return result;
  // All endpoints failed — wait 3s and try the most reliable one directly
  await new Promise(r => setTimeout(r, 3000));
  const radiusM = Math.min(radiusKm * 1000, 500000);
  const query = `[out:json][timeout:25];(nwr["amenity"~"^(shelter|hospital|clinic|doctors|nursing_home|social_facility|police|fire_station|pharmacy|community_centre|school|stadium)$"](around:${radiusM},${lat},${lng});nwr["emergency"~"^(shelter|assembly_point|evacuation_point)$"](around:${radiusM},${lat},${lng});nwr["disaster:shelter"="yes"](around:${radiusM},${lat},${lng}););out center 200;`;
  const typeMap = { shelter:'shelter',hospital:'hospital',clinic:'clinic',doctors:'clinic',nursing_home:'nursing_home',social_facility:'shelter',police:'police',fire_station:'fire_station',pharmacy:'pharmacy',community_centre:'shelter',school:'shelter',stadium:'shelter' };
  try {
    const res = await axios.get(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, { headers: { 'Accept': '*/*', 'User-Agent': 'OarfinApp/1.0' }, timeout: 25000 });
    if (typeof res.data === 'string' && res.data.includes('<html')) return [];
    return (res.data?.elements || []).map(el => {
      const elLat = el.lat ?? el.center?.lat;
      const elLng = el.lon ?? el.center?.lon;
      if (!elLat || !elLng) return null;
      const amenity = el.tags?.amenity || '';
      return { id: `osm-${el.id}`, name: el.tags?.name||null, lat:elLat, lng:elLng, type: el.tags?.emergency?'shelter':typeMap[amenity]||'shelter', address: el.tags?.['addr:street']||null, capacity:null, source:'OpenStreetMap', distance_km: Math.round(haversine(lat,lng,elLat,elLng)*10)/10 };
    }).filter(Boolean).sort((a,b)=>a.distance_km-b.distance_km);
  } catch { return []; }
}

module.exports = { queryNearby };
