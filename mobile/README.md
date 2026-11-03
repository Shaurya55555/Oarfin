# Oarfin Mobile (React Native)

The Oarfin app for people on the ground, built with **React Native + Expo** (SDK 58, Expo Router, TypeScript).

## Features

- **Danger zone detection** — follows your location while the app is open and warns you (notification + vibration) when you're inside a disaster zone.
- **Escape guidance** — tells you which direction to move and how far to the zone edge, and points you to the nearest official safe area (marked by authorities on the website) or the nearest shelter/hospital outside the zone, with Google Maps directions.
- **Alerts** — authority alerts from the Oarfin server plus live global events from GDACS (the same feed the website uses). "Near me" and "Worldwide" views, pull to refresh, offline cache.
- **Map** — danger zones, official safe areas, nearby shelters/hospitals/police/fire stations (OpenStreetMap via the server) and friends, with standard/satellite/hybrid/terrain views.
- **Friends** — add people by email, accept/decline requests, see their last location, battery, and whether they're inside a danger zone.
- **SOS** — one tap opens a text message with your live location to your SOS contacts; one tap calls your emergency number (112 by default).
- **AI assistant** — chat for emergency guidance, using your location, nearby alerts and shelters as context.
- **Location sharing** — reports your location to the server so authorities can see how many people are in an affected area (can be turned off in Settings).
- **Accounts** — the same email/password accounts as the website, or continue as a guest.

## Run it on your phone

1. Install **Expo Go** from the Play Store / App Store.
2. In this folder:
   ```bash
   npm install
   npx expo start
   ```
3. Scan the QR code with Expo Go (Android) or the Camera app (iOS). Your phone and computer must be on the same Wi-Fi.

By default the app talks to the deployed server (`https://oarfin-server.onrender.com`). To use a server running on your computer, copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to your computer's LAN IP, e.g. `http://192.168.1.20:3000` (not `localhost` — the app runs on the phone).

> The friends and AI assistant features need the server routes added in this repo (`/api/friends`, `/api/ai`). Redeploy the server, or run it locally, for those to work.

## Scripts

| Command | What it does |
| --- | --- |
| `npx expo start` | Start the dev server (scan the QR with Expo Go) |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint (Expo config) |
| `npx expo-doctor` | Check dependencies/config |
| `npx expo start --web` | Quick browser preview (the map shows a list instead of tiles on web) |

## Project structure

```
src/
  app/                 Screens (Expo Router — each file is a route)
    _layout.tsx        Providers + auth-guarded stack
    login.tsx          Sign in / create account / guest
    (tabs)/            Alerts, Map, Friends, Assistant tabs
    alert/[id].tsx     Alert details
    settings.tsx       Profile, safety settings, SOS contacts
  components/          UI pieces (AlertCard, DangerPanel, map/MapCanvas)
  context/             App state: auth, settings, location, alerts, friends
  lib/                 API client, GDACS parsing, geo math, notifications, SOS
```

## Notes

- Danger detection runs while the app is open. Background tracking needs a development build (`eas build`) because Expo Go doesn't support background location.
- GDACS doesn't publish an impact radius, so GDACS danger zones use an estimate per disaster type and alert level (shown as "estimated" in the app).
