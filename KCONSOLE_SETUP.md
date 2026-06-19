# KConsole Deployment

This application is deployed via KConsole Provider OAuth.

## OAuth Configuration

The following credentials are automatically injected as environment variables at build time:

- `NEXT_PUBLIC_KOOMPI_PROVIDER_CLIENT_ID`: Your OAuth client ID
- `NEXT_PUBLIC_KOOMPI_PROVIDER_CLIENT_SECRET`: Your OAuth client secret
- `NEXT_PUBLIC_KOOMPI_PROVIDER_REDIRECT_URI`: Your callback URL

**Note:** The `NEXT_PUBLIC_` prefix is required for Next.js to expose these variables to the frontend code.

## Authentication Flow

1. User clicks "Login with KOOMPI ID"
2. Redirect to: `https://api-kconsole.koompi.cloud/api/provider/auth/${NEXT_PUBLIC_KOOMPI_PROVIDER_CLIENT_ID}`
3. User authenticates with KOOMPI ID
4. Callback to: `NEXT_PUBLIC_KOOMPI_PROVIDER_REDIRECT_URI`
5. Access token is passed as a query parameter

## Database

This app uses **Turso (libSQL)** — a serverless, edge-replicated SQLite.

Injected automatically by KConsole:

- `DATABASE_URL` — e.g. `libsql://your-db.turso.io`
- `DATABASE_AUTH_TOKEN` — Turso auth token

The schema is created automatically on first request (and via `npm run db:init`).
No persistent volume is required — data lives in Turso.

## Object Storage

Image uploads use KConsole object storage via presigned URLs:

- `KCONSOLE_STORAGE_URL`
- `KCONSOLE_STORAGE_KEY`

## Stack

- **Framework**: Next.js 16 with App Router
- **Database**: Turso / libSQL (`@libsql/client`)
- **UI**: shadcn/ui + Tailwind CSS v4
- **Runtime**: Node.js 20+
- **Deployment**: Docker (standalone output)
