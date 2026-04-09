const express = require('express');
const {
  // Hero section
  getHero,
  updateHero,
  // Info Cards section
  getInfoCards,
  updateInfoCards,
  // Form section
  getForm,
  updateForm,
  // Map section
  getMap,
  updateMap,
  // Sidebar section
  getSidebar,
  updateSidebar,
  // Contact Requests
  getRequests,
  getRequest,
  updateRequest,
  deleteRequest,
  submitRequest,
} = require('../controllers/contact.controller');
const { checkPermission } = require('../middlewares/rbac.middleware');

const router = express.Router();

// Hero routes
router.get('/hero', checkPermission('contact.view'), getHero);
router.put('/hero', checkPermission('contact.manage'), updateHero);

// Info Cards routes
router.get('/info-cards', checkPermission('contact.view'), getInfoCards);
router.put('/info-cards', checkPermission('contact.manage'), updateInfoCards);

// Form routes
router.get('/form', checkPermission('contact.view'), getForm);
router.put('/form', checkPermission('contact.manage'), updateForm);

// Sidebar routes
router.get('/sidebar', checkPermission('contact.view'), getSidebar);
router.put('/sidebar', checkPermission('contact.manage'), updateSidebar);

// Map routes
router.get('/map', checkPermission('contact.view'), getMap);
router.put('/map', checkPermission('contact.manage'), updateMap);

// Contact Requests routes
router.get('/requests', checkPermission('contact.view'), getRequests);
router.get('/requests/:id', checkPermission('contact.view'), getRequest);
router.put('/requests/:id', checkPermission('contact.manage'), updateRequest);
router.delete('/requests/:id', checkPermission('contact.manage'), deleteRequest);

module.exports = router;

