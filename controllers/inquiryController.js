const db = require('../config/db')

// GET all inquiries
exports.getAllInquiries = (req, res) => {
  db.query(
    'SELECT * FROM inquiries ORDER BY created_at DESC',
    (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Server Error' })
      res.json({ success: true, data: results })
    }
  )
}

// GET single inquiry
exports.getInquiryById = (req, res) => {
  const { id } = req.params
  db.query(
    'SELECT * FROM inquiries WHERE id = ?',
    [id],
    (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Server Error' })
      if (results.length === 0) return res.status(404).json({ success: false, message: 'Inquiry not found' })
      res.json({ success: true, data: results[0] })
    }
  )
}

// POST create inquiry (from website contact form)
exports.createInquiry = (req, res) => {
  const { name, email, phone, message, property_id } = req.body

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Name, email and message are required' })
  }

  db.query(
    'INSERT INTO inquiries (name, email, phone, message, property_id, status) VALUES (?, ?, ?, ?, ?, ?)',
    [name, email, phone, message, property_id || null, 'New'],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Server Error' })
      res.status(201).json({ success: true, message: 'Inquiry submitted successfully', id: result.insertId })
    }
  )
}

// PUT update inquiry status
exports.updateInquiryStatus = (req, res) => {
  const { id } = req.params
  const { status } = req.body

  const allowed = ['New', 'Replied', 'Closed']
  if (!allowed.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value' })
  }

  db.query(
    'UPDATE inquiries SET status = ? WHERE id = ?',
    [status, id],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Server Error' })
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Inquiry not found' })
      res.json({ success: true, message: 'Status updated' })
    }
  )
}

// DELETE inquiry
exports.deleteInquiry = (req, res) => {
  const { id } = req.params
  db.query(
    'DELETE FROM inquiries WHERE id = ?',
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Server Error' })
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Inquiry not found' })
      res.json({ success: true, message: 'Inquiry deleted' })
    }
  )
}
