const multer = require('multer')
const path = require('path')
const fs = require('fs')

function createUpload(folder) {
  const uploadDir = path.join(__dirname, '../uploads', folder)
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase()
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`)
    },
  })

  const fileFilter = (req, file, cb) => {
    const ok = /jpeg|jpg|png|webp/.test(path.extname(file.originalname).toLowerCase())
    ok ? cb(null, true) : cb(new Error('Only image files allowed'))
  }

  return multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } })
}

// Same disk-storage pattern as createUpload, but accepts video files
// (mp4/webm/mov/ogg) with a larger size limit.
function createVideoUpload(folder) {
  const uploadDir = path.join(__dirname, '../uploads', folder)
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase()
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`)
    },
  })

  const fileFilter = (req, file, cb) => {
    const ok = /mp4|webm|mov|ogg/.test(path.extname(file.originalname).toLowerCase())
    ok ? cb(null, true) : cb(new Error('Only video files allowed (mp4, webm, mov, ogg)'))
  }

  return multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } })
}

module.exports = createUpload
module.exports.createVideoUpload = createVideoUpload
