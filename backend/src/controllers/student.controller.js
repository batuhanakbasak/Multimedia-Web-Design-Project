const bcrypt = require('bcrypt');

const { query } = require('../config/db');
const asyncHandler = require('../utils/async-handler');
const AppError = require('../utils/errors');
const { successResponse } = require('../utils/response');
const { buildUpdateFields } = require('../utils/helpers');
const { getPaginatedEvents, getEventDetail } = require('../utils/event-query');
const clubsController = require('./clubs.controller');

const SALT_ROUNDS = Number.parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [joinedCountResult, favoriteCountResult, upcomingJoinedResult, recommendedResult] = await Promise.all([
    query(
      `
        SELECT COUNT(*)::int AS joined_events_count
        FROM event_participants
        WHERE user_id = $1
          AND status = 'joined'
      `,
      [userId]
    ),
    query(
      `
        SELECT COUNT(*)::int AS favorite_count
        FROM favorites
        WHERE user_id = $1
      `,
      [userId]
    ),
    query(
      `
        SELECT
          e.id,
          e.title,
          e.category,
          e.event_date,
          e.location,
          e.status
        FROM event_participants ep
        JOIN events e ON e.id = ep.event_id
        WHERE ep.user_id = $1
          AND ep.status = 'joined'
          AND e.event_date >= NOW()
        ORDER BY e.event_date ASC
        LIMIT 5
      `,
      [userId]
    ),
    query(
      `
        SELECT
          e.id,
          e.title,
          e.category,
          e.event_date,
          e.location,
          e.status
        FROM events e
        WHERE e.status = 'active'
          AND e.event_date >= NOW()
          AND NOT EXISTS (
            SELECT 1
            FROM event_participants ep
            WHERE ep.user_id = $1
              AND ep.event_id = e.id
              AND ep.status = 'joined'
          )
        ORDER BY e.event_date ASC
        LIMIT 5
      `,
      [userId]
    ),
  ]);

  return successResponse(res, {
    message: 'Student dashboard fetched successfully',
    data: {
      joined_events_count: joinedCountResult.rows[0].joined_events_count,
      favorite_count: favoriteCountResult.rows[0].favorite_count,
      upcoming_joined_events: upcomingJoinedResult.rows,
      recommended_events: recommendedResult.rows,
    },
  });
});

const listEvents = asyncHandler(async (req, res) => {
  const result = await getPaginatedEvents(query, req.query, {
    defaultStatus: 'active',
    upcomingOnly: !req.query.status,
    currentUserId: req.user.id,
  });

  return successResponse(res, {
    message: 'Student events fetched successfully',
    data: result.items,
    meta: result.pagination,
  });
});

const searchEvents = asyncHandler(async (req, res) => {
  const result = await getPaginatedEvents(query, req.query, {
    defaultStatus: 'active',
    upcomingOnly: !req.query.status,
    currentUserId: req.user.id,
  });

  return successResponse(res, {
    message: 'Student event search results fetched successfully',
    data: result.items,
    meta: result.pagination,
  });
});

const getEventById = asyncHandler(async (req, res) => {
  const event = await getEventDetail(query, Number.parseInt(req.params.id, 10), req.user.id);

  if (!event) {
    throw new AppError(404, 'Event not found');
  }

  return successResponse(res, {
    message: 'Student event detail fetched successfully',
    data: event,
  });
});

const getProfile = asyncHandler(async (req, res) => {
  return successResponse(res, {
    message: 'Student profile fetched successfully',
    data: req.user,
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const payload = { ...req.body };

  if (typeof payload.full_name === 'string') {
    payload.full_name = payload.full_name.trim();
  }

  const { setClauses, values } = buildUpdateFields(payload, ['full_name', 'profile_image']);

  if (setClauses.length === 0) {
    throw new AppError(400, 'No profile fields were provided for update');
  }

  const result = await query(
    `
      UPDATE users
      SET ${setClauses.join(', ')}
      WHERE id = $${values.length + 1}
      RETURNING id, full_name, email, role, profile_image, is_active, last_login_at, created_at, updated_at
    `,
    [...values, req.user.id]
  );

  return successResponse(res, {
    message: 'Student profile updated successfully',
    data: result.rows[0],
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const result = await query(
    `
      SELECT id, password_hash
      FROM users
      WHERE id = $1
    `,
    [req.user.id]
  );

  const user = result.rows[0];

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const isCurrentPasswordValid = await bcrypt.compare(
    req.body.current_password,
    user.password_hash
  );

  if (!isCurrentPasswordValid) {
    throw new AppError(401, 'Current password is incorrect');
  }

  const passwordHash = await bcrypt.hash(req.body.new_password, SALT_ROUNDS);

  await query(
    `
      UPDATE users
      SET password_hash = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `,
    [passwordHash, req.user.id]
  );

  return successResponse(res, {
    message: 'Student password updated successfully',
    data: {
      password_changed: true,
    },
  });
});

module.exports = {
  getDashboard,
  listEvents,
  searchEvents,
  getEventById,
  getProfile,
  updateProfile,
  changePassword,
  listClubs: clubsController.listClubs,
  getClubById: clubsController.getClubById,
};
