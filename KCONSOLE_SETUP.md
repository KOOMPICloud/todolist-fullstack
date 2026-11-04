# Deployed on KOOMPI Cloud

People sign in to this app with their KOOMPI ID, through KOOMPI Cloud.

## OAuth Configuration

The following credentials are automatically injected as environment variables at build time:

- `NEXT_PUBLIC_KOOMPI_PROVIDER_CLIENT_ID`: Your OAuth client ID
- `KOOMPI_PROVIDER_CLIENT_SECRET`: Your OAuth client secret (server only: it swaps the sign-in code for the tokens)
- `NEXT_PUBLIC_KOOMPI_PROVIDER_REDIRECT_URI`: Your callback URL

**Note:** The `NEXT_PUBLIC_` prefix is what lets Next.js give a variable to the browser. The client secret has none: only the app's server reads it.

## Authentication Flow

1. User clicks "Login with KOOMPI ID" (a popup; in the same tab where popups are blocked)
2. The app opens: `${NEXT_PUBLIC_KOOMPI_API_BASE_URL}/api/provider/auth/${NEXT_PUBLIC_KOOMPI_PROVIDER_CLIENT_ID}?state=...&response_type=code`
3. User authenticates with KOOMPI ID
4. Callback to: `NEXT_PUBLIC_KOOMPI_PROVIDER_REDIRECT_URI` with a one-time code and the app's own state, never the tokens
5. The app's server swaps the code (within 2 minutes, once) at `POST ${NEXT_PUBLIC_KOOMPI_API_BASE_URL}/api/provider/token` with its client secret, and checks the token with KOOMPI ID

## Database

This app uses **Turso (libSQL)** — a serverless, edge-replicated SQLite.

Injected automatically by KOOMPI Cloud:

- `DATABASE_URL` — e.g. `libsql://your-db.turso.io`
- `DATABASE_AUTH_TOKEN` — Turso auth token

The schema is created automatically on first request (and via `npm run db:init`).
No persistent volume is required — data lives in Turso.

## Object Storage

Image uploads use KOOMPI Cloud object storage via presigned URLs:

- `KCONSOLE_STORAGE_URL`
- `KCONSOLE_STORAGE_KEY`

## Stack

- **Framework**: Next.js 16 with App Router
- **Database**: Turso / libSQL (`@libsql/client`)
- **UI**: shadcn/ui + Tailwind CSS v4
- **Runtime**: Node.js 20+
- **Deployment**: Docker (standalone output)
