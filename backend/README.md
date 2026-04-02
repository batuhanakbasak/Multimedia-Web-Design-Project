# University Event Management Backend

A production-friendly Node.js backend for a university event platform. It supports student registration, role-based login, JWT authentication with refresh-token sessions, event discovery, event participation, favorites, organizer event management, and admin-level user/club/system operations.

## Final Folder Structure

```text
backend/
├── .env
├── .env.example
├── .gitignore
├── package.json
├── README.md
├── sql/
│   ├── sample-queries.sql
│   └── schema.sql
└── src/
    ├── app.js
    ├── server.js
    ├── config/
    │   └── db.js
    ├── controllers/
    │   ├── admin.controller.js
    │   ├── auth.controller.js
    │   ├── clubs.controller.js
    │   ├── events.controller.js
    │   ├── favorites.controller.js
    │   ├── organizer.controller.js
    │   ├── participants.controller.js
    │   └── student.controller.js
    ├── middleware/
    │   ├── auth.middleware.js
    │   ├── error.middleware.js
    │   └── role.middleware.js
    ├── routes/
    │   ├── admin.routes.js
    │   ├── auth.routes.js
    │   ├── clubs.routes.js
    │   ├── events.routes.js
    │   ├── favorites.routes.js
    │   ├── organizer.routes.js
    │   ├── participants.routes.js
    │   └── student.routes.js
    └── utils/
        ├── async-handler.js
        ├── errors.js
        ├── event-query.js
        ├── helpers.js
        ├── jwt.js
        ├── response.js
        └── validators.js
```

## Features

- JWT access token + refresh token flow
- Refresh sessions stored hashed in `auth_sessions`
- Role-based authorization: `student`, `organizer`, `admin`
- Student self-registration
- Organizer and admin login endpoints
- Public/shared event list and search endpoints
- Student join/leave and favorites flows
- Organizer-only event ownership checks
- Admin user, club, and global event management
- Validation with `express-validator`
- Parameterized PostgreSQL queries with `pg`
- Centralized error handling middleware
- Extendable `events.metadata` JSONB field for future map/weather integrations

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- pg
- bcrypt
- jsonwebtoken
- dotenv
- express-validator
- cors

## Environment Variables

Use `backend/.env.example` as the base.

```env
PORT=5000
HOST=0.0.0.0
NODE_ENV=development
DATABASE_URL=postgres://postgres:password@localhost:5432/university_events
DB_HOST=192.168.0.20
DB_PORT=5432
DB_NAME=university_events
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_SSL=false
JWT_ACCESS_SECRET=change_this_access_secret
JWT_REFRESH_SECRET=change_this_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
CORS_ORIGIN=http://localhost:3000
```

Notes:
- If `DATABASE_URL` is set, it takes priority.
- If `DATABASE_URL` is empty, the backend uses `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`.

## Installation

```bash
cd backend
npm install
```

## Database Setup

1. Create PostgreSQL database:

```sql
CREATE DATABASE university_events;
```

2. Apply the schema:

```bash
cd backend
npm run db:schema
```

3. Optional: inspect helper SQL queries:

```bash
cd backend
npm run db:sample
```

Files:
- Schema: `backend/sql/schema.sql`
- Sample queries: `backend/sql/sample-queries.sql`

## How to Run

Development:

```bash
cd backend
npm run dev
```

Production-like start:

```bash
cd backend
npm start
```

Health check:

```http
GET /api/health
```

## Auth Flow Summary

### 1. Student registration
`POST /api/auth/register/student`

- Creates a `student` user only
- Hashes password with bcrypt
- Normalizes email to lowercase
- Rejects duplicate email

### 2. Login
`POST /api/auth/login/student`
`POST /api/auth/login/organizer`
`POST /api/auth/login/admin`

- Checks email + password
- Checks exact role for the selected endpoint
- Rejects inactive users
- Updates `last_login_at`
- Returns:
  - `access_token`
  - `refresh_token`
  - `user`

### 3. Refresh token
`POST /api/auth/refresh`

- Verifies refresh token signature
- Finds session by hashed token in `auth_sessions`
- Rejects revoked/expired sessions
- Rotates refresh token by revoking the old session and creating a new one

### 4. Logout
`POST /api/auth/logout`

- Accepts current `refresh_token`
- Revokes matching refresh session

### 5. Logout all devices
`POST /api/auth/logout-all`

- Requires access token
- Revokes every non-revoked session for the current user

### Token internals

Implementation files:
- Token helpers: `backend/src/utils/jwt.js`
- Session logic: `backend/src/controllers/auth.controller.js`

Notes:
- Passwords use bcrypt
- Refresh tokens are not stored as plain text
- Refresh tokens are hashed with SHA-256 before storage
- Access tokens are validated in `auth.middleware.js`

## Business Rules Implemented

- Public registration is student-only
- Organizer/admin login endpoints only accept matching roles
- Inactive users cannot log in or use protected endpoints
- Organizer can only manage own events
- Organizer can only create/update a club event when they are a club manager
- Students cannot join cancelled or completed events
- Students cannot join past events
- Duplicate joins are blocked
- Duplicate favorites are blocked
- Event quota is enforced when `quota > 0`
- `quota = 0` is treated as unlimited capacity
- Organizer delete is implemented as soft cancel
- Admin delete for events/clubs is implemented as hard delete

## Main API Groups

