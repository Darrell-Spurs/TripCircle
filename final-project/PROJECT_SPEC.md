# 🧭 TripCircle – Travel Planning & Sharing Web App  
### **Final Project Specification (Web Programming)**  
*Frontend: React (Vite + TS) • Backend: Express.js (TypeScript) • Database: Postgres + Prisma • Tracking: Amplitude + Custom Dashboard • External APIs: Google Maps/Places/Calendar • Auth: Email/Password + Google OAuth*

---

# 1. Purpose & Audience

This project is developed as the **final project for the Web Programming course**, demonstrating a complete full‑stack architecture including:

- A modern React SPA frontend  
- An Express.js (TypeScript) backend with REST APIs  
- A relational Postgres database  
- Third‑party integrations (Google Places/Maps/Directions)  
- Authentication (Email + Google OAuth)  
- Website analytics (Amplitude + custom analytics dashboard)

The system targets **friend groups planning trips together**, aiming to make collaborative travel planning simple, intuitive, and shareable.

---

# 2. Overview

**TripCircle** is a trip‑focused collaborative travel planning web application.  
Users can create trips, plan day‑by‑day itineraries with friends, explore attractions, leave notes, and share plans publicly or privately.

Key capabilities include:
- Multi‑day itineraries with activities  
- Google Places‑powered Explore tab  
- Add places directly into trips  
- Friend collaboration through invites  
- Share links with view/edit permissions  
- Activity & trip tracking using Amplitude  
- Optional Google Calendar export  

---

# 3. Tech Stack

### **Frontend**
- Vite + React + TypeScript
- Tailwind CSS
- React Query
- Google Maps JavaScript SDK
- Amplitude Browser SDK

### **Backend**
- Express.js (TypeScript)
- Zod validation
- JWT authentication
- Google OAuth (Passport.js)
- Prisma ORM for Node.js

### **Database**
- PostgreSQL (hosted on Supabase/Railway/Render)
- Prisma schema + migrations

### **Tracking**
- Amplitude analytics for frontend events  
- Custom `/events` endpoint storing data into Postgres  
- Internal analytics dashboard querying event logs  

### **External APIs**
- Google Places API for Explore  
- Google Maps JavaScript SDK  
- Google Calendar API (optional integration)

### **Authentication**
- Email/password with bcrypt  
- Google Login via OAuth  
- JWT tokens stored in HttpOnly cookies or Authorization headers  

---

# 4. Goals & Requirements

### **Primary Goals**
1. Let users create and edit trips with multi‑day itineraries.
2. Enable friend collaboration with role‑based permissions.
3. Provide an Explore page for discovering attractions using Google Places.
4. Track user behavior and actions using analytics.
5. Provide an internal admin dashboard for metrics and insights.

### **Non‑Goals**
- Real‑time document‑like editing (only polling required)
- Payment or booking
- Automatic AI itinerary generation

---

# 5. Core Features

## **5.1 Authentication**
- Register & login via email/password  
- Google OAuth login  
- JWT‑based sessions  
- Basic user profile management
- **Return URL preservation** - Login page accepts `?return=` query parameter and redirects users back to their original page after authentication  

---

## **5.2 Trips**
- Create, view, edit, delete trips  
- Fields: title, description, cover image, start/end dates, status  
- Owner can manage members and permission levels  

---

## **5.3 Itinerary Planning**
- Days automatically generated from date range  
- Activities per day:
  - title (uses location name, with "Untitled Activity" fallback)
  - notes  
  - body (rich description/story for feed display)
  - start/end time (24-hour clock format)
  - ordering index  
  - place info from Google Places (optional)  
  - Google Places Autocomplete integration for location search
  - Time overlap detection with custom error alerts
  - Quick time adjustment buttons (+15m, +30m, -15m, -30m) for start and end times

- Drag‑and‑drop reordering of activities  
- **Transportation Segments**: Automatic route calculation between consecutive activities
  - Google Directions API integration
  - Distance and duration display
  - Transportation mode selection (driving, walking, bicycling, transit)
  - Pace buffer settings (Tight: 10% pre/post, Neutral: 15%, Relaxed: 20%)
  - Visual transportation time blocks between activities
  - Google Maps route visualization with polyline decoding  

