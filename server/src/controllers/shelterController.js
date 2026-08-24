const { queryNearby } = require('../services/overpassService');

async function getNearbyShelters(req, res) {
  const { lat, lng, radius = 50 } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });
  const pLat = parseFloat(lat), pLng = parseFloat(lng), pRad = Math.min(Math.max(parseFloat(radius)||50, 1), 500);
  if (isNaN(pLat) || isNaN(pLng)) return res.status(400).json({ error: 'Invalid coordinates' });
  try {
    const shelters = await queryNearby(pLat, pLng, pRad);
    res.json({ shelters, count: shelters.length });
  } catch (err) {
    console.error('Shelter error:', err.message);
    res.status(500).json({ error: 'Failed to fetch shelters' });
  }
}

module.exports = { getNearbyShelters };
