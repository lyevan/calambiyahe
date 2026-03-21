# CalamBiyahe API Reference (Swagger-Style)

Version: `v1`  
Base URL: `http://localhost:3000`  
API Prefix: `/api/v1`

---

## OpenAPI-Like Summary

- **Title:** CalamBiyahe API
- **Description:** Calamba City route-scoped transport intelligence API
- **Primary Modules:** Auth, Jeepney Routes, GPS, Heatmap, Hazards
- **Content Types:** `application/json`, `multipart/form-data` (hazard image upload)

---

## Authentication

### Bearer Token

Most protected endpoints expect:

```http
Authorization: Bearer <JWT>
```

### Cookie Token

Auth middleware also accepts signed cookie token (`token`) if present.

### Roles

- `commuter`
- `driver`
- `private_driver`
- `citizen`
- `guide`
- `admin` (system-managed; not selectable from mobile role picker)

### Admin-only Access

Endpoints guarded with `adminMiddleware` require `is_admin: true` in token payload.

---

## Global Response Envelope

### Success

```json
{ "success": true, "data": {}, "message": "Optional message" }
```

### Error

```json
{ "success": false, "error": "Error description" }
```

---

## Global Constraints

- Geographic scope is **Calamba City only**.
- Coordinates outside bounds are rejected in service-layer checks.
- GPS broadcast is rate-limited to **1 request per user per 10 seconds**.
- Admin route endpoints are rate-limited to **30 requests per minute per user**.
- GPS signals expire after **5 minutes**.
- Heatmap responses are cached in-memory for **15 seconds per route** and invalidated on new/deleted route signal.

---

## Schemas

### RegisterRequest

```json
{
  "username": "string (min 3)",
  "password": "string (min 6)",
  "role": "commuter | driver | private_driver | citizen | guide"
}
```

### LoginRequest

```json
{
  "username": "string",
  "password": "string"
}
```

### CreateRouteRequest

```json
{
  "name": "string (min 3)",
  "code": "CAL-01 format (regex ^CAL-\\d{2}$)"
}
```

### UpdateRouteRequest

```json
{
  "name": "string (optional)",
  "is_active": true
}
```

### WaypointRequest

```json
{
  "sequence": 1,
  "lat": 14.2116,
  "lng": 121.1653,
  "label": "optional",
  "is_key_stop": false
}
```

### BulkWaypointsRequest

```json
[
  {
    "sequence": 1,
    "lat": 14.2116,
    "lng": 121.1653,
    "label": "Crossing",
    "is_key_stop": true
  }
]
```

### GPSBroadcastRequest

```json
{
  "route_id": "uuid",
  "lat": 14.2116,
  "lng": 121.1653
}
```

### DriverRouteSessionRequest

```json
{
  "route_id": "uuid"
}
```

### HazardCreateRequest

```json
{
  "type": "pothole | flood | accident | roadblock",
  "description": "optional string",
  "lat": 14.2116,
  "lng": 121.1653
}
```

### HazardStatusUpdateRequest

```json
{
  "status": "pending | verified | resolved"
}
```

### PotholeZoneRequest

```json
{
  "start_lat": 14.2116,
  "start_lng": 121.1653,
  "end_lat": 14.212,
  "end_lng": 121.166
}
```

---

## Endpoints

## 1) Health

### GET `/health`

- **Auth:** None
- **Description:** Liveness probe

**Response 200**

```json
{ "success": true, "message": "CalamBiyahe API is running" }
```

---

## 2) Auth

### POST `/api/v1/auth/register`

- **Auth:** None
- **Body:** `RegisterRequest`

**Response 201**

```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "username": "commuter1",
    "role": "commuter",
    "is_admin": false
  },
  "message": "User registered successfully"
}
```

**Errors**

- `400` validation/register failure

---

### POST `/api/v1/auth/login`

- **Auth:** None
- **Body:** `LoginRequest`
- **Notes:** Sets signed cookie `token` and also returns token in JSON.

**Response 200**

```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": "uuid",
      "username": "commuter1",
      "role": "commuter",
      "is_admin": false
    },
    "token": "jwt"
  },
  "message": "Login successful"
}
```

**Errors**

- `401` invalid credentials

---

## 3) Routes (Public)

### GET `/api/v1/routes`

- **Auth:** None
- **Query:** `all=true` (optional; if omitted, active routes only)

