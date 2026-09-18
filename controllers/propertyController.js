const db = require('../config/db')
const path = require('path')
const fs = require('fs')

const deleteFile = (imgPath) => {
  if (!imgPath) return
  const full = path.join(__dirname, '../', imgPath)
  if (fs.existsSync(full)) fs.unlinkSync(full)
}

function baseSlug(title) {
  return title
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// Returns slug via callback — uses base slug if unique, else appends id
function resolveSlug(title, id, excludeId, cb) {
  const slug = baseSlug(title)
  db.query(
    'SELECT id FROM properties WHERE slug = ? AND id != ?',
    [slug, excludeId],
    (err, rows) => {
      if (err) return cb(err)
      cb(null, rows.length === 0 ? slug : `${slug}-${id}`)
    }
  )
}

// GET all properties
exports.getAllProperties = (req, res) => {
  db.query(
    'SELECT *, show_in_sales + 0 AS show_in_sales, show_on_homepage + 0 AS show_on_homepage FROM properties ORDER BY created_at DESC',
    (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Server Error' })
      res.json({ success: true, data: results })
    }
  )
}

// GET single property — accepts numeric id OR slug string
exports.getPropertyById = (req, res) => {
  const { id } = req.params
  const isNumeric = /^\d+$/.test(id)
  const query = isNumeric
    ? 'SELECT *, show_in_sales + 0 AS show_in_sales, show_on_homepage + 0 AS show_on_homepage FROM properties WHERE id = ?'
    : 'SELECT *, show_in_sales + 0 AS show_in_sales, show_on_homepage + 0 AS show_on_homepage FROM properties WHERE slug = ?'
  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Server Error' })
    if (results.length === 0) return res.status(404).json({ success: false, message: 'Property not found' })
    res.json({ success: true, data: results[0] })
  })
}

// POST create property
exports.createProperty = (req, res) => {
  const {
    title, location, price, size, plot_size, outdoor_area,
    rooms, bedrooms, bathrooms, status, property_type, description, show_in_sales,
    show_on_homepage,
    location_details, features, information,
    title_en, location_en, description_en,
    location_details_en, features_en, information_en,
    floor, commission, extras,
  } = req.body

  if (!title || !location || !price) {
    return res.status(400).json({ success: false, message: 'Title, location and price are required' })
  }

  db.query(
    'INSERT INTO properties (title, location, price, size, plot_size, outdoor_area, rooms, bedrooms, bathrooms, status, property_type, description, show_in_sales, show_on_homepage, location_details, features, information, title_en, location_en, description_en, location_details_en, features_en, information_en, floor, commission, extras) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      title, location, price,
      size || 0,
      plot_size || null,
      outdoor_area || null,
      rooms || 0, bedrooms || 0, bathrooms || 0,
      status || 'Active', property_type || 'villa', description,
      show_in_sales ? 1 : 0,
      show_on_homepage ? 1 : 0,
      location_details || null, features || null, information || null,
      title_en || null, location_en || null, description_en || null,
      location_details_en || null, features_en || null, information_en || null,
      floor || null, commission || null, extras || null,
    ],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Server Error' })
      const id = result.insertId
      resolveSlug(title, id, id, (err2, slug) => {
        if (err2) return res.status(500).json({ success: false, message: 'Server Error' })
        db.query('UPDATE properties SET slug = ? WHERE id = ?', [slug, id], (err3) => {
          if (err3) return res.status(500).json({ success: false, message: 'Server Error' })
          res.status(201).json({ success: true, message: 'Property created', id, slug })
        })
      })
    }
  )
}

// PUT update property
exports.updateProperty = (req, res) => {
  const { id } = req.params
  const {
    title, location, price, size, plot_size, outdoor_area,
    rooms, bedrooms, bathrooms, status, property_type, description, show_in_sales,
    show_on_homepage,
    location_details, features, information,
    title_en, location_en, description_en,
    location_details_en, features_en, information_en,
    floor, commission, extras,
  } = req.body

  resolveSlug(title, id, id, (err, slug) => {
    if (err) return res.status(500).json({ success: false, message: 'Server Error' })
    db.query(
      'UPDATE properties SET title=?, slug=?, location=?, price=?, size=?, plot_size=?, outdoor_area=?, rooms=?, bedrooms=?, bathrooms=?, status=?, property_type=?, description=?, show_in_sales=?, show_on_homepage=?, location_details=?, features=?, information=?, title_en=?, location_en=?, description_en=?, location_details_en=?, features_en=?, information_en=?, floor=?, commission=?, extras=? WHERE id=?',
      [
        title, slug, location, price,
        size || 0,
        plot_size || null,
        outdoor_area || null,
        rooms || 0, bedrooms || 0, bathrooms || 0,
        status, property_type || 'villa', description,
        show_in_sales ? 1 : 0,
        show_on_homepage ? 1 : 0,
        location_details || null, features || null, information || null,
        title_en || null, location_en || null, description_en || null,
        location_details_en || null, features_en || null, information_en || null,
        floor || null, commission || null, extras || null,
        id,
      ],
      (err2, result) => {
        if (err2) return res.status(500).json({ success: false, message: 'Server Error' })
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Property not found' })
        res.json({ success: true, message: 'Property updated', slug })
      }
    )
  })
}

