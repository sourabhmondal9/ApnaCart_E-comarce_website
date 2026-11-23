import nodemailer from 'nodemailer';

/**
 * Two ways to send email, tried in this order:
 *
 * 1. Resend (HTTPS API, port 443) — used automatically if RESEND_API_KEY
 *    is set. This is the recommended path for Render (and most other
 *    free-tier PaaS hosts): as of Sept 2025, Render's free web services
 *    block ALL outbound traffic on SMTP ports 25/465/587, so nodemailer
 *    over raw SMTP simply cannot work there no matter how correct the
 *    credentials are — the connection itself is refused at the network
 *    level. Resend sends over plain HTTPS, which isn't blocked.
 *
 * 2. SMTP via nodemailer — used if RESEND_API_KEY is absent but
 *    SMTP_HOST/SMTP_USER/SMTP_PASS are set. Works fine for local
 *    development or any host that doesn't block SMTP ports, but will
 *    silently fail (connection timeout) on Render's free tier.
 *
 * If neither is configured, email is skipped entirely with a one-time
 * warning — the app still works, just without actual email delivery.
 */

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

/**
 * Sends a plain-text email via whichever method is configured; otherwise
 * logs a notice once and does nothing. Never throws — email is a
 * nice-to-have alongside the in-app notification system, not something
 * that should ever fail an order or a password reset. Callers should not
 * await this inside a request path that must respond quickly;
 * fire-and-forget with .catch() is the intended usage (see utils/notify.js
 * and authController.js's forgotPassword).
 */
export const sendEmail = async ({ to, subject, text }) => {
  if (!isEmailConfigured()) {
    if (!warnedOnce) {
      console.warn(
        'Email is not configured (set RESEND_API_KEY, or SMTP_HOST/SMTP_USER/SMTP_PASS, in .env) — skipping email. In-app notifications still work. See README Section 4 for setup.'
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

/**
 * Verifies the configured email method actually works, without sending a
 * real message. Meant to be called once at server startup (see
 * server.js) so a broken config shows up immediately and loudly in the
 * deploy logs, rather than only surfacing later as a silently-swallowed
 * failure inside a fire-and-forget sendEmail() call.
 */
export const verifyEmailConfig = async () => {
  if (!isEmailConfigured()) {
    console.warn(
      '📧 Email is NOT configured (set RESEND_API_KEY, or SMTP_HOST/SMTP_USER/SMTP_PASS) — order' +
        ' notifications and password-reset emails will not be sent. In-app notifications still work' +
        ' regardless. See README Section 4 for setup.'
    );
    return;
  }

  if (hasResend()) {
    // A lightweight authenticated GET confirms the API key itself is
    // valid without spending any of the account's send quota. It does
    // NOT confirm a sending domain is verified — see README for the
    // "onboarding@resend.dev only delivers to your own Resend account
    // email" caveat that applies until you verify a real domain.
    try {
      const response = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      });
      if (response.ok) {
        console.log('📧 Email is configured via Resend and the API key is valid — ready to send.');
      } else {
        console.error(
          `📧 Email IS configured via Resend but the API key appears invalid (HTTP ${response.status}).` +
            ' Double-check RESEND_API_KEY — see README Section 4.'
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
      `📧 Email IS configured via SMTP but verification FAILED: ${err.message}\n` +
        '   If this is running on Render\'s free tier, this is EXPECTED and cannot be fixed by changing' +
        ' credentials: Render blocks outbound SMTP ports (25/465/587) on free web services entirely.' +
        ' Switch to Resend (set RESEND_API_KEY) instead — see README Section 4.'
    );
  }
};
