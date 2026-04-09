const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/auth.middleware');
const { checkPermission } = require('../middlewares/rbac.middleware');
const {
  getSeoPages,
  getSeoPageByPath,
  updateSeoPage,
} = require('../controllers/seo.controller');

// Admin routes - cần authentication
router.get('/', requireAuth, checkPermission('seo.view'), (req, res, next) => {
  // Nếu có query parameter path, dùng nó
  if (req.query.path) {
    req.params.path = req.query.path;
    return getSeoPageByPath(req, res, next);
  }
  // Nếu không, trả về tất cả
  return getSeoPages(req, res, next);
});

router.put('/', requireAuth, checkPermission('seo.manage'), (req, res, next) => {
  // Nếu có query parameter path, dùng nó
  if (req.query.path) {
    req.params.path = req.query.path;
    return updateSeoPage(req, res, next);
  }
  return res.status(400).json({ 
    success: false, 
    message: 'Missing path parameter' 
  });
});

router.post('/', requireAuth, checkPermission('seo.manage'), (req, res, next) => {
  // Nếu có query parameter path, dùng nó
  if (req.query.path) {
    req.params.path = req.query.path;
    return updateSeoPage(req, res, next);
  }
  return res.status(400).json({ 
    success: false, 
    message: 'Missing path parameter' 
  });
});

// Routes với path parameter - dùng :path đơn giản (cho các path khác)
router.get('/:path', requireAuth, checkPermission('seo.view'), getSeoPageByPath);
router.put('/:path', requireAuth, checkPermission('seo.manage'), updateSeoPage);
router.post('/:path', requireAuth, checkPermission('seo.manage'), updateSeoPage); // POST cũng được để tạo mới

module.exports = router;


