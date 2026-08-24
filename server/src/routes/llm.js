const express = require('express');
const router = express.Router();
const { checkDisasterNews } = require('../controllers/llmController');

// POST /api/llm/is-disaster-news
router.post('/is-disaster-news', checkDisasterNews);

module.exports = router;
