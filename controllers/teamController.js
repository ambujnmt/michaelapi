const db = require('../config/db')
const path = require('path')
const fs = require('fs')

const ensureTable = () => {
  db.query(`
    CREATE TABLE IF NOT EXISTS team_members (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      position VARCHAR(255),
      bio TEXT,
      email VARCHAR(255),
      phone VARCHAR(100),
      image VARCHAR(500),
      status ENUM('Active','Inactive') DEFAULT 'Active',
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, () => {
    // Bilingual columns (DE / EN) — added on top of the legacy position/bio,
    // which stay populated (with the DE value) for backward compatibility.
    const cols = [
      "name_de VARCHAR(255)", "name_en VARCHAR(255)",
      "position_de VARCHAR(255)", "position_en VARCHAR(255)",
      "bio_de TEXT", "bio_en TEXT",
    ]
    cols.forEach(def => {
      db.query(`ALTER TABLE team_members ADD COLUMN ${def}`, (e) => {
        if (e && e.errno !== 1060) console.log('team_members column error:', e.message)
      })
    })
  })
}
ensureTable()

const deleteFile = (imgPath) => {
  if (!imgPath) return
  const full = path.join(__dirname, '../', imgPath.replace(/^\//, ''))
  if (fs.existsSync(full)) fs.unlinkSync(full)
}

exports.getAllTeam = (req, res) => {
  db.query('SELECT * FROM team_members ORDER BY sort_order ASC, id ASC', (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message })
    res.json({ success: true, data: results })
  })
}

exports.createTeamMember = (req, res) => {
  const { email, phone, status, sort_order } = req.body
  const name_de = req.body.name_de || req.body.name || null
  const name_en = req.body.name_en || null
  const name = name_de || name_en
  const position_de = req.body.position_de || req.body.position || null
  const position_en = req.body.position_en || null
  const bio_de = req.body.bio_de || req.body.bio || null
  const bio_en = req.body.bio_en || null
  if (!name) return res.status(400).json({ success: false, message: 'Name is required' })
  const image = req.file ? `/uploads/team/${req.file.filename}` : null
  db.query(
    `INSERT INTO team_members
      (name, position, bio, name_de, name_en, position_de, position_en, bio_de, bio_en, email, phone, image, status, sort_order)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [name, position_de, bio_de, name_de, name_en, position_de, position_en, bio_de, bio_en, email || null, phone || null, image, status || 'Active', sort_order || 0],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: err.message })
      res.status(201).json({ success: true, message: 'Team member created', id: result.insertId })
    }
  )
}

exports.updateTeamMember = (req, res) => {
  const { id } = req.params
  const { email, phone, status, sort_order } = req.body
  const name_de = req.body.name_de || req.body.name || null
  const name_en = req.body.name_en || null
  const name = name_de || name_en
  const position_de = req.body.position_de || req.body.position || null
  const position_en = req.body.position_en || null
  const bio_de = req.body.bio_de || req.body.bio || null
  const bio_en = req.body.bio_en || null
  db.query('SELECT image FROM team_members WHERE id = ?', [id], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message })
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' })
    let image = rows[0].image
    if (req.file) {
      deleteFile(image)
      image = `/uploads/team/${req.file.filename}`
    }
    db.query(
      `UPDATE team_members SET
         name=?, position=?, bio=?, name_de=?, name_en=?, position_de=?, position_en=?, bio_de=?, bio_en=?,
         email=?, phone=?, image=?, status=?, sort_order=?
       WHERE id=?`,
      [name, position_de, bio_de, name_de, name_en, position_de, position_en, bio_de, bio_en, email || null, phone || null, image, status || 'Active', sort_order || 0, id],
      (err2) => {
        if (err2) return res.status(500).json({ success: false, message: err2.message })
        res.json({ success: true, message: 'Team member updated' })
      }
    )
  })
}

exports.deleteTeamMember = (req, res) => {
  const { id } = req.params
  db.query('SELECT image FROM team_members WHERE id = ?', [id], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message })
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' })
    db.query('DELETE FROM team_members WHERE id = ?', [id], (err2) => {
      if (err2) return res.status(500).json({ success: false, message: err2.message })
      deleteFile(rows[0].image)
      res.json({ success: true, message: 'Deleted' })
    })
  })
}
