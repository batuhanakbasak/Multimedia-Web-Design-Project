# University Event Management Admin Panel

This repository includes a complete admin module for a university event management project.
The backend runs on `Node.js + Express + PostgreSQL`, and the frontend admin panel is a
lightweight static interface built with plain HTML, CSS, and JavaScript.

## What Is Included

- admin authentication with JWT
- protected admin dashboard
- admin user management
- admin club management
- admin event management
- reusable frontend sidebar, topbar, table, and modal system
- Windows-safe backend scripts for syntax checking and SQL execution

## Important Runtime Rule

The backend uses a real `.env` file.
`backend/.env.example` is only a template.

Create it like this:

```bash
cd backend
copy .env.example .env
```

## Server Setup

- backend port: `3000`
- backend host: `0.0.0.0`
- public server IP: `94.55.180.77`
- default frontend API target: `http://94.55.180.77:3000/api`

The frontend is now configured to call the public server directly through
`frontend/admin/js/runtime-config.js`.

## Quick Start

1. Create `backend/.env`
2. Install backend dependencies:
   `cd backend && npm install`
3. Create the database schema:
   `npm run db:schema`
4. Optional demo data:
   `npm run db:sample`
5. Start the backend:
   `npm start`
6. Publish or serve `frontend/admin` on your server
7. Open the admin login page from the public server

Demo admin account from `sample-queries.sql`:

- Email: `admin@example.com`
- Password: `Admin12345!`

Detailed setup notes live in:

- `backend/README.md`
- `frontend/README.md`
