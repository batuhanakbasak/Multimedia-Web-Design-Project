# API Endpoints

## Overview

Base path:

```text
/api
```

Protected routes use:

```http
Authorization: Bearer <access_token>
```

Standard success response:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

Standard validation error response:

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

## System

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | Public | Health check endpoint. |

## Auth

| Method | Endpoint | Auth | Expected Account | Description |
|---|---|---|---|---|
| POST | `/api/auth/register/student` | Public | Student | Register a new student account. |
| POST | `/api/auth/login/student` | Public | Student | Log in as student. |
| POST | `/api/auth/login/organizer` | Public | Organizer | Log in as organizer. |
| POST | `/api/auth/login/admin` | Public | Admin | Log in as admin. |
| POST | `/api/auth/refresh` | Public | Any | Rotate refresh session and issue new tokens. |
| POST | `/api/auth/logout` | Public | Any | Revoke one refresh session by refresh token. |
| POST | `/api/auth/logout-all` | Bearer token | Authenticated | Revoke all active sessions for current user. |
| GET | `/api/auth/me` | Bearer token | Authenticated | Return current authenticated user. |

### Register Student Body

```json
{
  "full_name": "Student One",
  "email": "student1@example.com",
  "password": "12345678"
}
```

### Login Body

```json
{
  "email": "student1@example.com",
  "password": "12345678"
}
```

### Refresh / Logout Body

```json
{
  "refresh_token": "<refresh_token>"
}
```

### Login Success Shape

```json
{
  "success": true,
  "message": "Student login successful",
  "data": {
    "user": {
      "id": 1,
      "full_name": "Student One",
      "email": "student1@example.com",
      "role": "student",
      "profile_image": null,
      "is_active": true
    },
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

## Public Events

Supported query params for `GET /api/events` and `GET /api/events/search`:

```text
search, keyword, category, date, status, sort, organizer_id, club_id, page, limit
```

Supported `sort` values:

```text
newest, oldest, upcoming
```

Default behavior:

- if `status` is omitted, only `active` events are returned
- if `status` is omitted, past events are also excluded

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/events` | Public | List events with filter and pagination support. |
| GET | `/api/events/search` | Public | Search/filter events with the same query model. |
| GET | `/api/events/:id` | Optional Bearer token | Get event detail. Returns `is_favorite` and `is_joined` when user token is provided. |

### Example Query

```http
GET /api/events/search?keyword=robot&category=Technology&date=2026-05-05&sort=upcoming&page=1&limit=12
```

## Public Clubs

Supported query params for `GET /api/clubs/:id/events`:

```text
search, keyword, category, date, status, sort, organizer_id, club_id, page, limit
```

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/clubs` | Public | List active clubs. |
| GET | `/api/clubs/:id` | Public | Get active club detail with managers and upcoming events. |
| GET | `/api/clubs/:id/members` | Public | List members of an active club. |
| GET | `/api/clubs/:id/events` | Public | List events belonging to an active club. |

## Student Routes

All student routes require a bearer token from an account with `role = student`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/student/dashboard` | Get student dashboard summary. |
| GET | `/api/student/events` | List events for students with filter and pagination support. |
| GET | `/api/student/events/search` | Search events for students. |
| GET | `/api/student/events/:id` | Get event detail with student-specific flags. |
| POST | `/api/student/events/:id/join` | Join an event. |
| DELETE | `/api/student/events/:id/leave` | Leave an event. |
| GET | `/api/student/my-events` | List joined events for current student. Supports `page` and `limit`. |
| GET | `/api/student/favorites` | List favorite events. |
| POST | `/api/student/favorites/:eventId` | Add event to favorites. |
| DELETE | `/api/student/favorites/:eventId` | Remove event from favorites. |
| GET | `/api/student/profile` | Get student profile. |
| PUT | `/api/student/profile` | Update student profile. |
| GET | `/api/student/clubs` | List active clubs through the student area. |
| GET | `/api/student/clubs/:id` | Get active club detail through the student area. |

### Student Event Query Params

```text
search, keyword, category, date, status, sort, organizer_id, club_id, page, limit
```

### Student Profile Update Body

```json
{
  "full_name": "Student One Updated",
  "profile_image": "https://example.com/profile.jpg"
}
```

### Join Event Success Shape

```json
{
  "success": true,
  "message": "Event joined successfully",
  "data": {
    "id": 10,
    "title": "AI Workshop",
    "joined_count": 21,
    "is_joined": true,
    "is_favorite": false
  }
}
```

## Organizer Routes

