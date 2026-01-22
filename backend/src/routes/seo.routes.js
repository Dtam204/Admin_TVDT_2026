const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/auth.middleware');
const {
  getSeoPages,
  getSeoPageByPath,
  updateSeoPage,
} = require('../controllers/seo.controller');

// Admin routes - cần authentication
router.get('/', requireAuth, (req, res, next) => {
  // Nếu có query parameter path, dùng nó
  if (req.query.path) {
    req.params.path = req.query.path;
    return getSeoPageByPath(req, res, next);
  }
  // Nếu không, trả về tất cả
  return getSeoPages(req, res, next);
});

router.put('/', requireAuth, (req, res, next) => {
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

router.post('/', requireAuth, (req, res, next) => {
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
router.get('/:path', requireAuth, getSeoPageByPath);
router.put('/:path', requireAuth, updateSeoPage);
router.post('/:path', requireAuth, updateSeoPage); // POST cũng được để tạo mới

module.exports = router;


