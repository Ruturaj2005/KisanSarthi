const express = require('express');
const router = express.Router();
const marketController = require('../controllers/market.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/filters', verifyToken, marketController.getFilters);
router.get('/prices', verifyToken, marketController.getPrices);
router.get('/trend', verifyToken, marketController.getTrend);
router.get('/best-mandis', verifyToken, marketController.getBestMandis);
router.get('/summary', verifyToken, marketController.getSummary);
router.post('/sync', verifyToken, marketController.syncNow);
router.get('/alerts', verifyToken, marketController.getMyAlerts);
router.post('/alerts', verifyToken, marketController.createAlert);
router.delete('/alerts/:id', verifyToken, marketController.deleteAlert);

module.exports = router;
