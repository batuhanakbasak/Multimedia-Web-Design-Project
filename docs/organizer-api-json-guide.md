# Organizer API JSON Guide

This guide is for frontend integration of the organizer panel.

Base URL:

```text
/api/organizer
```

All organizer routes require:

```http
Authorization: Bearer <access_token>
```

## Important Response Rule

Every successful response uses this wrapper:

```json
{
  "success": true,
  "message": "...",
  "data": {},
  "meta": {}
}
```

Important:

- `GET /api/organizer/dashboard` returns `data` as an object
- `GET /api/organizer/events` returns `data` as an array
- `GET /api/organizer/dashboard` event list is in `data.upcoming_events`
- `GET /api/organizer/dashboard` also exposes the same array in `data.events`

If frontend does `response.data.map(...)` on dashboard response, it will fail with:

```text
events.map is not a function
```

Correct usage for dashboard:

```js
const response = await fetch('/api/organizer/dashboard', { headers });
const payload = await response.json();
const events = payload.data.upcoming_events;
```

## 1. Organizer Login

Endpoint:

```http
POST /api/auth/login/organizer
```

Request body:

```json
{
  "email": "organizer@example.com",
  "password": "Organizer123!"
}
```

Success response:

```json
{
  "success": true,
  "message": "Organizer login successful",
  "data": {
    "user": {
      "id": 7,
      "full_name": "Organizer One",
      "email": "organizer@example.com",
      "role": "organizer",
      "profile_image": null,
      "is_active": true,
      "last_login_at": "2026-04-05T12:00:00.000Z",
      "created_at": "2026-04-01T08:30:00.000Z",
      "updated_at": "2026-04-01T08:30:00.000Z"
    },
    "access_token": "<jwt-access-token>",
    "refresh_token": "<jwt-refresh-token>"
  }
}
```

## 2. Dashboard

Endpoint:

```http
GET /api/organizer/dashboard
```

Success response:

```json
{
  "success": true,
  "message": "Organizer dashboard fetched successfully",
  "data": {
    "total_events": 8,
    "active_events": 5,
    "completed_events": 2,
    "cancelled_events": 1,
    "total_participants": 126,
    "upcoming_events": [
      {
        "id": 11,
        "title": "AI Workshop",
        "category": "Technology",
        "event_date": "2026-05-10T14:00:00.000Z",
        "location": "Engineering Hall",
        "quota": 100,
        "status": "active"
      }
    ],
    "events": [
      {
        "id": 11,
        "title": "AI Workshop",
        "category": "Technology",
        "event_date": "2026-05-10T14:00:00.000Z",
        "location": "Engineering Hall",
        "quota": 100,
        "status": "active"
      }
    ]
  }
}
```

Frontend mapping:

```js
const stats = payload.data;
const events = payload.data.upcoming_events;
```

## 3. Organizer Event List

Endpoint:

```http
GET /api/organizer/events?page=1&limit=10&sort=upcoming
```

Supported query params:

```text
search, keyword, category, date, status, sort, club_id, page, limit
```

Success response:

```json
{
  "success": true,
  "message": "Organizer events fetched successfully",
  "data": [
    {
      "id": 11,
      "club_id": 3,
      "organizer_id": 7,
      "title": "AI Workshop",
      "description": "Intro to AI and machine learning.",
      "category": "Technology",
      "event_date": "2026-05-10T14:00:00.000Z",
      "location": "Engineering Hall",
      "image_url": "https://example.com/ai.jpg",
      "quota": 100,
      "status": "active",
      "metadata": {
        "map_link": "https://maps.example.com/engineering-hall"
      },
      "created_at": "2026-04-05T12:00:00.000Z",
      "updated_at": "2026-04-05T12:00:00.000Z",
      "joined_count": 32,
      "organizer": {
        "id": 7,
        "full_name": "Organizer One",
        "email": "organizer@example.com",
        "profile_image": null
      },
      "club": {
        "id": 3,
        "name": "Robotics Club",
        "logo_url": "https://example.com/robotics.png",
        "is_active": true
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "total_pages": 1
  }
}
```

Frontend mapping:

```js
const events = payload.data;
const pagination = payload.meta;
```

## 4. Organizer Event Detail

Endpoint:

```http
GET /api/organizer/events/:id
```

Success response:

```json
{
  "success": true,
  "message": "Organizer event detail fetched successfully",
  "data": {
    "id": 11,
    "club_id": 3,
    "organizer_id": 7,
    "title": "AI Workshop",
    "description": "Intro to AI and machine learning.",
    "category": "Technology",
    "event_date": "2026-05-10T14:00:00.000Z",
    "location": "Engineering Hall",
    "image_url": "https://example.com/ai.jpg",
    "quota": 100,
    "status": "active",
    "metadata": {
      "map_link": "https://maps.example.com/engineering-hall"
    },
    "created_at": "2026-04-05T12:00:00.000Z",
    "updated_at": "2026-04-05T12:00:00.000Z",
    "joined_count": 32,
    "is_favorite": false,
    "is_joined": false,
    "organizer": {
      "id": 7,
      "full_name": "Organizer One",
      "email": "organizer@example.com",
      "profile_image": null
    },
    "club": {
      "id": 3,
      "name": "Robotics Club",
      "description": "Club for robotics enthusiasts",
      "logo_url": "https://example.com/robotics.png",
      "is_active": true
    }
  }
}
```

## 5. Create Event

Endpoint:

```http
POST /api/organizer/events
```

Request body:

