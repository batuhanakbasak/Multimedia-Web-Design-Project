const { query, withTransaction } = require('../config/db');
const asyncHandler = require('../utils/async-handler');
const AppError = require('../utils/errors');
const { successResponse } = require('../utils/response');
const { buildUpdateFields, getPagination } = require('../utils/helpers');
const { getPaginatedEvents, getEventDetail } = require('../utils/event-query');

const loadUserOrFail = async (userId) => {
  const result = await query(
    `
      SELECT id, full_name, email, role, profile_image, is_active, last_login_at, created_at, updated_at
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

const loadClubOrFail = async (clubId) => {
  const result = await query(
    `
      SELECT id, name, description, logo_url, is_active, created_by, created_at, updated_at
      FROM clubs
      WHERE id = $1
    `,
    [clubId]
  );

  const club = result.rows[0];

  if (!club) {
    throw new AppError(404, 'Club not found');
  }

  return club;
};

const getDashboard = asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT
      (SELECT COUNT(*)::int FROM users) AS total_users,
      (SELECT COUNT(*)::int FROM users WHERE role = 'student') AS total_students,
      (SELECT COUNT(*)::int FROM users WHERE role = 'organizer') AS total_organizers,
      (SELECT COUNT(*)::int FROM clubs) AS total_clubs,
      (SELECT COUNT(*)::int FROM events) AS total_events,
      (SELECT COUNT(*)::int FROM events WHERE status = 'active') AS total_active_events,
      (SELECT COUNT(*)::int FROM event_participants WHERE status = 'joined') AS total_participations
  `);

  return successResponse(res, {
    message: 'Admin dashboard fetched successfully',
    data: result.rows[0],
  });
});

