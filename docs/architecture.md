# Backend Architecture

## Purpose

This backend is a modular `Node.js + Express + PostgreSQL` service for a university event management platform.

It supports:

- student registration and login
- organizer and admin login
- JWT access and refresh token flow
- role-based authorization
- public event and club browsing
- student participation and favorites
- organizer-owned event management
- admin-level user, club, and event operations

## Project Scope

The backend is designed as a REST API for web and mobile clients. It returns consistent JSON payloads and keeps the data model ready for future integrations such as maps, weather data, or external university systems.

## Backend Folder Layout

```text
backend/
├── sql/
│   ├── schema.sql
│   └── sample-queries.sql
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   ├── db.js
│   │   └── env.js
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   └── utils/
├── .env
├── .env.example
├── package.json
└── README.md
```

## High-Level Runtime View

```text
Client / Frontend / Postman
            |
            v
        Express App
            |
            +-- Global middleware
            |   - CORS
            |   - JSON parser
            |   - URL-encoded parser
            |
            +-- Route layer
            |   - auth routes
            |   - student routes
            |   - organizer routes
            |   - admin routes
            |   - public clubs/events routes
            |   - participant/favorite alias routes
            |
            +-- Auth + role middleware
            |
            +-- Controllers
            |
            +-- Utils / query helpers
            |
            v
      PostgreSQL via pg Pool
```

## Entry Points

### `backend/src/server.js`

Responsibilities:

- load environment settings indirectly through app/db imports
- verify database connectivity before serving traffic
- start the HTTP server
- bind to `HOST` and `PORT`
- shut down gracefully on process signals

Current behavior:

- default host binding is `0.0.0.0`
- startup fails fast if PostgreSQL is unreachable

### `backend/src/app.js`

Responsibilities:

- initialize Express
- configure CORS
- enable body parsers
- expose `GET /api/health`
- mount all route groups under `/api`
- mount not-found and centralized error middleware

## Configuration Layer

### `backend/src/config/env.js`

Responsibilities:

- load `.env` from the backend root using an absolute path
- avoid `dotenv` path issues when the process starts from `backend/` or `backend/src`

Supported database styles:

