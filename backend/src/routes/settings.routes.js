const express = require('express');
const router = express.Router();
const {
  getSettings,
  getSettingByKey,
  updateSettings,
  updateSetting,
} = require('../controllers/settings.controller');
const requireAuth = require('../middlewares/auth.middleware');

// Admin routes - require authentication
router.get('/', requireAuth, getSettings);
router.get('/:key', requireAuth, getSettingByKey);
router.put('/', requireAuth, updateSettings);
router.put('/:key', requireAuth, updateSetting);

module.exports = router;