All organizer routes require a bearer token from an account with `role = organizer`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/organizer/dashboard` | Get organizer dashboard summary. |
| GET | `/api/organizer/events` | List organizer-owned events with filter and pagination support. |
| POST | `/api/organizer/events` | Create an event owned by the organizer. |
| PUT | `/api/organizer/events/:id` | Update an organizer-owned event. |
| DELETE | `/api/organizer/events/:id` | Soft-cancel an organizer-owned event. |
| GET | `/api/organizer/events/:id/participants` | List active participants of an organizer-owned event. |
| GET | `/api/organizer/profile` | Get organizer profile. |
| PUT | `/api/organizer/profile` | Update organizer profile. |
| GET | `/api/organizer/clubs` | List organizer club memberships. |

### Organizer Event Query Params

```text
search, keyword, category, date, status, sort, organizer_id, club_id, page, limit
```

### Organizer Create Event Body

```json
{
  "club_id": null,
  "title": "AI Workshop",
  "description": "Intro to AI and machine learning.",
  "category": "Technology",
  "event_date": "2026-05-10T14:00:00.000Z",
  "location": "Engineering Hall",
  "image_url": "https://example.com/ai.jpg",
  "quota": 100,
  "metadata": {
    "map_link": "https://maps.example.com/engineering-hall"
  }
}
```

### Organizer Update Event Body

```json
{
  "title": "AI Workshop Updated",
  "quota": 120,
  "status": "active"
}
```

### Organizer Profile Update Body

```json
{
  "full_name": "Organizer One Updated",
  "profile_image": "https://example.com/organizer.jpg"
}
```

## Admin Routes

All admin routes require a bearer token from an account with `role = admin`.

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/dashboard` | Get admin dashboard summary. |

### User Management

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/users` | List users with filter and pagination support. |
| GET | `/api/admin/users/:id` | Get user detail with club memberships and counters. |
| PUT | `/api/admin/users/:id/role` | Update user role. |
| PUT | `/api/admin/users/:id/status` | Activate or deactivate user. |

Supported user query params:

```text
search, role, is_active, page, limit
```

#### Update Role Body

```json
{
  "role": "organizer"
}
```

#### Update Status Body

```json
{
  "is_active": false
}
```

### Club Management

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/clubs` | List clubs with pagination support. |
| POST | `/api/admin/clubs` | Create club. |
| PUT | `/api/admin/clubs/:id` | Update club. |
| DELETE | `/api/admin/clubs/:id` | Delete club. |
| GET | `/api/admin/clubs/:id/members` | List club members. |
| POST | `/api/admin/clubs/:id/members` | Add or update club member. |
| DELETE | `/api/admin/clubs/:id/members/:userId` | Remove club member. |

#### Create Club Body

```json
{
  "name": "Robotics Club",
  "description": "Club for robotics enthusiasts",
  "logo_url": "https://example.com/robotics.png",
  "created_by": 5
}
```

Note:

- `created_by` is optional
- if omitted, the authenticated admin becomes the club creator

#### Update Club Body

```json
{
  "description": "Updated club description",
  "is_active": true
}
```

#### Add Club Member Body

```json
{
  "user_id": 7,
  "member_role": "manager"
}
```

### Global Event Management

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/events` | List all events with filter and pagination support. |
| GET | `/api/admin/events/:id` | Get full event detail. |
| DELETE | `/api/admin/events/:id` | Hard-delete event. |

Supported admin event query params:

```text
search, keyword, category, date, status, sort, organizer_id, club_id, page, limit
```

## Alias Routes

These routes expose the same student participation/favorite behavior through separate route groups.

## Participants Alias

All routes require a bearer token from an account with `role = student`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/participants/joined` | List joined events. Supports `page` and `limit`. |
| POST | `/api/participants/events/:eventId/join` | Join an event. |
| DELETE | `/api/participants/events/:eventId/leave` | Leave an event. |

## Favorites Alias

All routes require a bearer token from an account with `role = student`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/favorites` | List favorite events. |
| POST | `/api/favorites/:eventId` | Add favorite. |
| DELETE | `/api/favorites/:eventId` | Remove favorite. |

## Validation Notes

Current validation rules include:

- `register/student` validates `full_name`, `email`, and minimum password length
- login routes validate `email` and `password`
- refresh/logout validate `refresh_token`
- event create/update validates `event_date`, `quota`, URL fields, and allowed status values
- club routes validate positive IDs and allowed member roles
- profile update requires at least one allowed field
- pagination validates `page >= 1` and `1 <= limit <= 100`

## Common Failure Cases

Examples you should expect while testing:

- `401 Unauthorized` for missing or invalid bearer token
- `403 Forbidden` for wrong role or inactive user
- `404 Not Found` for missing event, club, user, or favorite membership
- `409 Conflict` for duplicate email, duplicate favorite, duplicate join, or full quota
- `400 Bad Request` for invalid validation payloads or joining non-active/past events

## Source of Truth

Route definitions live in:

- `backend/src/app.js`
- `backend/src/routes/auth.routes.js`
- `backend/src/routes/student.routes.js`
- `backend/src/routes/organizer.routes.js`
- `backend/src/routes/admin.routes.js`
- `backend/src/routes/clubs.routes.js`
- `backend/src/routes/events.routes.js`
- `backend/src/routes/participants.routes.js`
- `backend/src/routes/favorites.routes.js`