const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const conditions = [];
  const values = [];

  if (req.query.search) {
    values.push(`%${String(req.query.search).trim()}%`);
    conditions.push(`(full_name ILIKE $${values.length} OR email ILIKE $${values.length})`);
  }

  if (req.query.role) {
    values.push(req.query.role);
    conditions.push(`role = $${values.length}`);
  }

  if (req.query.is_active === 'true' || req.query.is_active === 'false') {
    values.push(req.query.is_active === 'true');
    conditions.push(`is_active = $${values.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [listResult, countResult] = await Promise.all([
    query(
      `
        SELECT id, full_name, email, role, profile_image, is_active, last_login_at, created_at, updated_at
        FROM users
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${values.length + 1}
        OFFSET $${values.length + 2}
      `,
      [...values, limit, offset]
    ),
    query(
      `
        SELECT COUNT(*)::int AS total
        FROM users
        ${whereClause}
      `,
      values
    ),
  ]);

  const total = countResult.rows[0].total;

  return successResponse(res, {
    message: 'Users fetched successfully',
    data: listResult.rows,
    meta: {
      page,
      limit,
      total,
      total_pages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  });
});

const getUserById = asyncHandler(async (req, res) => {
  const userId = Number.parseInt(req.params.id, 10);

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
        SELECT c.id, c.name, cm.member_role, cm.joined_at
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

  return successResponse(res, {
    message: 'User detail fetched successfully',
    data: {
      ...userResult.rows[0],
      club_memberships: membershipsResult.rows,
    },
  });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const userId = Number.parseInt(req.params.id, 10);
  await loadUserOrFail(userId);

  const result = await withTransaction(async (client) => {
    const updatedUser = await client.query(
      `
        UPDATE users
        SET role = $1
        WHERE id = $2
        RETURNING id, full_name, email, role, profile_image, is_active, last_login_at, created_at, updated_at
      `,
      [req.body.role, userId]
    );

    await client.query(
      `
        UPDATE auth_sessions
        SET is_revoked = TRUE,
            revoked_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
          AND is_revoked = FALSE
      `,
      [userId]
    );

    return updatedUser.rows[0];
  });

  return successResponse(res, {
    message: 'User role updated successfully',
    data: result,
  });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const userId = Number.parseInt(req.params.id, 10);
  await loadUserOrFail(userId);

  const result = await withTransaction(async (client) => {
    const updatedUser = await client.query(
      `
        UPDATE users
        SET is_active = $1
        WHERE id = $2
        RETURNING id, full_name, email, role, profile_image, is_active, last_login_at, created_at, updated_at
      `,
      [req.body.is_active, userId]
    );

    if (!req.body.is_active) {
      await client.query(
        `
          UPDATE auth_sessions
          SET is_revoked = TRUE,
              revoked_at = CURRENT_TIMESTAMP
          WHERE user_id = $1
            AND is_revoked = FALSE
        `,
        [userId]
      );
    }

    return updatedUser.rows[0];
  });

  return successResponse(res, {
    message: 'User status updated successfully',
    data: result,
  });
});

const listClubs = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);

  const [listResult, countResult] = await Promise.all([
    query(
      `
        SELECT
          c.id,
          c.name,
          c.description,
          c.logo_url,
          c.is_active,
          c.created_at,
          c.updated_at,
          json_build_object(
            'id', u.id,
            'full_name', u.full_name,
            'email', u.email,
            'profile_image', u.profile_image
          ) AS created_by,
          COALESCE(members.member_count, 0) AS member_count,
          COALESCE(events.event_count, 0) AS event_count
        FROM clubs c
        JOIN users u ON u.id = c.created_by
        LEFT JOIN (
          SELECT club_id, COUNT(*)::int AS member_count
          FROM club_members
          GROUP BY club_id
        ) members ON members.club_id = c.id
        LEFT JOIN (
          SELECT club_id, COUNT(*)::int AS event_count
          FROM events
          GROUP BY club_id
        ) events ON events.club_id = c.id
        ORDER BY c.created_at DESC
        LIMIT $1
        OFFSET $2
      `,
      [limit, offset]
    ),
    query(`SELECT COUNT(*)::int AS total FROM clubs`),
  ]);

  const total = countResult.rows[0].total;

  return successResponse(res, {
    message: 'Admin clubs fetched successfully',
    data: listResult.rows,
    meta: {
      page,
      limit,
      total,
      total_pages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  });
});

const createClub = asyncHandler(async (req, res) => {
  const creatorId = req.body.created_by || req.user.id;
  await loadUserOrFail(creatorId);

  const club = await withTransaction(async (client) => {
    const insertResult = await client.query(
      `
        INSERT INTO clubs (name, description, logo_url, created_by)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, description, logo_url, is_active, created_by, created_at, updated_at
      `,
      [req.body.name.trim(), req.body.description || null, req.body.logo_url || null, creatorId]
    );

    await client.query(
      `
        INSERT INTO club_members (user_id, club_id, member_role)
        VALUES ($1, $2, 'manager')
        ON CONFLICT (user_id, club_id) DO NOTHING
      `,
      [creatorId, insertResult.rows[0].id]
    );

    return insertResult.rows[0];
  });

  return successResponse(res, {
    statusCode: 201,
    message: 'Club created successfully',
    data: club,
  });
});

const updateClub = asyncHandler(async (req, res) => {
  const clubId = Number.parseInt(req.params.id, 10);
  await loadClubOrFail(clubId);

  const payload = { ...req.body };
  if (typeof payload.name === 'string') {
    payload.name = payload.name.trim();
  }

  const { setClauses, values } = buildUpdateFields(payload, ['name', 'description', 'logo_url', 'is_active']);

  if (setClauses.length === 0) {
    throw new AppError(400, 'No club fields were provided for update');
  }

  const result = await query(
    `
      UPDATE clubs
      SET ${setClauses.join(', ')}
      WHERE id = $${values.length + 1}
      RETURNING id, name, description, logo_url, is_active, created_by, created_at, updated_at
    `,
    [...values, clubId]
  );

  return successResponse(res, {
    message: 'Club updated successfully',
    data: result.rows[0],
  });
});

const deleteClub = asyncHandler(async (req, res) => {
  const clubId = Number.parseInt(req.params.id, 10);
  await loadClubOrFail(clubId);

  const result = await query(
    `
      DELETE FROM clubs
      WHERE id = $1
      RETURNING id, name
    `,
    [clubId]
  );

  return successResponse(res, {
    message: 'Club deleted successfully',
    data: result.rows[0],
  });
});

const getClubMembers = asyncHandler(async (req, res) => {
  const clubId = Number.parseInt(req.params.id, 10);
  await loadClubOrFail(clubId);

  const result = await query(
    `
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.role,
        u.profile_image,
        u.is_active,
        cm.member_role,
        cm.joined_at
      FROM club_members cm
      JOIN users u ON u.id = cm.user_id
      WHERE cm.club_id = $1
      ORDER BY cm.member_role DESC, u.full_name ASC
    `,
    [clubId]
  );

  return successResponse(res, {
    message: 'Club members fetched successfully',
    data: result.rows,
  });
});

const addClubMember = asyncHandler(async (req, res) => {
  const clubId = Number.parseInt(req.params.id, 10);
  await loadClubOrFail(clubId);
  await loadUserOrFail(req.body.user_id);

  const result = await query(
    `
      INSERT INTO club_members (user_id, club_id, member_role)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, club_id)
      DO UPDATE SET member_role = EXCLUDED.member_role
      RETURNING id, user_id, club_id, member_role, joined_at
    `,
    [req.body.user_id, clubId, req.body.member_role]
  );

  return successResponse(res, {
    statusCode: 201,
    message: 'Club member saved successfully',
    data: result.rows[0],
  });
});

const removeClubMember = asyncHandler(async (req, res) => {
  const clubId = Number.parseInt(req.params.id, 10);
  const userId = Number.parseInt(req.params.userId, 10);
  await loadClubOrFail(clubId);

  const result = await query(
    `
      DELETE FROM club_members
      WHERE club_id = $1
        AND user_id = $2
      RETURNING id, club_id, user_id
    `,
    [clubId, userId]
  );

  if (result.rowCount === 0) {
    throw new AppError(404, 'Club membership not found');
  }

  return successResponse(res, {
    message: 'Club member removed successfully',
    data: result.rows[0],
  });
});

const listEvents = asyncHandler(async (req, res) => {
  const result = await getPaginatedEvents(query, req.query, {});

  return successResponse(res, {
    message: 'Admin events fetched successfully',
    data: result.items,
    meta: result.pagination,
  });
});

const getEventById = asyncHandler(async (req, res) => {
  const event = await getEventDetail(query, Number.parseInt(req.params.id, 10), null);

  if (!event) {
    throw new AppError(404, 'Event not found');
  }

  return successResponse(res, {
    message: 'Admin event detail fetched successfully',
    data: event,
  });
});

const deleteEvent = asyncHandler(async (req, res) => {
  const eventId = Number.parseInt(req.params.id, 10);

  const result = await query(
    `
      DELETE FROM events
      WHERE id = $1
      RETURNING id, title
    `,
    [eventId]
  );

  if (result.rowCount === 0) {
    throw new AppError(404, 'Event not found');
  }

  return successResponse(res, {
    message: 'Event deleted successfully',
    data: result.rows[0],
  });
});

module.exports = {
  getDashboard,
  listUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  listClubs,
  createClub,
  updateClub,
  deleteClub,
  getClubMembers,
  addClubMember,
  removeClubMember,
  listEvents,
  getEventById,
  deleteEvent,
};
