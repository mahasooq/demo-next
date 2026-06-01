# Next.js 14 Demo: Multi-Tenant + PostGIS + Socket.io

Minimal App Router demo with three features:

1. **Multi-tenant middleware** — subdomain from `Host`, mock Redis lookup, `x-tenant-id` header, 404 for unknown tenants
2. **PostGIS geofence** — `POST /api/geofence` with `[lat, lng]`, `ST_Contains` via Prisma `$queryRaw`
3. **Realtime counter** — Socket.io on a custom Node server; increment in one tab updates another in under 500ms

**Access:** HTTP Basic Auth (browser login prompt) — username `mahasooq`, password `mahasooq`.

## Implementation details

### HTTP Basic Auth

All routes matched by `middleware.ts` require a valid `Authorization: Basic …` header. Credentials are hardcoded in `lib/basic-auth-shared.js` (`mahasooq` / `mahasooq`). Invalid or missing auth returns **401** with `WWW-Authenticate: Basic realm="Demo"`, which triggers the browser login dialog.

Socket.io connections are authenticated separately in `server.js` via `io.use()`, reading the same Basic header on the handshake (the browser re-sends cached credentials on same-origin requests).

### 1. Multi-tenant middleware

**Files:** `middleware.ts`, `lib/subdomain.ts`, `lib/tenant-store.ts`, `app/tenant/page.tsx`

Every request (except `_next/static`, `_next/image`, `favicon.ico`) passes through Edge middleware before reaching the App Router.

**Flow:**

1. Read the `Host` header (e.g. `acme.localhost:3000`).
2. Parse it against `ROOT_DOMAIN` from `.env` (default `localhost:3000`; comparison uses the hostname only, `localhost`).
3. Classify the host:
   - **Apex** — `localhost` or `www.localhost` → continue without tenant headers (main demo on port 3000).
   - **Tenant** — single label before `.localhost` (e.g. `acme` from `acme.localhost`) → look up tenant.
   - **Invalid** — anything else → continue without tenant headers (same as apex).
4. **Mock Redis lookup** — `lib/tenant-store.ts` uses an in-memory `Map` (simulating `GET tenant:{subdomain}`):
   - `acme` → `{ tenantId: "tenant_acme", name: "Acme" }`
   - `beta` → `{ tenantId: "tenant_beta", name: "Beta Inc" }`
   - any other subdomain → `null` → **404** `"Tenant not found"`
5. **Header injection** — on match, middleware clones request headers and sets:
   - `x-tenant-id`
   - `x-tenant-name`  
   then calls `NextResponse.next({ request: { headers } })`. Downstream Server Components and route handlers read these via `headers()`; they are not sent to the browser.

**Example:** `http://acme.localhost:3000/tenant` resolves the tenant and `/tenant` displays the injected IDs. `http://unknown.localhost:3000/tenant` returns 404 from middleware before the page renders.

### 2. PostGIS geofence

**Files:** `app/api/geofence/route.ts`, `lib/geofence.ts`, `app/geofence/page.tsx`, `app/geofence/GeofenceMap.tsx`, `prisma/migrations/…/migration.sql`

**API:** `POST /api/geofence`

```json
{
  "lat": 37.779,
  "lng": -122.414,
  "polygon": {
    "minLng": -122.419,
    "minLat": 37.774,
    "maxLng": -122.409,
    "maxLat": 37.784
  }
}
```

- `lat` / `lng` — point to test (required).
- `polygon` — bounding box (optional; defaults to the SF demo box in `lib/geofence.ts`).

The route validates coordinates and bounds (`minLng < maxLng`, `minLat < maxLat`), builds a rectangular WKT polygon server-side (no raw user WKT — avoids injection), then runs a **parameterized** Prisma raw query:

```sql
SELECT ST_Contains(
  ST_GeomFromText(<wkt>, 4326),
  ST_SetSRID(ST_MakePoint(<lng>, <lat>), 4326)
) AS inside
```

Note PostGIS `ST_MakePoint(x, y)` uses **longitude first**, then latitude.

PostGIS is enabled in the initial migration (`CREATE EXTENSION IF NOT EXISTS postgis`). The UI at `/geofence` lets you edit bounds and sample points, shows an HTTP request/response log on **Check point**, and renders a **Leaflet** map (OpenStreetMap tiles) with the box and check-point marker (green = inside, red = outside).

### 3. Socket.io realtime

**Files:** `server.js`, `app/realtime/page.tsx`

Next.js App Router cannot host WebSocket upgrades in Route Handlers, so the app uses a **custom Node HTTP server** (`npm run dev` → `node server.js`) that:

