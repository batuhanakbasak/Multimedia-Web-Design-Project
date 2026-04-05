const { getPagination } = require('./helpers');
const { hasEventsMetadataColumn, isMissingColumnError } = require('./schema-capabilities');

const SORT_MAP = {
  newest: 'e.created_at DESC, e.id DESC',
  oldest: 'e.created_at ASC, e.id ASC',
  upcoming: 'e.event_date ASC, e.id ASC',
};

const executeQuery = (db, text, params = []) => {
  if (typeof db === 'function') {
    return db(text, params);
  }

  return db.query(text, params);
};

const buildEventFilters = (filters = {}, options = {}) => {
  const conditions = [];
  const values = [];
  const keyword = (filters.keyword || filters.search || '').trim();

  if (keyword) {
    values.push(`%${keyword}%`);
    conditions.push(`(e.title ILIKE $${values.length} OR e.description ILIKE $${values.length})`);
  }

  if (filters.category) {
    values.push(String(filters.category).trim());
    conditions.push(`LOWER(e.category) = LOWER($${values.length})`);
  }

  if (filters.date) {
    values.push(filters.date);
    conditions.push(`DATE(e.event_date) = DATE($${values.length})`);
  }

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`e.status = $${values.length}`);
  } else if (options.defaultStatus) {
    values.push(options.defaultStatus);
    conditions.push(`e.status = $${values.length}`);
  }

  if (options.upcomingOnly) {
    conditions.push('e.event_date >= NOW()');
  }

  if (filters.organizer_id) {
    values.push(Number.parseInt(filters.organizer_id, 10));
    conditions.push(`e.organizer_id = $${values.length}`);
  }

  if (filters.club_id) {
    values.push(Number.parseInt(filters.club_id, 10));
    conditions.push(`e.club_id = $${values.length}`);
  }

  if (options.forceOrganizerId) {
    values.push(options.forceOrganizerId);
    conditions.push(`e.organizer_id = $${values.length}`);
  }

  if (options.forceClubId) {
    values.push(options.forceClubId);
    conditions.push(`e.club_id = $${values.length}`);
  }

  return {
    whereClause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    values,
  };
};

const getSortClause = (sort = 'upcoming') => SORT_MAP[sort] || SORT_MAP.upcoming;

const buildMetadataSelect = (hasMetadata) => (hasMetadata ? 'e.metadata,' : `'{}'::jsonb AS metadata,`);

const buildPaginatedEventsQueries = (filters = {}, options = {}, hasMetadata = false) => {
  const { page, limit, offset } = getPagination(filters);
  const { whereClause, values } = buildEventFilters(filters, options);
  const metadataSelect = buildMetadataSelect(hasMetadata);

  const listQuery = `
    SELECT
      e.id,
      e.club_id,
      e.organizer_id,
      e.title,
      e.description,
      e.category,
      e.event_date,
      e.location,
      e.image_url,
      e.quota,
      e.status,
      ${metadataSelect}
      e.created_at,
      e.updated_at,
      COALESCE(ep.joined_count, 0) AS joined_count,
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
    FROM events e
    JOIN users o ON o.id = e.organizer_id
    LEFT JOIN clubs c ON c.id = e.club_id
    LEFT JOIN (
      SELECT event_id, COUNT(*) FILTER (WHERE status = 'joined')::int AS joined_count
      FROM event_participants
      GROUP BY event_id
    ) ep ON ep.event_id = e.id
    ${whereClause}
    ORDER BY ${getSortClause(filters.sort)}
    LIMIT $${values.length + 1}
    OFFSET $${values.length + 2}
  `;

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM events e
    ${whereClause}
  `;

  return {
    listQuery,
    countQuery,
    values,
    page,
    limit,
    offset,
  };
};

const executePaginatedEventsQuery = async (db, filters = {}, options = {}, hasMetadata = false) => {
  const { listQuery, countQuery, values, page, limit, offset } = buildPaginatedEventsQueries(
    filters,
    options,
    hasMetadata
  );

  const [listResult, countResult] = await Promise.all([
    executeQuery(db, listQuery, [...values, limit, offset]),
    executeQuery(db, countQuery, values),
  ]);

  const total = countResult.rows[0]?.total || 0;

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

const buildEventDetailQuery = (hasMetadata = false) => {
  const metadataSelect = buildMetadataSelect(hasMetadata);

  return `
    SELECT
      e.id,
      e.club_id,
      e.organizer_id,
      e.title,
      e.description,
      e.category,
      e.event_date,
      e.location,
      e.image_url,
      e.quota,
      e.status,
      ${metadataSelect}
      e.created_at,
      e.updated_at,
      COALESCE(ep.joined_count, 0) AS joined_count,
      CASE
        WHEN $2::int IS NULL THEN FALSE
        ELSE EXISTS(
          SELECT 1
          FROM favorites f
          WHERE f.user_id = $2
            AND f.event_id = e.id
        )
      END AS is_favorite,
      CASE
        WHEN $2::int IS NULL THEN FALSE
        ELSE EXISTS(
          SELECT 1
          FROM event_participants p
          WHERE p.user_id = $2
            AND p.event_id = e.id
            AND p.status = 'joined'
        )
      END AS is_joined,
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
          'description', c.description,
          'logo_url', c.logo_url,
          'is_active', c.is_active
        )
      END AS club
    FROM events e
    JOIN users o ON o.id = e.organizer_id
    LEFT JOIN clubs c ON c.id = e.club_id
    LEFT JOIN (
      SELECT event_id, COUNT(*) FILTER (WHERE status = 'joined')::int AS joined_count
      FROM event_participants
      GROUP BY event_id
    ) ep ON ep.event_id = e.id
    WHERE e.id = $1
  `;
};

const getPaginatedEvents = async (db, filters = {}, options = {}) => {
  const hasMetadata = await hasEventsMetadataColumn(db);

  try {
    return await executePaginatedEventsQuery(db, filters, options, hasMetadata);
  } catch (error) {
    if (hasMetadata && isMissingColumnError(error, 'metadata')) {
      return executePaginatedEventsQuery(db, filters, options, false);
    }

    throw error;
  }
};

const getEventDetail = async (db, eventId, userId = null) => {
  const hasMetadata = await hasEventsMetadataColumn(db);

  try {
    const result = await executeQuery(db, buildEventDetailQuery(hasMetadata), [eventId, userId]);
    return result.rows[0] || null;
  } catch (error) {
    if (hasMetadata && isMissingColumnError(error, 'metadata')) {
      const fallbackResult = await executeQuery(db, buildEventDetailQuery(false), [eventId, userId]);
      return fallbackResult.rows[0] || null;
    }

    throw error;
  }
};

module.exports = {
  getPaginatedEvents,
  getEventDetail,
};
