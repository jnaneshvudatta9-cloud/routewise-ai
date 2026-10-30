# RouteWise AI 🚚

> AI-powered delivery route optimization for local businesses and delivery fleets.

## Features

- 🌍 **Global address search** via Nominatim/OpenStreetMap
- 🗺️ **Interactive map** with Leaflet + OpenStreetMap tiles
- 🛣️ **Real road routing** via OSRM (actual road network geometry)
- 🚦 **Live Traffic Intelligence** via Mapbox Directions API (`driving-traffic` profile) with automatic fallback to standard road routing
- 🔄 **Route optimization** using Nearest-Neighbor + 2-opt algorithm
- ⛽ **Fuel & cost savings** calculation
- 🤖 **Gemini AI** explanations of optimizations
- 💾 **Route history** saved to Supabase
- 🔐 **Secure auth** with Supabase Auth

## Architecture

```
frontend/   → React + Vite + TypeScript + Tailwind + React Leaflet
backend/    → Node.js + Express + TypeScript
database/   → Supabase (PostgreSQL + Auth)
maps/       → OpenStreetMap tiles, Nominatim geocoding, OSRM routing
```

## Quick Start

### Prerequisites
- Node.js 18+
- A Supabase project
- A Gemini API key

### 1. Database Setup

In your Supabase project, run this SQL:

```sql
-- Enable Row Level Security
create table public.saved_routes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now() not null,
  route_data jsonb not null
);

alter table public.saved_routes enable row level security;

-- Users can only see their own routes
create policy "Users can view own routes"
  on public.saved_routes for select
  using (auth.uid() = user_id);

create policy "Users can insert own routes"
  on public.saved_routes for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own routes"
  on public.saved_routes for delete
  using (auth.uid() = user_id);
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in your SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY, MAPBOX_ACCESS_TOKEN
npm install
npm run dev
```

### How to Obtain & Configure Mapbox API Token (Free Tier)
1. Go to [https://account.mapbox.com/auth/signup/](https://account.mapbox.com/auth/signup/) and create a free account.
2. Go to your **Mapbox Account Dashboard**.
3. Under **Access Tokens**, copy your **Default public token** (starts with `pk.eyJ...`).
4. Paste this token into your `backend/.env` file:
   ```env
   MAPBOX_ACCESS_TOKEN=pk.eyJ...your_token_here...
   ```
5. On **Render (Production)**:
   - Go to your Render Dashboard ➔ select your **Backend Web Service** ➔ **Environment**.
   - Add environment variable `MAPBOX_ACCESS_TOKEN` with your token value.
   - Click **Save Changes**.
   *(Note: Never put this secret in GitHub or frontend code!)*

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
# Fill in your VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL
npm install
npm run dev
```

Open http://localhost:5173

## Deployment (Render)

1. Push to GitHub
2. Create two Render Web Services:
   - **Backend**: `cd backend && npm install && npm run build` → `node dist/index.js`
   - **Frontend**: `cd frontend && npm install && npm run build` → serve `dist/` as static site
3. Set environment variables in Render dashboard
4. Update `FRONTEND_URL` in backend env and `VITE_API_URL` in frontend env to Render URLs

## Demo

Click **"Load Demo Data"** to populate with 5 London delivery stops and see optimization in action.

## Attribution

- Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright)
- Routing by [OSRM](https://project-osrm.org/)
- Geocoding by [Nominatim](https://nominatim.openstreetmap.org/)

## Usage Policy

This application uses public OpenStreetMap services. Requests are limited and cached in accordance with their usage policies. Do not deploy this in a high-traffic production environment without setting up your own OSRM/Nominatim instances.

