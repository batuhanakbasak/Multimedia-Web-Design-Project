const bcrypt = require('bcrypt');

const { query } = require('../config/db');
const asyncHandler = require('../utils/async-handler');
const AppError = require('../utils/errors');
const { successResponse } = require('../utils/response');
const { normalizeEmail, sanitizeUser } = require('../utils/helpers');
const { signAccessToken } = require('../utils/jwt');

const login = asyncHandler(async (req, res) => {
  const normalizedEmail = normalizeEmail(req.body.email);

  const result = await query(
    `
      SELECT
        id,
        full_name,
        email,
        password_hash,
        role,
        profile_image,
        is_active,
        last_login_at,
        created_at,
        updated_at
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `,
    [normalizedEmail]
  );

  const user = result.rows[0];

  if (!user) {
    throw new AppError(401, 'Invalid credentials');
  }

  if (user.role !== 'admin') {
    throw new AppError(403, 'Only admin accounts can use the admin login page');
  }

  if (!user.is_active) {
    throw new AppError(403, 'Admin account is inactive');
  }

  const isPasswordValid = await bcrypt.compare(req.body.password, user.password_hash);

  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid credentials');
  }

  const updatedUserResult = await query(
    `
      UPDATE users
      SET last_login_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, full_name, email, role, profile_image, is_active, last_login_at, created_at, updated_at
    `,
    [user.id]
  );

  const admin = sanitizeUser(updatedUserResult.rows[0]);
  const token = signAccessToken(admin);

  return successResponse(res, {
    message: 'Admin login successful',
    data: {
      token,
      admin,
    },
  });
});

const me = asyncHandler(async (req, res) =>
  successResponse(res, {
    message: 'Current admin fetched successfully',
    data: req.user,
  })
);

const logout = asyncHandler(async (req, res) => {
  await query(
    `
      UPDATE auth_sessions
      SET is_revoked = TRUE,
          revoked_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
        AND is_revoked = FALSE
    `,
    [req.user.id]
  );

  return successResponse(res, {
    message: 'Admin logout successful',
    data: null,
  });
});

module.exports = {
  login,
  me,
  logout,
};
