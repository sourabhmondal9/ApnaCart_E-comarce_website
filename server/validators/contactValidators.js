import ApiError from '../utils/ApiError.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateContactInput = (body) => {
  const errors = [];
  const { name, email, subject, message } = body;

  if (!name || typeof name !== 'string' || !name.trim()) errors.push('Name is required');
  if (!email || typeof email !== 'string' || !emailRegex.test(email)) errors.push('A valid email is required');
  if (!subject || typeof subject !== 'string' || !subject.trim()) errors.push('Subject is required');
  if (!message || typeof message !== 'string' || message.trim().length < 10) {
    errors.push('Message must be at least 10 characters');
  }

  if (errors.length) throw new ApiError(400, 'Invalid contact form data', errors);
};
