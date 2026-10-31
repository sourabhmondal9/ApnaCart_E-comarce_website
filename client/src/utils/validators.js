export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');

export const isValidPincode = (pincode) => /^[0-9]{4,10}$/.test((pincode || '').trim());

export const required = (value) => value !== undefined && value !== null && String(value).trim() !== '';