1. `DATABASE_URL`
2. separate variables:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_NAME`
   - `DB_USER`
   - `DB_PASSWORD`

Resolution rule:

- if `DATABASE_URL` exists, it takes precedence
- otherwise the discrete `DB_*` variables are used

### `backend/src/config/db.js`

Responsibilities:

- create and export the `pg` connection pool
- expose `query()` helper for parameterized SQL
- expose transaction helper for multi-step write operations
- centralize DB connection options

## Route Layer

Files in `backend/src/routes/` define the public API surface.

Current route groups:

- `auth.routes.js`
- `student.routes.js`
- `organizer.routes.js`
- `admin.routes.js`
- `clubs.routes.js`
- `events.routes.js`
- `participants.routes.js`
- `favorites.routes.js`

Responsibilities:

- map URLs to controller functions
- attach validation middleware
- attach authentication middleware where required
- attach role checks where required
- keep HTTP definitions thin and readable

The route layer does not contain business rules or SQL.

## Middleware Layer

### `auth.middleware.js`

Responsibilities:

- read `Authorization: Bearer <token>`
- verify access tokens
- load the authenticated user from the database
- reject inactive users
- attach sanitized user data to `req.user`

Modes:

- `protect`: authentication required
- `optionalAuth`: authentication optional for public routes that can enrich responses

Current usage:

- `optionalAuth` is used on public event detail so `is_favorite` and `is_joined` can be returned when a token is present

### `role.middleware.js`

Responsibilities:

- enforce role-based access after authentication
- reject requests when `req.user.role` is not allowed for the route

Current role sets:

- student-only routes
- organizer-only routes
- admin-only routes

### `error.middleware.js`

Responsibilities:

- convert thrown errors to a standard JSON format
- normalize common PostgreSQL errors
- normalize JWT errors
- handle invalid JSON payloads
- handle unknown routes

Example error shape:

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

## Controller Layer

Controllers own the request-level business logic.

### `auth.controller.js`

Responsibilities:

- register public student accounts
- log in student, organizer, and admin accounts through separate endpoints
- generate access and refresh tokens
- hash refresh tokens before storing sessions
- rotate refresh sessions on refresh
- revoke current session on logout
- revoke all user sessions on logout-all
- return current authenticated user through `/api/auth/me`

Important rules:

- student register always creates `role = 'student'`
- login endpoint must match the account role exactly
- inactive users cannot log in
- refresh tokens are never stored in plain text

### `student.controller.js`

Responsibilities:

- student dashboard summary
- event list and search for students
- event detail for students
- profile read/update
- club browsing in the student area

Dashboard data includes:

- joined events count
- favorite count
- upcoming joined events
- recommended active events

### `organizer.controller.js`

Responsibilities:

- organizer dashboard summary
- list organizer-owned events
- create event
- update own event
- cancel own event
- list participants of own event
- organizer profile read/update
- organizer club memberships

Important rules:

- organizer can manage only own events
- organizer can assign `club_id` only if they are a `manager` of that club
- delete is implemented as soft cancellation by setting `events.status = 'cancelled'`

### `adminAuth.controller.js`, `adminDashboard.controller.js`, `adminUsers.controller.js`, `adminClubs.controller.js`, `adminEvents.controller.js`

Responsibilities:

- admin authentication under `/api/admin/auth`
- admin dashboard summary
- list and inspect users
- update user roles
- activate/deactivate users
- list/create/update/delete clubs
- add/remove club members
- list and inspect all events
- update event status
- delete any event permanently

Important rules:

- role changes revoke all active refresh sessions for that user
- deactivating a user revokes active refresh sessions
- club delete is a hard delete
- admin event delete is a hard delete
- self-demotion and self-deactivation are blocked for admins
- the system keeps at least one active admin

### `events.controller.js`

Responsibilities:

- public event list
- public event search
- public event detail

Behavior:

- defaults to active upcoming events unless a status filter is explicitly passed
- event detail can include user-specific flags when an access token is present

### `clubs.controller.js`

Responsibilities:

- public club list
- public club detail
- public club members
- public club events

Behavior:

- public club endpoints expose only active clubs
- club detail returns managers and a short list of upcoming events

### `participants.controller.js`

Responsibilities:

- join event
- leave event
- list joined events

Important rules:

- only students can access these endpoints
- only active events can be joined
- past events cannot be joined
- duplicate join attempts are blocked
- event quota is enforced when `quota > 0`
- leave sets `status = 'cancelled'` instead of deleting the row

### `favorites.controller.js`

Responsibilities:

- list favorites
- add favorite
- remove favorite

Important rules:

- favorites are unique by `(user_id, event_id)`
- duplicate favorites return `409 Conflict`

## Utility Layer

### `jwt.js`

Responsibilities:

- sign access tokens
- sign refresh tokens
- verify access tokens
- verify refresh tokens
- hash refresh tokens with SHA-256 for database storage
- calculate refresh expiration date

Token model:

- access token: short-lived, sent in `Authorization` header
- refresh token: longer-lived, used only on refresh/logout flows

### `validators.js`

Responsibilities:

- validate request bodies, query params, and route params using `express-validator`
- normalize validation failures into a standard response shape

Validated areas include:

- student registration
- login bodies
- refresh token body
- profile updates
- event create/update payloads
- club create/update/member payloads
- pagination and event filters

### `event-query.js`

Responsibilities:

- build reusable event filtering logic
- centralize pagination logic for event lists
- centralize event detail query shape

Supported event filters:

- `search`
- `keyword`
- `category`
- `date`
- `status`
- `sort`
- `organizer_id`
- `club_id`

### Other utilities

- `helpers.js`: normalization, pagination, dynamic SQL update field building, request metadata helpers
- `response.js`: consistent success response helper
- `async-handler.js`: async error wrapper
- `errors.js`: application error class

## Request Lifecycle

### Example: student login

1. client sends `POST /api/auth/login/student`
2. validator checks `email` and `password`
3. controller loads user by normalized email
4. controller verifies exact role match and `is_active`
5. bcrypt compares provided password with `password_hash`
6. access token and refresh token are generated
7. refresh token is hashed and inserted into `auth_sessions`
8. response returns sanitized user + tokens

### Example: organizer creates event

1. client sends `POST /api/organizer/events`
2. auth middleware verifies bearer token
3. role middleware enforces `organizer`
4. validator checks `title`, `event_date`, `quota`, URLs, and optional `metadata`
5. controller checks club manager membership when `club_id` is present
6. controller inserts event row with `organizer_id` from `req.user`
7. response returns full event detail

### Example: student joins event

1. client sends `POST /api/student/events/:id/join`
2. auth middleware verifies token and current user
3. role middleware enforces `student`
4. controller locks the target event row with `FOR UPDATE`
5. controller verifies event status, future date, quota, and duplicate participation
6. controller inserts or reactivates `event_participants`
7. response returns updated event detail

## Authentication and Session Design

### Access token

Used for:

- all protected route access
- user identity and role checks

Properties:

- signed with `JWT_ACCESS_SECRET`
- expiry controlled by `JWT_ACCESS_EXPIRES_IN`

### Refresh token

Used for:

- `POST /api/auth/refresh`
- `POST /api/auth/logout`

Properties:

- signed with `JWT_REFRESH_SECRET`
- expiry controlled by `JWT_REFRESH_EXPIRES_IN`
- stored in the database only as a hash

### Session storage

Each successful login creates an `auth_sessions` row containing:

- `user_id`
- `refresh_token_hash`
- `user_agent`
- `ip_address`
- `expires_at`
- revocation fields

### Rotation strategy

Current refresh flow:

1. verify the provided refresh token
2. hash it and find the matching session row
3. reject revoked or expired rows
4. revoke the old session row
5. insert a new session row
6. return a new access token and refresh token

This reduces replay risk compared with keeping the same refresh token forever.

## Authorization Model

Supported roles:

- `student`
- `organizer`
- `admin`

Current access boundaries:

- public registration exists only for students
- organizer and admin must already exist or be promoted by admin
- organizer routes are isolated from admin routes
- organizer ownership checks happen in controller logic
- admin has full management rights over users, clubs, and events
- inactive users are blocked both at login and protected-route access time

## Database Interaction Strategy

The backend uses raw SQL through the `pg` package.

Design choices:

- parameterized queries only
- no ORM
- transaction wrapper for multi-step writes
- reusable SQL helpers for event list/detail queries

Why this fits the project:

- SQL stays explicit and beginner-readable
- business rules remain visible close to the controller logic
- PostgreSQL features such as JSONB, triggers, and filtered aggregates are easy to use directly

## Response Strategy

### Success response

```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {}
}
```

### Validation response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is invalid"
    }
  ]
}
```

