const express = require('express');
const router = express.Router();
const advisoryController = require('../controllers/advisory.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const idempotency = require('../middleware/idempotency.middleware');

router.post('/chat', verifyToken, idempotency, advisoryController.chat);
router.get('/history', verifyToken, advisoryController.getHistory);
router.post('/feedback', verifyToken, advisoryController.submitFeedback);

module.exports = router;
