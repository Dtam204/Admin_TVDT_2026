const express = require('express');
const router = express.Router();
const CollectionService = require('../services/admin/collection.service');

/**
 * @openapi
 * /api/admin/collections:
 *   get:
 *     tags: [Admin Collections]
 *     summary: Lấy danh sách bộ sưu tập
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: 'integer', default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: 'integer', default: 10 }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data: { type: 'array', items: { $ref: '#/components/schemas/Collection' } }
 *                     pagination: { $ref: '#/components/schemas/Pagination' }
 *   post:
 *     tags: [Admin Collections]
 *     summary: Tạo bộ sưu tập mới
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Collection' }
 *     responses:
 *       201: { description: Created }
 *
 * /api/admin/collections/{id}:
 *   get:
 *     tags: [Admin Collections]
 *     summary: Lấy chi tiết bộ sưu tập
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'integer' }
 *     responses:
 *       200: { description: OK }
 *   put:
 *     tags: [Admin Collections]
 *     summary: Cập nhật bộ sưu tập
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'integer' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Collection' }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     tags: [Admin Collections]
 *     summary: Xóa bộ sưu tập
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'integer' }
 *     responses:
 *       200: { description: Deleted }
 */
router.get('/', async (req, res) => {
  try {
    const collections = await CollectionService.getAllCollections(req.query);
    res.json({ success: true, data: collections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const collection = await CollectionService.getCollectionById(req.params.id);
    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }
    res.json({ success: true, data: collection });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const collection = await CollectionService.createCollection(req.body);
    res.status(201).json({ success: true, data: collection });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const collection = await CollectionService.updateCollection(req.params.id, req.body);
    res.json({ success: true, data: collection });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await CollectionService.deleteCollection(req.params.id);
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
