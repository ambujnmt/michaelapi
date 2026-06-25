const nodemailer = require('nodemailer')
const db = require('../config/db')

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.MAIL_PORT) || 587,
  secure: false,
  requireTLS: true,
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
})

function getAdminEmail(cb) {
  db.query('SELECT email FROM site_settings WHERE id = 1', (err, rows) => {
    if (err || !rows.length || !rows[0].email) return cb(null)
    cb(rows[0].email)
  })
}

exports.notifyAdmin = function ({ type, name, email, phone, message, propertyTitle }) {
  getAdminEmail((adminEmail) => {
    if (!adminEmail) return

    const isInquiry = type === 'inquiry'
    const subject   = isInquiry
      ? `Neue Anfrage${propertyTitle ? ` – ${propertyTitle}` : ''}`
      : `Neue Kontaktanfrage von ${name}`

    const rows = [
      { label: 'Name',     value: name },
      { label: 'Email',    value: email },
      phone ? { label: 'Phone', value: phone } : null,
      isInquiry && propertyTitle ? { label: 'Property', value: propertyTitle } : null,
      { label: 'Message',  value: message },
    ].filter(Boolean)

    const tableRows = rows.map(r => `
      <tr>
        <td style="padding:10px 14px;font-size:13px;color:#555;font-weight:600;background:#f9f9f9;border-bottom:1px solid #eee;white-space:nowrap;">${r.label}</td>
        <td style="padding:10px 14px;font-size:13px;color:#333;border-bottom:1px solid #eee;">${r.value}</td>
      </tr>`).join('')

    const html = `
<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#000;padding:24px 32px;">
            <h2 style="color:#fff;margin:0;font-size:18px;">${isInquiry ? '📩 Neue Immobilienanfrage' : '📬 Neue Kontaktanfrage'}</h2>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:8px;overflow:hidden;">
              ${tableRows}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 28px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#aaa;">Diese Nachricht wurde automatisch generiert.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`

    transporter.sendMail({
      from: `"Website" <${process.env.MAIL_USER}>`,
      to: adminEmail,
      subject,
      html,
    }).catch(err => console.error('notifyAdmin mail error:', err.message))
  })
}
