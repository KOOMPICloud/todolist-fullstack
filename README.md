# Todo List - Full-Stack Template

A full-stack todo list application with built-in KConsole Provider OAuth authentication.

## Features

- ✅ **User Authentication** - KOOMPI ID OAuth integration
- ✅ **Persistent Data** - SQLite database at `/data/db/app.db`
- ✅ **Full-Stack** - Vite frontend + Bun backend
- ✅ **Real-time Updates** - Add, toggle, and delete todos
- ✅ **User Profiles** - Automatically synced from KOOMPI ID

## Tech Stack

- **Frontend**: Vite + React + TypeScript
- **Backend**: Bun (native runtime) + SQLite (bun:sqlite)
- **Database**: SQLite with persistent storage at `/data/db`
- **Authentication**: KConsole Provider OAuth
- **Deployment**: Docker (single container, Vite proxies backend)

## Quick Start

### Local Development

1. Install dependencies:
```bash
bun run install:all
```

2. Start development servers:
```bash
bun run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

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
KOOMPI_PROVIDER_CLIENT_ID=kcp_xxx
KOOMPI_PROVIDER_CLIENT_SECRET=xxx
KOOMPI_PROVIDER_REDIRECT_URI=https://yourapp.kconsole.koompi.cloud/auth/callback
DATABASE_PATH=/data/db/app.db
NODE_ENV=production
PORT=3001
```

## Project Structure

```
todolist-fullstack/
├── frontend/          # Vite + React app
│   ├── src/
│   │   ├── auth.ts   # OAuth utilities
│   │   ├── App.tsx   # Main app component
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── backend/           # Bun backend
│   ├── src/
│   │   └── index.ts  # API server + database
│   └── package.json
├── Dockerfile         # Production build
└── README.md
```

## API Endpoints

### Public
- `GET /api/health` - Health check

### Authenticated (requires Bearer token)
- `GET /api/me` - Get current user
- `GET /api/todos` - List user's todos
- `POST /api/todos` - Create todo
- `PUT /api/todos/:id` - Update todo
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

1. **Frontend**: Edit `frontend/src/App.tsx`
2. **Backend**: Edit `backend/src/index.ts`
3. **Database**: Add migrations in `backend/src/db/migrate.ts`

### Testing OAuth Locally

To test OAuth flow locally, you'll need a KConsole client ID. Otherwise, the app will work without authentication but won't persist data across sessions.

## License

MIT License - Feel free to use this template for your projects!

## Support

- Deployed on [KConsole](https://kconsole.koompi.cloud)
- Authentication by [KOOMPI ID](https://oauth.koompi.org)
- Templates by [KOOMPICloud](https://github.com/KOOMPICloud)
