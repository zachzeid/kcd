# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kanar Character Checkout — a Next.js web app for managing LARP (live-action role-playing) character sheets, event check-in/check-out, and lore for the Kanar game system. Players create characters with race/class/skills, submit them for staff review, and check in at events.

## Commands

- `npm run dev` — start dev server (localhost:3000)
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run db:setup` — initialize SQLite schema from `prisma/setup.sql`
- `npm run db:generate` — generate Prisma client (also runs on `postinstall`)
- `npm run db:seed` — seed test data via `prisma/seed.ts`

Database setup order: `npm install` → `npm run db:generate` → `npm run db:setup` → `npm run db:seed`

## Architecture

**Stack:** Next.js 16 (App Router), React 19, Prisma 7 with libsql adapter, SQLite (`prisma/dev.db`), NextAuth v5 (JWT strategy, credentials provider), Tailwind CSS 4, TypeScript 5.

**Prisma client** is generated to `src/generated/prisma/` (not the default location). The singleton lives in `src/lib/prisma.ts` using the `@prisma/adapter-libsql` adapter with a file URL.

**Auth:** NextAuth v5 configured in `src/lib/auth.ts`. Session uses JWT with `id` and `role` fields added via callbacks. Custom types augmented in `src/types/next-auth.d.ts`. Login page at `/login`.

**Roles & permissions** (`src/lib/roles.ts`): Six roles — `user`, `admin`, `cbd` (Character Book Director), `gm`, `economy_marshal`, `play_master`. Character review requires `admin`, `cbd`, or `gm`. User management is admin-only. Staff with review privileges cannot edit their own characters.

**Character lifecycle** (`src/lib/character-status.ts`): draft → pending_review → approved/rejected → checked_in → checked_out → retired. Players can only edit characters in `draft` or `rejected` status.

**Character data model:** The `Character.data` field stores the full character sheet as a JSON string (typed as `Character` in `src/types/character.ts`). This includes race, class, skills, equipment, and history. The DB record tracks status/review metadata separately.

**Skill prerequisites** (`src/lib/prerequisites.ts`): Complex prerequisite chain validation for the Kanar skill system — martial abilities, magic spell slots, enchanting, crafting, etc. Uses hardcoded rule checks (not data-driven).

**Audit logging** (`src/lib/audit.ts`): All character state changes are logged to the `AuditLog` table with actor info and JSON details.

**Payments** (`src/lib/squarespace.ts`): Ticket purchases redirect to Squarespace Commerce (kanar.club). Optional Squarespace Orders API integration for payment verification via `SQUARESPACE_API_KEY` env var.

## API Route Structure

- `/api/auth/[...nextauth]` — NextAuth handlers
- `/api/characters` — player CRUD (scoped to own characters)
- `/api/characters/[id]/submit` — submit for review
- `/api/characters/[id]/levelup` — level-up with XP
- `/api/characters/[id]/history` — version history
- `/api/characters/[id]/log` — audit log
- `/api/admin/characters` — staff character listing
- `/api/admin/characters/[id]/review` — approve/reject
- `/api/admin/users` — user management (admin only)
- `/api/admin/events` — event CRUD
- `/api/events` — public event listing/registration
- `/api/lore` — lore entries and characters

## Key Conventions

- Path alias `@/` maps to `src/`
- All monetary values stored in cents (integers)
- JSON blob fields (`Character.data`, `AuditLog.details`, `LoreEntry.locations/characters/tags`) are stored as strings, parsed at the application layer
- Test accounts seeded with password `password123` (see README for full list)
