const express = require('express');
const { getPublicNews, getPublicNewsDetail } = require('../controllers/public_news.controller');

const router = express.Router();

/**
 * @openapi
 * /api/public/news:
 *   get:
 *     tags: [Public News]
 *     summary: Danh sách tin tức cho người đọc
 */
router.get('/', getPublicNews);

/**
 * @openapi
 * /api/public/news/{slug}:
 *   get:
 *     tags: [Public News]
 *     summary: Chi tiết bài viết cho người đọc
 */
router.get('/:slug', getPublicNewsDetail);

module.exports = router;
