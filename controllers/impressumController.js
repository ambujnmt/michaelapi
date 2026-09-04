const db = require('../config/db')

const ensureTable = () => {
  db.query(`
    CREATE TABLE IF NOT EXISTS impressum_page (
      id INT PRIMARY KEY DEFAULT 1,
      title_de LONGTEXT,
      title_en LONGTEXT,
      subtitle_de LONGTEXT,
      subtitle_en LONGTEXT,
      sections LONGTEXT
    )
  `, (err) => { if (err) console.log('impressum_page table error:', err.message) })
}
ensureTable()

const defaults = {
  title_de: '', title_en: '',
  subtitle_de: '', subtitle_en: '',
  sections: [],
}

const parseRow = (row) => {
  let sections = []
  try { sections = row.sections ? JSON.parse(row.sections) : [] } catch { sections = [] }
  return { ...row, sections }
}

// GET (admin) — current values for the edit form
exports.getImpressumPage = (req, res) => {
  db.query('SELECT * FROM impressum_page WHERE id = 1', (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message })
    res.json({ success: true, data: rows.length ? parseRow(rows[0]) : defaults })
  })
}

// GET (public) — same data, consumed by the /impressum page
exports.getPublicImpressumPage = (req, res) => {
  db.query('SELECT * FROM impressum_page WHERE id = 1', (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message })
    res.json({ success: true, data: rows.length ? parseRow(rows[0]) : defaults })
  })
}

// PUT (admin) — update title/subtitle + sections list
exports.updateImpressumPage = (req, res) => {
  const { title_de, title_en, subtitle_de, subtitle_en, sections } = req.body
  const sectionsJson = JSON.stringify(Array.isArray(sections) ? sections : [])

  db.query(
    `INSERT INTO impressum_page (id, title_de, title_en, subtitle_de, subtitle_en, sections)
     VALUES (1, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       title_de=VALUES(title_de), title_en=VALUES(title_en),
       subtitle_de=VALUES(subtitle_de), subtitle_en=VALUES(subtitle_en),
       sections=VALUES(sections)`,
    [title_de || '', title_en || '', subtitle_de || '', subtitle_en || '', sectionsJson],
    (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message })
      res.json({ success: true, message: 'Impressum page updated successfully' })
    }
  )
}
