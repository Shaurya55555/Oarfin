const express = require('express');
const router = express.Router();
const { getBBCNews, getNDTVNews, getRedditNews, getCacheStats } = require('../controllers/scraperController');

router.get('/bbc', getBBCNews);
router.get('/ndtv', getNDTVNews);
router.get('/reddit', getRedditNews);
router.get('/cache-stats', getCacheStats);

module.exports = router;
