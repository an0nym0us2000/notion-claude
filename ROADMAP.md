# Notion Clone - Complete Build Roadmap

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **TailwindCSS** for styling (minimal, wide spacing, light grey theme)
- **Zustand** for state management (lightweight, performant)
- **React DnD** for drag and drop
- **Tiptap** for rich text editing (built on ProseMirror)
- **React Query** for server state management

### Backend
- **Node.js** with **Express** and TypeScript
- **Prisma ORM** for database management
- **PostgreSQL** for primary database
- **Redis** for caching and real-time sync
- **Socket.io** for WebSocket connections
- **Yjs + y-websocket** for CRDT-based real-time collaboration

### Infrastructure
- **JWT** for authentication
- **AWS S3** or **Cloudinary** for file uploads
- **Docker** for containerization
- **Nginx** for reverse proxy

### Real-time Collaboration Strategy
**CRDT (Conflict-free Replicated Data Types) using Yjs**
- Better for high-concurrency editing
- No central authority needed for conflict resolution
- Eventual consistency guaranteed
- Works offline and syncs when reconnected
- Used by: Figma, Linear, Notion

## Phase Breakdown

---

## Phase 1: Foundation & Core Infrastructure (Weeks 1-2)

### Goals
- Project scaffold
- Basic authentication
- Page creation and navigation
- Simple block rendering
- Database foundation

### Frontend Tasks
1. Initialize React + Vite + TypeScript project
2. Set up TailwindCSS with custom Notion-like theme
3. Create folder structure and routing (React Router)
4. Build layout components (Sidebar, TopBar, PageCanvas)
5. Create authentication pages (Login, Signup)
6. Build basic Page component
7. Create TextBlock component (simplest block type)
8. Set up Zustand stores (auth, pages, blocks)

### Backend Tasks
1. Initialize Node + Express + TypeScript
2. Set up Prisma with PostgreSQL
3. Create authentication endpoints (register, login, refresh token)
4. Build page CRUD endpoints
5. Build block CRUD endpoints
6. Set up JWT middleware
7. Configure CORS and security headers

### Database Schema (Prisma)
```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  name          String?
  avatar        String?
  workspaces    WorkspaceMember[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Workspace {
  id          String    @id @default(uuid())
  name        String
  icon        String?
  members     WorkspaceMember[]
  pages       Page[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model WorkspaceMember {
  id          String    @id @default(uuid())
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  workspaceId String
  user        User      @relation(fields: [userId], references: [id])
  userId      String
  role        String    @default("member") // owner, admin, member, viewer
  createdAt   DateTime  @default(now())

  @@unique([workspaceId, userId])
}

model Page {
  id          String    @id @default(uuid())
  title       String    @default("Untitled")
  icon        String?
  coverImage  String?
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  workspaceId String
  parentPage  Page?     @relation("PageHierarchy", fields: [parentId], references: [id])
  parentId    String?
  childPages  Page[]    @relation("PageHierarchy")
  blocks      Block[]
  isPublished Boolean   @default(false)
  createdBy   String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Block {
  id          String    @id @default(uuid())
  type        String    // text, heading1, heading2, heading3, todo, bullet, number, quote, code, divider
  content     Json      // Rich text content (Tiptap JSON)
  properties  Json?     // Block-specific properties
  page        Page      @relation(fields: [pageId], references: [id], onDelete: Cascade)
  pageId      String
  parentBlock Block?    @relation("BlockNesting", fields: [parentId], references: [id])
  parentId    String?
  childBlocks Block[]   @relation("BlockNesting")
  order       Float     // For ordering blocks (fractional indexing)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

### API Routes
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
GET    /api/auth/me

GET    /api/workspaces
POST   /api/workspaces
GET    /api/workspaces/:id

GET    /api/pages
POST   /api/pages
GET    /api/pages/:id
PATCH  /api/pages/:id
DELETE /api/pages/:id

GET    /api/blocks
POST   /api/blocks
PATCH  /api/blocks/:id
DELETE /api/blocks/:id
```

### Component Structure
```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   └── PageCanvas.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── SignupForm.tsx
│   ├── blocks/
│   │   ├── BlockRenderer.tsx
│   │   ├── TextBlock.tsx
│   │   └── BlockWrapper.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       └── Avatar.tsx
├── stores/
│   ├── authStore.ts
│   ├── pageStore.ts
│   └── blockStore.ts
├── pages/
│   ├── Login.tsx
│   ├── Signup.tsx
│   ├── Workspace.tsx
│   └── PageView.tsx
└── lib/
    ├── api.ts
    └── types.ts
```

