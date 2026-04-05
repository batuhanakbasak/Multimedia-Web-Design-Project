const { query, withTransaction } = require('../config/db');
const asyncHandler = require('../utils/async-handler');
const AppError = require('../utils/errors');
const { successResponse } = require('../utils/response');
const { getPagination } = require('../utils/helpers');
const { hasEventsMetadataColumn, isMissingColumnError } = require('../utils/schema-capabilities');
const { getEventDetail } = require('../utils/event-query');

const resolveEventId = (req) => Number.parseInt(req.params.id || req.params.eventId, 10);

const joinEvent = asyncHandler(async (req, res) => {
  const eventId = resolveEventId(req);
  const userId = req.user.id;

  const joinedEvent = await withTransaction(async (client) => {
    const eventResult = await client.query(
      `
        SELECT id, title, event_date, quota, status
        FROM events
        WHERE id = $1
        FOR UPDATE
      `,
      [eventId]
    );

    const event = eventResult.rows[0];

    if (!event) {
      throw new AppError(404, 'Event not found');
    }

    if (event.status !== 'active') {
      throw new AppError(400, 'You can only join active events');
    }

    if (new Date(event.event_date) < new Date()) {
      throw new AppError(400, 'You cannot join a past event');
    }

    const existingResult = await client.query(
      `
        SELECT id, status
        FROM event_participants
        WHERE user_id = $1
          AND event_id = $2
      `,
      [userId, eventId]
    );

    const joinedCountResult = await client.query(
      `
        SELECT COUNT(*)::int AS joined_count
        FROM event_participants
        WHERE event_id = $1
          AND status = 'joined'
      `,
      [eventId]
    );

    const joinedCount = joinedCountResult.rows[0].joined_count;

    if (event.quota > 0 && joinedCount >= event.quota) {
      throw new AppError(409, 'Event quota is full');
    }

    if (existingResult.rowCount > 0) {
      if (existingResult.rows[0].status === 'joined') {
        throw new AppError(409, 'You already joined this event');
      }

      await client.query(
        `
          UPDATE event_participants
          SET status = 'joined',
              joined_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `,
        [existingResult.rows[0].id]
      );
    } else {
      await client.query(
        `
          INSERT INTO event_participants (user_id, event_id, status)
          VALUES ($1, $2, 'joined')
        `,
        [userId, eventId]
      );
    }

    return getEventDetail(client, eventId, userId);
  });

  return successResponse(res, {
    message: 'Event joined successfully',
    data: joinedEvent,
  });
});

const leaveEvent = asyncHandler(async (req, res) => {
  const eventId = resolveEventId(req);
  const userId = req.user.id;

  const result = await query(
    `
      UPDATE event_participants
      SET status = 'cancelled'
      WHERE user_id = $1
        AND event_id = $2
        AND status = 'joined'
      RETURNING id, event_id
    `,
    [userId, eventId]
  );

  if (result.rowCount === 0) {
    throw new AppError(404, 'You have not joined this event');
  }

  return successResponse(res, {
    message: 'Event left successfully',
    data: {
      event_id: result.rows[0].event_id,
    },
  });
});

const listJoinedEvents = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const userId = req.user.id;
  const buildJoinedEventsListQuery = (hasMetadata) => `
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
      ${hasMetadata ? 'e.metadata,' : `'{}'::jsonb AS metadata,`}
      ep.joined_at,
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
    FROM event_participants ep
    JOIN events e ON e.id = ep.event_id
    JOIN users o ON o.id = e.organizer_id
    LEFT JOIN clubs c ON c.id = e.club_id
    WHERE ep.user_id = $1
      AND ep.status = 'joined'
    ORDER BY e.event_date ASC
    LIMIT $2
    OFFSET $3
  `;

  const hasMetadata = await hasEventsMetadataColumn(query);

  let listResult;

  try {
    listResult = await query(buildJoinedEventsListQuery(hasMetadata), [userId, limit, offset]);
  } catch (error) {
    if (hasMetadata && isMissingColumnError(error, 'metadata')) {
      listResult = await query(buildJoinedEventsListQuery(false), [userId, limit, offset]);
    } else {
      throw error;
    }
  }

  const countResult = await query(
    `
      SELECT COUNT(*)::int AS total
      FROM event_participants
      WHERE user_id = $1
        AND status = 'joined'
    `,
    [userId]
  );

  const total = countResult.rows[0].total;

  return successResponse(res, {
    message: 'Joined events fetched successfully',
    data: listResult.rows,
    meta: {
      page,
      limit,
      total,
      total_pages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  });
});

module.exports = {
  joinEvent,
  leaveEvent,
  listJoinedEvents,
};
