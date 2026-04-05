# Database Design

## Overview

The backend uses PostgreSQL as the primary relational database.

Design goals:

- keep user, club, event, favorite, participation, and session data normalized
- enforce integrity through foreign keys and unique constraints
- support role-based access rules efficiently
- support search, filtering, and dashboard queries
- support refresh-token revocation safely
- leave room for future external integration data

Database source file:

- `backend/sql/schema.sql`

## Entity List

The schema contains 7 main tables:

1. `users`
2. `clubs`
3. `club_members`
4. `events`
5. `event_participants`
6. `favorites`
7. `auth_sessions`

## Entity Relationship Summary

```text
users
  ├──< clubs.created_by
  ├──< club_members.user_id >── clubs
  ├──< events.organizer_id
  ├──< event_participants.user_id >── events
  ├──< favorites.user_id >── events
  └──< auth_sessions.user_id

clubs
  ├──< club_members.club_id
  └──< events.club_id (nullable)
```

## Design Principles

Core relational decisions:

- all accounts live in one `users` table
- clubs and users are connected through `club_members`
- events always have an organizer
- events may or may not belong to a club
- participation and favorites are both many-to-many bridge tables
- refresh sessions are stored separately from users for revocation and device/session tracking

## Table Specifications

## 1. `users`

Purpose:

- stores every account in the system
- supports student, organizer, and admin roles in a single identity table

Columns:

| Column | Type | Null | Notes |
|---|---|---|---|
| `id` | `SERIAL` | No | Primary key |
| `full_name` | `VARCHAR(100)` | No | User display name |
| `email` | `VARCHAR(120)` | No | Unique login identifier |
| `password_hash` | `TEXT` | No | Bcrypt hash only |
| `role` | `VARCHAR(20)` | No | `student`, `organizer`, `admin` |
| `profile_image` | `TEXT` | Yes | Optional avatar URL |
| `is_active` | `BOOLEAN` | No | Access-control flag |
| `last_login_at` | `TIMESTAMP` | Yes | Updated on successful login |
| `password_updated_at` | `TIMESTAMP` | No | Password lifecycle timestamp |
| `created_at` | `TIMESTAMP` | No | Default `CURRENT_TIMESTAMP` |
| `updated_at` | `TIMESTAMP` | No | Updated by trigger |

Constraints:

- primary key on `id`
- unique constraint on `email`
- check constraint on `role`
- additional case-insensitive unique index on `LOWER(email)`

Business rules tied to this table:

- only students can self-register publicly
- organizer/admin accounts are created or promoted separately
- inactive users cannot authenticate or use protected routes

## 2. `clubs`

Purpose:

- stores club or community records

Columns:

| Column | Type | Null | Notes |
|---|---|---|---|
| `id` | `SERIAL` | No | Primary key |
| `name` | `VARCHAR(100)` | No | Unique club name |
| `description` | `TEXT` | Yes | Club description |
| `logo_url` | `TEXT` | Yes | Optional image URL |
| `created_by` | `INTEGER` | No | FK to `users.id` |
| `is_active` | `BOOLEAN` | No | Public visibility control |
| `created_at` | `TIMESTAMP` | No | Default `CURRENT_TIMESTAMP` |
| `updated_at` | `TIMESTAMP` | No | Updated by trigger |

Foreign key:

- `created_by -> users(id) ON DELETE CASCADE`

Implications:

- deleting the creator deletes the club record
- public club endpoints currently expose only active clubs

## 3. `club_members`

Purpose:

- models user membership in clubs
- stores whether a user is a normal member or manager

Columns:

| Column | Type | Null | Notes |
|---|---|---|---|
| `id` | `SERIAL` | No | Primary key |
| `user_id` | `INTEGER` | No | FK to `users.id` |
| `club_id` | `INTEGER` | No | FK to `clubs.id` |
| `member_role` | `VARCHAR(20)` | No | `member` or `manager` |
| `joined_at` | `TIMESTAMP` | No | Membership timestamp |

Constraints:

- unique constraint on `(user_id, club_id)`
- check constraint on `member_role`