---

## **5.4 Collaboration & Sharing**
- Invite collaborators via email  
- Roles:
  - **Owner**
  - **Editor**
  - **Viewer**
- Generate share links with limited permissions (view or edit)
- Public read‑only trip page via `/share/:token`
- **Activity Collaboration Features**:
  - **Activity Participants**: Track who's joining each activity (defaults to all trip members)
  - **Activity Comments**: Discussion threads on individual activities
  - **Cost Tracking**: Set activity costs with currency support
  - **Cost Shares**: Split expenses among participants (auto-equal or custom amounts)
  - **Activity Preferences**: Vote "interested" or "not interested" on activities
  - **Activity Tags**: Categorize activities with custom tags
  - **Activity History**: View audit trail of changes (who edited what and when)
  - **Activity Creator**: Track who created each activity
  - **Conflict Resolution**: Optimistic locking with last-write-wins strategy

---

## **5.5 Trip Photo Albums**
- Add photos to trips via URL or direct file upload from device (max 10MB file size)
- Photos tab in trip detail page (alongside Itinerary)
- Owner/Editor can add, edit, and delete photos
- Mark photos as public for feed display
- Select a public photo as feed cover image
- Feed cover priority: explicit cover > random public photo > trip cover > default gradient
- Backend configured to handle base64-encoded images up to 15MB (supports 10MB files when base64-encoded)

---

## **5.6 Trip Comments (Feed)**
- Comment on published trips in the feed
- Users can add, edit, and delete their own comments
- Trip owners can delete any comment on their posts
- Comment count displayed on feed cards

---

## **5.7 Feed Search & Clickable Content**
- Feed search with keyword filtering (title/description/places) and date range filters
- Activity location chips in the feed are clickable to filter by that location
- Chips also provide a "Search in Explore" shortcut that pre-fills the Explore page with the location keyword

---

## **5.8 Explore Tab**
- Two-tab interface: **Search** and **My Collections**
- **Search Tab**:
  - Search attractions using Google Places API  
  - Search inputs:
    - keyword  
    - location  
  - Display map + results list  
  - Add a place directly into a trip's itinerary
  - Save places to location collections
- **My Collections Tab**:
  - Manage location folders (create, edit, delete)
  - View saved locations in each folder
  - Edit location notes and tags
  - Import locations from folders into trips
  - Share public folders via share links  

---

## **5.9 Internationalization (i18n)**
- Full multi-language support (English and Traditional Chinese)
- Language switcher in navigation
- All UI elements translated (buttons, labels, messages, tabs)
- Locale-aware date and time formatting
- Translated error messages and validation feedback
- Language preference persisted in user context

## **5.10 Location Collections**
- **Location Folders**: Organize saved places into named collections
  - Create, edit, delete folders
  - Public/private folder settings
  - Folder descriptions
- **Saved Locations**: Store place data with metadata
  - Name, address, coordinates (lat/lng), placeId
  - Custom notes and tags
  - Multiple locations per folder
- **Folder Sharing**: Share public folders via share links
  - View or edit permissions
  - Optional expiration dates
  - Import shared folders to your account
- **Quick Import**: Import multiple locations from folders into trips
  - Select folder and locations
  - Choose target date
  - Bulk create activities
- **Integration**: 
  - "Save to Folder" from Explore search results
  - "Add from Folder" button in Activity Modal for quick location selection
  - "Import from Folder" in Trip Detail page

## **5.11 Google Maps Integration**
- Interactive map display in itinerary view
- Activity markers with custom info windows
- Route visualization between activities using Google Directions API
- Polyline decoding for route display
- Map auto-zoom to contain all locations
- POI click prevention (clickableIcons: false)
- Advanced Markers support (when Map ID is configured)  

---

# 6. Tracking & Analytics

## **6.1 Amplitude**
Frontend sends events such as:
- `user_registered`
- `user_logged_in`
- `trip_created`
- `activity_added`
- `explore_search`
- `share_link_opened`

---

## **6.2 Custom Backend Event Logging**
`POST /events`  
Stored in Postgres for internal dashboard.

