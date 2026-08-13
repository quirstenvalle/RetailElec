# Quinto Store — wholesale e-commerce (React + Vite + Supabase)

## Setup

### 1. Backend (Supabase)

Follow [`backend/README.md`](./backend/README.md):

1. Run `backend/sql/01_schema.sql`, `02_rls.sql`, then `03_seed.sql` in the [SQL Editor](https://supabase.com/dashboard/project/jpunedofchmqquxrntls/sql/new).
2. Disable email confirmation for local testing (Auth → Providers → Email).
3. Copy `.env.example` to `.env` and paste your **anon** key from [API settings](https://supabase.com/dashboard/project/jpunedofchmqquxrntls/settings/api).

### 2. Frontend

```bash
npm install
npm run dev
```

Open http://localhost:5173/

## Login

- **Admin:** `admin@arlen.store` / `admin123`
- **Customer:** `customer@arlen.store` / `customer123`

Seed data only creates categories + these login accounts. Catalog, customers, and orders start empty (except accounts you register).

## Scripts

- `npm run dev` — start development server
- `npm run build` — production build
- `npm run preview` — preview production build

## Architecture

- `backend/` — SQL schema, RLS, seed (Supabase)
- `src/api/` — backend API layer (no UI)
- `src/pages/` + `src/components/` — UI only
- `src/lib/supabaseClient.js` — Supabase client
