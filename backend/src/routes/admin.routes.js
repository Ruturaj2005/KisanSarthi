const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

router.get('/stats', verifyToken, isAdmin, adminController.getStats);
router.get('/farmers', verifyToken, isAdmin, adminController.getFarmers);
router.get('/feedback', verifyToken, isAdmin, adminController.getFeedback);
router.get('/pest-log', verifyToken, isAdmin, adminController.getPestLog);

module.exports = router;
