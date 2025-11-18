# Notion Clone

A full-featured collaborative workspace application inspired by Notion, built with modern web technologies.

## Features (Planned Phases)

### Phase 1 - Foundation ✓
- User authentication
- Workspace management
- Page creation and navigation
- Basic block system
- Clean Notion-like UI

### Phase 2 - Rich Editing
- Rich text editing with Tiptap
- Multiple block types (headings, lists, code, etc.)
- Drag and drop blocks
- Slash command menu

### Phase 3 - Real-time Collaboration
- Multi-user editing with Yjs CRDT
- Live cursors and presence
- Conflict-free syncing

### Phase 4 - Database Features
- Notion-like databases
- Multiple views (table, list, board)
- Properties and relations
- Filtering and sorting

### Phase 5 - Advanced Features
- Templates
- Sync blocks
- Backlinks
- Global search

### Phase 6 - Sharing & Permissions
- Public page sharing
- Workspace permissions
- Export functionality

### Phase 7 - Polish
- Comments and threads
- Animations and transitions
- Performance optimization

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- TailwindCSS
- Zustand (state management)
- Tiptap (rich text editor)
- React Query
- React DnD

### Backend
- Node.js + Express + TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- Socket.io
- Yjs (CRDT)

### Infrastructure
- Docker
- JWT authentication
- AWS S3 (file uploads)

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Docker (optional)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd notion-claude
```

2. Install dependencies
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

3. Set up environment variables
```bash
# Server
cp server/.env.example server/.env
# Edit server/.env with your database credentials

# Client
cp client/.env.example client/.env
```

4. Run database migrations
```bash
cd server
npx prisma migrate dev
```

5. Start the development servers
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### Using Docker

```bash
docker-compose up
```

## Project Structure

```
notion-clone/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── stores/        # Zustand stores
│   │   ├── lib/           # Utilities and helpers
│   │   └── styles/        # Global styles
│   └── package.json
├── server/                # Backend Node.js application
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── services/      # Business logic
│   │   └── prisma/        # Database schema
│   └── package.json
└── docker-compose.yml
```

## Development

### Database Migrations

```bash
cd server
npx prisma migrate dev --name migration_name
```

### Generate Prisma Client

```bash
cd server
npx prisma generate
```

### Run Tests

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Submit a pull request

## License

MIT
