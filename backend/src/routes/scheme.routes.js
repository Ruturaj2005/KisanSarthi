const express = require('express');
const router = express.Router();
const schemeController = require('../controllers/scheme.controller');
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');

// Farmer routes
router.get('/list', verifyToken, schemeController.getSchemes);
router.get('/:id', verifyToken, schemeController.getSchemeDetails);
router.get('/notifications/history', verifyToken, schemeController.getNotificationHistory);

// Admin routes
router.post('/admin/sync', verifyAdmin, schemeController.syncSchemes);
router.post('/admin/broadcast', verifyAdmin, schemeController.broadcastSchemeToFarmers);
router.get('/admin/all', verifyAdmin, schemeController.getAllSchemes);

module.exports = router;
