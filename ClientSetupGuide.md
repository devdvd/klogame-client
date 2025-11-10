# Client Setup Guide

Anleitung zum Erstellen eines HTML/JS Clients für KloGame.

## 🎯 Überblick

Der Server ist bereit und bietet alle benötigten APIs. Du kannst jetzt einen Client in einem separaten Repository bauen.

## 📋 Was du brauchst

### 1. API-Spezifikation
- **[API.md](API.md)** - Vollständige API-Dokumentation mit allen Endpoints
- **[types.ts](types.ts)** - TypeScript Types für Type Safety

### 2. Server-URL
- **Lokal**: `http://localhost:3000`
- **Production**: Deine deployed Server-URL (z.B. Railway, Render)

### 3. CORS ist aktiviert
✅ Du kannst den Server von jedem Origin aus aufrufen (auch localhost)

---

## 🚀 Quick Start: Neuer Client

### Option 1: Vanilla HTML/JS

```bash
# Neues Verzeichnis erstellen
mkdir klogame-client
cd klogame-client

# Basis-Struktur
mkdir src
touch index.html
touch src/app.js
touch src/api.js
touch styles.css
```

**index.html**
```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KloGame</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app">
    <h1>KloGame</h1>
    <div id="editions"></div>
  </div>

  <script type="module" src="src/app.js"></script>
</body>
</html>
```

**src/api.js**
```javascript
const API_URL = 'http://localhost:3000';

export async function getEditions() {
  const res = await fetch(`${API_URL}/api/editions`);
  const data = await res.json();
  return data.editions;
}

export async function downloadEdition(editionId) {
  const res = await fetch(`${API_URL}/api/editions/${editionId}/download`);
  return await res.json();
}

export async function trackVisit(editionId, location, type, points) {
  await fetch(`${API_URL}/api/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'visit_recorded',
      edition_id: editionId,
      location: location,
      type: type,
      points: points
    })
  });
}
```

**src/app.js**
```javascript
import { getEditions, downloadEdition } from './api.js';

async function init() {
  const editions = await getEditions();
  console.log('Available editions:', editions);

  // Display editions
  const container = document.getElementById('editions');
  editions.forEach(edition => {
    const div = document.createElement('div');
    div.innerHTML = `
      <h3>${edition.icon} ${edition.name}</h3>
      <p>${edition.description}</p>
      <p>Locations: ${edition.locations_count}</p>
      <button onclick="loadEdition('${edition.id}')">Load</button>
    `;
    container.appendChild(div);
  });
}

window.loadEdition = async (editionId) => {
  const edition = await downloadEdition(editionId);
  console.log('Loaded edition:', edition);
  // TODO: Display on map
};

init();
```

Dann einfach `index.html` im Browser öffnen!

---

### Option 2: Mit TypeScript

```bash
npm init -y
npm install -D typescript vite
npm install

# TypeScript Config
npx tsc --init
```

**vite.config.ts**
```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 8080
  }
});
```

**src/main.ts**
```typescript
import { KloGameClient, Edition } from './types';

const client = new KloGameClient('http://localhost:3000');

async function init() {
  const editions = await client.getEditions();
  console.log('Editions:', editions);
}

init();
```

---

### Option 3: React

```bash
npx create-react-app klogame-client
cd klogame-client
npm start
```

**src/App.js**
```javascript
import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3000';

