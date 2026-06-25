const db = require('../config/db')
const { notifyAdmin } = require('./mailHelper')

// Auto-create contacts table
const createTable = () => {
  db.query(
    `CREATE TABLE IF NOT EXISTS contacts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50) DEFAULT NULL,
      message TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'New',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    (err) => {
      if (err) console.error('contacts table create error:', err.message)
      else console.log('contacts table ready')
    }
  )
}

createTable()

// GET all contacts
exports.getAllContacts = (req, res) => {
  db.query('SELECT * FROM contacts ORDER BY created_at DESC', (err, results) => {
    if (err) {
      console.error('getAllContacts error:', err.message)
      return res.status(500).json({ success: false, message: err.message })
    }
    res.json({ success: true, data: results })
  })
}

// POST create contact
exports.createContact = (req, res) => {
  const { name, email, phone, message } = req.body

  console.log('createContact body:', req.body)

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Name, email and message are required' })
  }

  db.query(
    'INSERT INTO contacts (name, email, phone, message, status) VALUES (?, ?, ?, ?, ?)',
    [name, email, phone || null, message, 'New'],
    (err, result) => {
      if (err) {
        console.error('createContact insert error:', err.message)
        return res.status(500).json({ success: false, message: err.message })
      }
      notifyAdmin({ type: 'contact', name, email, phone, message })
      res.status(201).json({ success: true, message: 'Message sent successfully', id: result.insertId })
    }
  )
}

// PUT update status
exports.updateContactStatus = (req, res) => {
  const { id } = req.params
  const { status } = req.body
  const allowed = ['New', 'Replied', 'Closed']
  if (!allowed.includes(status))
    return res.status(400).json({ success: false, message: 'Invalid status' })

  db.query('UPDATE contacts SET status = ? WHERE id = ?', [status, id], (err, result) => {
    if (err) {
      console.error('updateContactStatus error:', err.message)
      return res.status(500).json({ success: false, message: err.message })
    }
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Not found' })
    res.json({ success: true, message: 'Status updated' })
  })
}

// DELETE contact
exports.deleteContact = (req, res) => {
  const { id } = req.params
  db.query('DELETE FROM contacts WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error('deleteContact error:', err.message)
      return res.status(500).json({ success: false, message: err.message })
    }
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Not found' })
    res.json({ success: true, message: 'Deleted' })
  })
}
