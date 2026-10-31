import Razorpay from 'razorpay';

/**
 * Lazily-constructed Razorpay client. We don't throw at import time if
 * keys are missing, so the rest of the app (which doesn't need payments)
 * still boots cleanly — the error only surfaces when a payment route is
 * actually hit without keys configured.
 */
let instance = null;

export const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    const err = new Error(
      'Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server/.env (see .env.example).'
    );
    err.statusCode = 500;
    throw err;
  }

  if (!instance) {
    instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return instance;
};