Common events:
- trip_created  
- activity_added  
- trip_shared  
- trip_viewed  

---

## **6.3 Admin Analytics Dashboard**
Route: `/admin/analytics`  
Displays:
- Total users  
- Trips created over time  
- Daily active users  
- Explore usage metrics  
- Shared trip statistics  
- Most active trip groups  

---

# 7. System Architecture

```
┌───────────────────────────────────────────┐
│                Frontend                   │
│     React + Vite + TS + React Query       │
│     Google Maps JS SDK + Amplitude        │
│     i18n (English/Traditional Chinese)     │
└───────────────────────▲───────────────────┘
                        │
                        │ (JSON API calls)
                        ▼
┌───────────────────────────────────────────┐
│            Express.js Backend             │
│ JWT Auth  |  Google OAuth  |  Zod         │
│ Trips API | Activities API | Places API   │
│ Directions API | Location Folders API    │
│ Custom event logging                       │
└───────────────────────▲───────────────────┘
                        │
                        │ (Prisma ORM)
                        ▼
┌───────────────────────────────────────────┐
│                PostgreSQL                 │
│  users          trips          events     │
│  trip_members   activities     share_links│
│  activity_*     location_folders          │
│  saved_locations trip_photos               │
└───────────────────────────────────────────┘
```

---

# 8. Database Schema (Prisma)