Business meaning:

- a user can belong to multiple clubs
- a club can contain multiple users
- `manager` membership is required when an organizer creates or updates a club-linked event

## 4. `events`

Purpose:

- stores all events in the platform
- supports both club events and organizer-personal events

Columns:

| Column | Type | Null | Notes |
|---|---|---|---|
| `id` | `SERIAL` | No | Primary key |
| `club_id` | `INTEGER` | Yes | Nullable FK to `clubs.id` |
| `organizer_id` | `INTEGER` | No | FK to `users.id` |
| `title` | `VARCHAR(150)` | No | Event title |
| `description` | `TEXT` | No | Event description |
| `category` | `VARCHAR(50)` | No | Event category |
| `event_date` | `TIMESTAMP` | No | Scheduled datetime |
| `location` | `VARCHAR(150)` | No | Event location |
| `image_url` | `TEXT` | Yes | Optional image URL |
| `quota` | `INTEGER` | No | Non-negative attendee limit |
| `status` | `VARCHAR(20)` | No | `active`, `cancelled`, `completed` |
| `metadata` | `JSONB` | No | Integration-ready event metadata |
| `created_at` | `TIMESTAMP` | No | Default `CURRENT_TIMESTAMP` |
| `updated_at` | `TIMESTAMP` | No | Updated by trigger |

Foreign keys:

- `club_id -> clubs(id) ON DELETE SET NULL`
- `organizer_id -> users(id) ON DELETE CASCADE`

Constraints:

- check constraint on `status`
- check constraint `quota >= 0`

Business meaning:

- `club_id IS NULL` means a personal organizer event
- `club_id IS NOT NULL` means the event is attached to a club
- application logic requires club manager membership for organizers on club-linked events
- admin can still manage any event through admin routes
- `quota = 0` currently means unlimited capacity in the application logic

## 5. `event_participants`

Purpose:

- tracks student participation state per event

Columns:

| Column | Type | Null | Notes |
|---|---|---|---|
| `id` | `SERIAL` | No | Primary key |
| `user_id` | `INTEGER` | No | FK to `users.id` |
| `event_id` | `INTEGER` | No | FK to `events.id` |
| `status` | `VARCHAR(20)` | No | `joined` or `cancelled` |
| `joined_at` | `TIMESTAMP` | No | Latest join timestamp |

Constraints:

- unique constraint on `(user_id, event_id)`
- check constraint on `status`

Business meaning:

- rows are reused when a user rejoins after leaving
- leave action updates `status` to `cancelled`
- active participation count depends on rows where `status = 'joined'`

## 6. `favorites`

Purpose:

- stores bookmarked events

Columns:

| Column | Type | Null | Notes |
|---|---|---|---|
| `id` | `SERIAL` | No | Primary key |
| `user_id` | `INTEGER` | No | FK to `users.id` |
| `event_id` | `INTEGER` | No | FK to `events.id` |
| `created_at` | `TIMESTAMP` | No | Bookmark timestamp |

Constraints:

- unique constraint on `(user_id, event_id)`

Business meaning:

- a user cannot favorite the same event twice
- current protected routes expose favorites mainly for students

## 7. `auth_sessions`

Purpose:

- stores refresh-token sessions and revocation state

Columns:

| Column | Type | Null | Notes |
|---|---|---|---|
| `id` | `SERIAL` | No | Primary key |
| `user_id` | `INTEGER` | No | FK to `users.id` |
| `refresh_token_hash` | `TEXT` | No | SHA-256 hash of refresh token |
| `user_agent` | `TEXT` | Yes | Optional device/client info |
| `ip_address` | `VARCHAR(45)` | Yes | Optional IP metadata |
| `is_revoked` | `BOOLEAN` | No | Revocation flag |
| `expires_at` | `TIMESTAMP` | No | Session expiry time |
| `created_at` | `TIMESTAMP` | No | Session creation time |
| `revoked_at` | `TIMESTAMP` | Yes | Revoke timestamp |

Business meaning:

