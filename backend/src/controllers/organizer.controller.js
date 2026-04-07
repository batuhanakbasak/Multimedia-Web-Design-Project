const bcrypt = require('bcrypt');

const { query, withTransaction } = require('../config/db');
const asyncHandler = require('../utils/async-handler');
const AppError = require('../utils/errors');
const { successResponse } = require('../utils/response');
const { buildUpdateFields } = require('../utils/helpers');
const { hasEventsMetadataColumn } = require('../utils/schema-capabilities');
const { getPaginatedEvents, getEventDetail } = require('../utils/event-query');

const SALT_ROUNDS = Number.parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

const loadUserOrFail = async (db, userId) => {
  const result = await db.query(
    `
      SELECT id, full_name, email, role, profile_image, is_active
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

const loadClubMember = async (db, clubId, userId) => {
  const result = await db.query(
    `
      SELECT id, user_id, club_id, member_role, joined_at
      FROM club_members
      WHERE club_id = $1
        AND user_id = $2
    `,
    [clubId, userId]
  );

  return result.rows[0] || null;
};

const lockClubMembers = async (db, clubId) => {
  await db.query(
    `
      SELECT id
      FROM club_members
      WHERE club_id = $1
      FOR UPDATE
    `,
    [clubId]
  );
};

const countClubManagers = async (db, clubId) => {
  const result = await db.query(
    `
      SELECT COUNT(*)::int AS total
      FROM club_members
      WHERE club_id = $1
        AND member_role = 'manager'
    `,
    [clubId]
  );

  return result.rows[0]?.total || 0;
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
        SELECT id, title, category, event_date, location, quota, status
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
      events: upcomingEventsResult.rows,
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

const getEventById = asyncHandler(async (req, res) => {
  const organizerId = req.user.id;
  const eventId = Number.parseInt(req.params.id, 10);

  await loadOwnedEventOrFail({ query }, organizerId, eventId);

  const event = await getEventDetail(query, eventId, organizerId);

  if (!event) {
    throw new AppError(404, 'Event not found');
  }

  return successResponse(res, {
    message: 'Organizer event detail fetched successfully',
    data: event,
  });
});

const createEvent = asyncHandler(async (req, res) => {
  const organizerId = req.user.id;

  const event = await withTransaction(async (client) => {
    const hasMetadata = await hasEventsMetadataColumn(client);

    if (req.body.club_id !== null && req.body.club_id !== undefined) {
      await ensureManagedClub(client, organizerId, req.body.club_id);
    }

    const insertFields = [
      'club_id',
      'organizer_id',
      'title',
      'description',
      'category',
      'event_date',
      'location',
      'image_url',
      'quota',
      'status',
    ];

    const insertValues = [
      req.body.club_id ?? null,
      organizerId,
      req.body.title.trim(),
      req.body.description.trim(),
      req.body.category.trim(),
      req.body.event_date,
      req.body.location.trim(),
      req.body.image_url ?? null,
      req.body.quota,
      'active',
    ];

    if (hasMetadata) {
      insertFields.push('metadata');
      insertValues.push(req.body.metadata || {});
    }

    const insertResult = await client.query(
      `
        INSERT INTO events (${insertFields.join(', ')})
        VALUES (${insertFields.map((field, index) => `$${index + 1}`).join(', ')})
        RETURNING id
      `,
      insertValues
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
    const hasMetadata = await hasEventsMetadataColumn(client);

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

    if (!hasMetadata) {
      delete payload.metadata;
    }

    const allowedFields = [
      'club_id',
      'title',
      'description',
      'category',
      'event_date',
      'location',
      'image_url',
      'quota',
      'status',
    ];

    if (hasMetadata) {
      allowedFields.push('metadata');
    }

    const { setClauses, values } = buildUpdateFields(payload, allowedFields);

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

const removeEventParticipant = asyncHandler(async (req, res) => {
  const organizerId = req.user.id;
  const eventId = Number.parseInt(req.params.id, 10);
  const userId = Number.parseInt(req.params.userId, 10);

  const payload = await withTransaction(async (client) => {
    await loadOwnedEventOrFail(client, organizerId, eventId);

    const result = await client.query(
      `
        UPDATE event_participants
        SET status = 'cancelled'
        WHERE event_id = $1
          AND user_id = $2
          AND status = 'joined'
        RETURNING id, event_id, user_id
      `,
      [eventId, userId]
    );

    if (result.rowCount === 0) {
      throw new AppError(404, 'Participant not found in this event');
    }

    const joinedCountResult = await client.query(
      `
        SELECT COUNT(*)::int AS joined_count
        FROM event_participants
        WHERE event_id = $1
          AND status = 'joined'
      `,
      [eventId]
    );

    return {
      ...result.rows[0],
      status: 'cancelled',
      joined_count: joinedCountResult.rows[0]?.joined_count || 0,
    };
  });

  return successResponse(res, {
    message: 'Event participant removed successfully',
    data: payload,
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
    message: 'Organizer password updated successfully',
    data: {
      password_changed: true,
    },
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

const getClubMembers = asyncHandler(async (req, res) => {
  const clubId = Number.parseInt(req.params.id, 10);

  await ensureManagedClub({ query }, req.user.id, clubId);

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
      ORDER BY
        CASE WHEN cm.member_role = 'manager' THEN 0 ELSE 1 END,
        u.full_name ASC
    `,
    [clubId]
  );

  return successResponse(res, {
    message: 'Organizer club members fetched successfully',
    data: result.rows,
  });
});

