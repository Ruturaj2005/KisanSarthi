const express = require('express');
const router = express.Router();
const pestController = require('../controllers/pest.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const idempotency = require('../middleware/idempotency.middleware');

router.post('/detect', verifyToken, upload.single('image'), idempotency, pestController.detect);
router.get('/history', verifyToken, pestController.getHistory);
router.get('/detection/:id', verifyToken, pestController.getDetection);

module.exports = router;
