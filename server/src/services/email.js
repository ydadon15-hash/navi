const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendPasswordResetEmail(toEmail, resetToken) {
  const resetUrl = `https://mynaviapp.com/reset-password?token=${resetToken}`;

  await transporter.sendMail({
    from: `"Navi" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: 'Reset your Navi password',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Sora',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding:36px 40px 28px;text-align:center;border-bottom:1px solid #DDD9D1;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#26231F;letter-spacing:-0.5px;">Navi</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#26231F;">Password reset request</h2>
              <p style="margin:0 0 28px;font-size:15px;color:#5a5650;line-height:1.6;">
                You requested a password reset. Click the button below to set a new password.
                This link expires in <strong>1 hour</strong>.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                <tr>
                  <td style="background:#22a355;border-radius:8px;">
                    <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.2px;">
                      Reset my password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;color:#8C887F;line-height:1.5;">
                If you didn't request this, you can safely ignore this email.
                Your password won't change.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;text-align:center;border-top:1px solid #DDD9D1;">
              <p style="margin:0;font-size:12px;color:#8C887F;">
                &copy; 2025 Navi. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });
}

module.exports = { sendPasswordResetEmail };
