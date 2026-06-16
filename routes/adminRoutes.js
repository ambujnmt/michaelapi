const express = require('express')
const router = express.Router()
const auth = require('../middleware/authMiddleware')

const { login, updateProfile, updatePassword } = require('../controllers/authController')
const {
  getAllProperties, getPropertyById, createProperty, updateProperty, deleteProperty,
  uploadBanner, getGalleryImages, uploadGalleryImages, deleteGalleryImage
} = require('../controllers/propertyController')
const {
  getAllInquiries, getInquiryById, updateInquiryStatus, deleteInquiry
} = require('../controllers/inquiryController')
const { getAllSubscribers, deleteSubscriber } = require('../controllers/subscriberController')
const upload = require('../middleware/upload')
const db = require('../config/db')

// --- Auth (public) ---
router.post('/login', login)

// === All routes below are protected ===
router.use(auth)

// --- Stats ---
router.get('/stats', (req, res) => {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM properties)  AS totalProperties,
      (SELECT COUNT(*) FROM inquiries)   AS totalInquiries,
      (SELECT COUNT(*) FROM inquiries WHERE status = 'New') AS newInquiries,
      (SELECT COUNT(*) FROM admins)      AS totalAdmins,
      (SELECT COUNT(*) FROM subscribers) AS totalSubscribers
  `
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Server Error' })
    res.json({ success: true, data: results[0] })
  })
})

// --- Properties ---
router.get('/properties', getAllProperties)
router.get('/properties/:id', getPropertyById)
router.post('/properties', createProperty)
router.put('/properties/:id', updateProperty)
router.delete('/properties/:id', deleteProperty)

// --- Property Images ---
router.post('/properties/:id/banner', upload.single('banner'), uploadBanner)
router.get('/properties/:id/images', getGalleryImages)
router.post('/properties/:id/images', upload.array('images', 10), uploadGalleryImages)
router.delete('/properties/images/:imageId', deleteGalleryImage)

// --- Inquiries ---
router.get('/inquiries', getAllInquiries)
router.get('/inquiries/:id', getInquiryById)
router.put('/inquiries/:id/status', updateInquiryStatus)
router.delete('/inquiries/:id', deleteInquiry)

// --- Subscribers ---
router.get('/subscribers', getAllSubscribers)
router.delete('/subscribers/:id', deleteSubscriber)

// --- Settings ---
router.put('/settings/profile', updateProfile)
router.put('/settings/password', updatePassword)

module.exports = router
