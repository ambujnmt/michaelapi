const db = require('../config/db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

exports.login = (req, res) => {
  const { email, password } = req.body

  db.query('SELECT * FROM admins WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Server Error' })
    if (results.length === 0) return res.status(401).json({ success: false, message: 'Invalid Email' })

    const admin = results[0]
    const isMatch = await bcrypt.compare(password, admin.password)
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid Password' })

    const token = jwt.sign(
      { id: admin.id },
      process.env.JWT_SECRET || 'mysecretkey',
      { expiresIn: '1d' }
    )

    res.json({
      success: true,
      token,
      admin: { id: admin.id, name: admin.name, email: admin.email }
    })
  })
}

exports.updateProfile = (req, res) => {
  const { name, email } = req.body
  const id = req.admin.id

  db.query(
    'UPDATE admins SET name = ?, email = ? WHERE id = ?',
    [name, email, id],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Server Error' })
      res.json({ success: true, message: 'Profile updated', admin: { name, email } })
    }
  )
}

exports.updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const id = req.admin.id

  db.query('SELECT * FROM admins WHERE id = ?', [id], async (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Server Error' })

    const isMatch = await bcrypt.compare(currentPassword, results[0].password)
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' })

    const hashed = await bcrypt.hash(newPassword, 10)
    db.query('UPDATE admins SET password = ? WHERE id = ?', [hashed, id], (err2) => {
      if (err2) return res.status(500).json({ success: false, message: 'Server Error' })
      res.json({ success: true, message: 'Password updated successfully' })
    })
  })
}
