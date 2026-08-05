const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const adminRoutes = require('./routes/adminRoutes')
const websiteRoutes = require('./routes/websiteRoutes')

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.get('/', (req, res) => {
  res.json({ message: 'API Running Successfully' })
})

app.use('/api/admin', adminRoutes)
app.use('/api/website', websiteRoutes)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
