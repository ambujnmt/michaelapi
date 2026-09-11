const mysql = require('mysql2')
require('dotenv').config()

// Use a POOL, not a single createConnection().
//
// A lone connection silently dies on DB idle-timeout (wait_timeout), a DB
// restart, or a network blip. The very next query on that dead socket then
// crashes the whole Node process with mysql2's fatal-error bug:
//   TypeError: this._command.onResult is not a function
// A pool hands out a fresh, live connection per query and quietly discards
// broken ones, so the API keeps working across DB hiccups.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
})

// Last-resort guard: a background pool error must never take down the server.
pool.on('error', (err) => {
  console.log('MySQL pool error:', err && (err.code || err.message))
})

const DB_NAME = process.env.DB_NAME

// Add a column only if it isn't already there.
//
// The old code fired `ALTER TABLE ... ADD COLUMN` every boot and ignored
// errno 1060 (duplicate column) in the callback. But on MariaDB that
// duplicate-column error comes back flagged *fatal*, and mysql2's fatal-error
// path is buggy ("this._command.onResult is not a function") — it throws
// instead of calling the callback, killing the process. So we check
// information_schema first and never emit the error at all.
function ensureColumn(table, column, definition) {
  pool.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [DB_NAME, table, column],
    (err, rows) => {
      if (err) {
        console.log(`${table}.${column} check error:`, err.message)
        return
      }
      if (rows.length) return // already exists
      pool.query(`ALTER TABLE \`${table}\` ADD COLUMN ${definition}`, (e) => {
        if (e && e.errno !== 1060) console.log(`${table}.${column} add error:`, e.message)
      })
    }
  )
}

// One-time, idempotent schema bootstrap. Runs on first use of the pool.
pool.query('SELECT 1', (err) => {
  if (err) {
    console.log('Database Error:', err)
    return
  }
  console.log('MySQL Connected')

  pool.query(`
    CREATE TABLE IF NOT EXISTS site_settings (
      id INT PRIMARY KEY DEFAULT 1,
      site_name VARCHAR(255) DEFAULT '',
      email VARCHAR(255) DEFAULT '',
      phone VARCHAR(100) DEFAULT '',
      address TEXT DEFAULT '',
      opening_hours VARCHAR(255) DEFAULT ''
    )
  `, (err) => {
    if (err) {
      console.log('site_settings table error:', err.message)
      return
    }
    console.log('site_settings table ready')
    ensureColumn('site_settings', 'opening_hours', `opening_hours VARCHAR(255) DEFAULT ''`)
  })

  ensureColumn('properties', 'show_in_sales', `show_in_sales TINYINT(1) NOT NULL DEFAULT 0`)
  ensureColumn('properties', 'location_details', `location_details LONGTEXT`)
  ensureColumn('properties', 'features', `features LONGTEXT`)
  ensureColumn('properties', 'information', `information LONGTEXT`)

  // English companion columns for the translatable text fields. German stays in
  // the original columns; these hold the optional EN override (blank => site
  // falls back to the German value).
  ensureColumn('properties', 'title_en', `title_en VARCHAR(255)`)
  ensureColumn('properties', 'location_en', `location_en VARCHAR(255)`)
  ensureColumn('properties', 'description_en', `description_en LONGTEXT`)
  ensureColumn('properties', 'location_details_en', `location_details_en LONGTEXT`)
  ensureColumn('properties', 'features_en', `features_en LONGTEXT`)
  ensureColumn('properties', 'information_en', `information_en LONGTEXT`)

  // Floor/Etage (apartments only), broker commission, and a free-text Extras
  // list (e.g. "Garage, Balkon, Garten, Keller"). Language-neutral single fields.
  ensureColumn('properties', 'floor', `floor VARCHAR(100)`)
  ensureColumn('properties', 'commission', `commission VARCHAR(255)`)
  ensureColumn('properties', 'extras', `extras TEXT`)

  // Apartment-only image set (multiple images), mirrors property_images.
  pool.query(`
    CREATE TABLE IF NOT EXISTS apartment_images (
      id INT AUTO_INCREMENT PRIMARY KEY,
      property_id INT NOT NULL,
      image VARCHAR(500) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_apartment_images_property (property_id)
    )
  `, (e) => {
    if (e) console.log('apartment_images table error:', e.message)
  })
})

module.exports = pool
