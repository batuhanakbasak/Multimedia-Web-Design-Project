-- Admin demo seed
-- Password for every inserted demo account: Admin12345!
-- Bcrypt hash generated with 10 salt rounds.

INSERT INTO users (full_name, email, password_hash, role, is_active)
VALUES
    ('System Admin', 'admin@example.com', '$2b$10$2Bb60q5GLWMKQb0oJSaReOHSnzy4UmqmpVC7mhogj3yARlAvgtkBW', 'admin', TRUE),
    ('Operations Admin', 'ops.admin@example.com', '$2b$10$2Bb60q5GLWMKQb0oJSaReOHSnzy4UmqmpVC7mhogj3yARlAvgtkBW', 'admin', TRUE),
    ('Aylin Demir', 'aylin.demir@example.com', '$2b$10$2Bb60q5GLWMKQb0oJSaReOHSnzy4UmqmpVC7mhogj3yARlAvgtkBW', 'student', TRUE),
    ('Mert Kaya', 'mert.kaya@example.com', '$2b$10$2Bb60q5GLWMKQb0oJSaReOHSnzy4UmqmpVC7mhogj3yARlAvgtkBW', 'student', TRUE),
    ('Ece Yilmaz', 'ece.yilmaz@example.com', '$2b$10$2Bb60q5GLWMKQb0oJSaReOHSnzy4UmqmpVC7mhogj3yARlAvgtkBW', 'student', TRUE),
    ('Burak Sahin', 'burak.sahin@example.com', '$2b$10$2Bb60q5GLWMKQb0oJSaReOHSnzy4UmqmpVC7mhogj3yARlAvgtkBW', 'organizer', TRUE),
    ('Elif Arslan', 'elif.arslan@example.com', '$2b$10$2Bb60q5GLWMKQb0oJSaReOHSnzy4UmqmpVC7mhogj3yARlAvgtkBW', 'organizer', TRUE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO clubs (name, description, logo_url, created_by)
SELECT
    'Robotics Club',
    'Hands-on projects, prototyping sessions, and robotics showcases.',
    'https://images.unsplash.com/photo-1581090700227-4c4d22b1f5b3?auto=format&fit=crop&w=600&q=80',
    u.id
FROM users u
WHERE u.email = 'admin@example.com'
  AND NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Robotics Club');

INSERT INTO clubs (name, description, logo_url, created_by)
SELECT
    'Design Society',
    'Visual design critiques, portfolio reviews, and campus exhibitions.',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
    u.id
FROM users u
WHERE u.email = 'ops.admin@example.com'
  AND NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'Design Society');

INSERT INTO club_members (user_id, club_id, member_role)
SELECT u.id, c.id, 'manager'
FROM users u
JOIN clubs c ON c.name = 'Robotics Club'
WHERE u.email = 'burak.sahin@example.com'
ON CONFLICT (user_id, club_id) DO UPDATE SET member_role = EXCLUDED.member_role;

INSERT INTO club_members (user_id, club_id, member_role)
SELECT u.id, c.id, 'manager'
FROM users u
JOIN clubs c ON c.name = 'Design Society'
WHERE u.email = 'elif.arslan@example.com'
ON CONFLICT (user_id, club_id) DO UPDATE SET member_role = EXCLUDED.member_role;

INSERT INTO club_members (user_id, club_id, member_role)
SELECT u.id, c.id, 'member'
FROM users u
JOIN clubs c ON c.name = 'Robotics Club'
WHERE u.email = 'aylin.demir@example.com'
ON CONFLICT (user_id, club_id) DO UPDATE SET member_role = EXCLUDED.member_role;

INSERT INTO club_members (user_id, club_id, member_role)
SELECT u.id, c.id, 'member'
FROM users u
JOIN clubs c ON c.name = 'Design Society'
WHERE u.email = 'ece.yilmaz@example.com'
ON CONFLICT (user_id, club_id) DO UPDATE SET member_role = EXCLUDED.member_role;

