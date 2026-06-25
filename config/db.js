const mysql = require('mysql2')
require('dotenv').config()

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

connection.connect((err) => {
  if (err) {
    console.log('Database Error:', err)
  } else {
    console.log('MySQL Connected')
    connection.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id INT PRIMARY KEY DEFAULT 1,
        site_name VARCHAR(255) DEFAULT '',
        email VARCHAR(255) DEFAULT '',
        phone VARCHAR(100) DEFAULT '',
        address TEXT DEFAULT '',
        opening_hours VARCHAR(255) DEFAULT ''
      )
    `, (err) => {
      if (err) console.log('site_settings table error:', err.message)
      else {
        console.log('site_settings table ready')
        connection.query(`ALTER TABLE site_settings ADD COLUMN opening_hours VARCHAR(255) DEFAULT ''`, (e) => {
          if (e && e.errno !== 1060) console.log('opening_hours column error:', e.message)
        })
      }
    })
    connection.query(`ALTER TABLE properties ADD COLUMN show_in_sales TINYINT(1) NOT NULL DEFAULT 0`, (err) => {
      if (err && err.errno !== 1060) console.log('show_in_sales column error:', err.message)
    })
  }
})

module.exports = connection