**Response 200**

```json
{
  "success": true,
  "data": [
    {
      "route_id": "uuid",
      "name": "CAL-01 — Crossing to Parian",
      "code": "CAL-01",
      "is_active": true
    }
  ]
}
```

---

### GET `/api/v1/routes/:id`

- **Auth:** None
- **Path Params:** `id` (route uuid)

**Response 200**

```json
{
  "success": true,
  "data": {
    "route_id": "uuid",
    "name": "CAL-01 — Crossing to Parian",
    "code": "CAL-01",
    "is_active": true,
    "waypoints": [
      {
        "waypoint_id": "uuid",
        "route_id": "uuid",
        "sequence": 1,
        "lat": "14.2116000",
        "lng": "121.1653000",
        "label": "Crossing",
        "is_key_stop": true
      }
    ]
  }
}
```

**Errors**

- `404` route not found

---

## 4) Routes (Admin)

> Requires `Authorization: Bearer <adminToken>` and admin role.

### GET `/api/v1/admin/routes`

- **Auth:** Admin
- **Query:** `all=true` optional

### POST `/api/v1/admin/routes`

- **Auth:** Admin
- **Body:** `CreateRouteRequest`
- **Response:** `201` route created

### GET `/api/v1/admin/routes/:id`

- **Auth:** Admin
- **Response:** single route with waypoints

### PATCH `/api/v1/admin/routes/:id`

- **Auth:** Admin
- **Body:** `UpdateRouteRequest`

### DELETE `/api/v1/admin/routes/:id`

- **Auth:** Admin
- **Response 200**

```json
{ "success": true, "message": "Route deleted successfully" }
```

### POST `/api/v1/admin/routes/:id/waypoints`

- **Auth:** Admin
- **Body:** `WaypointRequest`
- **Response 201** waypoint created

### PUT `/api/v1/admin/routes/:id/waypoints`

- **Auth:** Admin
- **Body:** `BulkWaypointsRequest`
- **Behavior:** Replaces all waypoints for route

### DELETE `/api/v1/admin/routes/:id/waypoints/:wid`

- **Auth:** Admin
- **Behavior:** Deletes waypoint and resequences remaining waypoints

**Common Admin Route Errors**

- `400` validation or sequence errors
- `401` missing/invalid token
- `403` not admin
- `404` route/waypoint not found
- `429` too many admin route requests

---

## 5) GPS

> Requires authenticated user.

### POST `/api/v1/gps/broadcast`

- **Auth:** User
- **Body:** `GPSBroadcastRequest`
- **Rules:**
  - Route must exist and be active
  - Coordinates must be within Calamba bounds
  - Per-user rate limit 1 request/10s
  - `expires_at = emitted_at + 5 minutes`

**Response 201**

```json
{
  "success": true,
  "data": {
    "signal_id": "uuid",
    "user_id": "uuid",
    "route_id": "uuid",
    "lat": "14.2116000",
    "lng": "121.1653000",
    "role": "commuter",
    "emitted_at": "2026-03-20T08:00:00.000Z",
    "expires_at": "2026-03-20T08:05:00.000Z"
  }
}
```

**Errors**

- `400` out-of-bounds coordinates
- `404` invalid/inactive route
- `429` broadcast rate limit reached

---

### GET `/api/v1/gps/signals/:route_id`

- **Auth:** User
- **Path Params:** `route_id` uuid
- **Behavior:** Returns non-expired route signals

### DELETE `/api/v1/gps/signal/:signal_id`

- **Auth:** User
- **Behavior:** Deletes signal and invalidates heatmap cache for its route

---

### POST `/api/v1/gps/driver/start-route`

- **Auth:** Driver role
- **Body:** `DriverRouteSessionRequest`
- **Behavior:** Ends existing active driver session before creating new one

**Response 201**

```json
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "user_id": "uuid",
    "route_id": "uuid",
    "is_active": true,
    "started_at": "2026-03-20T08:10:00.000Z",
    "ended_at": null
  },
  "message": "Driver route session started"
}
```

---

### POST `/api/v1/gps/driver/end-route`

- **Auth:** Driver role
- **Behavior:** Ends active session

### GET `/api/v1/gps/driver/active-route`

- **Auth:** Driver role
- **Behavior:** Returns active driver session

**Driver Route Errors**

