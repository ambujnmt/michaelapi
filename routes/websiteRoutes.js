const express = require('express')
const router = express.Router()

const {
  getAllProperties,
  getPropertyById,
  getGalleryImages,
} = require('../controllers/propertyController')
const { createInquiry } = require('../controllers/inquiryController')
const { subscribe } = require('../controllers/subscriberController')

// --- Properties (public listing) ---
router.get('/properties', getAllProperties)
router.get('/properties/:id/images', getGalleryImages)
router.get('/properties/:id', getPropertyById)

// --- Contact / Inquiry form ---
router.post('/inquiry', createInquiry)

// --- Newsletter ---
router.post('/subscribe', subscribe)

module.exports = router
