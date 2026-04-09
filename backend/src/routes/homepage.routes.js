const express = require('express');
const {
  getHomepageBlock,
  getAllHomepageBlocks,
  updateHomepageBlock,
} = require('../controllers/homepage.controller');
const { checkPermission } = require('../middlewares/rbac.middleware');

const router = express.Router();

// Get all blocks
router.get('/', checkPermission('homepage.view'), getAllHomepageBlocks);

// Get specific block
router.get('/:sectionType', checkPermission('homepage.view'), getHomepageBlock);

// Update specific block
router.put('/:sectionType', checkPermission('homepage.manage'), updateHomepageBlock);

module.exports = router;

