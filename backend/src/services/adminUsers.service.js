const { query, withTransaction } = require('../config/db');
const AppError = require('../utils/errors');
const { getPagination } = require('../utils/helpers');

const loadUserOrFail = async (userId) => {
  const result = await query(
    `
      SELECT
        id,
        full_name,
        email,
        role,
        profile_image,
        is_active,
        last_login_at,
        created_at,
        updated_at
      FROM users
      WHERE id = $1
    `,
    [userId]
  );

  const user = result.rows[0];

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  return user;
};

const revokeUserSessions = async (db, userId) => {
  await db.query(
    `
      UPDATE auth_sessions
      SET is_revoked = TRUE,
          revoked_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
        AND is_revoked = FALSE
    `,
    [userId]
  );
};

const ensureAnotherActiveAdminExists = async (userIdToExclude) => {
  const result = await query(
    `
      SELECT COUNT(*)::int AS total
      FROM users
      WHERE role = 'admin'
        AND is_active = TRUE
        AND id <> $1
    `,
    [userIdToExclude]
  );

  if (result.rows[0].total === 0) {
    throw new AppError(400, 'At least one active admin must remain in the system');
  }
};

const listUsers = async (filters = {}) => {
  const { page, limit, offset } = getPagination(filters);
  const conditions = [];
  const values = [];

  if (filters.search) {
    values.push(`%${String(filters.search).trim()}%`);
    conditions.push(`(u.full_name ILIKE $${values.length} OR u.email ILIKE $${values.length})`);
  }

  if (filters.role) {
    values.push(filters.role);
    conditions.push(`u.role = $${values.length}`);
  }

  if (typeof filters.is_active === 'boolean') {
    values.push(filters.is_active);
    conditions.push(`u.is_active = $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [listResult, countResult] = await Promise.all([
    query(
      `
        SELECT
          u.id,
          u.full_name,
          u.email,
          u.role,
          u.profile_image,
          u.is_active,
          u.last_login_at,
          u.created_at,
          u.updated_at
        FROM users u
        ${whereClause}
        ORDER BY u.created_at DESC, u.id DESC
        LIMIT $${values.length + 1}
        OFFSET $${values.length + 2}
      `,
      [...values, limit, offset]
    ),
    query(
      `
        SELECT COUNT(*)::int AS total
        FROM users u
        ${whereClause}
      `,
      values
    ),
  ]);

  const total = countResult.rows[0].total;

  return {
    items: listResult.rows,
    pagination: {
      page,
      limit,
      total,
      total_pages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
};

const getUserDetail = async (userId) => {
  const [userResult, membershipsResult] = await Promise.all([
    query(
      `
        SELECT
          u.id,
          u.full_name,
          u.email,
          u.role,
          u.profile_image,
          u.is_active,
          u.last_login_at,
          u.created_at,
          u.updated_at,
          (SELECT COUNT(*)::int FROM events WHERE organizer_id = u.id) AS created_events_count,
          (SELECT COUNT(*)::int FROM event_participants WHERE user_id = u.id AND status = 'joined') AS joined_events_count,
          (SELECT COUNT(*)::int FROM favorites WHERE user_id = u.id) AS favorite_count
        FROM users u
        WHERE u.id = $1
      `,
      [userId]
    ),
    query(
      `
        SELECT
          c.id,
          c.name,
          c.is_active,
          cm.member_role,
          cm.joined_at
        FROM club_members cm
        JOIN clubs c ON c.id = cm.club_id
        WHERE cm.user_id = $1
        ORDER BY c.name ASC
      `,
      [userId]
    ),
  ]);

  if (userResult.rowCount === 0) {
    throw new AppError(404, 'User not found');
  }

  return {
    ...userResult.rows[0],
    club_memberships: membershipsResult.rows,
  };
};

const updateUserRole = async (userId, nextRole, currentAdmin) => {
  const user = await loadUserOrFail(userId);

  if (currentAdmin.id === userId && nextRole !== 'admin') {
    throw new AppError(400, 'You cannot remove your own admin role');
  }

  if (user.role === 'admin' && nextRole !== 'admin' && user.is_active) {
    await ensureAnotherActiveAdminExists(userId);
  }

  const updatedUser = await withTransaction(async (client) => {
    const result = await client.query(
      `
        UPDATE users
        SET role = $1
        WHERE id = $2
        RETURNING
          id,
          full_name,
          email,
          role,
          profile_image,
          is_active,
          last_login_at,
          created_at,
          updated_at
      `,
      [nextRole, userId]
    );

    await revokeUserSessions(client, userId);

    return result.rows[0];
  });

  return updatedUser;
};

const updateUserStatus = async (userId, isActive, currentAdmin) => {
  const user = await loadUserOrFail(userId);

  if (currentAdmin.id === userId && !isActive) {
    throw new AppError(400, 'You cannot deactivate your own admin account');
  }

  if (user.role === 'admin' && user.is_active && !isActive) {
    await ensureAnotherActiveAdminExists(userId);
  }

  const updatedUser = await withTransaction(async (client) => {
    const result = await client.query(
      `
        UPDATE users
        SET is_active = $1
        WHERE id = $2
        RETURNING
          id,
          full_name,
          email,
          role,
          profile_image,
          is_active,
          last_login_at,
          created_at,
          updated_at
      `,
      [isActive, userId]
    );

    if (!isActive) {
      await revokeUserSessions(client, userId);
    }

    return result.rows[0];
  });

  return updatedUser;
};

module.exports = {
  listUsers,
  getUserDetail,
  updateUserRole,
  updateUserStatus,
};
