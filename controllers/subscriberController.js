const db = require('../config/db')

db.query(`
  CREATE TABLE IF NOT EXISTS subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`)

const subscribe = (req, res) => {
  const { email } = req.body
  if (!email) return res.json({ success: false, message: 'Email is required' })

  db.query('INSERT INTO subscribers (email) VALUES (?)', [email], (err) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.json({ success: false, message: 'Email already subscribed' })
      return res.status(500).json({ success: false, message: 'Server error' })
    }
    res.json({ success: true, message: 'Subscribed successfully!' })
  })
}

const getAllSubscribers = (req, res) => {
  db.query('SELECT * FROM subscribers ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Server error' })
    res.json({ success: true, data: results })
  })
}

const deleteSubscriber = (req, res) => {
  const { id } = req.params
  db.query('DELETE FROM subscribers WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Server error' })
    res.json({ success: true, message: 'Subscriber deleted' })
  })
}

module.exports = { subscribe, getAllSubscribers, deleteSubscriber }
