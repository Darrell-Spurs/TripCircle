# TripCircle - Travel Planning & Sharing Web App

A full-stack travel planning application built with React (Vite + TypeScript) frontend and Express.js (TypeScript) backend.

## Project Structure

```
final-project/
├── frontend/          # Vite + React + TypeScript
├── backend/           # Express.js + TypeScript
└── PROJECT_SPEC.md    # Project specification
```

## Setup Instructions

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
```
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
```
DATABASE_URL=postgresql://user:password@localhost:5432/tripcircle
JWT_SECRET=your-secret-key-change-this-in-production
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_PLACES_API_KEY=your-google-places-api-key
AMPLITUDE_API_KEY=your-amplitude-api-key
PORT=8000
```

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

- ✅ User authentication (Email/Password + Google OAuth)
- ✅ Trip CRUD operations
- ✅ Day-by-day itinerary planning with activities
- ✅ Drag-and-drop activity reordering
- ✅ Member collaboration (Owner/Editor/Viewer roles)
- ✅ Share links for public/private trip sharing
- ✅ Google Places integration for exploring attractions
- ✅ Analytics tracking (Amplitude + custom dashboard)
- ✅ Admin analytics dashboard

## API Endpoints

See `PROJECT_SPEC.md` for complete API documentation.

## Development

The frontend runs on `http://localhost:3000` (or Vite default port) and the backend runs on `http://localhost:8000`.

## Deployment

See deployment instructions in `PROJECT_SPEC.md`.

