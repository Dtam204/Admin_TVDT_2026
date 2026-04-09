const express = require('express');
const router = express.Router();

const menuController = require('../controllers/menu.controller');
const { checkPermission } = require('../middlewares/rbac.middleware');

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
 *     tags: [Admin Menus]
 */
router.get('/', checkPermission('menus.view'), menuController.getMenus);

/**
 * @swagger
 * /api/admin/menus/{id}:
 *   get:
 *     summary: Lấy chi tiết menu
 *     tags: [Admin Menus]
 */
router.get('/:id', checkPermission('menus.view'), menuController.getMenuById);

/**
 * @swagger
 * /api/admin/menus:
 *   post:
 *     summary: Tạo menu mới
 *     tags: [Admin Menus]
 */
router.post('/', checkPermission('menus.manage'), menuController.createMenu);

/**
 * @swagger
 * /api/admin/menus/{id}:
 *   put:
 *     summary: Cập nhật menu
 *     tags: [Admin Menus]
 */
router.put('/:id', checkPermission('menus.manage'), menuController.updateMenu);

/**
 * @swagger
 * /api/admin/menus/{id}:
 *   delete:
 *     summary: Xóa menu
 *     tags: [Admin Menus]
 */
router.delete('/:id', checkPermission('menus.manage'), menuController.deleteMenu);

module.exports = router;


