import ApiError from '../utils/ApiError.js';

export const validateShippingAddress = (addr) => {
  const errors = [];
  if (!addr || typeof addr !== 'object') {
    throw new ApiError(400, 'Shipping address is required');
  }
  const { street, city, state, pincode } = addr;
  if (!street || !street.trim()) errors.push('Street is required');
  if (!city || !city.trim()) errors.push('City is required');
  if (!state || !state.trim()) errors.push('State is required');
  if (!pincode || !/^[0-9]{4,10}$/.test(pincode.trim())) errors.push('A valid pincode is required');

  if (errors.length) throw new ApiError(400, 'Invalid shipping address', errors);
};
