const { query } = require('../config/db');
const asyncHandler = require('../utils/async-handler');
const AppError = require('../utils/errors');
const { successResponse } = require('../utils/response');
const { getPaginatedEvents } = require('../utils/event-query');

const loadPublicClubOrFail = async (clubId) => {
  const clubResult = await query(
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
      WHERE c.id = $1
        AND c.is_active = TRUE
    `,
    [clubId]
  );

  const club = clubResult.rows[0];

  if (!club) {
    throw new AppError(404, 'Club not found');
  }

  return club;
};

const listClubs = asyncHandler(async (req, res) => {
  const result = await query(
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
      WHERE c.is_active = TRUE
      ORDER BY c.name ASC
    `
  );

  return successResponse(res, {
    message: 'Clubs fetched successfully',
    data: result.rows,
  });
});

const getClubById = asyncHandler(async (req, res) => {
  const clubId = Number.parseInt(req.params.id, 10);
  const club = await loadPublicClubOrFail(clubId);

  const [managersResult, upcomingEventsResult] = await Promise.all([
    query(
      `
        SELECT u.id, u.full_name, u.email, u.profile_image
        FROM club_members cm
        JOIN users u ON u.id = cm.user_id
        WHERE cm.club_id = $1
          AND cm.member_role = 'manager'
        ORDER BY u.full_name ASC
      `,
      [clubId]
    ),
    query(
      `
        SELECT id, title, category, event_date, location, status
        FROM events
        WHERE club_id = $1
        ORDER BY event_date ASC
        LIMIT 5
      `,
      [clubId]
    ),
  ]);

  return successResponse(res, {
    message: 'Club detail fetched successfully',
    data: {
      ...club,
      managers: managersResult.rows,
      upcoming_events: upcomingEventsResult.rows,
    },
  });
});

const getClubMembers = asyncHandler(async (req, res) => {
  const clubId = Number.parseInt(req.params.id, 10);
  await loadPublicClubOrFail(clubId);

  const result = await query(
    `
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.profile_image,
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

const getClubEvents = asyncHandler(async (req, res) => {
  const clubId = Number.parseInt(req.params.id, 10);
  await loadPublicClubOrFail(clubId);

  const result = await getPaginatedEvents(query, req.query, {
    forceClubId: clubId,
    defaultStatus: 'active',
    upcomingOnly: !req.query.status,
  });

  return successResponse(res, {
    message: 'Club events fetched successfully',
    data: result.items,
    meta: result.pagination,
  });
});

module.exports = {
  listClubs,
  getClubById,
  getClubMembers,
  getClubEvents,
};
