const express = require('express');
const router = express.Router();
const {
  getSettings,
  getSettingByKey,
  updateSettings,
  updateSetting,
} = require('../controllers/settings.controller');
const requireAuth = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/rbac.middleware');

// Admin routes - require authentication
router.get('/', requireAuth, checkPermission('settings.view'), getSettings);
router.get('/:key', requireAuth, checkPermission('settings.view'), getSettingByKey);
router.put('/', requireAuth, checkPermission('settings.manage'), updateSettings);
router.put('/:key', requireAuth, checkPermission('settings.manage'), updateSetting);

module.exports = router;


