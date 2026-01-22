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

const router = express.Router();

// Hero routes
router.get('/hero', getHero);
router.put('/hero', updateHero);

// Info Cards routes
router.get('/info-cards', getInfoCards);
router.put('/info-cards', updateInfoCards);

// Form routes
router.get('/form', getForm);
router.put('/form', updateForm);

// Sidebar routes
router.get('/sidebar', getSidebar);
router.put('/sidebar', updateSidebar);

// Map routes
router.get('/map', getMap);
router.put('/map', updateMap);

// Contact Requests routes
router.get('/requests', getRequests);
router.get('/requests/:id', getRequest);
router.put('/requests/:id', updateRequest);
router.delete('/requests/:id', deleteRequest);

module.exports = router;

