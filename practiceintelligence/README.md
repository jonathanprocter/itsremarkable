# Howremarkable Calendar Application

This project provides a calendar and note management system. OAuth authentication with Google allows syncing events.

## Setup

1. Copy `.env.example` to `.env` and fill in the required values.
2. Ensure your Google Cloud OAuth credentials match the `BASE_URL` used by the server.
3. Run `npm install` and then `npm start` to launch the application.

## OAuth configuration

The server expects the following environment variables:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_ACCESS_TOKEN` *(optional for initial tokens)*
- `GOOGLE_REFRESH_TOKEN` *(optional for initial tokens)*
- `SESSION_SECRET`
- `DATABASE_URL`
- `BASE_URL` *(e.g. `https://your-app.example.com`)*

When running in Replit, `BASE_URL` may be automatically derived from `REPLIT_DEV_DOMAIN` or `REPLIT_DOMAINS`.

## Development

Use `npm run dev` to run the server with Vite in development mode. Production
builds run from `dist/`.
