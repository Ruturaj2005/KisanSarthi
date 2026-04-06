const express = require('express');
const router = express.Router();
const farmerController = require('../controllers/farmer.controller');
const cropHistoryController = require('../controllers/cropHistory.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Profile
router.get('/profile', verifyToken, farmerController.getProfile);
router.put('/profile', verifyToken, farmerController.updateProfile);

// Crop History
router.post('/crop-history', verifyToken, cropHistoryController.create);
router.get('/crop-history', verifyToken, cropHistoryController.getAll);
router.put('/crop-history/:id', verifyToken, cropHistoryController.update);
router.delete('/crop-history/:id', verifyToken, cropHistoryController.remove);

module.exports = router;
