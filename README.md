# CalamBiyahe

CalamBiyahe is a role-based smart mobility platform for Calamba City, Laguna. It is designed as a real-time transport intelligence prototype that combines GPS broadcasting, route-scoped passenger heatmaps, hazard reporting, and AI-assisted routing support.

This project was built for InterCICSkwela 2026 (Smart Mobility & Transport challenge) with a scope lock on Calamba City.

## Project Context

- **Hackathon:** InterCICSkwela 2026
- **Challenge:** #1 — Smart Mobility & Transport
- **Scope:** Calamba City, Laguna
- **SDG Alignment:** SDG 9 (Industry, Innovation, and Infrastructure), SDG 11 (Sustainable Cities and Communities)

## Core Value Proposition

CalamBiyahe turns residents and road users into active contributors to a shared mobility network:

- **GPS Broadcast** for route-aware commuter/driver signals
- **Passenger Heatmap** for route-level demand visibility
- **Hazard Reporting** with geotagging and image evidence
- **AI Rerouting** for road disruption response
- **Route Builder** for managed jeepney route and waypoint administration

## Monorepo Structure

```text
calambiyahe/
├── apps/
│   ├── api/      # Express + TypeScript + Drizzle + PostgreSQL
│   └── mobile/   # Expo Router + React Native + React Query + Zustand
└── README.md
```

## System Architecture

### API (`apps/api`)

- **Runtime:** Node.js + Express + TypeScript
- **Database:** PostgreSQL via Drizzle ORM
- **Authentication:** JWT bearer token and signed cookie support
- **Key modules:** auth, users, jeepney-routes, gps, heatmap, hazards, terminals, ai

Main API mounting points:

- `/api/v1/auth`
- `/api/v1/users`
- `/api/v1/routes`
- `/api/v1/admin/routes`
- `/api/v1/gps`
- `/api/v1/heatmap`
- `/api/v1/hazards`
- `/api/v1/terminals`
- `/api/v1/ai`

### Mobile (`apps/mobile`)

- **Runtime:** Expo + React Native + TypeScript
- **Navigation:** Expo Router route groups
- **Data layer:** Axios + TanStack Query
- **State management:** Zustand
- **UI:** NativeWind + custom map/UI components

Route groups:

- `(auth)` for login/register
- `(tabs)` for commuter/user-facing experience (map, alerts, report, profile)
- `(admin)` for route and moderation workflows

## Roles and Network Responsibilities

The platform is modeled as **six roles in one mobility network**:

| Role              | Responsibility                                  |
| ----------------- | ----------------------------------------------- |
| Commuter          | Broadcasts location and discovers waiting spots |
| Jeepney Driver    | Views active route passenger heatmaps           |
| Private Driver    | Receives AI rerouting and hazard alerts         |
| Concerned Citizen | Reports hazards and supports verification       |
| Local Guide       | Adds terminals and waiting spots                |
| Admin             | Manages routes and supervises hazard moderation |

> Technical role keys used by the API include `commuter`, `driver`, `private_driver`, `citizen`, `guide`, and `admin`.

## API Documentation and Collections

The repository ships with multiple API documentation artifacts under `apps/api/docs`:

- Markdown reference: `apps/api/docs/API_REFERENCE.md`
- OpenAPI JSON: `apps/api/docs/openapi.json`
- OpenAPI YAML: `apps/api/docs/openapi.yaml`
- Postman collection: `apps/api/docs/CalamBiyahe.postman_collection.json`

When the API server is running, docs are exposed at:

- **Swagger UI:** `GET /docs`
- **OpenAPI route:** `GET /docs/openapi.json`

Default local URLs:

- `http://localhost:3000/docs`
- `http://localhost:3000/docs/openapi.json`

## Quick Start

## 1) Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL

## 2) Start the API

```bash
cd apps/api
npm install
npm run db:push
npm run dev
```

Useful API scripts:

```bash
npm run build
npm start
npm test
npm run db:generate
npm run db:studio
npm run db:seed
npm run db:clear
```

## 3) Start the Mobile App

```bash
cd apps/mobile
npm install
npm start
```

Optional targets:

```bash
npm run android
npm run ios
npm run web
```

## Environment Configuration

### API environment (`apps/api/.env`)

```env
PORT=3000
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<db>
CORS_ORIGIN=http://localhost:8081
JWT_SECRET=<your-jwt-secret>
COOKIES_SECRET=<your-cookie-secret>
BASE_URL=http://localhost:3000

# Gemini AI
GEMINI_API_KEY=<your-gemini-key>
GEMINI_MODEL=gemini-3-flash-preview
GEMINI_TEXT_MODEL=gemini-3-flash-preview
GEMINI_VISION_MODEL=gemini-1.5-pro
GEMINI_TIMEOUT_MS=30000

# Cloudinary (or use CLOUDINARY_URL)
CLOUDINARY_URL=<your-cloudinary-url>
```

### Mobile API configuration

Mobile API base URL is currently set in:

- `apps/mobile/lib/api/client.ts`

Update `ENV.API_URL` as needed for your local/LAN/deployed API.

## Operational Notes

- The system enforces Calamba-only geospatial constraints in core mobility flows.
- GPS and heatmap logic is route-scoped to avoid cross-route signal mixing.
- Prototype infrastructure may show cold starts and response delays due to free-tier hosting limits.

## Team

**Team CCC Iskode**  
City College of Calamba  
Adviser: Prof. John Gio Arciaga

Contributors:

- Ivan Elmido — Lead Fullstack Developer
- Kiel Arthur Inigo Navasero — AI/Backend Developer
- Lebron Catubao — Frontend Developer/UI/UX
- John Carlo Cacao — Frontend Developer/UI/UX

## License

This project is licensed under the MIT License.
