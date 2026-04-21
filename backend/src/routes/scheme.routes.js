const express = require('express');
const router = express.Router();
const schemeController = require('../controllers/scheme.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Farmer routes
router.get('/list', verifyToken, schemeController.getSchemes);
router.get('/notifications/history', verifyToken, schemeController.getNotificationHistory);
router.get('/:id', verifyToken, schemeController.getSchemeDetails);

// Admin routes
router.post('/admin/sync', verifyToken, isAdmin, schemeController.syncSchemes);
router.post('/admin/broadcast', verifyToken, isAdmin, schemeController.broadcastSchemeToFarmers);
router.get('/admin/all', verifyToken, isAdmin, schemeController.getAllSchemes);

module.exports = router;