INSERT INTO events (club_id, organizer_id, title, description, category, event_date, location, image_url, quota, status)
SELECT
    c.id,
    u.id,
    'Robotics Hack Night',
    'Rapid prototyping challenge focused on autonomous bots and sensor systems.',
    'Technology',
    NOW() + INTERVAL '10 days',
    'Engineering Building Lab 4',
    'https://images.unsplash.com/photo-1535378620166-273708d44e4c?auto=format&fit=crop&w=900&q=80',
    80,
    'active'
FROM clubs c
JOIN users u ON u.email = 'burak.sahin@example.com'
WHERE c.name = 'Robotics Club'
  AND NOT EXISTS (SELECT 1 FROM events WHERE title = 'Robotics Hack Night');

INSERT INTO events (club_id, organizer_id, title, description, category, event_date, location, image_url, quota, status)
SELECT
    c.id,
    u.id,
    'Poster Design Sprint',
    'Campus poster design workshop with live critique rounds and gallery review.',
    'Art',
    NOW() + INTERVAL '18 days',
    'Fine Arts Studio 2',
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80',
    45,
    'active'
FROM clubs c
JOIN users u ON u.email = 'elif.arslan@example.com'
WHERE c.name = 'Design Society'
  AND NOT EXISTS (SELECT 1 FROM events WHERE title = 'Poster Design Sprint');

INSERT INTO events (club_id, organizer_id, title, description, category, event_date, location, image_url, quota, status)
SELECT
    c.id,
    u.id,
    'Spring Expo',
    'End-of-season club showcase with demos, prototypes, and sponsor tables.',
    'Showcase',
    NOW() - INTERVAL '7 days',
    'Main Conference Hall',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80',
    120,
    'completed'
FROM clubs c
JOIN users u ON u.email = 'burak.sahin@example.com'
WHERE c.name = 'Robotics Club'
  AND NOT EXISTS (SELECT 1 FROM events WHERE title = 'Spring Expo');

INSERT INTO events (club_id, organizer_id, title, description, category, event_date, location, image_url, quota, status)
SELECT
    c.id,
    u.id,
    'Design Meet-up',
    'Roundtable event for student designers to review portfolios and internship goals.',
    'Networking',
    NOW() + INTERVAL '25 days',
    'Media Center Atrium',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
    60,
    'cancelled'
FROM clubs c
JOIN users u ON u.email = 'elif.arslan@example.com'
WHERE c.name = 'Design Society'
  AND NOT EXISTS (SELECT 1 FROM events WHERE title = 'Design Meet-up');

INSERT INTO event_participants (user_id, event_id, status)
SELECT u.id, e.id, 'joined'
FROM users u
JOIN events e ON e.title = 'Robotics Hack Night'
WHERE u.email IN ('aylin.demir@example.com', 'mert.kaya@example.com')
ON CONFLICT (user_id, event_id) DO UPDATE SET status = EXCLUDED.status;

INSERT INTO event_participants (user_id, event_id, status)
SELECT u.id, e.id, 'joined'
FROM users u
JOIN events e ON e.title = 'Poster Design Sprint'
WHERE u.email IN ('ece.yilmaz@example.com', 'mert.kaya@example.com')
ON CONFLICT (user_id, event_id) DO UPDATE SET status = EXCLUDED.status;

INSERT INTO favorites (user_id, event_id)
SELECT u.id, e.id
FROM users u
JOIN events e ON e.title = 'Poster Design Sprint'
WHERE u.email = 'aylin.demir@example.com'
ON CONFLICT (user_id, event_id) DO NOTHING;

INSERT INTO favorites (user_id, event_id)
SELECT u.id, e.id
FROM users u
JOIN events e ON e.title = 'Robotics Hack Night'
WHERE u.email = 'ece.yilmaz@example.com'
ON CONFLICT (user_id, event_id) DO NOTHING;

-- Quick verification queries
SELECT id, full_name, email, role, is_active
FROM users
ORDER BY id ASC;

SELECT id, name, is_active, created_by
FROM clubs
ORDER BY id ASC;

SELECT id, title, status, event_date
FROM events
ORDER BY created_at DESC;
