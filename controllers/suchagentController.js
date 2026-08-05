const db = require('../config/db')
const { notifyAdmin } = require('./mailHelper')

db.query(`
  CREATE TABLE IF NOT EXISTS suchagents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(100) DEFAULT NULL,
    location VARCHAR(255) DEFAULT NULL,
    size VARCHAR(50) DEFAULT NULL,
    price VARCHAR(50) DEFAULT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(100) DEFAULT NULL,
    status ENUM('New','Replied','Closed') DEFAULT 'New',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`, () => {})

exports.createSuchagent = (req, res) => {
  const { type, location, size, price, email, phone } = req.body
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' })

  db.query(
    'INSERT INTO suchagents (type, location, size, price, email, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [type || null, location || null, size || null, price || null, email, phone || null, 'New'],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Server Error' })
      const message = `Typ: ${type || '—'} | Standort: ${location || '—'} | Min. Größe: ${size || '—'} m² | Max. Preis: ${price || '—'} €`
      notifyAdmin({ type: 'inquiry', name: 'Suchagent', email, phone: phone || '', message })
      res.status(201).json({ success: true, message: 'Suchagent submitted', id: result.insertId })
    }
  )
}

exports.getAllSuchagents = (req, res) => {
  db.query('SELECT * FROM suchagents ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Server Error' })
    res.json({ success: true, data: results })
  })
}

exports.updateSuchagentStatus = (req, res) => {
  const { id } = req.params
  const { status } = req.body
  const allowed = ['New', 'Replied', 'Closed']
  if (!allowed.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' })

  db.query('UPDATE suchagents SET status = ? WHERE id = ?', [status, id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Server Error' })
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Not found' })
    res.json({ success: true, message: 'Status updated' })
  })
}

exports.deleteSuchagent = (req, res) => {
  const { id } = req.params
  db.query('DELETE FROM suchagents WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Server Error' })
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Not found' })
    res.json({ success: true, message: 'Deleted' })
  })
}