const saveClubMember = asyncHandler(async (req, res) => {
  const clubId = Number.parseInt(req.params.id, 10);
  const { user_id: userId, member_role: memberRole } = req.body;

  const membership = await withTransaction(async (client) => {
    await ensureManagedClub(client, req.user.id, clubId);
    await loadUserOrFail(client, userId);
    await lockClubMembers(client, clubId);

    const existingMembership = await loadClubMember(client, clubId, userId);

    if (
      existingMembership &&
      existingMembership.member_role === 'manager' &&
      memberRole !== 'manager'
    ) {
      const managerCount = await countClubManagers(client, clubId);

      if (managerCount <= 1) {
        throw new AppError(400, 'Club must have at least one manager');
      }
    }

    const result = await client.query(
      `
        INSERT INTO club_members (user_id, club_id, member_role)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, club_id)
        DO UPDATE SET member_role = EXCLUDED.member_role
        RETURNING id, user_id, club_id, member_role, joined_at
      `,
      [userId, clubId, memberRole]
    );

    return result.rows[0];
  });

  return successResponse(res, {
    statusCode: 201,
    message: 'Organizer club member saved successfully',
    data: membership,
  });
});

const removeClubMember = asyncHandler(async (req, res) => {
  const clubId = Number.parseInt(req.params.id, 10);
  const userId = Number.parseInt(req.params.userId, 10);

  const membership = await withTransaction(async (client) => {
    await ensureManagedClub(client, req.user.id, clubId);
    await lockClubMembers(client, clubId);

    const existingMembership = await loadClubMember(client, clubId, userId);

    if (!existingMembership) {
      throw new AppError(404, 'Club membership not found');
    }

    if (existingMembership.member_role === 'manager') {
      const managerCount = await countClubManagers(client, clubId);

      if (managerCount <= 1) {
        throw new AppError(400, 'Club must have at least one manager');
      }
    }

    const result = await client.query(
      `
        DELETE FROM club_members
        WHERE club_id = $1
          AND user_id = $2
        RETURNING id, club_id, user_id
      `,
      [clubId, userId]
    );

    return result.rows[0];
  });

  return successResponse(res, {
    message: 'Organizer club member removed successfully',
    data: membership,
  });
});

module.exports = {
  getDashboard,
  listEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventParticipants,
  removeEventParticipant,
  getProfile,
  updateProfile,
  changePassword,
  getClubs,
  getClubMembers,
  saveClubMember,
  removeClubMember,
};
