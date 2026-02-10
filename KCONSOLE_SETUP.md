# KConsole Deployment

This application is deployed via KConsole Provider OAuth.

## OAuth Configuration

The following credentials are automatically injected as environment variables:

- `KOOMPI_PROVIDER_CLIENT_ID`: Your OAuth client ID
- `KOOMPI_PROVIDER_CLIENT_SECRET`: Your OAuth client secret
- `KOOMPI_PROVIDER_REDIRECT_URI`: Your callback URL

## Authentication Flow

1. User clicks "Login with KOOMPI ID"
2. Redirect to: `https://kconsole.koompi.cloud/api/provider/auth/${KOOMPI_PROVIDER_CLIENT_ID}`
3. User authenticates with KOOMPI ID
4. Callback to: `KOOMPI_PROVIDER_REDIRECT_URI`
5. Access token is passed as query parameter

## Database

This app uses SQLite with persistence at `/data/db/app.db`.
Data persists across deployments and updates.

## Stack

- **Frontend**: Vite + React + TypeScript
- **Backend**: Bun (native runtime)
- **Database**: SQLite (bun:sqlite)
- **Deployment**: Docker (single container, Vite proxies backend)
