const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { listFriends, sendRequest, respondToRequest, removeFriend } = require('../controllers/friendController');

// Friends expose each other's live location, so every route needs a real login.
router.use(requireAuth);

// GET /api/friends?status=accepted|pending
router.get('/', listFriends);

// POST /api/friends/request  { email }
router.post('/request', sendRequest);

// PUT /api/friends/respond  { requestId, status: 'accept' | 'reject' }
router.put('/respond', respondToRequest);

// DELETE /api/friends/:id
router.delete('/:id', removeFriend);

module.exports = router;
