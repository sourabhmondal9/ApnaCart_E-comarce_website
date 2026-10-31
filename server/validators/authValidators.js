import ApiError from '../utils/ApiError.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegisterInput = (body) => {
  const errors = [];
  const { name, email, password } = body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
    errors.push('A valid email is required');
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (errors.length) throw new ApiError(400, 'Invalid registration data', errors);
};

export const validateLoginInput = (body) => {
  const errors = [];
  const { email, password } = body;

  if (!email || typeof email !== 'string') errors.push('Email is required');
  if (!password || typeof password !== 'string') errors.push('Password is required');

  if (errors.length) throw new ApiError(400, 'Invalid login data', errors);
};