- `403` non-driver role
- `404` no active session / invalid route

---

## 6) Heatmap

### GET `/api/v1/heatmap/:route_id`

- **Auth:** User
- **Path Params:** `route_id` uuid
- **Behavior:**
  - Aggregates **commuter-only** active signals for route
  - Grid buckets are rounded by `Math.round(value * 200) / 200`
  - Returns intensity in range `0..1`
  - Cached for 15 seconds per route

**Response 200**

```json
{
  "success": true,
  "data": {
    "route_id": "uuid",
    "route_code": "CAL-01",
    "points": [
      { "lat": 14.2116, "lng": 121.1653, "intensity": 1, "count": 18 },
      { "lat": 14.2098, "lng": 121.1641, "intensity": 0.44, "count": 8 }
    ],
    "generated_at": "2026-03-20T08:00:00.000Z"
  }
}
```

**Errors**

- `404` route not found
- `401` unauthorized

---

## 7) Hazards

### GET `/api/v1/hazards`

- **Auth:** None
- **Description:** List hazard reports

### GET `/api/v1/hazards/potholes`

- **Auth:** None
- **Description:** List pothole zones

### POST `/api/v1/hazards`

- **Auth:** User
- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `type` = `pothole | flood | accident | roadblock`
  - `description` (optional)
  - `lat`
  - `lng`
  - `image` (optional file)

**Response 201**

```json
{
  "success": true,
  "data": {
    "report_id": "uuid",
    "reporter_id": "uuid",
    "type": "pothole",
    "description": "Large pothole near market",
    "lat": "14.2116000",
    "lng": "121.1653000",
    "image_url": "/uploads/image-123456.jpg"
  }
}
```

**Errors**

- `400` validation / out-of-bounds hazard location
- `401` unauthorized

---

### PATCH `/api/v1/hazards/:id/status`

- **Auth:** Admin
- **Body:** `HazardStatusUpdateRequest`

### POST `/api/v1/hazards/:id/zone`

- **Auth:** Admin
- **Body:** `PotholeZoneRequest`

**Admin Hazard Errors**

- `400` validation or update failure
- `401` unauthorized
- `403` not admin

---

## 8) AI

> Requires authenticated user.

### POST `/api/v1/ai/reroute`

- **Auth:** Any authenticated user
- **Body:**

```json
{
  "hazardZoneId": "uuid",
  "userLat": 14.2116,
  "userLng": 121.1653,
  "currentRouteId": "uuid"
}
```

**Response 200**

```json
{
  "success": true,
  "data": {
    "hazardZoneId": "uuid",
    "suggestedRouteCode": "CAL-02",
    "message": "Avoid Real Street. Switch to CAL-02 via National Hwy.",
    "severity": "high",
    "alternativeSteps": [
      "Turn back to Crossing Terminal.",
      "Board CAL-02 towards Bucal."
    ],
    "generatedAt": "2026-03-20T09:00:00.000Z"
  },
  "message": "Reroute suggestion generated"
}
```

### POST `/api/v1/ai/travel-tips`

- **Auth:** Any authenticated user
- **Body:**

```json
{
  "originLat": 14.2116,
  "originLng": 121.1653,
  "destinationLabel": "SM City Calamba",
  "role": "commuter"
}
```

`role` can be: `commuter`, `driver`, `private_driver`, `citizen`, `guide`

**Response 200**

```json
{
  "success": true,
  "data": {
    "tips": [
      "Board CAL-06 at Crossing Terminal.",
      "Alight at SM City Calamba entrance.",
      "Travel time is around 15–20 minutes."
    ],
    "recommendedRouteCode": "CAL-06",
    "fareEstimate": "PHP 13–15",
    "bestTimeToTravel": "Before 8:00 AM",
    "generatedAt": "2026-03-20T09:00:00.000Z"
  },
  "message": "Travel tips generated"
}
```

### POST `/api/v1/ai/analyze-hazard`

- **Auth:** Any authenticated user
- **Body:**

```json
{
  "imageBase64": "base64encodedimagestring",
  "mimeType": "image/jpeg",
  "lat": 14.2116,
  "lng": 121.1653,
  "reporterNote": "Malaking lubak sa gitna ng kalsada."
}
```

`mimeType` can be: `image/jpeg`, `image/png`, `image/webp`

**Response 200**