### Paginated response

```json
{
  "success": true,
  "message": "Events fetched successfully",
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "total_pages": 5
  }
}
```

## Security Design

Currently implemented:

- bcrypt password hashing
- hashed refresh token persistence
- JWT verification in middleware
- role-based route protection
- inactive-user blocking
- centralized error handling
- input validation
- parameterized SQL queries
- duplicate prevention via both controller logic and DB constraints

Not yet implemented:

- rate limiting
- audit logging
- password reset flow
- email verification
- MFA
- background job processing for notifications or reminders

## Extension Points

The current backend leaves room for future growth.

### Event metadata

`events.metadata` is `JSONB`, which allows incremental additions such as:

- coordinates
- weather snapshot
- external map URL
- external provider IDs
- room/building metadata

### Architectural growth paths

Reasonable future refactors:

- extract service layer modules from controllers
- add repository modules for repeated SQL patterns
- add Swagger/OpenAPI generation
- add Redis-backed rate limiting or caching
- add notification workers
- add audit tables and domain events

## Source Files

Primary files for this architecture:

- `backend/src/server.js`
- `backend/src/app.js`
- `backend/src/config/env.js`
- `backend/src/config/db.js`
- `backend/src/controllers/`
- `backend/src/routes/`
- `backend/src/middleware/`
- `backend/src/utils/`
- `backend/sql/schema.sql`
