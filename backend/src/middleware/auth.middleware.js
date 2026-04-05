const { query } = require('../config/db');
const asyncHandler = require('../utils/async-handler');
const AppError = require('../utils/errors');
const { verifyAccessToken } = require('../utils/jwt');
const { sanitizeUser } = require('../utils/helpers');

const loadCurrentUser = async (userId) => {
  const result = await query(
    `
      SELECT id, full_name, email, role, profile_image, is_active, last_login_at, created_at, updated_at
      FROM users
      WHERE id = $1
    `,
    [userId]
  );

  return result.rows[0] || null;
};

const attachAuthenticatedUser = async (req, token) => {
  let payload;

  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError(401, 'Access token expired');
    }

    throw new AppError(401, 'Invalid access token');
  }

  const user = await loadCurrentUser(payload.sub);

  if (!user) {
    throw new AppError(401, 'User not found');
  }

  if (!user.is_active) {
    throw new AppError(403, 'User account is inactive');
  }

  req.user = sanitizeUser(user);
};

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(401, 'Authorization token is required');
  }

  const token = authHeader.split(' ')[1];
  await attachAuthenticatedUser(req, token);
  next();
});

const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw new AppError(401, 'Invalid authorization header');
  }

  const token = authHeader.split(' ')[1];
  await attachAuthenticatedUser(req, token);
  next();
});

module.exports = {
  protect,
  optionalAuth,
};
