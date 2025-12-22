# 🧭 TripCircle – Travel Planning & Sharing Web App  
### **Final Project Specification (Web Programming)**  
*Frontend: React (Vite + TS) • Backend: FastAPI • Database: Postgres + Prisma • Tracking: Amplitude + Custom Dashboard • External APIs: Google Maps/Places/Calendar • Auth: Email/Password + Google OAuth*

---

# 1. Purpose & Audience

This project is developed as the **final project for the Web Programming course**, demonstrating a complete full‑stack architecture including:

- A modern React SPA frontend  
- A FastAPI backend with REST APIs  
- A relational Postgres database  
- Third‑party integrations (Google Places/Maps/Calendar)  
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
- FastAPI (Python)
- Pydantic validation
- JWT authentication
- Google OAuth (Authlib)
- Prisma ORM for Python

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

---

## **5.2 Trips**
- Create, view, edit, delete trips  
- Fields: title, description, cover image, start/end dates, status  
- Owner can manage members and permission levels  

---

## **5.3 Itinerary Planning**
- Days automatically generated from date range  
- Activities per day:
  - title  
  - notes  
  - start/end time  
  - ordering index  
  - place info from Google Places (optional)  

- Drag‑and‑drop reordering of activities  

---

## **5.4 Collaboration & Sharing**
- Invite collaborators via email  
- Roles:
  - **Owner**
  - **Editor**
  - **Viewer**
- Generate share links with limited permissions (view or edit)
- Public read‑only trip page via `/share/:token`

---

## **5.5 Trip Photo Albums**
- Add photos to trips via URL with optional caption
- Upload photos directly from device (file upload with base64 data URL conversion)
- File validation: image types only, maximum 10MB file size
- Photos tab in trip detail page (alongside Itinerary)
- Owner/Editor can add, edit, and delete photos
- Mark photos as public for feed display
- Select a public photo as feed cover image
- Feed cover priority: explicit cover > random public photo > trip cover > default gradient

---

## **5.6 Trip Comments (Feed)**
- Comment on published trips in the feed
- Users can add, edit, and delete their own comments
- Trip owners can delete any comment on their posts
- Comment count displayed on feed cards

---

## **5.7 Explore Tab**
- Search attractions using Google Places API  
- Search inputs:
  - keyword  
  - location  
- Display map + results list  
- Add a place directly into a trip's itinerary  
- **Two-tab interface:**
  - **Search Tab**: Discover new locations via Google Places
  - **My Collections Tab**: Manage saved location folders
- **Save to Folder**: Save discovered places to organized collections
- **Folder Management**: Create, edit, delete folders with descriptions
- **Location Notes & Tags**: Add custom notes and tags to saved locations
- **Quick Import**: Import multiple locations from folders into trips

---

## **5.10 Location Collections**
- **Save Locations**: Save favorite places from Explore to organized folders
- **Folder Organization**: Create multiple folders to categorize locations (e.g., "Tokyo Restaurants", "Must-See Attractions")
- **Location Details**: Store place data (name, address, lat/lng, placeId) plus user-added notes and tags
- **Import to Trips**: Select multiple locations from folders and import them into trip activities
- **Quick Select**: "Add from Folder" button in activity creation modal for fast location selection
- **Folder Sharing**: Share location folders via share links (view or edit permissions)
- **Import Shared Folders**: Copy shared folders to your account
- **Folder Collaboration**: Invite others to folders with editor/viewer roles
- **Public Folders**: Option to make folders publicly accessible

---

## **5.8 Optional: Google Calendar Export**
- OAuth with Google Calendar scopes  
- Export activities as events  
- Automatically assign event times and day mapping  

## **5.9 Internationalization (i18n)**
- Full multi-language support for Traditional Chinese (zh-TW) and English (en)
- Language switcher in navigation bar
- All UI text translated including:
  - Navigation, tabs (Itinerary, Photos), buttons, labels
  - Activity management, trip details, feed content
  - Comments, photo upload, error messages
