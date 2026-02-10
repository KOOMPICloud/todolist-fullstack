# Todo List - Full-Stack Next.js 16 Template

A full-stack todo list application built with Next.js 16 App Router and KConsole Provider OAuth authentication.

## Features

- ✅ **User Authentication** - KOOMPI ID OAuth integration
- ✅ **Persistent Data** - SQLite database at `/data/db/app.db`
- ✅ **Full-Stack** - Next.js 16 with App Router (API Routes + Pages)
- ✅ **Real-time Updates** - Add, toggle, and delete todos
- ✅ **User Profiles** - Automatically synced from KOOMPI ID
- ✅ **Single Container** - Docker deployment with one port

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **React**: 19.0.0
- **Database**: SQLite with better-sqlite3
- **Runtime**: Node.js 20
- **Authentication**: KConsole Provider OAuth
- **Deployment**: Docker standalone output

## Quick Start

### Local Development

1. Install dependencies:
```bash
npm install
```

2. (Optional) Create `.env.local` for OAuth testing:
```bash
cp .env.local.example .env.local
```

3. Run development server:
```bash
npm run dev
```

4. Open http://localhost:3000

**Note:** Without configuring real OAuth credentials, you can still run the app locally but authentication won't work. The app will show a login button but it won't connect to KOOMPI ID.

### Production (KConsole)

This template is designed to be deployed on KConsole with one click!

When deployed, KConsole will automatically:
1. Fork this template to your private GitHub repo
2. Generate OAuth credentials (`client_id` and `client_secret`)
3. Inject credentials as environment variables
4. Configure persistent storage at `/data/db`
5. Deploy the application

## Environment Variables

When deployed on KConsole, these are automatically injected:

```env
NEXT_PUBLIC_KOOMPI_PROVIDER_CLIENT_ID=kcp_xxx
NEXT_PUBLIC_KOOMPI_PROVIDER_CLIENT_SECRET=xxx
NEXT_PUBLIC_KOOMPI_PROVIDER_REDIRECT_URI=https://yourapp.tunnel.koompi.cloud/auth/callback
DATABASE_PATH=/data/db/app.db
NODE_ENV=production
PORT=3000
```

## Project Structure

```
todolist-fullstack/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── health/        # Health check
│   │   ├── todos/         # CRUD endpoints
│   │   └── todos/[id]/    # Individual todo operations
│   ├── auth/              # Authentication pages
│   │   └── callback/      # OAuth callback handler
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page (todo app)
│   └── globals.css        # Global styles
├── lib/                   # Utilities
│   ├── db.ts             # Database initialization
│   └── auth.ts           # OAuth client utilities
├── public/                # Static assets
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── next.config.js         # Next.js config
└── Dockerfile             # Production build
```

## API Endpoints

### Public
- `GET /api/health` - Health check

### Authenticated (requires Bearer token)
- `GET /api/todos` - List user's todos
- `POST /api/todos` - Create todo
- `PUT /api/todos/:id` - Update todo (toggle completed)
- `DELETE /api/todos/:id` - Delete todo

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  koompi_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  fullname TEXT,
  avatar TEXT,
  wallet_address TEXT,
  created_at DATETIME,
  updated_at DATETIME
);
```

### Todos Table
```sql
CREATE TABLE todos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  created_at DATETIME,
  updated_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(koompi_id)
);
```

## Authentication Flow

1. User clicks "Login with KOOMPI ID"
2. Redirected to KConsole Provider OAuth
3. User authenticates with KOOMPI ID
4. Redirected back to app with access token
5. Token stored and used for all API calls
6. User profile synced from KOOMPI ID

## Data Persistence

- SQLite database stored at `/data/db/app.db`
- Persists across deployments and updates
- Automatic backups via KConsole snapshots
- WAL mode enabled for better concurrent access

## Development

### Adding New Features

1. **New Page**: Create `app/your-page/page.tsx`
2. **New API Route**: Create `app/api/your-route/route.ts`
3. **Database Query**: Import `db` from `@/lib/db` and use better-sqlite3

### Example: Adding a New API Endpoint

```typescript
// app/api/hello/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Hello World!' });
}
```

### Example: Database Query

```typescript
import db from '@/lib/db';

const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
const user = stmt.get(userId);
```

## Deployment

The Dockerfile uses Next.js standalone output for optimal production performance:

- Multi-stage build for small image size
- Node.js 20 Alpine base
- Non-root user for security
- Health check endpoint
- Exposes port 3000

## License

MIT License - Feel free to use this template for your projects!

## Support

- Deployed on [KConsole](https://kconsole.koompi.cloud)
- Authentication by [KOOMPI ID](https://oauth.koompi.org)
- Templates by [KOOMPICloud](https://github.com/KOOMPICloud)
