import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ContactMessage from '../models/ContactMessage.js';
import { validateContactInput } from '../validators/contactValidators.js';
import { validateObjectId } from '../validators/productValidators.js';

// @route POST /api/contact — public (rate-limited in routes)
export const submitContactMessage = asyncHandler(async (req, res) => {
  validateContactInput(req.body);
  const { name, email, subject, message } = req.body;

  const doc = await ContactMessage.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    subject: subject.trim(),
    message: message.trim(),
    user: req.user ? req.user._id : undefined, // attached only if an optional-auth token was valid
  });

  res.status(201).json({
    success: true,
    message: 'Thanks for reaching out — we received your message and will respond by email.',
    data: { id: doc._id },
  });
});

// @route GET /api/contact — admin only. Paginated inbox for submitted messages.
export const getContactMessages = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [messages, total, unresolvedCount] = await Promise.all([
    ContactMessage.find({}).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    ContactMessage.countDocuments({}),
    ContactMessage.countDocuments({ isResolved: false }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      messages,
      unresolvedCount,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) || 1 },
    },
  });
});

// @route PATCH /api/contact/:id/resolve — admin only. body: { isResolved: boolean }
export const setMessageResolved = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'message id');
  const { isResolved } = req.body;

  if (typeof isResolved !== 'boolean') {
    throw new ApiError(400, 'isResolved must be true or false');
  }

  const message = await ContactMessage.findByIdAndUpdate(req.params.id, { isResolved }, { new: true });
  if (!message) throw new ApiError(404, 'Message not found');

  res.status(200).json({
    success: true,
    message: isResolved ? 'Message marked as resolved' : 'Message marked as unresolved',
    data: { message },
  });
});

// @route DELETE /api/contact/:id — admin only
export const deleteContactMessage = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'message id');
  const message = await ContactMessage.findByIdAndDelete(req.params.id);
  if (!message) throw new ApiError(404, 'Message not found');

  res.status(200).json({ success: true, message: 'Message deleted' });
});
