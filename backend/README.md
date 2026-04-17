# Backend Admin Module

This backend powers the admin panel for the university event management project. The existing
student, organizer, and public APIs remain available, but the admin area is now split into clear
modules for authentication, dashboard data, users, clubs, and events.

## Folder Structure

```text
backend/
├── .env.example
├── package.json
├── README.md
├── scripts/
│   ├── check-syntax.js
│   └── run-sql.js
├── sql/
│   ├── sample-queries.sql
│   └── schema.sql
└── src/
    ├── app.js
    ├── server.js
    ├── config/
    ├── controllers/
    │   ├── adminAuth.controller.js
    │   ├── adminDashboard.controller.js
    │   ├── adminUsers.controller.js
    │   ├── adminClubs.controller.js
    │   └── adminEvents.controller.js
    ├── middleware/
    ├── routes/
    │   └── admin.routes.js
    ├── services/
    │   ├── adminDashboard.service.js
    │   ├── adminUsers.service.js
    │   ├── adminClubs.service.js
    │   └── adminEvents.service.js
    └── utils/
```

## Backend Stack

- Node.js
- Express.js
- PostgreSQL
- pg
- bcrypt
- jsonwebtoken
- dotenv
- express-validator
- cors

## Required `.env`

The backend does not run from `.env.example` directly. Create a real `.env` file first.

```bash
cd backend
copy .env.example .env
```

Then edit `.env` with your real values.

Current server-oriented example:

```env
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
DATABASE_URL=
DB_HOST=/var/run/postgresql
DB_PORT=5432
DB_NAME=campus_events_db
DB_USER=iot-server
DB_PASSWORD=
DB_SSL=false
JWT_ACCESS_SECRET=change_this_access_secret
JWT_REFRESH_SECRET=change_this_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
CORS_ORIGIN=https://www.example.com,https://example.com
CORS_ALLOW_NULL_ORIGIN=false
```

## CORS Rule

`CORS_ORIGIN` must contain every public frontend origin that will open the admin or
organizer panel.

Examples:

- Frontend served from the main site:
  `CORS_ORIGIN=https://www.example.com`
- Frontend served from the apex domain:
  `CORS_ORIGIN=https://example.com`
- Multiple allowed frontend origins:
  `CORS_ORIGIN=https://www.example.com,https://example.com`

If your frontend is served from a different port, include that exact origin with the port number.

## Install and Run

```bash
cd backend
npm install
npm run db:schema
npm run db:sample
npm start
```

Useful scripts:

- `npm run dev`: start with nodemon
- `npm start`: start with node
- `npm run check`: syntax-check every backend and helper script file
- `npm run db:schema`: execute `sql/schema.sql`
- `npm run db:sample`: execute `sql/sample-queries.sql`

## Admin API Surface

### Auth

- `POST /api/admin/auth/login`
- `GET /api/admin/auth/me`
- `POST /api/admin/auth/logout`

Login rules:

- account must exist
- `role` must be `admin`
- `is_active` must be `true`
- password must match the bcrypt hash

Login response shape:

```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "token": "jwt-token",
    "admin": {
      "id": 1,
      "full_name": "System Admin",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

### Dashboard

- `GET /api/admin/dashboard`

Returns:

- total users
- total students
- total organizers
- total clubs
- total events
- total active events
- total cancelled events
- total completed events
- latest registered users
- latest created events

### Users

- `GET /api/admin/users`
- `GET /api/admin/users/:id`
- `PUT /api/admin/users/:id/role`
- `PUT /api/admin/users/:id/status`

Supported list filters:

- `search`
- `role`
- `is_active`
- `page`
- `limit`

Safety rules:

- an admin cannot remove their own admin role
- an admin cannot deactivate their own account
- the system always keeps at least one active admin
- role changes and deactivation revoke active `auth_sessions`

### Clubs

- `GET /api/admin/clubs`
- `GET /api/admin/clubs/:id`
- `POST /api/admin/clubs`
- `PUT /api/admin/clubs/:id`
- `DELETE /api/admin/clubs/:id`
- `GET /api/admin/clubs/:id/members`
- `POST /api/admin/clubs/:id/members`
- `DELETE /api/admin/clubs/:id/members/:userId`

### Events

- `GET /api/admin/events`
- `GET /api/admin/events/:id`
- `PUT /api/admin/events/:id/status`
- `DELETE /api/admin/events/:id`

## Frontend Connection Logic

The frontend now resolves the API like this:

- local development on `localhost`: `http://localhost:3000/api`
- production hosts: `https://api.<your-domain>/api`

Those defaults live in:

- `frontend/admin/js/runtime-config.js`

If the production API or frontend domain changes later, update that file group and make sure
`CORS_ORIGIN` matches the real frontend origin.

## Server Test Flow

1. Copy `backend/.env.example` to `backend/.env`
2. Fill in `DATABASE_URL` or `DB_PASSWORD`
3. Run:
   `npm install`
4. Create tables:
   `npm run db:schema`
5. Optional demo data:
   `npm run db:sample`
6. Start backend:
   `npm run dev`
7. Confirm the API is reachable:
   `http://localhost:3000/api/health`
8. Confirm the public API is reachable:
   `https://api.<your-domain>/api/health`
9. Serve the frontend from your public site host
9. Open the admin panel in the browser and log in

## Demo Seed

`sql/sample-queries.sql` inserts a ready-to-test dataset including:

- 2 active admins
- 3 students
- 2 organizers
- 2 clubs
- active, cancelled, and completed events

Demo login:

- Email: `admin@example.com`
- Password: `Admin12345!`
