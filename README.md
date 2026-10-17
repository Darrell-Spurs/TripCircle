<div align="center">

# TripCircle

**A collaborative trip planning and sharing platform**

Final project of NTU Web Programming (Fall 2025), Group 55

[Live site](https://trip-circle.vercel.app/) · [Demo video](https://youtu.be/533CHagGErQ) · [Project docs (中文)](final-project/README.md)

</div>

<p align="center">
  <a href="https://youtu.be/533CHagGErQ">
    <img src="assets/tripcircle_preview.jpg" width="90%" alt="TripCircle trip page (click to watch the demo video)">
  </a>
</p>

## Features

- **Itinerary planning:** multi-day trips, drag-and-drop daily activities, time-conflict warnings, and travel-time estimates from Google Directions.
- **Collaboration:** Owner / Editor / Viewer roles, activity participants, comments, expense splitting, preferences, tags, and edit history.
- **Social feed:** publish trips to a public feed with search and filters, comment on trips, share links, and import other people's trips as templates.
- **Explore:** search places with Google Places, save them into folders, share or import folders, and add places to a trip.
- **Photos and more:** trip albums with public cover photos, English / Traditional Chinese UI with localized dates and times, and Amplitude analytics.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite, React Router, Tailwind CSS, dnd-kit, i18n, Google Maps JS API, Places Autocomplete |
| Backend | Express, TypeScript, Prisma, PostgreSQL, JWT, bcrypt, Google OAuth |
| Deployment | Vercel |

## Team

| Member | Responsibilities |
|---|---|
| 詹文淵 | Backend authentication and authorization, Prisma schema and data model, trip / activity / sharing / photo routes, deployment |
| 吳政霖 | Frontend trip and activity UI, drag-and-drop and time-conflict handling, i18n, forms and validation, frontend API integration |
| 游至捷 | Feed publishing and import, photos and covers, Explore / folders / sharing, frontend–backend integration testing |

## Repository Layout

```text
final-project/
├── frontend/          # React + Vite app (deployed on Vercel)
├── backend/           # Express API and Prisma schema
├── PROJECT_SPEC.md    # feature specification
├── CHANGELOG.md
└── README.md          # course submission README with full setup steps (中文)
```

## Running Locally

Requirements: Node.js 18+, PostgreSQL 14+, and a Google Maps / Places API key.

```bash
# backend (http://localhost:8000)
cd final-project/backend
cp .env.example .env        # fill in DATABASE_URL, JWT_SECRET, Google keys
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev

# frontend (http://localhost:3000)
cd ../frontend
cp .env.example .env        # set VITE_API_BASE_URL and VITE_GOOGLE_MAPS_API_KEY
npm install
npm run dev
```

See [final-project/README.md](final-project/README.md) for the full setup guide and the list of flows to test.

## History

This repository started from the course's homework template. The earlier homework folders were removed in October 2026 so that the repository focuses on the final project; the full commit history, including every team member's contributions, is unchanged.