### What to Build First
1. Authentication (login/signup)
2. Workspace creation
3. Single page with title
4. Simple text block rendering
5. Basic sidebar navigation

### What to Delay
- Rich text formatting (Phase 2)
- Drag and drop (Phase 2)
- Slash commands (Phase 2)
- Real-time sync (Phase 2)
- Comments (Phase 4)

---

## Phase 2: Rich Editing & Block System (Weeks 3-4)

### Goals
- Full block type support
- Rich text editing with Tiptap
- Drag and drop blocks
- Slash command menu
- Block nesting

### Frontend Tasks
1. Integrate Tiptap editor
2. Build all block types (H1, H2, H3, bullet, number, todo, quote, code, divider)
3. Create slash command menu with fuzzy search
4. Implement drag-and-drop with react-dnd
5. Add block nesting support
6. Build block actions menu (delete, duplicate, turn into)
7. Add keyboard shortcuts (Cmd+B, Cmd+I, etc.)

### Backend Tasks
1. Optimize block ordering with fractional indexing
2. Add block duplication endpoint
3. Add bulk block operations endpoint
4. Implement block type conversion logic

### Database Updates
```prisma
// Add to Block model
indentLevel  Int      @default(0)
checked      Boolean? // For todo blocks
language     String?  // For code blocks
```

### New Components
- HeadingBlock.tsx
- TodoBlock.tsx
- BulletBlock.tsx
- NumberedBlock.tsx
- QuoteBlock.tsx
- CodeBlock.tsx
- DividerBlock.tsx
- SlashCommandMenu.tsx
- BlockActionsMenu.tsx

### What to Build First
1. Tiptap integration
2. Heading blocks (H1, H2, H3)
3. List blocks (bullet, numbered)
4. Slash menu for block creation

### What to Delay
- Advanced formatting (tables, embeds)
- Block comments
- Database blocks

---

## Phase 3: Real-time Collaboration (Weeks 5-6)

### Goals
- Multi-user editing with Yjs
- Live cursors and selections
- Presence awareness
- Conflict-free syncing

### Frontend Tasks
1. Integrate Yjs with Tiptap (y-prosemirror)
2. Set up WebSocket connection with y-websocket
3. Build presence UI (live cursors, user avatars)
4. Add online/offline indicators
5. Show "X users editing" badge
6. Handle reconnection logic

### Backend Tasks
1. Set up Socket.io server
2. Integrate Yjs with y-redis for persistence
3. Create room management (one room per page)
4. Implement user presence tracking
5. Add authentication to WebSocket connections
6. Build conflict resolution middleware

### Database Updates
```prisma
model YjsDocument {
  id        String   @id @default(uuid())
  pageId    String   @unique
  data      Bytes    // Yjs binary update
  version   Int      @default(0)
  updatedAt DateTime @updatedAt
}

model Presence {
  id          String   @id @default(uuid())
  pageId      String
  userId      String
  cursor      Json?
  selection   Json?
  lastSeenAt  DateTime @updatedAt
}
```

### Real-time Sync Plan
1. **Connection**: User opens page → joins WebSocket room
2. **Initial sync**: Server sends Yjs document state
3. **Updates**: User edits → Yjs creates update → broadcast to room
4. **Persistence**: Server saves Yjs updates to Redis (fast) and periodically to PostgreSQL
5. **Presence**: Each user broadcasts cursor position every 50ms
6. **Disconnection**: Remove user from presence, keep document state

### Testing Plan
- Test with 2+ concurrent editors
- Simulate network disconnections
- Test offline editing + reconnection
- Load test with 10+ simultaneous users

---

## Phase 4: Database Features (Weeks 7-9)

### Goals
- Database blocks (like Notion databases)
- Properties (text, number, select, multi-select, date, checkbox, relation)
- Multiple views (table, list, board/kanban)
- Filtering and sorting
- Relations between databases

### Frontend Tasks
1. Build DatabaseBlock component
2. Create property type editors (text, select, date, etc.)
3. Build TableView component
4. Build ListView component
5. Build BoardView component (Kanban)
6. Add filtering UI
7. Add sorting UI
8. Build relation picker

### Backend Tasks
1. Create Database model
2. Create DatabaseProperty model
3. Create DatabaseRow model
4. Build database query engine (filters, sorts)
5. Add relation resolver

