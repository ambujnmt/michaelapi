const express = require('express')
const router = express.Router()

const {
  getAllProperties,
  getPropertyById,
  getGalleryImages,
} = require('../controllers/propertyController')
const { createInquiry } = require('../controllers/inquiryController')
const { createContact } = require('../controllers/contactController')
const { subscribe } = require('../controllers/subscriberController')
const { getAllSliders } = require('../controllers/sliderController')
const { getAllTeam } = require('../controllers/teamController')
const { getAllTestimonials } = require('../controllers/testimonialController')
const { getAllBlogs } = require('../controllers/blogController')
const db = require('../config/db')

// --- Properties (public listing) ---
router.get('/properties', getAllProperties)
router.get('/properties/sales', (req, res) => {
  db.query('SELECT *, show_in_sales + 0 AS show_in_sales FROM properties WHERE show_in_sales = 1 ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Server Error' })
    res.json({ success: true, data: results })
  })
})
router.get('/properties/:id/images', getGalleryImages)
router.get('/properties/:id', getPropertyById)

// --- Contact / Inquiry form ---
router.post('/inquiry', createInquiry)
router.post('/contact', createContact)

// --- Newsletter ---
router.post('/subscribe', subscribe)

// --- Sliders (active only) ---
router.get('/sliders', (req, res) => {
  db.query('SELECT * FROM sliders WHERE status = ? ORDER BY order_no ASC, id ASC', ['Active'], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message })
    res.json({ success: true, data: results })
  })
})

// --- Testimonials (active only) ---
router.get('/testimonials', (req, res) => {
  db.query('SELECT * FROM testimonials WHERE status = ? ORDER BY created_at DESC', ['Active'], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message })
    res.json({ success: true, data: results })
  })
})

// --- Blogs (published only, latest 6) ---
router.get('/blogs', (req, res) => {
  db.query('SELECT id, title, slug, excerpt, image, category, created_at FROM blogs WHERE status = ? ORDER BY created_at DESC LIMIT 6', ['Published'], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message })
    res.json({ success: true, data: results })
  })
})

// --- Site Info (public) ---
router.get('/site-info', (req, res) => {
  db.query(
    `CREATE TABLE IF NOT EXISTS site_settings (
      id INT PRIMARY KEY DEFAULT 1,
      site_name VARCHAR(255) DEFAULT '',
      email VARCHAR(255) DEFAULT '',
      phone VARCHAR(100) DEFAULT '',
      address TEXT DEFAULT ''
    )`, () => {
    db.query('SELECT site_name, email, phone, address, opening_hours FROM site_settings WHERE id = 1', (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: err.message })
      if (!rows.length) return res.json({ success: true, data: { site_name: '', email: '', phone: '', address: '', opening_hours: '' } })
      res.json({ success: true, data: rows[0] })
    })
  })
})

// --- Team (public, active only) ---
router.get('/team', (req, res) => {
  db.query('SELECT * FROM team_members WHERE status = ? ORDER BY sort_order ASC, id ASC', ['Active'], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message })
    res.json({ success: true, data: results })
  })
})

// --- Single blog by slug (or ID fallback) ---
router.get('/blogs/:slug', (req, res) => {
  const param = req.params.slug
  const isId = /^\d+$/.test(param)
  const query = isId
    ? 'SELECT * FROM blogs WHERE id = ? AND status = ?'
    : 'SELECT * FROM blogs WHERE slug = ? AND status = ?'
  db.query(query, [param, 'Published'], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message })
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' })
    res.json({ success: true, data: rows[0] })
  })
})

module.exports = router
