const express = require('express');
const router = express.Router();

const menuController = require('../controllers/menu.controller');

/**
 * @swagger
 * tags:
 *   name: Menus
 *   description: Quản lý menu điều hướng cho website
 */

/**
 * @swagger
 * /api/admin/menus:
 *   get:
 *     summary: Lấy danh sách menu
 *     tags: [Menus]
 */
router.get('/', menuController.getMenus);

/**
 * @swagger
 * /api/admin/menus/{id}:
 *   get:
 *     summary: Lấy chi tiết menu
 *     tags: [Menus]
 */
router.get('/:id', menuController.getMenuById);

/**
 * @swagger
 * /api/admin/menus:
 *   post:
 *     summary: Tạo menu mới
 *     tags: [Menus]
 */
router.post('/', menuController.createMenu);

/**
 * @swagger
 * /api/admin/menus/{id}:
 *   put:
 *     summary: Cập nhật menu
 *     tags: [Menus]
 */
router.put('/:id', menuController.updateMenu);

/**
 * @swagger
 * /api/admin/menus/{id}:
 *   delete:
 *     summary: Xóa menu
 *     tags: [Menus]
 */
router.delete('/:id', menuController.deleteMenu);

module.exports = router;


