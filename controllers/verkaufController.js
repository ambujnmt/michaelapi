const db = require('../config/db')
const path = require('path')
const fs = require('fs')

const ensureTable = () => {
  db.query(`
    CREATE TABLE IF NOT EXISTS verkauf_page (
      id INT PRIMARY KEY DEFAULT 1,
      heading_de LONGTEXT,
      heading_en LONGTEXT,
      text_top_de LONGTEXT,
      text_top_en LONGTEXT,
      text_bottom_de LONGTEXT,
      text_bottom_en LONGTEXT,
      photo_note_de LONGTEXT,
      photo_note_en LONGTEXT,
      image VARCHAR(500)
    )
  `, (err) => {
    if (err) return console.log('verkauf_page table error:', err.message)
    // Migrate installs created with an older field set
    const addCols = ['title_de', 'title_en', 'subtitle_de', 'subtitle_en', 'heading_de', 'heading_en', 'text_top_de', 'text_top_en', 'text_bottom_de', 'text_bottom_en', 'photo_note_de', 'photo_note_en']
    addCols.forEach(col => {
      db.query(`ALTER TABLE verkauf_page ADD COLUMN ${col} LONGTEXT`, (e) => {
        if (e && e.errno !== 1060) console.log(`verkauf_page.${col} column error:`, e.message)
      })
    })
    db.query(`ALTER TABLE verkauf_page ADD COLUMN image VARCHAR(500)`, (e) => {
      if (e && e.errno !== 1060) console.log('verkauf_page.image column error:', e.message)
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
  text_top_de: '', text_top_en: '',
  text_bottom_de: '', text_bottom_en: '',
  photo_note_de: '', photo_note_en: '',
  image: '',
}

// GET (admin) — current values for the edit form
exports.getVerkaufPage = (req, res) => {
  db.query('SELECT * FROM verkauf_page WHERE id = 1', (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message })
    res.json({ success: true, data: rows.length ? rows[0] : defaults })
  })
}

// GET (public) — same data, consumed by the /verkauf page
exports.getPublicVerkaufPage = (req, res) => {
  db.query('SELECT * FROM verkauf_page WHERE id = 1', (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message })
    res.json({ success: true, data: rows.length ? rows[0] : defaults })
  })
}

// PUT (admin) — update text fields + optional image
exports.updateVerkaufPage = (req, res) => {
  const {
    title_de, title_en,
    subtitle_de, subtitle_en,
    heading_de, heading_en,
    text_top_de, text_top_en,
    text_bottom_de, text_bottom_en,
    photo_note_de, photo_note_en,
  } = req.body

  db.query('SELECT image FROM verkauf_page WHERE id = 1', (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message })
    let image = rows.length ? rows[0].image : null
    if (req.file) {
      deleteFile(image)
      image = `/uploads/verkauf/${req.file.filename}`
    }
    db.query(
      `INSERT INTO verkauf_page (
        id, title_de, title_en, subtitle_de, subtitle_en,
        heading_de, heading_en, text_top_de, text_top_en,
        text_bottom_de, text_bottom_en, photo_note_de, photo_note_en, image
      ) VALUES (1, ?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE
        title_de=VALUES(title_de), title_en=VALUES(title_en),
        subtitle_de=VALUES(subtitle_de), subtitle_en=VALUES(subtitle_en),
        heading_de=VALUES(heading_de), heading_en=VALUES(heading_en),
        text_top_de=VALUES(text_top_de), text_top_en=VALUES(text_top_en),
        text_bottom_de=VALUES(text_bottom_de), text_bottom_en=VALUES(text_bottom_en),
        photo_note_de=VALUES(photo_note_de), photo_note_en=VALUES(photo_note_en),
        image=VALUES(image)`,
      [
        title_de || '', title_en || '',
        subtitle_de || '', subtitle_en || '',
        heading_de || '', heading_en || '',
        text_top_de || '', text_top_en || '',
        text_bottom_de || '', text_bottom_en || '',
        photo_note_de || '', photo_note_en || '',
        image,
      ],
      (err2) => {
        if (err2) return res.status(500).json({ success: false, message: err2.message })
        res.json({ success: true, message: 'Verkauf page updated successfully', data: { image } })
      }
    )
  })
}