1. Creates `http.createServer` and passes requests to Next’s `getRequestHandler()`.
2. Attaches Socket.io on the same server (`path: "/socket.io"`).
3. Keeps a single in-memory `counter` on the server.
4. On `increment` from any client: increments counter and `io.emit("counter", { value, sentAt })` to all connected tabs.

The client (`app/realtime/page.tsx`) connects with `socket.io-client`, displays the counter, and measures latency:

- **Tab that clicked Increment** — round-trip via `performance.now()` (sub-ms precision; avoids misleading `0 ms` from integer rounding).
- **Other tabs** — `Date.now() - sentAt` (server → client; 1 ms wall-clock ticks).

Target: cross-tab updates in **under 500 ms** on localhost (typically sub-millisecond).

## Prerequisites

- Node.js 18+
- Docker (for PostGIS)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

3. Start PostGIS (uses host port **5433** to avoid conflicting with a local Postgres on 5432):

   ```bash
   docker compose up -d
   ```

4. Run migrations and generate Prisma client:

   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

5. (Recommended) Add local hostnames for tenant subdomains in `/etc/hosts`:

   ```
   127.0.0.1 acme.localhost
   127.0.0.1 beta.localhost
   127.0.0.1 unknown.localhost
   ```

   On macOS/Linux: `sudo nano /etc/hosts`

6. Start the app (custom server required for Socket.io):

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Verify features

### 1. Multi-tenant middleware

| URL | Expected |
|-----|----------|
| http://acme.localhost:3000/tenant | Shows `x-tenant-id: tenant_acme` (after Basic auth) |
| http://beta.localhost:3000/tenant | Shows `x-tenant-id: tenant_beta` |
| http://unknown.localhost:3000/tenant | HTTP 404 — tenant not in mock store |

Known tenants (mock Redis): `acme`, `beta`.

### 2. PostGIS geofence

Default polygon (SF box) — inside sample `37.779, -122.414`; outside `37.77, -122.5`.

```bash
# Inside (with default polygon)
curl -s -u mahasooq:mahasooq -X POST http://localhost:3000/api/geofence \
  -H "Content-Type: application/json" \
  -d '{"lat":37.779,"lng":-122.414}'

# Outside
curl -s -u mahasooq:mahasooq -X POST http://localhost:3000/api/geofence \
  -H "Content-Type: application/json" \
  -d '{"lat":37.77,"lng":-122.5}'
```

Or use the UI at [http://localhost:3000/geofence](http://localhost:3000/geofence) (editable bounds, map, HTTP log).

### 3. Socket.io realtime

1. Open [http://localhost:3000/realtime](http://localhost:3000/realtime) in two browser tabs.
2. Click **Increment** in one tab.
3. The counter in the other tab updates immediately.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Custom server + Next.js dev (`node server.js`) |
| `npm run build` | Production build |
| `npm run start` | Custom server + Next.js production |

## Deploying on Railway

The custom server in `server.js` is configured for Railway:

- **Host:** `0.0.0.0` (default via `HOSTNAME`, listens on all interfaces)
- **Port:** `process.env.PORT` (injected by Railway; defaults to `3000` locally)

**Start command:** `npm run start` (runs `NODE_ENV=production node server.js`)

Set these variables in the Railway service:

| Variable | Example |
|----------|---------|
| `DATABASE_URL` | Railway Postgres/PostGIS plugin connection string |
| `ROOT_DOMAIN` | Your public host, e.g. `your-app.up.railway.app` (no `https://`) |
| `NODE_ENV` | `production` (often set by Railway) |

For tenant subdomains in production, point DNS wildcard `*.yourdomain.com` at Railway and set `ROOT_DOMAIN` accordingly.

## Notes

- **Custom server**: Socket.io shares the HTTP server with Next.js (`server.js`). This demo cannot deploy to Vercel as-is; use a long-running Node host (Railway, Render, Fly.io, VPS, etc.).
- **`ROOT_DOMAIN`**: Defaults to `localhost:3000` locally. Subdomains are parsed against the hostname part only.
- **PostGIS**: Must be running before calling `/api/geofence`.

## Project layout

```
middleware.ts              # Basic auth + subdomain → tenant headers / 404
lib/basic-auth-shared.js   # Hardcoded Basic auth credentials
lib/subdomain.ts           # Host → apex | tenant | invalid
lib/tenant-store.ts        # In-memory mock Redis (acme, beta)
lib/geofence.ts            # Polygon bounds, WKT builder, validation
app/api/geofence/route.ts  # ST_Contains via prisma.$queryRaw
app/geofence/              # UI, HTTP log, Leaflet map
app/tenant/page.tsx        # Displays x-tenant-id from middleware
app/realtime/page.tsx      # Socket.io client + latency display
server.js                  # Custom HTTP server + Socket.io
docker-compose.yml         # PostGIS on host port 5433
```
