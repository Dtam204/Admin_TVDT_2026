const express = require('express');
const {
  getTestimonials,
  getTestimonialById,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} = require('../controllers/testimonials.controller');
const { checkPermission } = require('../middlewares/rbac.middleware');

const router = express.Router();

router.get('/', checkPermission('news.view'), getTestimonials);
router.get('/:id', checkPermission('news.view'), getTestimonialById);
router.post('/', checkPermission('news.manage'), createTestimonial);
router.put('/:id', checkPermission('news.manage'), updateTestimonial);
router.delete('/:id', checkPermission('news.manage'), deleteTestimonial);

module.exports = router;

