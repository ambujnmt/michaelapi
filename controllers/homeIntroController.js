const db = require('../config/db')

const ensureTable = () => {
  db.query(`
    CREATE TABLE IF NOT EXISTS home_intro (
      id INT PRIMARY KEY DEFAULT 1,
      heading_de LONGTEXT,
      heading_en LONGTEXT,
      intro1_de LONGTEXT,
      intro1_en LONGTEXT,
      intro2_de LONGTEXT,
      intro2_en LONGTEXT
    )
  `, (err) => { if (err) console.log('home_intro table error:', err.message) })
}
ensureTable()

const defaults = {
  heading_de: 'MICHAEL LEBER IMMOBILIEN',
  heading_en: 'MICHAEL LEBER IMMOBILIEN',
  intro1_de: 'Michael Leber Immobilien steht für die persönliche und diskrete Vermittlung hochwertiger Wohnimmobilien in Wien – mit besonderem Fokus auf Döbling und ausgewählte Premiumlagen.',
  intro1_en: 'Michael Leber Immobilien stands for the personal and discreet brokerage of high-quality residential properties in Vienna – with a special focus on Döbling and select premium locations.',
  intro2_de: 'Fundierte Marktkenntnis, individuelle Beratung und langjährige Erfahrung bilden die Grundlage für eine vertrauensvolle Zusammenarbeit auf höchstem Niveau.',
  intro2_en: 'Sound market knowledge, individual advice and many years of experience form the basis for a trusting collaboration at the highest level.',
}

// GET (admin) — current values for the edit form
exports.getHomeIntro = (req, res) => {
  db.query('SELECT * FROM home_intro WHERE id = 1', (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message })
    res.json({ success: true, data: rows.length ? rows[0] : defaults })
  })
}

// GET (public) — same data, consumed by the homepage ML Immobilien section
exports.getPublicHomeIntro = (req, res) => {
  db.query('SELECT * FROM home_intro WHERE id = 1', (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message })
    res.json({ success: true, data: rows.length ? rows[0] : defaults })
  })
}

// PUT (admin) — update heading + intro paragraphs
exports.updateHomeIntro = (req, res) => {
  const { heading_de, heading_en, intro1_de, intro1_en, intro2_de, intro2_en } = req.body

  db.query(
    `INSERT INTO home_intro (id, heading_de, heading_en, intro1_de, intro1_en, intro2_de, intro2_en)
     VALUES (1, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       heading_de=VALUES(heading_de), heading_en=VALUES(heading_en),
       intro1_de=VALUES(intro1_de), intro1_en=VALUES(intro1_en),
       intro2_de=VALUES(intro2_de), intro2_en=VALUES(intro2_en)`,
    [heading_de || '', heading_en || '', intro1_de || '', intro1_en || '', intro2_de || '', intro2_en || ''],
    (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message })
      res.json({ success: true, message: 'Homepage intro updated successfully' })
    }
  )
}