function App() {
  const [editions, setEditions] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/editions`)
      .then(res => res.json())
      .then(data => setEditions(data.editions));
  }, []);

  return (
    <div className="App">
      <h1>KloGame</h1>
      {editions.map(edition => (
        <div key={edition.id}>
          <h3>{edition.icon} {edition.name}</h3>
          <p>{edition.description}</p>
        </div>
      ))}
    </div>
  );
}

export default App;
```

---

## 🗺️ Map Integration (Leaflet.js)

### Installation
```bash
npm install leaflet
```

### HTML
```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```

### JavaScript
```javascript
import L from 'leaflet';

// Initialize map
const map = L.map('map').setView([51.1657, 10.4515], 6); // Germany center

// Add tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Load edition and add markers
const edition = await downloadEdition('bundesliga-2024-25');
edition.locations.forEach(location => {
  const marker = L.marker(location.coordinates)
    .bindPopup(`
      <b>${location.name}</b><br>
      ${location.metadata.team}<br>
      Pinkeln: ${location.points.pee} | Kacken: ${location.points.poop}
    `)
    .addTo(map);

  marker.on('click', () => {
    // Record visit
    trackVisit(edition.id, location.name, 'pinkeln', location.points.pee);
  });
});
```

---

## 💾 LocalStorage / IndexedDB

### LocalStorage (einfach)
```javascript
// Save edition
localStorage.setItem('edition-bundesliga', JSON.stringify(edition));

// Load edition
const saved = JSON.parse(localStorage.getItem('edition-bundesliga'));
```

### IndexedDB (besser für große Daten)
```javascript
// Open DB
const db = await openDB('KloGameDB', 1, {
  upgrade(db) {
    db.createObjectStore('editions', { keyPath: 'id' });
    db.createObjectStore('visits', { keyPath: 'id', autoIncrement: true });
  }
});

// Save edition
await db.put('editions', edition);

// Load edition
const saved = await db.get('editions', 'bundesliga-2024-25');
```

---

## 📊 Client Features Checklist

### Basis-Features
- [ ] Editions auflisten
- [ ] Edition Details anzeigen
- [ ] Edition herunterladen
- [ ] Locations auf Karte anzeigen (Leaflet)
- [ ] Besuch aufzeichnen (Pinkeln/Kacken)
- [ ] Punkte berechnen
- [ ] Statistiken anzeigen

### Erweiterte Features
- [ ] Offline-Support (Service Worker)
- [ ] LocalStorage/IndexedDB für Daten
- [ ] Hierarchische Propagierung (Parent Editions)
- [ ] Filter (nach Edition-Typ, besucht/unbesucht)
- [ ] Search (nach Location-Name)
- [ ] Dark Mode
- [ ] Mobile-optimiert
- [ ] GPS-Lokalisierung (Geolocation API)

### Premium Features
- [ ] Payment-Integration (falls benötigt)
- [ ] User-Accounts
- [ ] Leaderboards
- [ ] Social Sharing

---

## 🎨 UI Libraries (Optional)

### CSS Frameworks
- **Tailwind CSS** - Utility-first CSS
- **Bootstrap** - Komponenten-Bibliothek
- **Material UI** - Material Design

### Map Libraries
- **Leaflet.js** ⭐ (empfohlen, einfach)
- **Mapbox GL** (schöner, aber API key benötigt)
- **Google Maps** (API key benötigt)

### State Management
- **Zustand** - Einfaches State Management
- **Redux** - Komplexeres State Management
- **MobX** - Reactive State Management

---

## 🧪 Testing

### Server lokal starten
```bash
cd server
npm start
# Server läuft auf http://localhost:3000
```

### API testen
```bash
# PowerShell
Invoke-RestMethod -Uri http://localhost:3000/api/editions

# curl
curl http://localhost:3000/api/editions
```

### Client testen
```bash
# Öffne index.html im Browser
# oder mit Live Server (VS Code Extension)
# oder mit Python
python -m http.server 8080
```

---

## 📁 Empfohlene Projekt-Struktur

```
klogame-client/
├── public/
│   └── index.html
├── src/
│   ├── api/
│   │   └── client.ts          # API Client
│   ├── components/
│   │   ├── EditionList.tsx
│   │   ├── Map.tsx
│   │   └── Stats.tsx
│   ├── types/
│   │   └── api.ts             # Types (kopiert von Server)
│   ├── utils/
│   │   └── storage.ts         # LocalStorage/IndexedDB
│   └── main.ts
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Deployment

### Client
- **Vercel** (empfohlen für React/Next.js)
- **Netlify** (gut für statische Sites)
- **GitHub Pages** (kostenlos für statische Sites)
- **Cloudflare Pages**

### Server
Siehe [server/README.md](server/README.md) für Server-Deployment.

### Wichtig
Stelle sicher, dass der Client die richtige Server-URL verwendet:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
```

---

## 📚 Weitere Ressourcen

- **API Dokumentation**: [API.md](API.md)
- **TypeScript Types**: [types.ts](types.ts)
- **Server README**: [server/README.md](server/README.md)
- **Leaflet Docs**: https://leafletjs.com/
- **IndexedDB Tutorial**: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API

---

## 💡 Beispiel-Flow

```javascript
// 1. App startet
const client = new KloGameClient('http://localhost:3000');

// 2. Lade verfügbare Editionen
const editions = await client.getEditions();

// 3. User wählt Edition
const edition = await client.downloadEdition('bundesliga-2024-25');

// 4. Speichere Edition offline
localStorage.setItem('edition-bundesliga', JSON.stringify(edition));

// 5. Zeige Locations auf Karte
edition.locations.forEach(loc => {
  addMarkerToMap(loc);
});

// 6. User klickt auf Location
await client.recordVisit('bundesliga-2024-25', 'Allianz Arena', 'kacken', 25);

// 7. Update Statistiken
const stats = await client.getStats();
updateStatsUI(stats);
```

---

Viel Erfolg beim Client-Bau! 🚀🚽