```json
{
  "success": true,
  "data": {
    "severity": "high",
    "hazardType": "pothole",
    "description": "A large pothole approximately 50cm wide is visible in the center lane.",
    "recommendedAction": "Avoid the center lane and reduce speed to below 20 kph.",
    "confidence": 0.91,
    "generatedAt": "2026-03-20T09:00:00.000Z"
  },
  "message": "Hazard analysis complete"
}
```

**AI Endpoint Errors**

- `400` validation error
- `401` unauthorized
- `500` AI/service failure

---

## 9) Users

### GET `/api/v1/users/me`

- **Auth:** Any authenticated user
- **Description:** Returns current user profile.

### PATCH `/api/v1/users/me`

- **Auth:** Any authenticated user
- **Body:**

```json
{
  "username": "new_username_optional"
}
```

**Notes**

- `username` must be unique.

### PATCH `/api/v1/users/me/role`

- **Auth:** Any authenticated user
- **Description:** Switches current user's role for mobile role selection flow.
- **Body:**

```json
{
  "role": "guide"
}
```

`role` can be: `commuter`, `driver`, `private_driver`, `citizen`, `guide`

**Response Notes**

- Returns updated user and a refreshed JWT token in `data.token`.
- Client should replace the stored token after role switch.

### GET `/api/v1/users`

- **Auth:** Admin
- **Description:** Lists all users (no password field).

### PATCH `/api/v1/users/:user_id/role`

- **Auth:** Admin
- **Body:**

```json
{
  "role": "commuter"
}
```

`role` can be: `commuter`, `driver`, `private_driver`, `citizen`, `guide`

**Users Endpoint Errors**

- `400` validation failure
- `401` unauthorized
- `403` not admin
- `404` user not found
- `409` username already exists

---

## 10) Terminals

### GET `/api/v1/terminals`

- **Auth:** None
- **Description:** Lists all terminals.

### GET `/api/v1/terminals/:terminal_id`

- **Auth:** None
- **Description:** Returns terminal details including `waiting_spots`.

### POST `/api/v1/terminals`

- **Auth:** Admin
- **Body:**

```json
{
  "name": "Crossing Terminal",
  "lat": 14.2116,
  "lng": 121.1653,
  "address": "Crossing, Calamba"
}
```

### PATCH `/api/v1/terminals/:terminal_id`

- **Auth:** Admin
- **Body:** `CreateTerminalRequest` fields (all optional)

### DELETE `/api/v1/terminals/:terminal_id`

- **Auth:** Admin

### POST `/api/v1/terminals/:terminal_id/spots`

- **Auth:** Admin
- **Body:**

```json
{
  "route_id": "uuid",
  "label": "Parian Waiting Spot",
  "lat": 14.212,
  "lng": 121.165
}
```

### DELETE `/api/v1/terminals/spots/:spot_id`

- **Auth:** Admin

**Terminals Endpoint Errors**

- `400` validation or out-of-bounds coordinates
- `401` unauthorized
- `403` not admin
- `404` terminal/spot/route not found

---

## Rate Limits

| Scope         |                           Limit | Applies To                   |
| ------------- | ------------------------------: | ---------------------------- |
| GPS broadcast | 1 request / 10 seconds per user | `POST /api/v1/gps/broadcast` |
| Admin routes  |   30 requests / minute per user | `/api/v1/admin/routes/*`     |

---

## Common Error Codes

| Code | Meaning                           |
| ---: | --------------------------------- |
|  200 | OK                                |
|  201 | Created                           |
|  400 | Validation or business rule error |
|  401 | Missing/invalid auth token        |
|  403 | Forbidden (admin/role mismatch)   |
|  404 | Not found                         |
|  429 | Rate limit exceeded               |
|  500 | Server error                      |

---

## Quick cURL Examples

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"commuter1","password":"password123"}'
```

### Broadcast GPS

```bash
curl -X POST http://localhost:3000/api/v1/gps/broadcast \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"route_id":"<ROUTE_UUID>","lat":14.2116,"lng":121.1653}'
```

### Get Heatmap

```bash
curl http://localhost:3000/api/v1/heatmap/<ROUTE_UUID> \
  -H "Authorization: Bearer <TOKEN>"
```

---

## Artifacts

- Postman collection: `docs/CalamBiyahe.postman_collection.json`
- API markdown reference: `docs/API_REFERENCE.md`
