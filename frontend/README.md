# Frontend Admin Panel

The frontend admin panel lives under `frontend/admin` and is intentionally lightweight:
plain HTML, CSS, and JavaScript with no build step.

## Folder Structure

```text
frontend/
└── admin/
    ├── login.html
    ├── dashboard.html
    ├── users.html
    ├── clubs.html
    ├── events.html
    ├── user-detail.html
    ├── club-detail.html
    ├── event-detail.html
    ├── css/
    │   ├── admin.css
    │   └── auth.css
    ├── js/
    │   ├── api.js
    │   ├── auth.js
    │   ├── dashboard.js
    │   ├── users.js
    │   ├── clubs.js
    │   ├── events.js
    │   ├── guards.js
    │   ├── helpers.js
    │   └── runtime-config.js
    └── components/
        ├── sidebar.js
        ├── navbar.js
        └── modal.js
```

## API Connection Logic

The frontend is configured with separate local and production API targets.

Default targets:

- local development: `http://localhost:3000/api`
- production: `https://api.<your-domain>/api`

These values are defined in:

`frontend/admin/js/runtime-config.js`

## Public Server Use

### Current deployment target

- frontend public hosts: your production site origins
- backend API: `https://api.<your-domain>/api`

If the production API domain changes later, update:

```js
// frontend/admin/js/runtime-config.js
(function () {
  // localhost pages use http://localhost:3000/api
  // public pages use the matching api. subdomain
})();
```

And on the backend:

```env
CORS_ORIGIN=https://www.example.com,https://example.com
```

If you later move to a different domain, change both values together.

## Server Testing

1. Create `backend/.env` from `backend/.env.example`
2. Start backend on port `3000`
3. Make sure PostgreSQL is reachable with the values in `.env`
4. Serve `frontend/admin` from the server
5. Open the public admin page in the browser

Backend setup:

```bash
cd backend
npm install
npm run db:schema
npm run db:sample
npm run dev
```

Health check:

```text
http://localhost:3000/api/health
https://api.<your-domain>/api/health
```

Then open the frontend from the server, for example:

```text
http://localhost:3000/admin/login.html
https://www.<your-domain>/admin/login.html
```

## Login Test

Demo account from the sample SQL:

- Email: `admin@example.com`
- Password: `Admin12345!`

## Required Admin Routes

- `POST /api/admin/auth/login`
- `GET /api/admin/auth/me`
- `POST /api/admin/auth/logout`
- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `GET /api/admin/users/:id`
- `PUT /api/admin/users/:id/role`
- `PUT /api/admin/users/:id/status`
- `GET /api/admin/clubs`
- `GET /api/admin/clubs/:id`
- `POST /api/admin/clubs`
- `PUT /api/admin/clubs/:id`
- `DELETE /api/admin/clubs/:id`
- `GET /api/admin/clubs/:id/members`
- `POST /api/admin/clubs/:id/members`
- `DELETE /api/admin/clubs/:id/members/:userId`
- `GET /api/admin/events`
- `GET /api/admin/events/:id`
- `PUT /api/admin/events/:id/status`
- `DELETE /api/admin/events/:id`