### Database Schema
```prisma
model Database {
  id          String              @id @default(uuid())
  blockId     String              @unique
  properties  DatabaseProperty[]
  rows        DatabaseRow[]
  views       DatabaseView[]
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
}

model DatabaseProperty {
  id          String   @id @default(uuid())
  database    Database @relation(fields: [databaseId], references: [id])
  databaseId  String
  name        String
  type        String   // text, number, select, multi-select, date, checkbox, relation, url
  config      Json?    // Options for select types, relation config, etc.
  order       Float
}

model DatabaseRow {
  id          String   @id @default(uuid())
  database    Database @relation(fields: [databaseId], references: [id])
  databaseId  String
  pageId      String?  // Each row can be a full page
  values      Json     // Property values
  order       Float
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model DatabaseView {
  id          String   @id @default(uuid())
  database    Database @relation(fields: [databaseId], references: [id])
  databaseId  String
  name        String
  type        String   // table, list, board
  config      Json     // Filters, sorts, group by (for board)
  order       Float
}
```

### What to Build First
1. Basic table view with text properties
2. Add/edit/delete rows
3. Select and multi-select properties
4. Date and checkbox properties

### What to Delay
- Advanced formulas
- Rollup properties
- Complex relations

---

## Phase 5: Templates & Advanced Features (Weeks 10-11)

### Goals
- Page templates
- Sync blocks (reusable content blocks)
- Page linking and backlinks
- Search functionality

### Frontend Tasks
1. Build template gallery
2. Create template editor
3. Build sync block UI
4. Add page link autocomplete (@ mentions)
5. Build backlinks panel
6. Add global search with keyboard shortcut (Cmd+K)

### Backend Tasks
1. Create Template model
2. Add template instantiation logic
3. Create SyncBlock model with syncing logic
4. Build search index (PostgreSQL full-text search)
5. Add backlinks resolver

### Database Schema
```prisma
model Template {
  id          String   @id @default(uuid())
  name        String
  description String?
  icon        String?
  blocks      Json     // Template block structure
  workspaceId String
  isPublic    Boolean  @default(false)
  createdAt   DateTime @default(now())
}

model SyncBlock {
  id          String   @id @default(uuid())
  content     Json
  instances   String[] // Array of block IDs that sync with this
  workspaceId String
  updatedAt   DateTime @updatedAt
}
```

---

## Phase 6: Sharing & Permissions (Week 12)

### Goals
- Page sharing (public links)
- Workspace permissions
- Guest access
- Export functionality

### Frontend Tasks
1. Build share modal
2. Add permission settings UI
3. Create public page view (no auth)
4. Build export dialog (Markdown, PDF)

### Backend Tasks
1. Add page sharing endpoints
2. Implement permission middleware
3. Create public page resolver
4. Build export service (markdown, HTML)

### Database Updates
```prisma
model PageShare {
  id          String    @id @default(uuid())
  pageId      String
  token       String    @unique
  password    String?
  expiresAt   DateTime?
  createdAt   DateTime  @default(now())
}

// Update WorkspaceMember to include permissions
model WorkspaceMember {
  permissions Json // { canEdit, canComment, canShare, canInvite }
}
```

---

## Phase 7: Comments & Polish (Week 13-14)

### Goals
- Inline comments
- Block comments
- Comment threads
- UI polish and animations

### Frontend Tasks
1. Build comment thread UI
2. Add inline comment highlights
3. Create comment sidebar
4. Add @mentions in comments
5. Polish animations and transitions
6. Add loading states and skeletons

### Backend Tasks
1. Create Comment model
2. Build comment CRUD endpoints
3. Add comment notifications

### Database Schema
```prisma
model Comment {
  id          String    @id @default(uuid())
  content     String
  blockId     String?
  pageId      String
  parentId    String?   // For threaded replies
  author      String
  mentions    String[]  // User IDs mentioned
  resolved    Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

---

## Testing Strategy

### Unit Tests
- Jest for backend logic
- React Testing Library for components
- Test block rendering
- Test CRDT operations
- Test permission logic

### Integration Tests
- API endpoint tests with Supertest
- Database transaction tests
- WebSocket connection tests

### E2E Tests
- Playwright for critical user flows
- Test page creation
- Test real-time collaboration
- Test authentication

---

## Deployment Plan

### Development
- Docker Compose for local development
- Hot reload for frontend and backend

### Staging
- Deploy to staging environment
- Test with small user group

### Production
- Frontend: Vercel or Netlify
- Backend: AWS EC2 or DigitalOcean
- Database: AWS RDS PostgreSQL
- Redis: AWS ElastiCache
- CDN: CloudFront for assets

---

## Success Metrics

1. **Performance**
   - Page load < 1s
   - Block rendering < 50ms
   - Real-time latency < 100ms

2. **Reliability**
   - 99.9% uptime
   - Zero data loss in collaboration
   - Graceful offline handling

3. **User Experience**
   - Keyboard-first navigation
   - Smooth animations (60fps)
   - Notion-like aesthetics

---

## Next Steps

Starting with **Phase 1** implementation now...
