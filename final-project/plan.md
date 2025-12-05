# TripCircle - Travel Planning & Sharing Web App

A full-stack travel planning application built with React (Vite + TypeScript) frontend and Express.js (TypeScript) backend. Users can plan trips, collaborate with others, and share their travel experiences with the community.

Deploy link: http://wp-final-five.vercel.app/

---

## 🚧 TODO - Upcoming Features

> **Team members**: Pick one and start working on it! Update this list when you begin.

### 1. Search & Filter Feed
- [ ] Add search bar to filter published trips by title, destination, etc.
- [ ] Add filters (date range, trip length, trip type etc.)

### 2. Clickable Feed Content → Search/Explore
- [ ] Make locations, tags, or keywords in feed posts clickable
- [ ] Clicking should filter the feed OR jump to Explore page with that search term
- [ ] Example: Click "Tokyo" in a post → see all Tokyo trips or explore Tokyo attractions

### 3. Update Trip Dates (Tricky!)
- [ ] Allow changing trip start/end dates after creation
- [ ] **Challenge**: What happens to activities when dates change?
  - If a day is removed, what happens to its activities? (Delete? Move? Warn user?)
  - If dates shift, should activities shift too?
  - Consider a confirmation dialog explaining the impact

### 4. Save & Comment on Posts
- [ ] Add "Save/Bookmark" button on feed posts
- [ ] Show saved posts in user's dashboard
- [ ] Add comment section on published trips
- [ ] Consider: notifications when someone comments on your post?

### 5. Publisher Analytics Dashboard
- [ ] Show stats for your published trips: views, imports, saves
- [ ] Add to existing dashboard or create new "My Posts" section
- [ ] Track: view count, import count, comments count per post

---

## Project Structure

```
final-project/
├── frontend/          # Vite + React + TypeScript
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components (routes)
│   │   ├── hooks/         # Custom React hooks (API calls)
│   │   ├── context/       # React context (Auth)
│   │   ├── lib/           # Utilities (API client, analytics)
│   │   └── types/         # TypeScript interfaces
│   └── ...
├── backend/           # Express.js + TypeScript + Prisma
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── middleware/    # Auth middleware
│   │   └── database.ts    # Prisma client
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   └── ...
└── PROJECT_SPEC.md    # Original project specification
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL database (or use Supabase/Railway)

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_AMPLITUDE_API_KEY=your_amplitude_api_key
```

4. Run development server:
```bash
npm run dev
```

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/tripcircle
JWT_SECRET=your-secret-key-change-this-in-production
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_PLACES_API_KEY=your-google-places-api-key
AMPLITUDE_API_KEY=your-amplitude-api-key
PORT=8000
```

> **Note**: If your database password contains special characters (like `#`, `+`, `@`), you must URL-encode them in the connection string. For example, `#` becomes `%23`, `+` becomes `%2B`.

4. Set up database:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

5. Run backend server:
```bash
npm run dev
```

For production:
```bash
npm run build
npm start
```

## Features

### Core Features
- ✅ **User Authentication** - Email/Password + Google OAuth
- ✅ **Trip Management** - Create, edit, delete trips with cover images
- ✅ **Itinerary Planning** - Day-by-day activities with times and locations
- ✅ **Drag-and-Drop** - Reorder activities within each day
- ✅ **Collaboration** - Invite members with Owner/Editor/Viewer roles
- ✅ **Share Links** - Generate permanent links for trip sharing

### Feed & Social Features (NEW)
- ✅ **Public Feed** - Browse published trips from the community (home page)
- ✅ **Trip Publishing** - Publish trips to feed with optional "story" text
- ✅ **Activity Stories** - Add rich descriptions to activities for feed display
- ✅ **Trip Import** - Import published trips as templates for your own trips
- ✅ **Allow Imports Toggle** - Publishers control if others can import their trips

### Explore & Discovery
- ✅ **Google Places Integration** - Search and explore attractions
- ✅ **Analytics Tracking** - Amplitude integration for user behavior

### Admin
- ✅ **Analytics Dashboard** - View user and trip statistics

## Key Concepts

### Trip Roles
| Role | Permissions |
|------|-------------|
| **Owner** | Full control, can delete trip, manage members, publish |
| **Editor** | Can edit trip details and activities |
| **Viewer** | Read-only access |

### Publishing Flow
1. Create and plan your trip
2. Add a "Trip Story" (optional rich description for feed)
3. Toggle "Allow imports" if you want others to use your trip as a template
4. Click "Publish to Feed"

### Import Flow
1. Browse the feed or receive a share link
2. Click "View & Import" (if publisher allowed it)
3. Trip is copied to your account with "(Imported)" suffix
4. Notes are preserved, but stories are cleared for you to write your own

## API Endpoints

### Auth
- `POST /auth/register` - Register with email/password
- `POST /auth/login` - Login
- `POST /auth/google` - Google OAuth
- `GET /auth/me` - Get current user

### Trips
- `GET /trips` - List user's trips
- `POST /trips` - Create trip
- `GET /trips/:id` - Get trip details
- `PUT /trips/:id` - Update trip
- `DELETE /trips/:id` - Delete trip

### Activities
- `POST /activities/trips/:tripId/activities` - Create activity
- `PUT /activities/:id` - Update activity
- `DELETE /activities/:id` - Delete activity
- `PUT /activities/trips/:tripId/reorder` - Reorder activities

### Feed (Public)
- `GET /feed` - List published trips (paginated)
- `GET /feed/:id` - Get published trip details
- `POST /feed/:id/publish` - Publish trip (with `allowImports` option)
- `POST /feed/:id/unpublish` - Unpublish trip

### Share
- `POST /share` - Create share link
- `GET /share/:token` - Get shared trip
- `POST /share/:token/import` - Import shared trip

### Members
- `GET /trips/:tripId/members` - List members
- `POST /trips/:tripId/members` - Add member
- `DELETE /trips/:tripId/members/:userId` - Remove member

## Database Schema

Key models (see `backend/prisma/schema.prisma` for full schema):

- **User** - Authentication and profile
- **Trip** - Trip details, dates, publish status
- **Activity** - Itinerary items with location data
- **TripMember** - User-trip relationships with roles
- **ShareLink** - Permanent share tokens
- **Event** - Analytics events

## Development

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8000 |

### After Schema Changes
```bash
cd backend
npx prisma generate        # Regenerate client
npx prisma migrate dev     # Apply migrations
```

## Recent Changes

### December 2024
- **Feed System** - Added public feed as home page where users can browse published trips
- **Trip Stories** - Publishers can add rich text descriptions for feed display
- **Activity Stories** - Each activity can have its own story for the feed
- **Import Feature** - Users can import trips from feed or share links as templates
- **Allow Imports Toggle** - Publishers control whether their trip can be imported
- **Edit Trip Details** - Inline editing for title, description, and cover image
- **UI Improvements** - Renamed "Dashboard" to "My Trips", feed is now the home page

## Team Notes

- The feed is now the main landing page (`/`)
- "My Trips" shows the user's own trips (`/dashboard`)
- Share links are permanent unless explicitly deleted
- When publishing with "Allow imports" unchecked, existing share links are deleted
- Stories (`body` field) are NOT copied during import - users write their own
- Notes ARE copied during import - useful for practical trip info

## Deployment

See deployment instructions in `PROJECT_SPEC.md`.

