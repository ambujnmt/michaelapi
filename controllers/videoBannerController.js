const db = require('../config/db')
const path = require('path')
const fs = require('fs')

const ensureTable = () => {
  db.query(`
    CREATE TABLE IF NOT EXISTS video_banner (
      id INT PRIMARY KEY DEFAULT 1,
      text_de LONGTEXT,
      text_en LONGTEXT,
      video VARCHAR(500),
      hero_video VARCHAR(500)
    )
  `, (err) => {
    if (err) return console.log('video_banner table error:', err.message)
    // Migrate installs created before hero_video existed
    db.query('ALTER TABLE video_banner ADD COLUMN hero_video VARCHAR(500)', (e) => {
      if (e && e.errno !== 1060) console.log('video_banner.hero_video column error:', e.message)
    })
  })
}
ensureTable()

const deleteFile = (videoPath) => {
  if (!videoPath) return
  const full = path.join(__dirname, '../', videoPath.replace(/^\//, ''))
  if (fs.existsSync(full)) fs.unlinkSync(full)
}

const defaults = {
  text_de: 'Außergewöhnliche Immobilien für außergewöhnliche Ansprüche',
  text_en: 'Exceptional properties for exceptional demands',
  video: '',
  hero_video: '',
}

// GET (admin) — current values for the edit form
exports.getVideoBanner = (req, res) => {
  db.query('SELECT * FROM video_banner WHERE id = 1', (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message })
    res.json({ success: true, data: rows.length ? rows[0] : defaults })
  })
}

// GET (public) — same data, consumed by the homepage top hero + video banner sections
exports.getPublicVideoBanner = (req, res) => {
  db.query('SELECT * FROM video_banner WHERE id = 1', (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message })
    res.json({ success: true, data: rows.length ? rows[0] : defaults })
  })
}

// PUT (admin) — update text + optional video files (banner section + top hero)
exports.updateVideoBanner = (req, res) => {
  const { text_de, text_en } = req.body

  db.query('SELECT video, hero_video FROM video_banner WHERE id = 1', (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message })
    let video = rows.length ? rows[0].video : null
    let heroVideo = rows.length ? rows[0].hero_video : null

    const videoFile = req.files?.video?.[0]
    const heroVideoFile = req.files?.hero_video?.[0]

    if (videoFile) {
      deleteFile(video)
      video = `/uploads/video-banner/${videoFile.filename}`
    }
    if (heroVideoFile) {
      deleteFile(heroVideo)
      heroVideo = `/uploads/video-banner/${heroVideoFile.filename}`
    }

    db.query(
      `INSERT INTO video_banner (id, text_de, text_en, video, hero_video)
       VALUES (1, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         text_de=VALUES(text_de), text_en=VALUES(text_en), video=VALUES(video), hero_video=VALUES(hero_video)`,
      [text_de || '', text_en || '', video, heroVideo],
      (err2) => {
        if (err2) return res.status(500).json({ success: false, message: err2.message })
        res.json({ success: true, message: 'Video banner updated successfully', data: { video, hero_video: heroVideo } })
      }
    )
  })
}
