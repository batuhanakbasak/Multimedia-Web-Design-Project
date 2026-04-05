const { query } = require('../config/db');

const getDashboardSummary = async () => {
  const [countsResult, latestUsersResult, latestEventsResult] = await Promise.all([
    query(`
      SELECT
        (SELECT COUNT(*)::int FROM users) AS total_users,
        (SELECT COUNT(*)::int FROM users WHERE role = 'student') AS total_students,
        (SELECT COUNT(*)::int FROM users WHERE role = 'organizer') AS total_organizers,
        (SELECT COUNT(*)::int FROM clubs) AS total_clubs,
        (SELECT COUNT(*)::int FROM events) AS total_events,
        (SELECT COUNT(*)::int FROM events WHERE status = 'active') AS total_active_events,
        (SELECT COUNT(*)::int FROM events WHERE status = 'cancelled') AS total_cancelled_events,
        (SELECT COUNT(*)::int FROM events WHERE status = 'completed') AS total_completed_events
    `),
    query(
      `
        SELECT id, full_name, email, role, is_active, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 5
      `
    ),
    query(
      `
        SELECT
          e.id,
          e.title,
          e.category,
          e.status,
          e.event_date,
          e.created_at,
          json_build_object(
            'id', u.id,
            'full_name', u.full_name,
            'email', u.email
          ) AS organizer,
          CASE
            WHEN c.id IS NULL THEN NULL
            ELSE json_build_object(
              'id', c.id,
              'name', c.name
            )
          END AS club
        FROM events e
        JOIN users u ON u.id = e.organizer_id
        LEFT JOIN clubs c ON c.id = e.club_id
        ORDER BY e.created_at DESC
        LIMIT 5
      `
    ),
  ]);

  return {
    ...countsResult.rows[0],
    latest_registered_users: latestUsersResult.rows,
    latest_created_events: latestEventsResult.rows,
  };
};

module.exports = {
  getDashboardSummary,
};
