const { query, withTransaction } = require('../config/db');
const asyncHandler = require('../utils/async-handler');
const AppError = require('../utils/errors');
const { successResponse } = require('../utils/response');
const { buildUpdateFields } = require('../utils/helpers');
const { getPaginatedEvents, getEventDetail } = require('../utils/event-query');

const ensureManagedClub = async (db, organizerId, clubId) => {
  if (clubId === null || clubId === undefined) {
    return null;
  }

  const clubResult = await db.query(
    `
      SELECT id, name, is_active
      FROM clubs
      WHERE id = $1
    `,
    [clubId]
  );

  if (clubResult.rowCount === 0) {
    throw new AppError(404, 'Club not found');
  }

  if (!clubResult.rows[0].is_active) {
    throw new AppError(400, 'Selected club is inactive');
  }

  const membershipResult = await db.query(
    `
      SELECT id
      FROM club_members
      WHERE user_id = $1
        AND club_id = $2
        AND member_role = 'manager'
    `,
    [organizerId, clubId]
  );

  if (membershipResult.rowCount === 0) {
    throw new AppError(403, 'You must be a manager of the selected club');
  }

  return clubResult.rows[0];
};

const loadOwnedEventOrFail = async (db, organizerId, eventId) => {
  const eventResult = await db.query(
    `
      SELECT id, organizer_id, club_id, status
      FROM events
      WHERE id = $1
    `,
    [eventId]
  );

  const event = eventResult.rows[0];

  if (!event) {
    throw new AppError(404, 'Event not found');
  }

  if (event.organizer_id !== organizerId) {
    throw new AppError(403, 'You can only manage your own events');
  }

  return event;
};

const getDashboard = asyncHandler(async (req, res) => {
  const organizerId = req.user.id;

  const [statsResult, participantResult, upcomingEventsResult] = await Promise.all([
    query(
      `
        SELECT
          COUNT(*)::int AS total_events,
          COUNT(*) FILTER (WHERE status = 'active')::int AS active_events,
          COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_events,
          COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled_events
        FROM events
        WHERE organizer_id = $1
      `,
      [organizerId]
    ),
    query(
      `
        SELECT COUNT(ep.id)::int AS total_participants
        FROM events e
        LEFT JOIN event_participants ep
          ON ep.event_id = e.id
         AND ep.status = 'joined'
        WHERE e.organizer_id = $1
      `,
      [organizerId]
    ),
    query(
      `
        SELECT id, title, category, event_date, location, status
        FROM events
        WHERE organizer_id = $1
          AND event_date >= NOW()
        ORDER BY event_date ASC
        LIMIT 5
      `,
      [organizerId]
    ),
  ]);

  return successResponse(res, {
    message: 'Organizer dashboard fetched successfully',
    data: {
      ...statsResult.rows[0],
      total_participants: participantResult.rows[0].total_participants,
      upcoming_events: upcomingEventsResult.rows,
    },
  });
});

const listEvents = asyncHandler(async (req, res) => {
  const result = await getPaginatedEvents(query, req.query, {
    forceOrganizerId: req.user.id,
  });

  return successResponse(res, {
    message: 'Organizer events fetched successfully',
    data: result.items,
    meta: result.pagination,
  });
});

const createEvent = asyncHandler(async (req, res) => {
  const organizerId = req.user.id;

  const event = await withTransaction(async (client) => {
    if (req.body.club_id !== null && req.body.club_id !== undefined) {
      await ensureManagedClub(client, organizerId, req.body.club_id);
    }

    const insertResult = await client.query(
      `
        INSERT INTO events (
          club_id,
          organizer_id,
          title,
          description,
          category,
          event_date,
          location,
          image_url,
          quota,
          status,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', $10)
        RETURNING id
      `,
      [
        req.body.club_id ?? null,
        organizerId,
        req.body.title.trim(),
        req.body.description.trim(),
        req.body.category.trim(),
        req.body.event_date,
        req.body.location.trim(),
        req.body.image_url ?? null,
        req.body.quota,
        req.body.metadata || {},
      ]
    );

    return getEventDetail(client, insertResult.rows[0].id, organizerId);
  });

  return successResponse(res, {
    statusCode: 201,
    message: 'Event created successfully',
    data: event,
  });
});