```json
{
  "club_id": 3,
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

Success response:

```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "id": 11,
    "title": "AI Workshop"
  }
}
```

Note:

- actual response contains full event detail object
- `club_id` can be `null`
- `metadata` is optional

## 6. Update Event

Endpoint:

```http
PUT /api/organizer/events/:id
```

Request body example:

```json
{
  "title": "AI Workshop Updated",
  "quota": 120,
  "status": "active"
}
```

## 7. Cancel Event

Endpoint:

```http
DELETE /api/organizer/events/:id
```

Success response:

```json
{
  "success": true,
  "message": "Event cancelled successfully",
  "data": {
    "event_id": 11,
    "status": "cancelled"
  }
}
```

## 8. Event Participants

Endpoint:

```http
GET /api/organizer/events/:id/participants
```

Success response:

```json
{
  "success": true,
  "message": "Event participants fetched successfully",
  "data": [
    {
      "id": 21,
      "full_name": "Student One",
      "email": "student1@example.com",
      "profile_image": null,
      "status": "joined",
      "joined_at": "2026-04-05T13:00:00.000Z"
    }
  ]
}
```

## 9. Remove Event Participant

Endpoint:

```http
DELETE /api/organizer/events/:id/participants/:userId
```

Behavior:

- organizer can remove only participants from their own event
- removal is soft-delete style
- backend sets participant status to `cancelled`

Success response:

```json
{
  "success": true,
  "message": "Event participant removed successfully",
  "data": {
    "id": 81,
    "event_id": 11,
    "user_id": 21,
    "status": "cancelled",
    "joined_count": 31
  }
}
```

## 10. Organizer Profile

Endpoint:

```http
GET /api/organizer/profile
```

Success response:

```json
{
  "success": true,
  "message": "Organizer profile fetched successfully",
  "data": {
    "id": 7,
    "full_name": "Organizer One",
    "email": "organizer@example.com",
    "role": "organizer",
    "profile_image": null,
    "is_active": true,
    "last_login_at": "2026-04-05T12:00:00.000Z",
    "created_at": "2026-04-01T08:30:00.000Z",
    "updated_at": "2026-04-01T08:30:00.000Z"
  }
}
```

## 11. Update Organizer Profile

Endpoint:

```http
PUT /api/organizer/profile
```

Request body:

```json
{
  "full_name": "Organizer One Updated",
  "profile_image": "https://example.com/organizer.jpg"
}
```

## 12. Change Organizer Password

Endpoint:

```http
PUT /api/organizer/profile/password
```

Request body:

```json
{
  "current_password": "Organizer123!",
  "new_password": "NewPassword123!"
}
```

Success response:

```json
{
  "success": true,
  "message": "Organizer password updated successfully",
  "data": {
    "password_changed": true
  }
}
```

## 13. Organizer Clubs

Endpoint:

```http
GET /api/organizer/clubs
```

Success response:

```json
{
  "success": true,
  "message": "Organizer clubs fetched successfully",
  "data": [
    {
      "id": 3,
      "name": "Robotics Club",
      "description": "Club for robotics enthusiasts",
      "logo_url": "https://example.com/robotics.png",
      "is_active": true,
      "member_role": "manager",
      "joined_at": "2026-04-02T09:00:00.000Z"
    }
  ]
}
```

## 14. Organizer Club Members

Endpoint:

```http
GET /api/organizer/clubs/:id/members
```

Important:

- current organizer must already be a `manager` of that club

Success response:

```json
{
  "success": true,
  "message": "Organizer club members fetched successfully",
  "data": [
    {
      "id": 7,
      "full_name": "Organizer One",
      "email": "organizer@example.com",
      "role": "organizer",
      "profile_image": null,
      "is_active": true,
      "member_role": "manager",
      "joined_at": "2026-04-02T09:00:00.000Z"
    },
    {
      "id": 12,
      "full_name": "Student Two",
      "email": "student2@example.com",
      "role": "student",
      "profile_image": null,
      "is_active": true,
      "member_role": "member",
      "joined_at": "2026-04-03T10:00:00.000Z"
    }
  ]
}
```

## 15. Add Member Or Promote To Manager

Endpoint:

```http
POST /api/organizer/clubs/:id/members
```

Request body:

```json
{
  "user_id": 12,
  "member_role": "manager"
}
```

Behavior:

- if the user is not in the club yet, membership is created
- if the user is already in the club, role is updated
- use `member_role: "member"` to keep user as normal member
- use `member_role: "manager"` to promote or keep as manager

Success response:

```json
{
  "success": true,
  "message": "Organizer club member saved successfully",
  "data": {
    "id": 44,
    "user_id": 12,
    "club_id": 3,
    "member_role": "manager",
    "joined_at": "2026-04-03T10:00:00.000Z"
  }
}
```

## 16. Remove Member From Club

Endpoint:

```http
DELETE /api/organizer/clubs/:id/members/:userId
```

Success response:

```json
{
  "success": true,
  "message": "Organizer club member removed successfully",
  "data": {
    "id": 44,
    "club_id": 3,
    "user_id": 12
  }
}
```

Important management rule:

- backend does not allow the last remaining manager to be removed
- backend also does not allow the last remaining manager to be downgraded to `member`

## Common Frontend Mistakes

Wrong:

```js
const events = payload.data;
events.map(...)
```

This is only correct for:

- `GET /api/organizer/events`
- `GET /api/organizer/events/:id/participants`
- `GET /api/organizer/clubs`

For dashboard, correct usage is:

```js
const stats = payload.data;
const events = payload.data.upcoming_events;
events.map(...)
```
