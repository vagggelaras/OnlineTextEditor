# Online Text Editor

## Project Overview
Online text editor (like Word online) with real-time collaboration, graph/chart creator, file management, share/export, and version history.

## Tech Stack
- **Frontend**: React 19 + TypeScript, Vite 8, TipTap (ProseMirror), Tailwind CSS v4, shadcn/ui (manual), Zustand, React Router v7, Lucide icons
- **Backend**: Node.js + Express 5, PostgreSQL + Prisma 7 ORM, JWT + bcrypt auth, Zod v4 validation
- **Real-time**: Yjs (CRDT) + Hocuspocus WebSocket server
- **Charts** (planned): Chart.js + react-chartjs-2

## Project Structure
Monorepo with npm workspaces (`frontend/`, `backend/`).

```
OnlineTextEditor/
├── package.json              # npm workspaces root
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # Button, Toggle, Separator, Input, Tooltip
│   │   │   ├── layout/       # AppLayout, Header, Sidebar, ProtectedRoute
│   │   │   ├── editor/       # Editor.tsx (TipTap), EditorToolbar.tsx
│   │   │   ├── charts/       # ChartPanel, ChartEditor, ChartPreview (Chart.js)
│   │   │   ├── share/        # ShareDialog (share link management)
│   │   │   ├── export/       # ExportMenu (PDF, HTML, Markdown)
│   │   │   └── versions/     # VersionPanel (version history + preview)
│   │   ├── pages/            # EditorPage, LoginPage, RegisterPage, DashboardPage, SharedPage
│   │   ├── stores/           # authStore.ts, documentStore.ts, chartStore.ts (Zustand)
│   │   ├── lib/              # utils.ts (cn), api.ts (fetch wrapper), export.ts
│   │   ├── types/            # user.ts, document.ts, chart.ts, html2pdf.d.ts
│   │   ├── styles/           # editor.css (TipTap content styles)
│   │   └── App.tsx           # BrowserRouter + routes
│   └── vite.config.ts        # React + Tailwind plugins, @ alias
└── backend/
    ├── prisma/
    │   └── schema.prisma     # User, Document, Folder, Version, SharedDocument, Chart
    ├── prisma.config.ts      # Prisma v7 config with @prisma/adapter-pg
    ├── src/
    │   ├── index.ts          # Express server entry
    │   ├── config/           # env.ts, database.ts, cors.ts
    │   ├── middleware/        # auth.ts (JWT), errorHandler.ts, asyncHandler.ts
    │   ├── routes/           # auth, documents, folders, charts, shares, versions routes
    │   ├── controllers/      # auth, documents, folders, charts, shares, versions controllers
    │   ├── services/         # auth, document, folder, chart, share, version, collaboration services
    │   └── utils/            # errors.ts, validation.ts (Zod schemas incl. chart validation)
    └── .env                  # DATABASE_URL, JWT_SECRET, PORT, FRONTEND_URL
```

## Key Technical Decisions
- **Tailwind v4**: Uses `@theme` directive in index.css with `--color-*` custom properties (NOT `@layer base` with HSL triplets like v3)
- **shadcn/ui**: Manually created components (no CLI), using `class-variance-authority` + `clsx` + `tailwind-merge`
- **TipTap imports**: `Table` and `TextStyle` use named exports `{ Table }`, `{ TextStyle }`. Others use default exports.
- **Path alias**: `@/` maps to `./src/` via tsconfig paths + vite resolve alias
- **Prisma v7**: No `url` in `datasource db`. Connection URL configured via `prisma.config.ts` with `@prisma/adapter-pg`. Use `import { z } from "zod/v4"` for Zod.
- **Auth**: JWT stored in HTTP-only cookies, 7-day expiry. Express middleware in `requireAuth()`.
- **Collaboration**: Hocuspocus integrated with Express via `http.createServer` + WebSocket upgrade. Auth via cookie parsing in `onAuthenticate` hook. Yjs state stored as `Bytes` in PostgreSQL. Content migration: if no `yjsState`, first client seeds Yjs from existing JSON content.
- **Editor + Yjs**: StarterKit `history: false` (Yjs handles undo/redo). Collaboration + CollaborationCursor extensions. Auto-save handled by Hocuspocus `onStoreDocument`.
- **Charts**: Chart.js + react-chartjs-2 on frontend. Charts stored in DB per document. Support bar, line, pie, doughnut, radar, polarArea. Side panel with live preview editor.
- **Export**: Frontend-only (no backend deps). HTML from `editor.getHTML()`, Markdown via `turndown`, PDF via `html2pdf.js` (lazy-loaded). All trigger browser downloads.
- **Sharing**: Share tokens (base64url, 24 bytes) stored in `SharedDocument`. Public `/shared/:token` route. View or edit permissions. `/api/shared/:token` is unauthenticated.
- **Versions**: Manual snapshots via API. Preview old versions in read-only TipTap editor. Restore auto-saves current state first, then replaces content + clears yjsState.

## Implementation Phases
- [x] Phase 1: Project setup + basic TipTap editor with toolbar
- [x] Phase 2: Backend + PostgreSQL + Prisma + Auth (JWT)
- [x] Phase 3: File management (CRUD documents/folders, auto-save, FileTree, DashboardPage)
- [x] Phase 4: Real-time collaboration (Yjs + Hocuspocus)
- [x] Phase 5: Graph/Chart creator tab (Chart.js + react-chartjs-2)
- [x] Phase 6: Share / Export (PDF via html2pdf.js, HTML, Markdown via turndown)
- [x] Phase 7: Version history (manual save, preview, restore)
- [ ] Phase 8: Polish, testing, deployment

## Commands
- `cd frontend && npx vite` — dev server (port 5173)
- `cd frontend && npx vite build` — production build
- `cd frontend && npx tsc --noEmit` — type check frontend
- `cd backend && npx tsc --noEmit` — type check backend
- `cd backend && npx prisma generate` — regenerate Prisma client
- `cd backend && npx prisma migrate dev` — run migrations
- `cd backend && npm run dev` — start backend with nodemon

## Prerequisites
- PostgreSQL must be installed and running for backend to work
- Create database: `CREATE DATABASE online_editor;`
- Run `cd backend && npx prisma migrate dev` after DB is ready

## Plan File
Full implementation plan: `.claude/plans/functional-wiggling-boole.md`
