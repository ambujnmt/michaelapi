const db = require('../config/db')
const path = require('path')
const fs = require('fs')

const deleteFile = (imgPath) => {
  if (!imgPath) return
  const full = path.join(__dirname, '../', imgPath.replace(/^\//, ''))
  if (fs.existsSync(full)) fs.unlinkSync(full)
}

// GET all sliders
exports.getAllSliders = (req, res) => {
  db.query('SELECT * FROM sliders ORDER BY order_no ASC, id ASC', (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message })
    res.json({ success: true, data: results })
  })
}

// POST create slider
exports.createSlider = (req, res) => {
  const { title, subtitle, btn_text, btn_link, order_no, status } = req.body
  const image = req.file ? `/uploads/sliders/${req.file.filename}` : null

  db.query(
    'INSERT INTO sliders (title, subtitle, btn_text, btn_link, image, order_no, status) VALUES (?,?,?,?,?,?,?)',
    [title || null, subtitle || null, btn_text || null, btn_link || null, image, order_no || 0, status || 'Active'],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: err.message })
      res.status(201).json({ success: true, message: 'Slider created', id: result.insertId })
    }
  )
}

// PUT update slider
exports.updateSlider = (req, res) => {
  const { id } = req.params
  const { title, subtitle, btn_text, btn_link, order_no, status } = req.body

  db.query('SELECT image FROM sliders WHERE id = ?', [id], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message })
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' })

    let image = rows[0].image
    if (req.file) {
      deleteFile(image)
      image = `/uploads/sliders/${req.file.filename}`
    }

    db.query(
      'UPDATE sliders SET title=?, subtitle=?, btn_text=?, btn_link=?, image=?, order_no=?, status=? WHERE id=?',
      [title || null, subtitle || null, btn_text || null, btn_link || null, image, order_no || 0, status || 'Active', id],
      (err2) => {
        if (err2) return res.status(500).json({ success: false, message: err2.message })
        res.json({ success: true, message: 'Slider updated' })
      }
    )
  })
}

// DELETE slider
exports.deleteSlider = (req, res) => {
  const { id } = req.params
  db.query('SELECT image FROM sliders WHERE id = ?', [id], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message })
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' })

    db.query('DELETE FROM sliders WHERE id = ?', [id], (err2) => {
      if (err2) return res.status(500).json({ success: false, message: err2.message })
      deleteFile(rows[0].image)
      res.json({ success: true, message: 'Deleted' })
    })
  })
}
