# Todo List - Full-Stack Next.js 16 Template

A full-stack todo list application built with Next.js 16 App Router, KOOMPI ID sign-in through KOOMPI Cloud, a Turso (libSQL) database, and a small mobile-first UI kit (`components/ui`, shadcn-based) with light and dark themes. How its screens are built: [DESIGN.md](DESIGN.md).

## Features

- ✅ **User Authentication** - KOOMPI ID OAuth integration
- ✅ **Cloud Database** - Turso (libSQL) — serverless, edge-replicated SQLite
- ✅ **Mobile-first UI** - a tab bar on phones and a side bar on wide screens, lists, sheets, fields, day and time chips, light and dark ([DESIGN.md](DESIGN.md))
- ✅ **Image Uploads** - KOOMPI Cloud object storage (presigned uploads)
- ✅ **Full-Stack** - Next.js 16 App Router (API routes + pages)
- ✅ **Single Container** - Docker standalone deployment on one port

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **React**: 19
- **Database**: Turso / libSQL (`@libsql/client`)
- **UI**: shadcn/ui + Tailwind CSS v4 + lucide-react
- **Runtime**: Node.js 24 (LTS)
- **Authentication**: KOOMPI ID sign-in through KOOMPI Cloud
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
   The app also creates tables automatically as it starts.

4. Run the dev server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000

**Note:** Without real OAuth credentials the login button won't connect to KOOMPI ID,
but the app and database still run locally.

### Production (KOOMPI Cloud)

This template is designed to be deployed on KOOMPI Cloud with one click. When deployed,
KOOMPI Cloud automatically:

1. Forks this template to your private GitHub repo
2. Provisions a Turso database and injects `DATABASE_URL` / `DATABASE_AUTH_TOKEN`
3. Generates OAuth credentials (`client_id` / `client_secret`) and injects them
4. Provisions object storage and injects `KCONSOLE_STORAGE_*`
5. Builds and deploys the container

## Environment Variables

When deployed on KOOMPI Cloud these are injected automatically:

```env
NEXT_PUBLIC_KOOMPI_PROVIDER_CLIENT_ID=kcp_xxx
KOOMPI_PROVIDER_CLIENT_SECRET=xxx   # server only: swaps the sign-in code for the tokens
NEXT_PUBLIC_KOOMPI_PROVIDER_REDIRECT_URI=https://yourapp.tunnel.koompi.cloud/api/auth/callback
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
│   ├── layout.tsx          # Root layout: AppShell (the tabs), the theme script, Toaster
│   ├── theme-script.ts     # Light/dark, set before the page draws
│   ├── page.tsx            # Thin entry — renders <TodoApp/>
│   ├── account/page.tsx    # The Account tab
│   └── globals.css         # Design tokens (colors, type, corners), light and dark
├── components/
│   ├── ui/                 # The UI kit: AppShell, Screen, List, Sheet, Field, ChoiceChips… (DESIGN.md)
│   ├── account-screen.tsx
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
│   ├── db.ts               # Turso / libSQL client + schema (and how to keep it fast)
│   ├── auth.ts             # OAuth client utilities (browser)
│   ├── auth-server.ts      # Bearer-token verification (API routes)
│   ├── api.ts              # Client-side API + upload helpers
│   ├── storage.ts          # Object storage helpers
│   ├── format.ts           # Dates, times and money (Phnom Penh time, $ and ៛)
│   ├── types.ts            # Shared types
│   └── utils.ts            # cn() helper
├── instrumentation.ts      # Connects to the database as the server starts
├── scripts/init-db.mjs     # Schema init / migration script
├── DESIGN.md               # How the screens are built: read before changing one
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
2. KOOMPI Cloud sends them to KOOMPI ID (a popup; the same tab where popups are blocked)
3. User authenticates with KOOMPI ID
4. Back at the app with a one-time code, which its server swaps for the token with its client secret
5. Token stored in `localStorage` and used for all API calls
6. User profile is upserted into the database

## Payments

Customers can pay with ABA, ACLEDA, Wing or any KHQR banking app, through KOOMPI Cloud. It is off until
payments are turned on for the app (Ask AI: "let customers pay", or **Payments** in the KOOMPI Cloud
dashboard), which sets `KOOMPI_PAY_URL`, `KOOMPI_PAY_KEY` and `KOOMPI_PAY_WEBHOOK_SECRET`. Until then the
payment card is hidden.

1. `POST /api/payments/checkout { productId }` saves an unpaid order (price from `lib/products.ts`, never
   from the browser) and returns the payment link.
2. KOOMPI Cloud sends `payment.paid` to `POST /api/payments/webhook`, signed (`X-KOOMPI-Pay-Signature`);
   `lib/payments.ts` checks it and the order is marked paid.
3. The customer comes back with `?payment_id=…`; `GET /api/payments?payment_id=…` asks KOOMPI Cloud,
   in case the event has not arrived yet.

Previews use a test key: the bank is simulated and no money moves. To sell something else, change
`lib/products.ts` and `components/todo/support-card.tsx`.

## Development

### Database queries

`getDb()` returns the app's one shared libSQL client (async). Queries use `db.execute({ sql, args })`:

```typescript
import { getDb } from '@/lib/db';

const db = await getDb();
const result = await db!.execute({
  sql: 'SELECT * FROM todos WHERE user_id = ?',
  args: [userId],
});
const todos = result.rows;
```

The database is a network trip away (about 80 ms a read and 140 ms a write), so a request is
as fast as the number of trips it makes:

- Use `getDb()`'s shared client; never `createClient()` again (a new one takes about 0.7 s to connect).
- Reads that don't depend on each other: one `db.batch([...], 'read')`, one trip.
- Writes that belong together: one `db.batch([...], 'write')`, one trip, all or nothing (not `db.transaction()`: each step is a trip).
- `INSERT / UPDATE / DELETE ... RETURNING *` gives back the row: no SELECT after a write.
- An index in `SCHEMA` (lib/db.ts) for every new WHERE or ORDER BY.
- No queries in a loop: `IN (...)`, a JOIN, or one batch.

The client also keeps its connections open for a minute after each query (`keepWarm` in lib/db.ts):
Turso closes an idle one after 5 s, and a new one made the first query after a pause 0.3 s instead
of 0.075 s. An app idle for longer makes no requests.

```typescript
const [todos, orders] = await db!.batch([
  { sql: 'SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC', args: [userId] },
  { sql: 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', args: [userId] },
], 'read');
```

### Building screens

Compose them from `components/ui` as [DESIGN.md](DESIGN.md) says: a `Screen` per page, its tab in `app/layout.tsx`, `List` rows, a `Sheet` for each form. More shadcn components can be added (`npx shadcn@latest add <component>`); restyle them with the tokens in `app/globals.css`.

## Deployment

The Dockerfile uses Next.js standalone output:

- Multi-stage build for a small image
- Node.js 24 Alpine base
- Non-root user
- Health check endpoint on `/api/health`
- Exposes port 3000

No persistent volume is required — data lives in Turso.

## License

MIT License - Feel free to use this template for your projects!

## Support

- Deployed on [KOOMPI Cloud](https://kconsole.koompi.cloud)
- Authentication by [KOOMPI ID](https://oauth.koompi.org)
- Templates by [KOOMPICloud](https://github.com/KOOMPICloud)
