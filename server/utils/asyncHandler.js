/**
 * Wraps an async Express route/controller so thrown errors (or rejected
 * promises) are forwarded to next(err) instead of crashing the process
 * or requiring try/catch in every controller.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
