const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Routes
const adminRoutes = require('./routes/adminRoutes')
const websiteRoutes = require('./routes/websiteRoutes')

app.use('/api/admin', adminRoutes)
app.use('/api/website', websiteRoutes)

// Test Route
app.get('/', (req, res) => {
  res.json({
    message: 'API Running Successfully'
  })
})

// Server Start
const PORT = process.env.PORT || 5000

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Run: npx kill-port ${PORT}`)
    process.exit(1)
  }
})