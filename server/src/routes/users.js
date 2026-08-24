const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { updateLocation, getAlerts } = require('../controllers/userController');

// POST /api/users/location
router.post('/location', authMiddleware, updateLocation);

// POST /api/users/alerts  (body params: latitude, longitude, radius)
router.post('/alerts', authMiddleware, getAlerts);

module.exports = router;
