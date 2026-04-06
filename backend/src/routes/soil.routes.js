const express = require('express');
const router = express.Router();
const soilController = require('../controllers/soil.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/test', verifyToken, soilController.createSoilTest);
router.get('/tests', verifyToken, soilController.getSoilTests);
router.get('/recommendation', verifyToken, soilController.getSoilRecommendation);

module.exports = router;
