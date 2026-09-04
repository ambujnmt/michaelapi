const db = require('../config/db')
const path = require('path')
const fs = require('fs')

const ensureTable = () => {
  db.query(`
    CREATE TABLE IF NOT EXISTS about_info (
      id INT PRIMARY KEY DEFAULT 1,
      title_de LONGTEXT,
      title_en LONGTEXT,
      subtitle_de LONGTEXT,
      subtitle_en LONGTEXT,
      heading_de LONGTEXT,
      heading_en LONGTEXT,
      content_de LONGTEXT,
      content_en LONGTEXT,
      image VARCHAR(500)
    )
  `, (err) => {
    if (err) return console.log('about_info table error:', err.message)
    // Migrate installs created with the older field set
    const addCols = ['title_de', 'title_en', 'subtitle_de', 'subtitle_en', 'content_de', 'content_en']
    addCols.forEach(col => {
      db.query(`ALTER TABLE about_info ADD COLUMN ${col} LONGTEXT`, (e) => {
        if (e && e.errno !== 1060) console.log(`about_info.${col} column error:`, e.message)
      })
    })
    const dropCols = ['banner_title_de', 'banner_title_en', 'banner_sub_de', 'banner_sub_en', 'p1_de', 'p1_en', 'p2_de', 'p2_en', 'li1_de', 'li1_en', 'li2_de', 'li2_en', 'li3_de', 'li3_en']
    dropCols.forEach(col => {
      db.query(`ALTER TABLE about_info DROP COLUMN ${col}`, (e) => {
        if (e && e.errno !== 1091) console.log(`about_info.${col} drop error:`, e.message)
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

const defaults = {
  title_de: '', title_en: '',
  subtitle_de: '', subtitle_en: '',
  heading_de: '', heading_en: '',
  content_de: '', content_en: '',
  image: '',
}

// GET (admin) — current values for the edit form
exports.getAbout = (req, res) => {
  db.query('SELECT * FROM about_info WHERE id = 1', (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message })
    res.json({ success: true, data: rows.length ? rows[0] : defaults })
  })
}

// GET (public) — same data, consumed by the /unternehmen page
exports.getPublicAbout = (req, res) => {
  db.query('SELECT * FROM about_info WHERE id = 1', (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message })
    res.json({ success: true, data: rows.length ? rows[0] : defaults })
  })
}

// PUT (admin) — update text fields + optional image
exports.updateAbout = (req, res) => {
  const { title_de, title_en, subtitle_de, subtitle_en, heading_de, heading_en, content_de, content_en } = req.body

  db.query('SELECT image FROM about_info WHERE id = 1', (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message })
    let image = rows.length ? rows[0].image : null
    if (req.file) {
      deleteFile(image)
      image = `/uploads/about/${req.file.filename}`
    }
    db.query(
      `INSERT INTO about_info (
        id, title_de, title_en, subtitle_de, subtitle_en,
        heading_de, heading_en, content_de, content_en, image
      ) VALUES (1, ?,?,?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE
        title_de=VALUES(title_de), title_en=VALUES(title_en),
        subtitle_de=VALUES(subtitle_de), subtitle_en=VALUES(subtitle_en),
        heading_de=VALUES(heading_de), heading_en=VALUES(heading_en),
        content_de=VALUES(content_de), content_en=VALUES(content_en),
        image=VALUES(image)`,
      [
        title_de || '', title_en || '',
        subtitle_de || '', subtitle_en || '',
        heading_de || '', heading_en || '',
        content_de || '', content_en || '',
        image,
      ],
      (err2) => {
        if (err2) return res.status(500).json({ success: false, message: err2.message })
        res.json({ success: true, message: 'About info updated successfully', data: { image } })
      }
    )
  })
}
