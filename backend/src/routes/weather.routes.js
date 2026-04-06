const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weather.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/current', verifyToken, weatherController.getCurrentWeather);
router.get('/forecast', verifyToken, weatherController.getForecast);
router.get('/alerts', verifyToken, weatherController.getAlerts);

module.exports = router;
