const express = require('express');
const {
  getHomepageBlock,
  getAllHomepageBlocks,
  updateHomepageBlock,
} = require('../controllers/homepage.controller');

const router = express.Router();

// Get all blocks
router.get('/', getAllHomepageBlocks);

// Get specific block
router.get('/:sectionType', getHomepageBlock);

// Update specific block
router.put('/:sectionType', updateHomepageBlock);

module.exports = router;

