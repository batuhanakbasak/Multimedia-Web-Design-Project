const { query } = require('../config/db');
const asyncHandler = require('../utils/async-handler');
const AppError = require('../utils/errors');
const { successResponse } = require('../utils/response');

const resolveEventId = (req) => Number.parseInt(req.params.eventId || req.params.id, 10);

const listFavorites = asyncHandler(async (req, res) => {
  const result = await query(
    `
      SELECT
        e.id,
        e.title,
        e.description,
        e.category,
        e.event_date,
        e.location,
        e.image_url,
        e.quota,
        e.status,
        e.metadata,
        f.created_at AS favorited_at,
        json_build_object(
          'id', o.id,
          'full_name', o.full_name,
          'email', o.email,
          'profile_image', o.profile_image
        ) AS organizer,
        CASE
          WHEN c.id IS NULL THEN NULL
          ELSE json_build_object(
            'id', c.id,
            'name', c.name,
            'logo_url', c.logo_url,
            'is_active', c.is_active
          )
        END AS club
      FROM favorites f
      JOIN events e ON e.id = f.event_id
      JOIN users o ON o.id = e.organizer_id
      LEFT JOIN clubs c ON c.id = e.club_id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
    `,
    [req.user.id]
  );

  return successResponse(res, {
    message: 'Favorite events fetched successfully',
    data: result.rows,
  });
});

const addFavorite = asyncHandler(async (req, res) => {
  const eventId = resolveEventId(req);

  const eventResult = await query(
    `
      SELECT id
      FROM events
      WHERE id = $1
    `,
    [eventId]
  );

  if (eventResult.rowCount === 0) {
    throw new AppError(404, 'Event not found');
  }

  const insertResult = await query(
    `
      INSERT INTO favorites (user_id, event_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, event_id) DO NOTHING
      RETURNING id, event_id, created_at
    `,
    [req.user.id, eventId]
  );

  if (insertResult.rowCount === 0) {
    throw new AppError(409, 'Event is already in favorites');
  }

  return successResponse(res, {
    statusCode: 201,
    message: 'Event added to favorites successfully',
    data: insertResult.rows[0],
  });
});

const removeFavorite = asyncHandler(async (req, res) => {
  const eventId = resolveEventId(req);

  const deleteResult = await query(
    `
      DELETE FROM favorites
      WHERE user_id = $1
        AND event_id = $2
      RETURNING event_id
    `,
    [req.user.id, eventId]
  );

  if (deleteResult.rowCount === 0) {
    throw new AppError(404, 'Favorite event not found');
  }

  return successResponse(res, {
    message: 'Event removed from favorites successfully',
    data: deleteResult.rows[0],
  });
});

module.exports = {
  listFavorites,
  addFavorite,
  removeFavorite,
};
