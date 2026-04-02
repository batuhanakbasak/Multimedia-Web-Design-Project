const bcrypt = require('bcrypt');

const { query, withTransaction } = require('../config/db');
const asyncHandler = require('../utils/async-handler');
const AppError = require('../utils/errors');
const { successResponse } = require('../utils/response');
const { normalizeEmail, sanitizeUser, getRequestMeta } = require('../utils/helpers');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  getRefreshTokenExpiryDate,
} = require('../utils/jwt');

const SALT_ROUNDS = Number.parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

const selectSafeUserById = async (db, userId) => {
  const result = await db.query(
    `
      SELECT id, full_name, email, role, profile_image, is_active, last_login_at, created_at, updated_at
      FROM users
      WHERE id = $1
    `,
    [userId]
  );

  return result.rows[0] || null;
};

const createAuthSession = async (db, user, req) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const refreshTokenHash = hashToken(refreshToken);
  const { userAgent, ipAddress } = getRequestMeta(req);

  await db.query(
    `
      INSERT INTO auth_sessions (user_id, refresh_token_hash, user_agent, ip_address, expires_at)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [user.id, refreshTokenHash, userAgent, ipAddress, getRefreshTokenExpiryDate()]
  );

  return {
    accessToken,
    refreshToken,
  };
};

const registerStudent = asyncHandler(async (req, res) => {
  const { full_name, email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);

  const existingUser = await query(
    `
      SELECT id
      FROM users
      WHERE LOWER(email) = LOWER($1)
    `,
    [normalizedEmail]
  );

  if (existingUser.rowCount > 0) {
    throw new AppError(409, 'Email already exists');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await query(
    `
      INSERT INTO users (full_name, email, password_hash, role)
      VALUES ($1, $2, $3, 'student')
      RETURNING id, full_name, email, role, profile_image, is_active, last_login_at, created_at, updated_at
    `,
    [full_name.trim(), normalizedEmail, passwordHash]
  );

  return successResponse(res, {
    statusCode: 201,
    message: 'Student registered successfully',
    data: {
      user: sanitizeUser(result.rows[0]),
    },
  });
});

const createLoginHandler = (expectedRole, successMessage) =>
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const userResult = await query(
      `
        SELECT id, full_name, email, password_hash, role, profile_image, is_active, last_login_at, created_at, updated_at
        FROM users
        WHERE LOWER(email) = LOWER($1)
      `,
      [normalizedEmail]
    );

    const user = userResult.rows[0];

    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    if (user.role !== expectedRole) {
      throw new AppError(403, `This account cannot use the ${expectedRole} login endpoint`);
    }

    if (!user.is_active) {
      throw new AppError(403, 'User account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    const payload = await withTransaction(async (client) => {
      await client.query(
        `
          UPDATE users
          SET last_login_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `,
        [user.id]
      );

      const tokens = await createAuthSession(client, user, req);
      const safeUser = await selectSafeUserById(client, user.id);

      return {
        user: safeUser,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      };
    });

    return successResponse(res, {
      message: successMessage,
      data: payload,
    });
  });

const loginStudent = createLoginHandler('student', 'Student login successful');
const loginOrganizer = createLoginHandler('organizer', 'Organizer login successful');
const loginAdmin = createLoginHandler('admin', 'Admin login successful');

const me = asyncHandler(async (req, res) => {
  return successResponse(res, {
    message: 'Current user fetched successfully',
    data: req.user,
  });
});

const refresh = asyncHandler(async (req, res) => {
  const { refresh_token: refreshToken } = req.body;

  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError(401, 'Refresh token expired');
    }

    throw new AppError(401, 'Invalid refresh token');
  }

  const hashedToken = hashToken(refreshToken);

  const sessionResult = await query(
    `
      SELECT
        s.id AS session_id,
        s.user_id,
        s.expires_at,
        s.is_revoked,
        u.id,
        u.full_name,
        u.email,
        u.role,
        u.profile_image,
        u.is_active,
        u.last_login_at,
        u.created_at,
        u.updated_at
      FROM auth_sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.user_id = $1
        AND s.refresh_token_hash = $2
      LIMIT 1
    `,
    [payload.sub, hashedToken]
  );

  const session = sessionResult.rows[0];

  if (!session || session.is_revoked) {
    throw new AppError(401, 'Refresh session is invalid or revoked');
  }

  if (new Date(session.expires_at) <= new Date()) {
    throw new AppError(401, 'Refresh session has expired');
  }

  if (!session.is_active) {
    throw new AppError(403, 'User account is inactive');
  }

  const refreshedPayload = await withTransaction(async (client) => {
    await client.query(
      `
        UPDATE auth_sessions
        SET is_revoked = TRUE,
            revoked_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `,
      [session.session_id]
    );

    const currentUser = {
      id: session.id,
      full_name: session.full_name,
      email: session.email,
      role: session.role,
      profile_image: session.profile_image,
    };

    const tokens = await createAuthSession(client, currentUser, req);
    const safeUser = await selectSafeUserById(client, session.id);

    return {
      user: safeUser,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    };
  });

  return successResponse(res, {
    message: 'Token refreshed successfully',
    data: refreshedPayload,
  });
});

const logout = asyncHandler(async (req, res) => {
  const { refresh_token: refreshToken } = req.body;
  const hashedToken = hashToken(refreshToken);

  await query(
    `
      UPDATE auth_sessions
      SET is_revoked = TRUE,
          revoked_at = CURRENT_TIMESTAMP
      WHERE refresh_token_hash = $1
        AND is_revoked = FALSE
    `,
    [hashedToken]
  );

  return successResponse(res, {
    message: 'Session revoked successfully',
    data: null,
  });
});

const logoutAll = asyncHandler(async (req, res) => {
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
    message: 'All sessions revoked successfully',
    data: null,
  });
});

module.exports = {
  registerStudent,
  loginStudent,
  loginOrganizer,
  loginAdmin,
  me,
  refresh,
  logout,
  logoutAll,
};
