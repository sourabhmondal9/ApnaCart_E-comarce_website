import nodemailer from 'nodemailer';

let transporter = null;
let warnedOnce = false;

const hasResend = () => Boolean(process.env.RESEND_API_KEY);
const hasSmtp = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
const isEmailConfigured = () => hasResend() || hasSmtp();

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

const resolveFrom = () => process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER;

const sendViaResend = async ({ to, subject, text }) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: resolveFrom() || 'ApnaCart <onboarding@resend.dev>',
      to: [to],
      subject,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Resend API returned ${response.status}: ${body || response.statusText}`);
  }
};

const sendViaSmtp = async ({ to, subject, text }) => {
  await getTransporter().sendMail({
    from: resolveFrom(),
    to,
    subject,
    text,
  });
};

export const sendEmail = async ({ to, subject, text }) => {
  if (!isEmailConfigured()) {
    if (!warnedOnce) {
      console.warn(
        'Email is not configured — skipping email.'
      );
      warnedOnce = true;
    }
    return { sent: false, reason: 'not_configured' };
  }

  try {
    if (hasResend()) {
      await sendViaResend({ to, subject, text });
    } else {
      await sendViaSmtp({ to, subject, text });
    }
    return { sent: true };
  } catch (err) {
    console.error('Failed to send email:', err.message);
    return { sent: false, reason: 'send_failed', error: err.message };
  }
};

export const verifyEmailConfig = async () => {
  if (!isEmailConfigured()) {
    console.warn(
      '📧 Email is NOT configured — order' +
        ' notifications and password-reset emails will not be sent.'
    );
    return;
  }

  if (hasResend()) {
    try {
      const response = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      });
      if (response.ok) {
        console.log('📧 Email is configured via Resend and the API key is valid — ready to send.');
      } else {
        console.error(
          `📧 Email IS configured via Resend but the API key appears invalid (HTTP ${response.status}).` +
            ' Double-check RESEND_API_KEY'
        );
      }
    } catch (err) {
      console.error(`📧 Could not reach Resend's API to verify the key: ${err.message}`);
    }
    return;
  }

  // SMTP path
  try {
    await getTransporter().verify();
    console.log(`📧 Email is configured via SMTP and verified (SMTP_HOST=${process.env.SMTP_HOST}) — ready to send.`);
  } catch (err) {
    console.error(
      `📧 Email IS configured via SMTP but verification FAILED: ${err.message}\n`
    );
  }
};