- refresh tokens are never stored in plain text
- every login creates a session row
- refresh rotates the session
- logout revokes one session
- logout-all revokes all sessions of the current user

## Referential Integrity Rules

Foreign key effects:

- deleting a user cascades to clubs they created, events they organize, participations, favorites, memberships, and sessions
- deleting a club cascades to `club_members` and sets `events.club_id` to `NULL`
- deleting an event cascades to participants and favorites tied to that event

These rules reduce orphaned rows and keep controller cleanup simpler.

## Business Rules Enforced Above the Database

Some rules are enforced in application logic rather than pure schema constraints:

- only students can self-register
- organizer/admin login endpoints require exact role match
- inactive users cannot log in or use protected routes
- organizers can update/delete only their own events
- organizers need `manager` club membership for club-linked events
- students cannot join past or non-active events
- quota is checked against current joined participant count
- organizer delete is soft cancel, not hard delete
- admin event delete is hard delete

## Index Design

Defined indexes:

- `idx_users_role`
- `idx_users_email`
- `idx_users_email_lower`
- `idx_clubs_created_by`
- `idx_club_members_user_id`
- `idx_club_members_club_id`
- `idx_events_club_id`
- `idx_events_organizer_id`
- `idx_events_event_date`
- `idx_events_status`
- `idx_event_participants_user_id`
- `idx_event_participants_event_id`
- `idx_favorites_user_id`
- `idx_favorites_event_id`
- `idx_auth_sessions_user_id`
- `idx_auth_sessions_expires_at`
- `idx_auth_sessions_is_revoked`

Why they matter:

- auth depends on fast user and email lookups
- event listing depends on `event_date`, `status`, `organizer_id`, and `club_id`
- favorites and participations are frequently filtered by `user_id`
- session revocation and refresh matching depend on efficient session lookups

## Trigger Design

A shared trigger function updates `updated_at` automatically.

Trigger function:

- `set_updated_at()`

Affected tables:

- `users`
- `clubs`
- `events`

Benefits:

- keeps timestamps consistent
- reduces repeated timestamp SQL in update statements

## Query Patterns Used by the Backend

### Authentication patterns

- load user by normalized email
- compare bcrypt hash in application logic
- insert hashed refresh session
- revoke sessions by hashed refresh token or by `user_id`

### Event patterns

- paginated event list with flexible filters
- event detail with organizer, club, joined count, favorite flag, joined flag
- participant counts via grouped subquery with filtered count

### Club patterns

- list active clubs with creator, member count, and event count
- club detail with managers and recent upcoming events
- club event list filtered through shared event query helper

### Dashboard patterns

- admin dashboard uses aggregate subqueries
- organizer dashboard aggregates event counts and total participants
- student dashboard aggregates joined count, favorites, upcoming joins, and recommended events

## Data Lifecycle Notes

### User lifecycle

- public registration inserts `student` rows
- role changes happen through admin endpoints
- deactivation blocks both login and protected access

### Event lifecycle

- organizer/admin create event
- student joins or leaves event
- organizer delete marks event as `cancelled`
- admin delete removes the event row entirely

### Session lifecycle

- login creates `auth_sessions` row
- refresh revokes old session and inserts new one
- logout revokes current session
- logout-all revokes every active session for the user

## Seed and Testing Recommendations

For realistic local testing, populate at least:

- 1 admin
- 3 students
- 3 organizers
- 2 clubs
- manager memberships for at least some organizers
- both personal and club-linked events
- participations and favorites for students

This allows end-to-end validation of:

- registration
- role-specific login paths
- organizer ownership checks
- club manager restrictions
- admin management actions
- favorites and participation flows

## Extension Points

The main schema-level extension point is `events.metadata JSONB`.

Good future additions:

- coordinates
- weather snapshot
- map link
- external provider ID
- venue metadata

If some of those fields need indexed querying later, they can be extracted into dedicated relational tables.

## Source of Truth

Primary database-related files:

- `backend/sql/schema.sql`
- `backend/sql/sample-queries.sql`
- `backend/src/config/db.js`
- `backend/src/controllers/`
- `backend/src/utils/event-query.js`