```prisma
model User {
  id                  Int                  @id @default(autoincrement())
  email               String               @unique
  passwordHash        String?
  name                String
  avatarUrl           String?
  provider            String
  trips               Trip[]               @relation("OwnerTrips")
  tripMembers         TripMember[]
  events              Event[]
  createdActivities   Activity[]           @relation("CreatedActivities")
  activityParticipants ActivityParticipant[]
  activityComments    ActivityComment[]
  activityCostShares  ActivityCostShare[]
  activityPreferences ActivityPreference[]
  activityHistory     ActivityHistory[]
  tripComments        TripComment[]
  addedPhotos         TripPhoto[]          @relation("AddedPhotos")
  locationFolders     LocationFolder[]
  locationFolderMembers LocationFolderMember[] @relation("LocationFolderMembers")
  createdAt           DateTime             @default(now())
}

model Trip {
  id          Int          @id @default(autoincrement())
  ownerId     Int
  owner       User         @relation("OwnerTrips", fields: [ownerId], references: [id])
  title       String
  description String?
  body        String?
  coverImage  String?
  startDate   DateTime
  endDate     DateTime
  status      String
  isPublished Boolean      @default(false)
  publishedAt DateTime?
  members     TripMember[]
  activities  Activity[]
  shareLinks  ShareLink[]
  events      Event[]
  tripComments TripComment[]
  photos      TripPhoto[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model TripMember {
  id     Int   @id @default(autoincrement())
  tripId Int
  userId Int
  role   String
  trip   Trip @relation(fields: [tripId], references: [id])
  user   User @relation(fields: [userId], references: [id])

  @@unique([tripId, userId])
}

model Activity {
  id              Int                  @id @default(autoincrement())
  tripId          Int
  date            DateTime
  startTime       DateTime?
  endTime         DateTime?
  title           String
  notes           String?
  body            String?
  placeId         String?
  locationName    String?
  address         String?
  lat             Float?
  lng             Float?
  orderIndex      Int
  createdByUserId Int?
  cost            Float?
  currency        String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  trip            Trip @relation(fields: [tripId], references: [id], onDelete: Cascade)
  createdBy       User? @relation("CreatedActivities", fields: [createdByUserId], references: [id], onDelete: SetNull)
  participants    ActivityParticipant[]
  comments        ActivityComment[]
  costShares      ActivityCostShare[]
  preferences     ActivityPreference[]
  tags            ActivityTag[]
  history         ActivityHistory[]
}

model ShareLink {
  id         Int      @id @default(autoincrement())
  tripId     Int
  token      String   @unique
  permission String
  expiresAt  DateTime?
  trip       Trip @relation(fields: [tripId], references: [id])
}

model Event {
  id        Int      @id @default(autoincrement())
  userId    Int?
  tripId    Int?
  eventType String
  metadata  Json?
  createdAt DateTime @default(now())
  user      User?    @relation(fields: [userId], references: [id])
  trip      Trip?    @relation(fields: [tripId], references: [id])
}

model TripComment {
  id        Int      @id @default(autoincrement())
  tripId    Int
  userId    Int
  content   String
  trip      Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model TripPhoto {
  id            Int      @id @default(autoincrement())
  tripId        Int
  url           String
  caption       String?
  isPublic      Boolean  @default(false)
  isFeedCover   Boolean  @default(false)
  addedByUserId Int
  trip          Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)
  addedBy       User     @relation("AddedPhotos", fields: [addedByUserId], references: [id], onDelete: Cascade)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model ActivityParticipant {
  id         Int      @id @default(autoincrement())
  activityId Int
  userId     Int
  activity   Activity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())
  @@unique([activityId, userId])
}

model ActivityComment {
  id         Int      @id @default(autoincrement())
  activityId Int
  userId     Int
  content    String
  activity   Activity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model ActivityCostShare {
  id         Int      @id @default(autoincrement())
  activityId Int
  userId     Int
  amount     Float
  activity   Activity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  @@unique([activityId, userId])
}

model ActivityPreference {
  id         Int      @id @default(autoincrement())
  activityId Int
  userId     Int
  preference String   // "interested" or "not_interested"
  activity   Activity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  @@unique([activityId, userId])
}

model ActivityHistory {
  id         Int      @id @default(autoincrement())
  activityId Int
  userId     Int
  action     String   // "created", "updated", "deleted"
  changes    Json?
  activity   Activity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())
}

model ActivityTag {
  id         Int      @id @default(autoincrement())
  activityId Int
  tag        String
  activity   Activity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())
  @@unique([activityId, tag])
  @@index([tag])
}

model LocationFolder {
  id          Int                      @id @default(autoincrement())
  userId      Int
  name        String
  description String?
  isPublic    Boolean                  @default(false)
  createdAt   DateTime                 @default(now())
  updatedAt   DateTime                 @updatedAt
  owner       User                     @relation(fields: [userId], references: [id], onDelete: Cascade)
  locations   SavedLocation[]
  shareLinks  LocationFolderShareLink[]
  members     LocationFolderMember[]
  @@index([userId])
}

model SavedLocation {
  id        Int            @id @default(autoincrement())
  folderId  Int
  name      String
  address   String
  lat       Float
  lng       Float
  placeId   String
  notes     String?
  tags      Json?          // Array of strings
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt
  folder    LocationFolder @relation(fields: [folderId], references: [id], onDelete: Cascade)
  @@index([folderId])
}

model LocationFolderShareLink {
  id         Int            @id @default(autoincrement())
  folderId   Int
  token      String         @unique
  permission String
  expiresAt  DateTime?
  createdAt  DateTime       @default(now())
  folder     LocationFolder @relation(fields: [folderId], references: [id], onDelete: Cascade)
  @@index([token])
}

model LocationFolderMember {
  id        Int            @id @default(autoincrement())
  folderId  Int
  userId    Int
  role      String
  createdAt DateTime       @default(now())
  folder    LocationFolder @relation(fields: [folderId], references: [id], onDelete: Cascade)
  user      User           @relation("LocationFolderMembers", fields: [userId], references: [id], onDelete: Cascade)
  @@unique([folderId, userId])
}
```

---

# 9. API Routes

## **Auth**
```
POST /auth/register  
POST /auth/login  
GET  /auth/me  
GET  /auth/google/login  
GET  /auth/google/callback  
```

## **Trips**
```
GET    /trips  
POST   /trips  
GET    /trips/:id  
PUT    /trips/:id  
DELETE /trips/:id  
```

## **Activities**
```
POST   /activities/trips/:tripId/activities  – Create activity (with participantIds, cost, tags)
PUT    /activities/:id                       – Update activity (with conflict resolution)
DELETE /activities/:id                      – Delete activity
PATCH  /activities/reorder                   – Reorder activities
```

