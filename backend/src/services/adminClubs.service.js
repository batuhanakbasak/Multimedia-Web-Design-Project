const { query, withTransaction } = require('../config/db');
const AppError = require('../utils/errors');
const { buildUpdateFields, getPagination } = require('../utils/helpers');

const loadUserOrFail = async (userId) => {
  const result = await query(
    `
      SELECT id, full_name, email, role, is_active
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
      SELECT id, name, description, logo_url, created_by, is_active, created_at, updated_at
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

const listClubs = async (filters = {}) => {
  const { page, limit, offset } = getPagination(filters);
  const conditions = [];
  const values = [];

  if (filters.search) {
    values.push(`%${String(filters.search).trim()}%`);
    conditions.push(`(c.name ILIKE $${values.length} OR COALESCE(c.description, '') ILIKE $${values.length})`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

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
            'email', u.email
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
        ${whereClause}
        ORDER BY c.created_at DESC, c.id DESC
        LIMIT $${values.length + 1}
        OFFSET $${values.length + 2}
      `,
      [...values, limit, offset]
    ),
    query(
      `
        SELECT COUNT(*)::int AS total
        FROM clubs c
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

const getClubDetail = async (clubId) => {
  await loadClubOrFail(clubId);

  const [detailResult, managersResult, eventsResult] = await Promise.all([
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
            'role', u.role,
            'is_active', u.is_active
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
      `,
      [clubId]
    ),
    query(
      `
        SELECT
          u.id,
          u.full_name,
          u.email,
          u.role,
          u.profile_image,
          u.is_active,
          cm.joined_at
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
        SELECT
          e.id,
          e.title,
          e.category,
          e.status,
          e.event_date,
          e.created_at
        FROM events e
        WHERE e.club_id = $1
        ORDER BY e.event_date DESC, e.id DESC
        LIMIT 5
      `,
      [clubId]
    ),
  ]);

  return {
    ...detailResult.rows[0],
    managers: managersResult.rows,
    recent_events: eventsResult.rows,
  };
};

const createClub = async (payload, adminUser) => {
  const creatorId = payload.created_by || adminUser.id;
  await loadUserOrFail(creatorId);

  const createdClubId = await withTransaction(async (client) => {
    const insertResult = await client.query(
      `
        INSERT INTO clubs (name, description, logo_url, created_by)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `,
      [payload.name.trim(), payload.description || null, payload.logo_url || null, creatorId]
    );

    await client.query(
      `
        INSERT INTO club_members (user_id, club_id, member_role)
        VALUES ($1, $2, 'manager')
        ON CONFLICT (user_id, club_id)
        DO UPDATE SET member_role = EXCLUDED.member_role
      `,
      [creatorId, insertResult.rows[0].id]
    );

    return insertResult.rows[0].id;
  });

  return getClubDetail(createdClubId);
};

const updateClub = async (clubId, payload) => {
  await loadClubOrFail(clubId);

  const sanitizedPayload = { ...payload };

  if (typeof sanitizedPayload.name === 'string') {
    sanitizedPayload.name = sanitizedPayload.name.trim();
  }

  const { setClauses, values } = buildUpdateFields(sanitizedPayload, ['name', 'description', 'logo_url', 'is_active']);

  if (setClauses.length === 0) {
    throw new AppError(400, 'No club fields were provided for update');
  }

  await query(
    `
      UPDATE clubs
      SET ${setClauses.join(', ')}
      WHERE id = $${values.length + 1}
    `,
    [...values, clubId]
  );

  return getClubDetail(clubId);
};

const deleteClub = async (clubId) => {
  await loadClubOrFail(clubId);

  const result = await query(
    `
      DELETE FROM clubs
      WHERE id = $1
      RETURNING id, name
    `,
    [clubId]
  );

  return result.rows[0];
};

const getClubMembers = async (clubId) => {
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
      ORDER BY
        CASE WHEN cm.member_role = 'manager' THEN 0 ELSE 1 END,
        u.full_name ASC
    `,
    [clubId]
  );

  return result.rows;
};

const saveClubMember = async (clubId, userId, memberRole) => {
  await Promise.all([loadClubOrFail(clubId), loadUserOrFail(userId)]);

  const result = await query(
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
};

const removeClubMember = async (clubId, userId) => {
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

  return result.rows[0];
};

module.exports = {
  listClubs,
  getClubDetail,
  createClub,
  updateClub,
  deleteClub,
  getClubMembers,
  saveClubMember,
  removeClubMember,
};
