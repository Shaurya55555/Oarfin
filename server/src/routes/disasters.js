const express = require('express');
const router = express.Router();
const { getAllDisasters, reportDisaster } = require('../controllers/disasterController');
const { getAllSafeLocations, reportSafeLocation } = require('../controllers/safeLocationController');

// GET /api/disasters
router.get('/', getAllDisasters);

// POST /api/disasters/report
router.post('/report', reportDisaster);

// POST /api/disasters/report-batch (bulk sync from frontend — silently accepted)
router.post('/report-batch', (req, res) => {
  res.json({ success: true, received: (req.body?.disasters || []).length });
});

// GET /api/disasters/safe-locations
router.get('/safe-locations', getAllSafeLocations);

// POST /api/disasters/safe-locations/report
router.post('/safe-locations/report', reportSafeLocation);

module.exports = router;

