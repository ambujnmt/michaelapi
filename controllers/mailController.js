const nodemailer = require('nodemailer')

exports.sendMail = async (req, res) => {
  const { to, toName, subject, message, propertyTitle } = req.body

  if (!to || !message) {
    return res.status(400).json({ success: false, message: 'Recipient and message are required' })
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.MAIL_PORT) || 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    })

    // Build full message: greeting + admin message + signature
    const fullMessage = `Sehr geehrte/r ${toName || 'Interessent/in'},\n\n${message}\n\nMit freundlichen Grüßen,\nMichael Leber Immobilien`

    // Convert to HTML paragraphs
    const messageHtml = fullMessage
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .split('\n')
      .map(line => line.trim() === '' ? '<br/>' : `<p style="margin:0 0 10px 0;color:#333;font-size:15px;line-height:24px;">${line}</p>`)
      .join('')

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#000;padding:28px 36px;text-align:left;">
            <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;letter-spacing:0.02em;">
              Michael Leber Immobilien
            </h1>
            <p style="color:rgba(255,255,255,0.6);margin:4px 0 0;font-size:13px;">
              Musterstraße 1, 1010 Wien, Österreich
            </p>
          </td>
        </tr>

        ${propertyTitle ? `
        <!-- Property badge -->
        <tr>
          <td style="background:#f9f9f9;padding:14px 36px;border-bottom:1px solid #eee;">
            <p style="margin:0;font-size:13px;color:#555;">
              <strong style="color:#000;">Betreff Immobilie:</strong> ${propertyTitle}
            </p>
          </td>
        </tr>` : ''}

        <!-- Body -->
        <tr>
          <td style="padding:36px;">
            ${messageHtml}
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:0 36px;"><hr style="border:none;border-top:1px solid #eee;margin:0;"/></td></tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 36px;background:#fafafa;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right:16px;border-right:1px solid #ddd;">
                  <p style="margin:0;font-size:13px;color:#555;">📞 +43 664 547 5915</p>
                </td>
                <td style="padding-left:16px;">
                  <p style="margin:0;font-size:13px;color:#555;">✉ office@michaelleber.at</p>
                </td>
              </tr>
            </table>
            <p style="margin:12px 0 0;font-size:11px;color:#aaa;">
              Mo – Fr: 09:00 – 18:00 &nbsp;|&nbsp; Musterstraße 1, 1010 Wien
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

    await transporter.sendMail({
      from: `"${process.env.MAIL_FROM || 'Michael Leber Immobilien'}" <${process.env.MAIL_USER}>`,
      to: toName ? `"${toName}" <${to}>` : to,
      subject: subject || 'Ihre Anfrage – Michael Leber Immobilien',
      text: fullMessage,
      html,
    })

    res.json({ success: true, message: 'Email sent successfully' })
  } catch (err) {
    console.error('Mail error:', err.message)
    res.status(500).json({ success: false, message: err.message || 'Failed to send email' })
  }
}
