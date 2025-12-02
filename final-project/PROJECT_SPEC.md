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

## **5.5 Explore Tab**
- Search attractions using Google Places API  
- Search inputs:
  - keyword  
  - location  
- Display map + results list  
- Add a place directly into a trip’s itinerary  

---

## **5.6 Optional: Google Calendar Export**
- OAuth with Google Calendar scopes  
- Export activities as events  
- Automatically assign event times and day mapping  

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
  id           Int      @id @default(autoincrement())
  email        String   @unique
  passwordHash String?
  name         String
  avatarUrl    String?
  provider     String
  trips        Trip[]   @relation("OwnerTrips")
  tripMembers  TripMember[]
  events       Event[]
  createdAt    DateTime @default(now())
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

---

# 10. Frontend Pages

```
/                     – Landing  
/auth/login           – Login  
/auth/register        – Register  
/dashboard            – User trips  
/trips/:id            – Trip planner  
/explore              – Explore attractions  
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
