# Backend Setup

This folder contains the beginnings of the backend for the X clone project. It
is a standalone Fastify + Prisma service that connects to a PostgreSQL
database.

## Prerequisites

- Node.js 20+
- PostgreSQL database (local `postgres` or managed such as Neon, Supabase, etc.)

## Installation

```bash
cd server
npm install
```

Copy the example env file and update the values to point at your own database.

```bash
cp env.example .env
# edit .env to include your credentials
```

## Database

The Prisma schema defines the core tables:

- `users` — profile metadata and auth fields
- `posts` — 280-character posts, replies via `inReplyToId`
- `post_stats` — denormalised counters for replies, reposts, likes, views
- `post_likes`, `post_reposts` — interaction join tables
- `follows` — follower/following relationships
- `drafts` — saved drafts owned by a user
- `notifications` — activity feed items (like/repost/reply/follow)

Generate the Prisma client and push the schema to your database:

```bash
npm run prisma:generate
npm run db:push
# or use migrations
npm run prisma:migrate -- --name init
```

## Development server

```bash
npm run dev
```

This launches a Fastify server with a `GET /health` endpoint. Additional
modules/routes will be added in future steps.