- Locale-aware date and time formatting
- Date displays adapt to selected language (e.g., "December 20, 2024" vs "2024年12月20日")
- All photo-related features fully internationalized (upload methods, file validation, captions)

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
└───────────────────────▲───────────────────┘
                        │
                        │ (JSON API calls)
                        ▼
┌───────────────────────────────────────────┐
│                FastAPI Backend            │
│ JWT Auth  |  Google OAuth  |  Pydantic    │
│ Trips API | Activities API | Explore API  │
│ Calendar Sync (optional)                 │
│ Custom event logging                       │
└───────────────────────▲───────────────────┘
                        │
                        │ (Prisma ORM)
                        ▼
┌───────────────────────────────────────────┐
│                PostgreSQL                 │
│  users          trips          events     │
│  trip_members   activities     share_links│
└───────────────────────────────────────────┘
```

---

# 8. Database Schema (Prisma)

```prisma
model User {
  id                  Int                  @id @default(autoincrement())
  email                String               @unique
  passwordHash         String?
  name                 String
  avatarUrl            String?
  provider             String
  trips                Trip[]               @relation("OwnerTrips")
  tripMembers          TripMember[]
  events               Event[]
  locationFolders      LocationFolder[]
  locationFolderMembers LocationFolderMember[]
  createdAt            DateTime             @default(now())
}

model Trip {
  id          Int          @id @default(autoincrement())
  ownerId     Int
  owner       User         @relation("OwnerTrips", fields: [ownerId], references: [id])
  title       String
  description String?
  coverImage  String?
  startDate   DateTime
  endDate     DateTime
  status      String
  members     TripMember[]
  activities  Activity[]
  shareLinks  ShareLink[]
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
  id           Int      @id @default(autoincrement())
  tripId       Int
  date         DateTime
  startTime    DateTime?
  endTime      DateTime?
  title        String
  notes        String?
  placeId      String?
  locationName String?
  address      String?
  lat          Float?
  lng          Float?
  orderIndex   Int
  trip         Trip @relation(fields: [tripId], references: [id])
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
  addedBy       User     @relation(fields: [addedByUserId], references: [id], onDelete: Cascade)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
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
}

model LocationFolderShareLink {
  id         Int            @id @default(autoincrement())
  folderId   Int
  token      String         @unique
  permission String
  expiresAt  DateTime?
  createdAt  DateTime       @default(now())
  folder     LocationFolder @relation(fields: [folderId], references: [id], onDelete: Cascade)
}

model LocationFolderMember {
  id        Int            @id @default(autoincrement())
  folderId  Int
  userId    Int
  role      String
  createdAt DateTime       @default(now())
  folder    LocationFolder @relation(fields: [folderId], references: [id], onDelete: Cascade)
  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)

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
POST   /trips/:id/activities  
PUT    /activities/:id  
DELETE /activities/:id  
PATCH  /activities/reorder  
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

## **Explore**
```
GET /places/search
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

## **Location Folders**
```
GET    /location-folders                               – List user's folders
POST   /location-folders                               – Create folder
GET    /location-folders/:id                           – Get folder with locations
PUT    /location-folders/:id                           – Update folder
DELETE /location-folders/:id                           – Delete folder
POST   /location-folders/:id/locations                 – Save location to folder
PUT    /location-folders/:id/locations/:locationId     – Update location (notes/tags)
DELETE /location-folders/:id/locations/:locationId    – Remove location
POST   /location-folders/:id/share-links                – Create share link
GET    /location-folders/shared/:token                 – Access shared folder
POST   /location-folders/:id/import                    – Import folder to account
```

---

# 10. Frontend Pages

```
/                     – Redirects to /feed  
/feed                 – Public feed (browse published trips)  
/feed/:id             – Published trip details + comments + public photos
/auth/login           – Login  
/auth/register        – Register  
/dashboard            – User trips  
/trips/:id            – Trip planner (Itinerary + Photos tabs)
/explore              – Explore attractions & manage location collections (Search/My Collections tabs)
/share/:token         – Public trip view  
/admin/analytics      – Admin dashboard  
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
