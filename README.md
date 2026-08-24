# 🌍 Oarfin — Disaster Management Platform

**Open-source Adaptive Real-time Framework for Intelligent Navigation**

Oarfin is a real-time disaster alert and management system built around four connected pieces: a live disaster map for authorities, a mobile alert app for people on the ground, scraping-driven news aggregation, and a central server tying it all together.

[![React](https://img.shields.io/badge/React-19.0.0-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg)](https://nodejs.org/)
[![Flutter](https://img.shields.io/badge/Flutter-Dart-blue.svg)](https://flutter.dev/)

**🏆 Runner-Up, HackCrux Hackathon**

**Live:** [Website (Vercel)](https://oarfin-website-nine.vercel.app) · [API Server (Render)](https://oarfin-server.onrender.com)

## What it does

- **Website** (`website/`) — a live map for authorities showing current disasters worldwide, affected areas, and the number of app users in each affected region. Authorities can mark safe areas, which are pushed to nearby app users, alongside scraped news/context about each disaster.
- **App** (`disaster_alert/`) — a Flutter mobile app for people in or near a disaster. On detecting a danger zone, the user is notified immediately, their location is sent to authorities, and their added contacts are alerted too. The app helps the user navigate out of the danger zone or follow safety instructions, and surfaces authority-marked safe areas.
- **Server** (`server/`) — the hub connecting the website, app, and scraping pipeline. Scrapes disaster news/Reddit posts, serves nearby-safe-location lookups (hospitals, shelters, police, fire stations via the Overpass API), and provides an AI-assisted chatbot (Google Generative AI / OpenAI) for contextual emergency guidance — on top of JWT-authenticated APIs and a SQLite-backed store.

## 🚀 Features

### 🗺️ Interactive Disaster Map
- Real-time visualization using **Leaflet.js** and **React-Leaflet**
- Dynamic disaster filtering (floods, fires, tornadoes, earthquakes, volcanic activity)
- User-contributed safe spot marking and sharing
- 5km-radius safe-location identification (hospitals, shelters, police stations, fire stations)

### 📰 Live Disaster News Aggregation
- Automated web scraping using **Playwright**
- Real-time news articles from multiple sources, plus Reddit video integration for on-ground updates
- Cached responses (via `node-cache`) for optimized performance

### 🤖 AI-Powered Assistance
- **Google Generative AI** integration for contextual disaster analysis
- **OpenAI API** chatbot for emergency guidance
- Context-aware recommendations based on disaster type and location

### 📱 Mobile Alert App
- Immediate danger-zone detection and notification
- Location sharing with authorities and the user's added contacts on alert
- In-app navigation out of a danger zone / safety instructions
- Authority-marked safe areas visible and reachable from the app

### 🔒 Security & Performance
- JWT authentication for secure access
- CORS protection and error handling across all APIs
- SQLite (via `sqlite3`, which has built-in SQL-injection protection) for persistent storage

## 🛠️ Tech Stack

**Website (frontend)** — React 19 + Vite, Leaflet.js, Tailwind CSS, Axios
**App (mobile)** — Flutter / Dart
**Server (backend)** — Node.js + Express.js, Playwright, SQLite3, node-cache, Google Generative AI & OpenAI APIs, JWT
**External APIs** — Overpass API (OpenStreetMap data)

## 📁 Project Structure

```
Oarfin/
├── website/                 # React frontend (authority-facing live map)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── HomePage.jsx
│   │   ├── Dashboard.jsx
│   │   ├── DisasterMap.jsx
│   │   ├── DisasterDetailPanel.jsx
│   │   ├── DisasterFilter.jsx
│   │   ├── NewsArticles.jsx
│   │   ├── RedditVideos.jsx
│   │   ├── SafeSpotMarker.jsx
│   │   └── AIChatBox.jsx
│   └── package.json
│
├── server/                  # Node.js backend
│   ├── src/
│   │   ├── controllers/scraperController.js
│   │   ├── services/{overpassService.js, scraperService.js}
│   │   └── routes/scraper.js
│   ├── index.js
│   └── package.json
│
└── disaster_alert/          # Flutter mobile app (user-facing alerts)
    ├── lib/
    ├── android/
    └── pubspec.yaml
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+), npm
- Flutter SDK (for the mobile app)
- Git

### Setup — Server
```bash
cd server
npm install
```
Create `server/.env` from `server/.env.example`:
```env
PORT=5000
GOOGLE_AI_API_KEY=your_google_ai_key
OPENAI_API_KEY=your_openai_key
JWT_SECRET=your_jwt_secret
```
```bash
npm run dev   # http://localhost:5000
```

### Setup — Website
```bash
cd website
npm install
```
Create `website/.env` from `website/.env.example`:
```env
VITE_API_URL=http://localhost:5000
```
```bash
npm run dev   # http://localhost:5173
```

### Setup — App
```bash
cd disaster_alert
flutter pub get
flutter run
```

## 🎯 Usage

1. **View the disaster map** — open the website to see real-time disaster locations.
2. **Filter by disaster type** — floods, fires, tornadoes, earthquakes, volcanic activity, with live counts.
3. **Find safe spots** — click the map to identify nearby hospitals, shelters, police, or fire stations within 5km.
4. **Read live news** — aggregated disaster news and Reddit videos, refreshed every few minutes.
5. **Ask the AI assistant** — chatbot support for emergency guidance and recommendations.
6. **On the mobile app** — get notified immediately on entering a danger zone, share location automatically, and navigate to safety or a marked safe area.

## System Architecture
![image](https://github.com/user-attachments/assets/2b34fafa-4698-43d8-b821-28fb717e3626)

## Security Measures
All APIs have error handling and CORS protection. The server's SQLite database benefits from `sqlite3`'s built-in SQL-injection protection, and API access is gated behind JWT authentication.

## 🙏 Acknowledgments

Oarfin was built as a team project (Runner-Up, HackCrux Hackathon) — this repository tracks the most current implementation of that shared codebase. Thanks to OpenStreetMap for geospatial data, Google Generative AI / OpenAI for the assistant, and the open-source community for the tools this is built on.
