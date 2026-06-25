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
const {
  getAllContacts, updateContactStatus, deleteContact
} = require('../controllers/contactController')
const { getAllSubscribers, deleteSubscriber } = require('../controllers/subscriberController')
const { sendMail } = require('../controllers/mailController')
const {
  getAllSliders, createSlider, updateSlider, deleteSlider
} = require('../controllers/sliderController')
const {
  getAllTestimonials, createTestimonial, updateTestimonial, deleteTestimonial
} = require('../controllers/testimonialController')
const {
  getAllBlogs, getBlogById, createBlog, updateBlog, deleteBlog
} = require('../controllers/blogController')
const createUpload = require('../middleware/upload')
const uploadProperties   = createUpload('properties')
const uploadSliders      = createUpload('sliders')
const uploadTestimonials = createUpload('testimonials')
const uploadBlogs        = createUpload('blogs')
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
router.post('/properties/:id/banner', uploadProperties.single('banner'), uploadBanner)
router.get('/properties/:id/images', getGalleryImages)
router.post('/properties/:id/images', uploadProperties.array('images', 10), uploadGalleryImages)
router.delete('/properties/images/:imageId', deleteGalleryImage)

// --- Inquiries ---
router.get('/inquiries', getAllInquiries)
router.get('/inquiries/:id', getInquiryById)
router.put('/inquiries/:id/status', updateInquiryStatus)
router.delete('/inquiries/:id', deleteInquiry)

// --- Contacts ---
router.get('/contacts', getAllContacts)
router.put('/contacts/:id/status', updateContactStatus)
router.delete('/contacts/:id', deleteContact)

// --- Mail ---
router.post('/send-mail', sendMail)

// --- Sliders ---
router.get('/sliders', getAllSliders)
router.post('/sliders', uploadSliders.single('image'), createSlider)
router.put('/sliders/:id', uploadSliders.single('image'), updateSlider)
router.delete('/sliders/:id', deleteSlider)

// --- Testimonials ---
router.get('/testimonials', getAllTestimonials)
router.post('/testimonials', uploadTestimonials.single('image'), createTestimonial)
router.put('/testimonials/:id', uploadTestimonials.single('image'), updateTestimonial)
router.delete('/testimonials/:id', deleteTestimonial)

// --- Blogs ---
router.get('/blogs', getAllBlogs)
router.get('/blogs/:id', getBlogById)
router.post('/blogs', uploadBlogs.single('image'), createBlog)
router.put('/blogs/:id', uploadBlogs.single('image'), updateBlog)
router.delete('/blogs/:id', deleteBlog)

// --- Subscribers ---
router.get('/subscribers', getAllSubscribers)
router.delete('/subscribers/:id', deleteSubscriber)

// --- Settings ---
router.put('/settings/profile', updateProfile)
router.put('/settings/password', updatePassword)

// --- Site Info ---
router.get('/settings/site', (req, res) => {
  db.query('SELECT * FROM site_settings WHERE id = 1', (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message })
    if (!rows.length) return res.json({ success: true, data: { site_name: '', email: '', phone: '', address: '', opening_hours: '' } })
    res.json({ success: true, data: rows[0] })
  })
})

router.put('/settings/site', (req, res) => {
  const { site_name, email, phone, address, opening_hours } = req.body
  db.query(
    `INSERT INTO site_settings (id, site_name, email, phone, address, opening_hours)
     VALUES (1, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE site_name = VALUES(site_name), email = VALUES(email), phone = VALUES(phone), address = VALUES(address), opening_hours = VALUES(opening_hours)`,
    [site_name, email, phone, address, opening_hours],
    (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message })
      res.json({ success: true, message: 'Site info updated successfully' })
    }
  )
})

module.exports = router
