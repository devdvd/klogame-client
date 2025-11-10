# KloGame API Specification

Version: 1.0.0
Base URL: `http://localhost:3000`

## 📋 Table of Contents
- [Authentication](#authentication)
- [Endpoints](#endpoints)
- [Data Models](#data-models)
- [Error Handling](#error-handling)

---

## Authentication

Currently **no authentication** required. All endpoints are public.

---

## Endpoints

### 1. Health Check

**GET** `/health`

Health check endpoint to verify server status.

**Response** `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2024-11-10T15:30:00.000Z"
}
```

---

### 2. API Info

**GET** `/`

Returns API information and available endpoints.

**Response** `200 OK`
```json
{
  "name": "KloGame API",
  "version": "1.0.0",
  "status": "running",
  "endpoints": {
    "editions": "/api/editions",
    "edition_details": "/api/editions/:id",
    "edition_download": "/api/editions/:id/download",
    "analytics_track": "/api/analytics/track (POST)",
    "analytics_stats": "/api/analytics/stats",
    "health": "/health"
  }
}
```

---

### 3. List All Editions

**GET** `/api/editions`

Returns metadata for all available editions (without location data).

**Response** `200 OK`
```json
{
  "editions": [
    {
      "id": "bundesliga-2024-25",
      "name": "Bundesliga 2024/25",
      "description": "Alle 18 Stadien der Bundesliga Saison 2024/25",
      "type": "free",
      "version": "1.0.0",
      "icon": "⚽",
      "unlock_conditions": {
        "payment_required": false,
        "date_range": null,
        "requires_editions": []
      },
      "parent_editions": ["bundeslaender", "deutschland", "europa"],
      "locations_count": 18
    }
  ]
}
```

---

### 4. Get Edition Details

**GET** `/api/editions/:id`

Returns detailed metadata for a specific edition (without locations).

**Parameters**
- `id` (path) - Edition ID (e.g., `bundesliga-2024-25`)

**Response** `200 OK`
```json
{
  "id": "bundesliga-2024-25",
  "name": "Bundesliga 2024/25",
  "description": "Alle 18 Stadien der Bundesliga Saison 2024/25",
  "type": "free",
  "version": "1.0.0",
  "icon": "⚽",
  "unlock_conditions": {
    "payment_required": false,
    "date_range": null,
    "requires_editions": []
  },
  "parent_editions": ["bundeslaender", "deutschland", "europa"],
  "locations_count": 18
}
```

**Response** `404 Not Found`
```json
{
  "error": "Edition bundesliga-2099 not found"
}
```

---

### 5. Download Full Edition

**GET** `/api/editions/:id/download`

Downloads complete edition including all locations. Use this to get the full data for the client.

**Parameters**
- `id` (path) - Edition ID (e.g., `bundesliga-2024-25`)

**Response** `200 OK`
```json
{
  "id": "bundesliga-2024-25",
  "name": "Bundesliga 2024/25",
  "description": "Alle 18 Stadien der Bundesliga Saison 2024/25",
  "type": "free",
  "version": "1.0.0",
  "icon": "⚽",
  "unlock_conditions": {
    "payment_required": false,
    "date_range": null,
    "requires_editions": []
  },
  "parent_editions": ["bundeslaender", "deutschland", "europa"],
  "locations": [
    {
      "id": "allianz-arena",
      "name": "Allianz Arena",
      "coordinates": [48.2188, 11.6247],
      "metadata": {
        "team": "FC Bayern München",
        "city": "München",
        "state": "Bayern",
        "capacity": 75000,
        "opened": 2005
      },
      "points": {
        "pee": 10,
        "poop": 25
      }
    }
  ]
}
```

---

### 6. Track Analytics Event

**POST** `/api/analytics/track`

Track an analytics event (visit, download, etc.).

**Request Body**
```json
{
  "event": "visit_recorded",
  "edition_id": "bundesliga-2024-25",
  "location": "Allianz Arena",
  "type": "pinkeln",
  "points": 10,
  "timestamp": "2024-11-10T15:30:00.000Z"
}
```

**Response** `200 OK`
```json
{
  "success": true
}
```

**Response** `500 Internal Server Error`
```json
{
  "success": false,
  "error": "Failed to save event"
}
```

---

### 7. Get Analytics Stats

**GET** `/api/analytics/stats`

Returns aggregated analytics statistics.

**Response** `200 OK`
```json
{
  "total_events": 150,
  "events_by_type": {
    "visit_recorded": 120,
    "edition_downloaded": 20,
    "edition_activated": 10
  },
  "events_by_edition": {
    "bundesliga-2024-25": 50,
    "2-bundesliga-2024-25": 30,
    "weihnachtsmaerkte-2024": 20
  },
  "recent_events": [
    {
      "event": "visit_recorded",
      "edition_id": "bundesliga-2024-25",
      "location": "Allianz Arena",
      "type": "kacken",
      "points": 25,
      "timestamp": "2024-11-10T15:30:00.000Z",
      "id": "1699628400000-abc123"
    }
  ]
}
```

---

## Data Models

### Edition (Metadata)
```typescript
interface EditionMetadata {
  id: string;
  name: string;
  description: string;
  type: 'free' | 'premium' | 'seasonal';
  version: string;
  icon: string;
  unlock_conditions: UnlockConditions;
  parent_editions: string[];
  locations_count: number;
}
```

### Edition (Full)
```typescript
interface Edition extends EditionMetadata {
  locations: Location[];
}
```

### Location
```typescript
interface Location {
  id: string;
  name: string;
  coordinates: [number, number]; // [latitude, longitude]
  metadata: Record<string, any>; // Edition-specific data
  points: {
    pee: number;
    poop: number;
  };
}
```

### Unlock Conditions
```typescript
interface UnlockConditions {
  payment_required: boolean;
  date_range: {
    start: string; // ISO date
    end: string;   // ISO date
  } | null;
  requires_editions: string[]; // Edition IDs that must be unlocked first
}
```

### Analytics Event
```typescript
interface AnalyticsEvent {
  event: string; // Event type (e.g., "visit_recorded", "edition_downloaded")
  edition_id?: string;
  location?: string;
  type?: 'pinkeln' | 'kacken';
  points?: number;
  timestamp?: string; // ISO date (auto-generated if not provided)
  // Additional custom fields allowed
  [key: string]: any;
}
```

---

## Error Handling

### Error Response Format
```json
{
  "error": "Error message here"
}
```

### HTTP Status Codes
- `200 OK` - Request successful
- `404 Not Found` - Edition not found
- `500 Internal Server Error` - Server error

---

## CORS

CORS is **enabled** for all origins. You can call the API from any domain.

---

## Available Editions

The server currently provides these editions:

| ID | Name | Type | Locations |
|---|---|---|---|
| `bundesliga-2024-25` | Bundesliga 2024/25 | free | 18 |
| `2-bundesliga-2024-25` | 2. Bundesliga 2024/25 | free | 18 |
| `bundeslaender` | Bundesländer | free | 16 |
| `deutschland` | Deutschland | free | 1 |
| `europa` | Europa | free | 20 |
| `weihnachtsmaerkte-2024` | Weihnachtsmärkte 2024 | seasonal | 15 |
| `autobahnraststaetten` | Autobahnraststätten | free | 15 |
| `bahnhoefe` | Bahnhöfe | free | 15 |
| `fastfood-ketten` | Fastfood-Ketten | free | 15 |
| `tankstellen` | Tankstellen | free | 12 |
| `fan-kneipen` | Fan-Kneipen & Pubs | premium | 12 |

---

## Client Implementation Guide

### Step 1: Fetch Available Editions
```javascript
const response = await fetch('http://localhost:3000/api/editions');
const data = await response.json();
console.log(data.editions); // Array of edition metadata
```

### Step 2: Download Edition
```javascript
const editionId = 'bundesliga-2024-25';
const response = await fetch(`http://localhost:3000/api/editions/${editionId}/download`);
const edition = await response.json();
console.log(edition.locations); // Array of locations
```

### Step 3: Display on Map
```javascript
// Example with Leaflet.js
edition.locations.forEach(location => {
  const marker = L.marker(location.coordinates)
    .bindPopup(`
      <b>${location.name}</b><br>
      Pinkeln: ${location.points.pee} Punkte<br>
      Kacken: ${location.points.poop} Punkte
    `);
  map.addLayer(marker);
});
```

### Step 4: Track Visit
```javascript
async function recordVisit(editionId, locationName, type) {
  await fetch('http://localhost:3000/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'visit_recorded',
      edition_id: editionId,
      location: locationName,
      type: type, // 'pinkeln' or 'kacken'
      points: type === 'pinkeln' ? 10 : 25
    })
  });
}
```

---

## Example Client Workflow

```javascript
class KloGameClient {
  constructor(apiUrl = 'http://localhost:3000') {
    this.apiUrl = apiUrl;
  }

  async getEditions() {
    const res = await fetch(`${this.apiUrl}/api/editions`);
    return await res.json();
  }

  async downloadEdition(editionId) {
    const res = await fetch(`${this.apiUrl}/api/editions/${editionId}/download`);
    return await res.json();
  }

  async trackEvent(event) {
    const res = await fetch(`${this.apiUrl}/api/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    return await res.json();
  }

  async getStats() {
    const res = await fetch(`${this.apiUrl}/api/analytics/stats`);
    return await res.json();
  }
}

// Usage
const client = new KloGameClient();
const { editions } = await client.getEditions();
const fullEdition = await client.downloadEdition('bundesliga-2024-25');
await client.trackEvent({
  event: 'visit_recorded',
  edition_id: 'bundesliga-2024-25',
  location: 'Allianz Arena',
  type: 'kacken',
  points: 25
});
```

---

## Testing

Use the provided PowerShell test script:
```powershell
.\test-api.ps1
```

Or test manually:
```powershell
# Get all editions
Invoke-RestMethod -Uri http://localhost:3000/api/editions

# Download edition
Invoke-RestMethod -Uri http://localhost:3000/api/editions/bundesliga-2024-25/download
```
