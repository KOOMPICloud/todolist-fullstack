# Todo List - Full-Stack Next.js 16 Template

A full-stack todo list application built with Next.js 16 App Router, KConsole Provider OAuth, a Turso (libSQL) database, and a shadcn/ui interface.

## Features

- ✅ **User Authentication** - KOOMPI ID OAuth integration
- ✅ **Cloud Database** - Turso (libSQL) — serverless, edge-replicated SQLite
- ✅ **Modern UI** - shadcn/ui components on Tailwind CSS v4
- ✅ **Image Uploads** - KConsole object storage (presigned uploads)
- ✅ **Full-Stack** - Next.js 16 App Router (API routes + pages)
- ✅ **Single Container** - Docker standalone deployment on one port

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **React**: 19
- **Database**: Turso / libSQL (`@libsql/client`)
- **UI**: shadcn/ui + Tailwind CSS v4 + lucide-react
- **Runtime**: Node.js 20+
- **Authentication**: KConsole Provider OAuth
- **Deployment**: Docker standalone output

## Quick Start

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create your local env file:
   ```bash
   cp .env.local.example .env.local
   ```
   By default it uses a local SQLite file (`file:./data/dev.db`). To use Turso,
   set `DATABASE_URL` (e.g. `libsql://your-db.turso.io`) and `DATABASE_AUTH_TOKEN`.

3. (Optional) Initialize/migrate the schema explicitly:
   ```bash
   npm run db:init
   ```
   The app also creates tables automatically on first request.

4. Run the dev server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000

**Note:** Without real OAuth credentials the login button won't connect to KOOMPI ID,
but the app and database still run locally.

### Production (KConsole)

This template is designed to be deployed on KConsole with one click. When deployed,
KConsole automatically:

1. Forks this template to your private GitHub repo
2. Provisions a Turso database and injects `DATABASE_URL` / `DATABASE_AUTH_TOKEN`
3. Generates OAuth credentials (`client_id` / `client_secret`) and injects them
4. Provisions object storage and injects `KCONSOLE_STORAGE_*`
5. Builds and deploys the container

## Environment Variables

When deployed on KConsole these are injected automatically:

```env
NEXT_PUBLIC_KOOMPI_PROVIDER_CLIENT_ID=kcp_xxx
NEXT_PUBLIC_KOOMPI_PROVIDER_CLIENT_SECRET=xxx
NEXT_PUBLIC_KOOMPI_PROVIDER_REDIRECT_URI=https://yourapp.tunnel.koompi.cloud/auth/callback
NEXT_PUBLIC_KOOMPI_API_BASE_URL=https://api-kconsole.koompi.cloud

# Turso / libSQL
DATABASE_URL=libsql://your-database.turso.io
DATABASE_AUTH_TOKEN=xxx

# Object storage
KCONSOLE_STORAGE_URL=https://api-kconsole.koompi.cloud
KCONSOLE_STORAGE_KEY=xxx

NODE_ENV=production
PORT=3000
```

## Project Structure

```
todolist-fullstack/
├── app/                    # Next.js App Router
│   ├── api/                # API routes
│   │   ├── health/         # Health check
│   │   ├── todos/          # CRUD endpoints (+ [id])
│   │   ├── auth/callback/  # OAuth callback handler
│   │   └── upload/         # Presigned upload token + complete
│   ├── layout.tsx          # Root layout (+ Toaster)
│   ├── page.tsx            # Thin entry — renders <TodoApp/>
│   └── globals.css         # Tailwind v4 + shadcn theme
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   └── todo/               # Feature components
│       ├── todo-app.tsx        # Client container (wires hooks)
│       ├── login-card.tsx
│       ├── add-todo-form.tsx
│       ├── todo-list.tsx
│       ├── todo-item.tsx
│       └── image-preview-dialog.tsx
├── hooks/
│   ├── use-auth.ts         # Client auth state
│   └── use-todos.ts        # Todos state + mutations
├── lib/
│   ├── db.ts               # Turso / libSQL client + schema
│   ├── auth.ts             # OAuth client utilities (browser)
│   ├── auth-server.ts      # Bearer-token verification (API routes)
│   ├── api.ts              # Client-side API + upload helpers
│   ├── storage.ts          # Object storage helpers
│   ├── types.ts            # Shared types
│   └── utils.ts            # cn() helper
├── scripts/init-db.mjs     # Schema init / migration script
├── components.json         # shadcn config
├── package.json
├── tsconfig.json
├── next.config.js          # standalone output, unoptimized images
└── Dockerfile              # Production build
```

## API Endpoints

### Public
- `GET /api/health` - Health check

### Authenticated (requires Bearer token)
- `GET /api/todos` - List the user's todos
- `POST /api/todos` - Create a todo
- `PUT /api/todos/:id` - Update a todo (toggle, rename, change/remove image)
- `DELETE /api/todos/:id` - Delete a todo

## Database Schema

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  koompi_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  fullname TEXT,
  avatar TEXT,
  wallet_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE todos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  image_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Authentication Flow

1. User clicks "Login with KOOMPI ID"
2. Redirected to KConsole Provider OAuth
3. User authenticates with KOOMPI ID
4. Redirected back to the app with an access token
5. Token stored in `localStorage` and used for all API calls
6. User profile is upserted into the database

## Development

### Database queries

`getDb()` returns a libSQL client (async). Queries use `db.execute({ sql, args })`:

```typescript
import { getDb } from '@/lib/db';

const db = await getDb();
const result = await db!.execute({
  sql: 'SELECT * FROM todos WHERE user_id = ?',
  args: [userId],
});
const todos = result.rows;
```

### Adding shadcn components

```bash
npx shadcn@latest add <component>
```

## Deployment

The Dockerfile uses Next.js standalone output:

- Multi-stage build for a small image
- Node.js 20 Alpine base
- Non-root user
- Health check endpoint on `/api/health`
- Exposes port 3000

No persistent volume is required — data lives in Turso.

## License

MIT License - Feel free to use this template for your projects!

## Support

- Deployed on [KConsole](https://kconsole.koompi.cloud)
- Authentication by [KOOMPI ID](https://oauth.koompi.org)
- Templates by [KOOMPICloud](https://github.com/KOOMPICloud)
