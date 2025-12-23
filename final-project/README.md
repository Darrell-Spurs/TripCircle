# TripCircle - Travel Planning & Sharing Web App

A full-stack travel planning application built with React (Vite + TypeScript) frontend and Express.js (TypeScript) backend. Users can plan trips, collaborate with others, and share their travel experiences with the community.

Deploy link: https://trip-circle.vercel.app/

---

## Project Structure

```
final-project/
├── frontend/          # Vite + React + TypeScript
│   ├── src/
│   │   ├── components/    # Reusable UI components
    │   │   │   ├── Navbar.tsx
    │   │   │   ├── ItineraryDay.tsx
    │   │   │   ├── ActivityCard.tsx
    │   │   │   ├── ActivityModal.tsx
    │   │   │   ├── ActivityCommentsPanel.tsx
    │   │   │   ├── ActivityCostShareEditor.tsx
    │   │   │   ├── ActivityParticipantSelector.tsx
    │   │   │   ├── ActivityPreferenceButtons.tsx
    │   │   │   ├── ActivityTagSelector.tsx
    │   │   │   ├── MemberList.tsx
    │   │   │   ├── InviteMemberModal.tsx
    │   │   │   ├── TripCommentsSection.tsx
    │   │   │   ├── TripPhotosTab.tsx
    │   │   │   ├── AddPhotoModal.tsx
    │   │   │   ├── LanguageSwitcher.tsx
    │   │   │   ├── ProtectedRoute.tsx
    │   │   │   └── AlertModal.tsx
│   │   ├── pages/         # Page components (routes)
│   │   │   ├── Feed.tsx
│   │   │   ├── FeedTripDetail.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── TripDetail.tsx
│   │   │   ├── CreateTrip.tsx
│   │   │   ├── Explore.tsx
│   │   │   ├── ShareTrip.tsx
│   │   │   ├── ShareLocationFolder.tsx
│   │   │   ├── AdminAnalytics.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── GoogleCallback.tsx
│   │   │   └── Landing.tsx
│   │   ├── hooks/         # Custom React hooks (API calls)
    │   │   │   ├── useTrips.ts
    │   │   │   ├── useActivities.ts
    │   │   │   ├── useFeed.ts
    │   │   │   ├── useMembers.ts
    │   │   │   ├── useShare.ts
    │   │   │   ├── usePlaces.ts
    │   │   │   ├── useActivityComments.ts
    │   │   │   ├── useActivityCostShares.ts
    │   │   │   ├── useActivityParticipants.ts
    │   │   │   ├── useActivityPreferences.ts
    │   │   │   ├── useActivityTags.ts
    │   │   │   ├── useActivityHistory.ts
    │   │   │   ├── useTripComments.ts
    │   │   │   └── useTripPhotos.ts
│   │   ├── context/       # React context
│   │   │   ├── AuthContext.tsx
│   │   │   └── LanguageContext.tsx
│   │   ├── lib/           # Utilities (API client, analytics)
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   └── amplitude.ts
│   │   ├── types/         # TypeScript interfaces
│   │   └── i18n/          # Internationalization
│   └── ...
├── backend/           # Express.js + TypeScript + Prisma
│   ├── src/
│   │   ├── routes/        # API route handlers
    │   │   │   ├── auth.ts
    │   │   │   ├── trips.ts
    │   │   │   ├── activities.ts
    │   │   │   ├── feed.ts
    │   │   │   ├── share.ts
    │   │   │   ├── members.ts
    │   │   │   ├── photos.ts
    │   │   │   ├── places.ts
    │   │   │   ├── events.ts
    │   │   │   └── admin.ts
│   │   ├── middleware/    # Auth middleware
│   │   ├── constants/     # Tag validation, etc.
│   │   ├── utils/
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
- **User Authentication** - Email/Password + Google OAuth
- **Trip Management** - Create, edit, delete trips with cover images
- **Itinerary Planning** - Day-by-day activities with times and locations
- **Drag-and-Drop** - Reorder activities within each day
- **Collaboration** - Invite members with Owner/Editor/Viewer roles
- **Share Links** - Generate permanent links for trip sharing

### Activity Collaboration Features
- **Activity Participants** - Track who's joining each activity (defaults to all members)
- **Activity Comments** - Discussion threads on individual activities
- **Cost Tracking** - Set activity costs with currency support
- **Cost Shares** - Split expenses among participants (auto-equal or custom amounts)
- **Activity Preferences** - Vote "interested" or "not interested" on activities
- **Activity Tags** - Categorize activities with custom tags
- **Activity History** - View audit trail of changes (who edited what and when)
- **Activity Creator** - Track who created each activity

### Feed & Social Features
- **Public Feed** - Browse published trips from the community (home page)
- **Trip Publishing** - Publish trips to feed with optional "story" text
- **Activity Stories** - Add rich descriptions to activities for feed display
- **Trip Import** - Import published trips as templates for your own trips
- **Allow Imports Toggle** - Publishers control if others can import their trips
- **Trip Comments** - Comment and discuss on published trips in the feed
- **Trip Photo Albums** - Add photos to trips via URL or direct file upload (max 10MB)
- **Public Photos** - Mark photos as public to display in the feed
- **Feed Cover Image** - Choose a public photo as the feed cover (separate from trip cover)
- **Large File Support** - Backend configured to handle base64-encoded images up to 15MB

### Explore & Discovery
- **Google Places Integration** - Search and explore attractions
- **Add to Trip** - Add discovered places directly to your itinerary
- **Location Collections** - Save favorite locations to organized folders
- **Public/Private Collections** - Mark collections as public (anyone can view) or private (only owner/members)
- **Folder Sharing** - Share public location folders via share links (private collections cannot be shared)
- **Shared Collection Viewing** - View and import shared collection folders via share links

### Admin & Analytics
- **Analytics Dashboard** - View user and trip statistics
- **Amplitude Integration** - Track user behavior

### Multi-language Support
- **i18n** - Language switcher for internationalization

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

### Activity Collaboration
- **Participants**: By default, all trip members are added to new activities. Editors can customize who joins each activity.
- **Cost Splitting**: When you set a cost, it's automatically split equally among participants. Custom splits are also supported.
- **Preferences**: Members can indicate interest level to help group decision-making.
- **Comments**: Discuss details, suggest alternatives, or coordinate logistics.

### Authentication & User Experience
- **Return URL Preservation**: After login, users are redirected back to the page they were viewing (shared trips, feed posts, etc.)
- **Login Flow**: Login page accepts `?return=` query parameter to preserve user's original destination
- **Comment Login**: Users can click login button in comment section and return to the same post after authentication

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
- `PATCH /activities/reorder` - Reorder activities

### Activity Participants
- `GET /activities/:id/participants` - List participants
- `POST /activities/:id/participants` - Set participants (array of userIds)
- `DELETE /activities/:id/participants/:userId` - Remove participant

### Activity Comments
- `GET /activities/:id/comments` - List comments
- `POST /activities/:id/comments` - Add comment
- `PUT /activities/comments/:commentId` - Edit comment
- `DELETE /activities/comments/:commentId` - Delete comment

### Activity Cost Shares
- `GET /activities/:id/cost-shares` - List cost shares
- `POST /activities/:id/cost-shares` - Set cost shares
- `DELETE /activities/:id/cost-shares` - Clear cost shares

### Activity Preferences
- `GET /activities/:id/preferences` - Get preferences with counts
- `POST /activities/:id/preferences` - Set preference (interested/not_interested)
- `DELETE /activities/:id/preferences` - Remove preference

### Activity Tags
- `GET /activities/:id/tags` - List tags
- `POST /activities/:id/tags` - Add tags
- `DELETE /activities/:id/tags/:tag` - Remove tag

### Activity History
- `GET /activities/:id/history` - Get change history

### Feed (Public)
- `GET /feed` - List published trips (paginated, includes feedCoverImage)
- `GET /feed/:id` - Get published trip details with public photos
- `POST /feed/:id/publish` - Publish trip (with `allowImports` option)
- `POST /feed/:id/unpublish` - Unpublish trip

### Trip Comments
- `GET /feed/:id/comments` - List comments on published trip (public)
- `POST /feed/:id/comments` - Add comment (authenticated)
- `PUT /feed/comments/:commentId` - Edit own comment
- `DELETE /feed/comments/:commentId` - Delete own comment (or trip owner can delete)

### Trip Photos
- `GET /photos/trips/:tripId/photos` - List all photos in album (members only)
- `POST /photos/trips/:tripId/photos` - Add photo (Owner/Editor)
- `PUT /photos/:id` - Update photo (caption, isPublic)
- `DELETE /photos/:id` - Delete photo
- `POST /photos/trips/:tripId/photos/:id/set-feed-cover` - Set as feed cover
- `DELETE /photos/trips/:tripId/feed-cover` - Clear feed cover selection

### Share
- `POST /share` - Create share link
- `GET /share/:token` - Get shared trip
- `POST /share/:token/import` - Import shared trip

### Members
- `GET /trips/:tripId/members` - List members
- `POST /trips/:tripId/members` - Add member
- `DELETE /trips/:tripId/members/:userId` - Remove member

### Places
- `GET /places/search` - Search Google Places

### Events & Admin
- `POST /events` - Log analytics event
- `GET /admin/metrics` - Get admin metrics

## Database Schema

Key models (see `backend/prisma/schema.prisma` for full schema):

### Core Models
- **User** - Authentication and profile
- **Trip** - Trip details, dates, publish status
- **Activity** - Itinerary items with location, cost, times
- **TripMember** - User-trip relationships with roles
- **ShareLink** - Permanent share tokens
- **Event** - Analytics events

### Activity Collaboration Models
- **ActivityParticipant** - Users joining an activity
- **ActivityComment** - Discussion comments on activities
- **ActivityCostShare** - Cost split per user per activity
- **ActivityPreference** - Interest votes on activities
- **ActivityTag** - Tags assigned to activities
- **ActivityHistory** - Audit trail of activity changes

### Feed & Social Models
- **TripComment** - Comments on published trips
- **TripPhoto** - Photos in trip album (url, caption, isPublic, isFeedCover)

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

## Frontend Pages

| Route | Description |
|-------|-------------|
| `/` | Redirects to Feed |
| `/feed` | Public feed - browse published trips |
| `/feed/:id` | View published trip details |
| `/dashboard` | My Trips - user's own trips |
| `/trips/new` | Create new trip |
| `/trips/:id` | Trip planner/editor |
| `/explore` | Search attractions & manage location collections (two tabs: Search, My Collections) |
| `/location-folders` | Manage location collections (create, edit, delete folders) |
| `/share/:token` | View shared trip |
| `/location-folders/shared/:token` | View shared collection folder |
| `/admin/analytics` | Admin dashboard |
| `/auth/login` | Login page (supports `?return=` query parameter for redirect after login) |
| `/auth/register` | Registration page |

## Team Notes

- The feed is the main landing page (`/` redirects to `/feed`)
- "My Trips" shows the user's own trips (`/dashboard`)
- Share links are permanent unless explicitly deleted
- When publishing with "Allow imports" unchecked, existing share links are deleted
- Stories (`body` field) are NOT copied during import - users write their own
- Notes ARE copied during import - useful for practical trip info
- Activity participants default to all trip members when creating new activities
- Cost shares are auto-calculated as equal split when cost is set

## ✅ Recently Completed Features

### Trip Comments (Completed)
- [x] Add comment section on published trips
- [x] Users can add, edit, delete their own comments
- [x] Trip owners can delete any comment on their posts
- [x] Comment count displayed on feed cards

### Trip Photo Albums (Completed)
- [x] Add photos to trips via URL with optional caption
- [x] Photos tab in trip detail page (alongside Itinerary)
- [x] Mark photos as public for feed display
- [x] Select a public photo as feed cover (separate from trip cover)
- [x] Feed cover priority: explicit cover > random public photo > trip cover > default
- [x] Public photos gallery displayed on feed trip detail page
- [x] Lightbox for viewing photos

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

### 4. Save/Bookmark Posts
- [ ] Add "Save/Bookmark" button on feed posts
- [ ] Show saved posts in user's dashboard
- [ ] Consider: notifications when someone comments on your post?

### 5. Publisher Analytics Dashboard
- [ ] Show stats for your published trips: views, imports, saves
- [ ] Add to existing dashboard or create new "My Posts" section
- [ ] Track: view count, import count, comments count per post

## Deployment

### Vercel Deployment (Frontend)
- Frontend is deployed on Vercel at https://trip-circle.vercel.app/
- `vercel.json` configured with SPA rewrite rules to handle client-side routing
- All routes are rewritten to `/index.html` to prevent 404 errors on page refresh

### Backend Configuration
- Express body parser limit increased to 15MB to support base64-encoded image uploads
- Payload size validation with user-friendly error messages (413 status code)

See deployment instructions in `PROJECT_SPEC.md`.
