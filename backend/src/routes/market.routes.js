const express = require('express');
const router = express.Router();
const marketController = require('../controllers/market.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/prices', verifyToken, marketController.getPrices);
router.get('/trend', verifyToken, marketController.getTrend);
router.get('/alerts', verifyToken, marketController.getMyAlerts);
router.post('/alerts', verifyToken, marketController.createAlert);
router.delete('/alerts/:id', verifyToken, marketController.deleteAlert);

module.exports = router;