const updateEvent = asyncHandler(async (req, res) => {
  const organizerId = req.user.id;
  const eventId = Number.parseInt(req.params.id, 10);

  const updatedEvent = await withTransaction(async (client) => {
    await loadOwnedEventOrFail(client, organizerId, eventId);

    if (Object.prototype.hasOwnProperty.call(req.body, 'club_id') && req.body.club_id !== null) {
      await ensureManagedClub(client, organizerId, req.body.club_id);
    }

    const payload = { ...req.body };

    if (typeof payload.title === 'string') {
      payload.title = payload.title.trim();
    }

    if (typeof payload.description === 'string') {
      payload.description = payload.description.trim();
    }

    if (typeof payload.category === 'string') {
      payload.category = payload.category.trim();
    }

    if (typeof payload.location === 'string') {
      payload.location = payload.location.trim();
    }

    const { setClauses, values } = buildUpdateFields(payload, [
      'club_id',
      'title',
      'description',
      'category',
      'event_date',
      'location',
      'image_url',
      'quota',
      'status',
      'metadata',
    ]);

    if (setClauses.length === 0) {
      throw new AppError(400, 'No event fields were provided for update');
    }

    await client.query(
      `
        UPDATE events
        SET ${setClauses.join(', ')}
        WHERE id = $${values.length + 1}
      `,
      [...values, eventId]
    );

    return getEventDetail(client, eventId, organizerId);
  });

  return successResponse(res, {
    message: 'Event updated successfully',
    data: updatedEvent,
  });
});

const deleteEvent = asyncHandler(async (req, res) => {
  const organizerId = req.user.id;
  const eventId = Number.parseInt(req.params.id, 10);

  await withTransaction(async (client) => {
    await loadOwnedEventOrFail(client, organizerId, eventId);

    await client.query(
      `
        UPDATE events
        SET status = 'cancelled'
        WHERE id = $1
      `,
      [eventId]
    );
  });

  return successResponse(res, {
    message: 'Event cancelled successfully',
    data: {
      event_id: eventId,
      status: 'cancelled',
    },
  });
});

const getEventParticipants = asyncHandler(async (req, res) => {
  const organizerId = req.user.id;
  const eventId = Number.parseInt(req.params.id, 10);

  await loadOwnedEventOrFail({ query }, organizerId, eventId);

  const result = await query(
    `
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.profile_image,
        ep.status,
        ep.joined_at
      FROM event_participants ep
      JOIN users u ON u.id = ep.user_id
      WHERE ep.event_id = $1
        AND ep.status = 'joined'
      ORDER BY ep.joined_at DESC
    `,
    [eventId]
  );

  return successResponse(res, {
    message: 'Event participants fetched successfully',
    data: result.rows,
  });
});

const getProfile = asyncHandler(async (req, res) => {
  return successResponse(res, {
    message: 'Organizer profile fetched successfully',
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
    message: 'Organizer profile updated successfully',
    data: result.rows[0],
  });
});

const getClubs = asyncHandler(async (req, res) => {
  const result = await query(
    `
      SELECT
        c.id,
        c.name,
        c.description,
        c.logo_url,
        c.is_active,
        cm.member_role,
        cm.joined_at
      FROM club_members cm
      JOIN clubs c ON c.id = cm.club_id
      WHERE cm.user_id = $1
      ORDER BY c.name ASC
    `,
    [req.user.id]
  );

  return successResponse(res, {
    message: 'Organizer clubs fetched successfully',
    data: result.rows,
  });
});

module.exports = {
  getDashboard,
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventParticipants,
  getProfile,
  updateProfile,
  getClubs,
};