## **Members & Sharing**
```
GET    /trips/:id/members  
POST   /trips/:id/members  
PATCH  /members/:id  
DELETE /members/:id  

POST   /trips/:id/share-links  
GET    /share/:token  
```

## **Explore & Places**
```
GET /places/search          – Search Google Places
GET /places/directions      – Get route between two coordinates (for transportation segments)
```

## **Location Folders**
```
GET    /location-folders                          – List user's folders
POST   /location-folders                          – Create folder
GET    /location-folders/:id                      – Get folder with locations
PUT    /location-folders/:id                      – Update folder
DELETE /location-folders/:id                      – Delete folder
POST   /location-folders/:folderId/locations      – Add saved location
PUT    /location-folders/:folderId/locations/:id  – Update location
DELETE /location-folders/:folderId/locations/:id  – Delete location
POST   /location-folders/:folderId/share-links    – Create share link
GET    /location-folders/shared/:token            – Access shared folder
POST   /location-folders/shared/:token/import      – Import shared folder
```

## **Activity Collaboration**
```
GET    /activities/:id/participants       – List participants
POST   /activities/:id/participants       – Set participants
DELETE /activities/:id/participants/:userId – Remove participant
GET    /activities/:id/comments           – List comments
POST   /activities/:id/comments          – Add comment
PUT    /activities/comments/:commentId   – Edit comment
DELETE /activities/comments/:commentId   – Delete comment
GET    /activities/:id/cost-shares        – List cost shares
POST   /activities/:id/cost-shares        – Set cost shares
DELETE /activities/:id/cost-shares        – Clear cost shares
GET    /activities/:id/preferences        – Get preferences
POST   /activities/:id/preferences        – Set preference
DELETE /activities/:id/preferences        – Remove preference
GET    /activities/:id/tags               – List tags
POST   /activities/:id/tags               – Add tag
DELETE /activities/:id/tags/:tag           – Remove tag
GET    /activities/:id/history            – Get change history
```

## **Events**
```
POST /events
```

## **Admin Metrics**
```
GET /admin/metrics
```

## **Trip Comments**
```
GET    /feed/:id/comments         – List comments (public)
POST   /feed/:id/comments         – Add comment (auth)
PUT    /feed/comments/:commentId  – Edit own comment
DELETE /feed/comments/:commentId  – Delete comment
```

## **Trip Photos**
```
GET    /photos/trips/:tripId/photos                    – List album photos
POST   /photos/trips/:tripId/photos                    – Add photo
PUT    /photos/:id                                     – Update photo
DELETE /photos/:id                                     – Delete photo
POST   /photos/trips/:tripId/photos/:id/set-feed-cover – Set feed cover
DELETE /photos/trips/:tripId/feed-cover                – Clear feed cover
```

---

# 10. Frontend Pages

```
/                              – Redirects to /feed  
/feed                          – Public feed (browse published trips with search & filters)  
/feed/:id                      – Published trip details + comments + public photos
/auth/login                    – Login (supports ?return= query parameter)  
/auth/register                 – Register  
/dashboard                     – User trips  
/trips/:id                     – Trip planner (Itinerary + Photos tabs, map view)
/explore                       – Explore attractions & manage location collections (two tabs: Search, My Collections)
/share/:token                  – Public trip view  
/location-folders/shared/:token – Shared collection folder view  
/admin/analytics               – Admin dashboard  
```

---

# 11. Development Timeline

### **Weeks 1–2**
- Project setup  
- Auth system  
- Trips CRUD  
- Basic UI pages  

### **Week 3**
- Activities API + itinerary editor  
- Member permissions  

### **Week 4**
- Sharing system  
- Public read‑only pages  
- Explore tab integration  

### **Week 5**
- Amplitude + event logging  
- Admin dashboard  

### **Week 6**
- UI polish  
- Calendar export (optional)  
- Final testing & deployment  

---

# 12. Deliverables

- Fully deployed website (frontend + backend)  
- GitHub repository with complete source code  
- Technical report:
  - System architecture
  - ERD diagram
  - API documentation
  - Screenshots
  - Feature descriptions  
- Recorded demo video  
- PROJECT_SPEC.md (this document)  

---

This concludes the **official, polished TripCircle project specification**.
