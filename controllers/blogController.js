const db = require('../config/db')
const path = require('path')
const fs = require('fs')

const deleteFile = (imgPath) => {
  if (!imgPath) return
  const full = path.join(__dirname, '../', imgPath.replace(/^\//, ''))
  if (fs.existsSync(full)) fs.unlinkSync(full)
}

const slugify = (str) =>
  str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')

// GET all blogs
exports.getAllBlogs = (req, res) => {
  db.query('SELECT * FROM blogs ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message })
    res.json({ success: true, data: results })
  })
}

// GET single blog
exports.getBlogById = (req, res) => {
  db.query('SELECT * FROM blogs WHERE id = ?', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message })
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' })
    res.json({ success: true, data: rows[0] })
  })
}

// POST create blog
exports.createBlog = (req, res) => {
  const { title, content, excerpt, category, status } = req.body
  if (!title) return res.status(400).json({ success: false, message: 'Title required' })
  const slug = slugify(title) + '-' + Date.now()
  const image = req.file ? `/uploads/blogs/${req.file.filename}` : null

  db.query(
    'INSERT INTO blogs (title, slug, content, excerpt, image, category, status) VALUES (?,?,?,?,?,?,?)',
    [title, slug, content || null, excerpt || null, image, category || 'General', status || 'Draft'],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: err.message })
      res.status(201).json({ success: true, message: 'Blog created', id: result.insertId })
    }
  )
}

// PUT update blog
exports.updateBlog = (req, res) => {
  const { id } = req.params
  const { title, slug, content, excerpt, category, status } = req.body

  db.query('SELECT image FROM blogs WHERE id = ?', [id], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message })
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' })

    let image = rows[0].image
    if (req.file) {
      deleteFile(image)
      image = `/uploads/blogs/${req.file.filename}`
    }

    const finalSlug = slug ? slugify(slug) : slugify(title) + '-' + Date.now()

    db.query(
      'UPDATE blogs SET title=?, slug=?, content=?, excerpt=?, image=?, category=?, status=? WHERE id=?',
      [title, finalSlug, content || null, excerpt || null, image, category || 'General', status || 'Draft', id],
      (err2) => {
        if (err2) return res.status(500).json({ success: false, message: err2.message })
        res.json({ success: true, message: 'Blog updated' })
      }
    )
  })
}

// DELETE blog
exports.deleteBlog = (req, res) => {
  const { id } = req.params
  db.query('SELECT image FROM blogs WHERE id = ?', [id], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message })
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' })

    db.query('DELETE FROM blogs WHERE id = ?', [id], (err2) => {
      if (err2) return res.status(500).json({ success: false, message: err2.message })
      deleteFile(rows[0].image)
      res.json({ success: true, message: 'Deleted' })
    })
  })
}
