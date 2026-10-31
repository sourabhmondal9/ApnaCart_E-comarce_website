import api from './api.js';

export const createRazorpayOrder = async () => {
  const { data } = await api.post('/payments/razorpay/order');
  return data.data; // { razorpayOrderId, amount, currency, keyId }
};

export const verifyRazorpayPayment = async (payload) => {
  const { data } = await api.post('/payments/razorpay/verify', payload);
  return data.data.order;
};

/**
 * Loads the Razorpay Checkout script once and caches the promise, so
 * multiple checkout attempts don't inject the <script> tag repeatedly.
 */
let razorpayScriptPromise = null;

export const loadRazorpayScript = () => {
  if (window.Razorpay) return Promise.resolve(true);
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => {
      razorpayScriptPromise = null; // allow retry on next attempt
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
};
