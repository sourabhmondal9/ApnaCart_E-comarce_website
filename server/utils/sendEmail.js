import nodemailer from 'nodemailer';

let transporter = null;
let warnedOnce = false;

const isEmailConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for port 465, false for 587/STARTTLS
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
};

export const sendEmail = async ({ to, subject, text }) => {
  if (!isEmailConfigured()) {
    if (!warnedOnce) {
      console.warn(
        'Email is not configured (SMTP_HOST/SMTP_USER/SMTP_PASS missing in .env) — skipping email notifications. In-app notifications still work. See README for setup.'
      );
      warnedOnce = true;
    }
    return { sent: false, reason: 'not_configured' };
  }

  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
    });
    return { sent: true };
  } catch (err) {
    console.error('Failed to send email:', err.message);
    return { sent: false, reason: 'send_failed', error: err.message };
  }
};

export const verifyEmailConfig = async () => {
  if (!isEmailConfigured()) {
    console.warn(
      '📧 Email is NOT configured (SMTP_HOST/SMTP_USER/SMTP_PASS missing) — order notifications and password-reset emails will not be sent. In-app notifications still work.'
    );
    return;
  }

  try {
    await getTransporter().verify();
    console.log(`📧 Email is configured and verified (SMTP_HOST=${process.env.SMTP_HOST}) — ready to send.`);
  } catch (err) {
    console.error(
      `📧 Email IS configured but verification FAILED: ${err.message}\n` +
        '   This usually means: wrong SMTP_USER/SMTP_PASS, a Gmail account password used instead of an' +
        ' App Password, or an incorrect SMTP_HOST/SMTP_PORT/SMTP_SECURE combination. Password-reset and' +
        ' order emails will silently fail to send until this is fixed — see README Section 4.'
    );
  }
};