// POST /properties/:id/banner
exports.uploadBanner = (req, res) => {
  const { id } = req.params
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })
  const imageUrl = `/uploads/properties/${req.file.filename}`

  db.query('SELECT image FROM properties WHERE id = ?', [id], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'Server Error' })
    const oldImage = rows[0]?.image

    db.query('UPDATE properties SET image = ? WHERE id = ?', [imageUrl, id], (err2) => {
      if (err2) return res.status(500).json({ success: false, message: 'Server Error' })
      deleteFile(oldImage)
      res.json({ success: true, image: imageUrl })
    })
  })
}

// Apartment images — a separate multi-image set, shown only for apartments.
// Same shape as the general gallery, kept in its own table.

// GET /properties/:id/apartment-images
exports.getApartmentImages = (req, res) => {
  const { id } = req.params
  db.query('SELECT * FROM apartment_images WHERE property_id = ? ORDER BY id ASC', [id], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'Server Error' })
    res.json({ success: true, data: rows })
  })
}

// POST /properties/:id/apartment-images
exports.uploadApartmentImages = (req, res) => {
  const { id } = req.params
  if (!req.files || req.files.length === 0)
    return res.status(400).json({ success: false, message: 'No files uploaded' })

  const values = req.files.map(f => [id, `/uploads/properties/${f.filename}`])
  db.query('INSERT INTO apartment_images (property_id, image) VALUES ?', [values], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Server Error' })
    res.json({ success: true, message: `${req.files.length} image(s) uploaded` })
  })
}

// DELETE /properties/apartment-images/:imageId
exports.deleteApartmentImage = (req, res) => {
  const { imageId } = req.params
  db.query('SELECT image FROM apartment_images WHERE id = ?', [imageId], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'Server Error' })
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Image not found' })

    db.query('DELETE FROM apartment_images WHERE id = ?', [imageId], (err2) => {
      if (err2) return res.status(500).json({ success: false, message: 'Server Error' })
      deleteFile(rows[0].image)
      res.json({ success: true, message: 'Image deleted' })
    })
  })
}

// GET /properties/:id/images
exports.getGalleryImages = (req, res) => {
  const { id } = req.params
  db.query('SELECT * FROM property_images WHERE property_id = ? ORDER BY id ASC', [id], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'Server Error' })
    res.json({ success: true, data: rows })
  })
}

// POST /properties/:id/images
exports.uploadGalleryImages = (req, res) => {
  const { id } = req.params
  if (!req.files || req.files.length === 0)
    return res.status(400).json({ success: false, message: 'No files uploaded' })

  const values = req.files.map(f => [id, `/uploads/properties/${f.filename}`])
  db.query('INSERT INTO property_images (property_id, image) VALUES ?', [values], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Server Error' })
    res.json({ success: true, message: `${req.files.length} image(s) uploaded` })
  })
}

// DELETE /properties/images/:imageId
exports.deleteGalleryImage = (req, res) => {
  const { imageId } = req.params
  db.query('SELECT image FROM property_images WHERE id = ?', [imageId], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'Server Error' })
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Image not found' })

    db.query('DELETE FROM property_images WHERE id = ?', [imageId], (err2) => {
      if (err2) return res.status(500).json({ success: false, message: 'Server Error' })
      deleteFile(rows[0].image)
      res.json({ success: true, message: 'Image deleted' })
    })
  })
}

// DELETE property
exports.deleteProperty = (req, res) => {
  const { id } = req.params
  db.query(
    'DELETE FROM properties WHERE id = ?',
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Server Error' })
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Property not found' })
      res.json({ success: true, message: 'Property deleted' })
    }
  )
}