### Auth
- `POST /api/auth/register/student`
- `POST /api/auth/login/student`
- `POST /api/auth/login/organizer`
- `POST /api/auth/login/admin`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/logout-all`
- `GET /api/auth/me`

### Student
- `GET /api/student/dashboard`
- `GET /api/student/events`
- `GET /api/student/events/search`
- `GET /api/student/events/:id`
- `POST /api/student/events/:id/join`
- `DELETE /api/student/events/:id/leave`
- `GET /api/student/my-events`
- `GET /api/student/favorites`
- `POST /api/student/favorites/:eventId`
- `DELETE /api/student/favorites/:eventId`
- `GET /api/student/profile`
- `PUT /api/student/profile`
- `GET /api/student/clubs`
- `GET /api/student/clubs/:id`

### Organizer
- `GET /api/organizer/dashboard`
- `GET /api/organizer/events`
- `POST /api/organizer/events`
- `PUT /api/organizer/events/:id`
- `DELETE /api/organizer/events/:id`
- `GET /api/organizer/events/:id/participants`
- `GET /api/organizer/profile`
- `PUT /api/organizer/profile`
- `GET /api/organizer/clubs`

### Admin
- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `GET /api/admin/users/:id`
- `PUT /api/admin/users/:id/role`
- `PUT /api/admin/users/:id/status`
- `GET /api/admin/clubs`
- `POST /api/admin/clubs`
- `PUT /api/admin/clubs/:id`
- `DELETE /api/admin/clubs/:id`
- `GET /api/admin/clubs/:id/members`
- `POST /api/admin/clubs/:id/members`
- `DELETE /api/admin/clubs/:id/members/:userId`
- `GET /api/admin/events`
- `GET /api/admin/events/:id`
- `DELETE /api/admin/events/:id`

### Public/Shared
- `GET /api/events`
- `GET /api/events/search`
- `GET /api/events/:id`
- `GET /api/clubs`
- `GET /api/clubs/:id`
- `GET /api/clubs/:id/members`
- `GET /api/clubs/:id/events`

### Generic aliases for frontend convenience
- `GET /api/participants/joined`
- `POST /api/participants/events/:eventId/join`
- `DELETE /api/participants/events/:eventId/leave`
- `GET /api/favorites`
- `POST /api/favorites/:eventId`
- `DELETE /api/favorites/:eventId`

## Example Requests and Responses

### 1. Register student

```http
POST /api/auth/register/student
Content-Type: application/json

{
  "full_name": "Batuhan Akbasak",
  "email": "batuhan@example.com",
  "password": "12345678"
}
```

```json
{
  "success": true,
  "message": "Student registered successfully",
  "data": {
    "user": {
      "id": 1,
      "full_name": "Batuhan Akbasak",
      "email": "batuhan@example.com",
      "role": "student",
      "profile_image": null,
      "is_active": true,
      "last_login_at": null,
      "created_at": "2026-04-02T10:00:00.000Z",
      "updated_at": "2026-04-02T10:00:00.000Z"
    }
  }
}
```

### 2. Student login

```http
POST /api/auth/login/student
Content-Type: application/json

{
  "email": "batuhan@example.com",
  "password": "12345678"
}
```

```json
{
  "success": true,
  "message": "Student login successful",
  "data": {
    "user": {
      "id": 1,
      "full_name": "Batuhan Akbasak",
      "email": "batuhan@example.com",
      "role": "student",
      "profile_image": null,
      "is_active": true,
      "last_login_at": "2026-04-02T10:15:00.000Z",
      "created_at": "2026-04-02T10:00:00.000Z",
      "updated_at": "2026-04-02T10:15:00.000Z"
    },
    "access_token": "<jwt-access-token>",
    "refresh_token": "<jwt-refresh-token>"
  }
}
```

### 3. Create organizer event

```http
POST /api/organizer/events
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "club_id": 3,
  "title": "AI Workshop",
  "description": "Intro to AI and machine learning concepts.",
  "category": "Technology",
  "event_date": "2026-05-10T14:00:00.000Z",
  "location": "Engineering Hall",
  "image_url": "https://example.com/ai-workshop.jpg",
  "quota": 100,
  "metadata": {
    "map_link": "https://maps.example.com/location/engineering-hall"
  }
}
```

### 4. Search events

```http
GET /api/events/search?keyword=robot&category=Technology&sort=upcoming&page=1&limit=12
```

### 5. Join event

```http
POST /api/student/events/7/join
Authorization: Bearer <access_token>
```

### 6. Validation error example

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

### 7. Generic error example

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

## SQL Schema

The full schema is stored in:
- `backend/sql/schema.sql`

Highlights:
- `users` stores every account
- `clubs` stores club metadata
- `club_members` handles member/manager relations
- `events` supports both club events and organizer-personal events
- `event_participants` handles join/leave state
- `favorites` stores saved events
- `auth_sessions` stores hashed refresh sessions
- `events.metadata` is a JSONB extension point for future integrations

## Testing Notes

### Syntax checks
Run:

```bash
cd backend
npm run check
```

### Manual test checklist

1. Register a student account.
2. Log in through `/api/auth/login/student`.
3. Call `/api/auth/me` with the access token.
4. Refresh the session with `/api/auth/refresh`.
5. Promote a user to organizer through admin route or SQL.
6. Create a club and add a manager.
7. Create an organizer event with and without `club_id`.
8. Join an event as a student.
9. Try joining the same event twice and verify `409`.
10. Add/remove favorites and verify uniqueness.
11. Deactivate a user and verify protected access is blocked.
12. Verify organizer cannot update another organizer's event.
13. Verify admin can delete any event.

### Suggested Postman / Insomnia sequence

1. Register student
2. Student login
3. Auth me
4. Public event search
5. Student join event
6. Student favorites add/remove
7. Organizer login
8. Organizer create/update/cancel event
9. Admin login
10. Admin user/club/event management

## Notes for Future Extensions

- `events.metadata` can store coordinates, weather snapshots, map links, or third-party IDs.
- External integration code can be added later without breaking the current API shape.
- If you want stricter architecture separation later, service and repository layers can be extracted from controllers without changing the route contract.
