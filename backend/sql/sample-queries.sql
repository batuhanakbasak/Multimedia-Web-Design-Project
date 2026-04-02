-- 1. Promote an existing student to organizer.
UPDATE users
SET role = 'organizer', updated_at = CURRENT_TIMESTAMP
WHERE email = 'student@example.com';

-- 2. Create an admin user manually.
-- Replace the password hash with a bcrypt hash generated in Node.js.
INSERT INTO users (full_name, email, password_hash, role)
VALUES ('System Admin', 'admin@example.com', '$2b$10$replace_with_real_bcrypt_hash', 'admin');

-- 3. List upcoming active events with organizer and club info.
SELECT
    e.id,
    e.title,
    e.category,
    e.event_date,
    e.location,
    u.full_name AS organizer_name,
    c.name AS club_name
FROM events e
JOIN users u ON u.id = e.organizer_id
LEFT JOIN clubs c ON c.id = e.club_id
WHERE e.status = 'active'
  AND e.event_date >= NOW()
ORDER BY e.event_date ASC;

-- 4. Search events by keyword and category.
SELECT id, title, category, event_date, location
FROM events
WHERE (title ILIKE '%robot%' OR description ILIKE '%robot%')
  AND category ILIKE 'technology'
ORDER BY event_date ASC;

-- 5. Get dashboard counts.
SELECT
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM users WHERE role = 'student') AS total_students,
    (SELECT COUNT(*) FROM users WHERE role = 'organizer') AS total_organizers,
    (SELECT COUNT(*) FROM clubs) AS total_clubs,
    (SELECT COUNT(*) FROM events) AS total_events,
    (SELECT COUNT(*) FROM events WHERE status = 'active') AS total_active_events,
    (SELECT COUNT(*) FROM event_participants WHERE status = 'joined') AS total_participations;

-- 6. Show event participation totals.
SELECT
    e.id,
    e.title,
    COUNT(ep.id) FILTER (WHERE ep.status = 'joined') AS joined_count,
    e.quota
FROM events e
LEFT JOIN event_participants ep ON ep.event_id = e.id
GROUP BY e.id
ORDER BY e.event_date ASC;

-- 7. List a student's joined events.
SELECT
    e.id,
    e.title,
    e.event_date,
    e.location,
    ep.joined_at
FROM event_participants ep
JOIN events e ON e.id = ep.event_id
WHERE ep.user_id = 1
  AND ep.status = 'joined'
ORDER BY e.event_date ASC;

-- 8. List a student's favorite events.
SELECT
    e.id,
    e.title,
    e.event_date,
    e.location,
    f.created_at AS favorited_at
FROM favorites f
JOIN events e ON e.id = f.event_id
WHERE f.user_id = 1
ORDER BY f.created_at DESC;
