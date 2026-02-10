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
2. Redirect to: `https://kconsole.koompi.cloud/api/provider/auth/${NEXT_PUBLIC_KOOMPI_PROVIDER_CLIENT_ID}`
3. User authenticates with KOOMPI ID
4. Callback to: `NEXT_PUBLIC_KOOMPI_PROVIDER_REDIRECT_URI`
5. Access token is passed as query parameter

## Database

This app uses SQLite with persistence at `/data/db/app.db`.
Data persists across deployments and updates.

## Stack

- **Framework**: Next.js 16 with App Router
- **Database**: SQLite (better-sqlite3)
- **Runtime**: Node.js 20
- **Deployment**: Docker (standalone output)
