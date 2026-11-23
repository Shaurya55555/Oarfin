# BTP 3 — corrections to make, and viva prep

## A. Paste-ready LaTeX for BTP 3

### A1. New section: "Deviations from the Sprint 1 plan" (put before Conclusion, or as Section 6.1)

```latex
\section{Deviations from the Sprint 1 Plan}
The Sprint 1 report listed five Sprint 2 items. Table~\ref{tab:deviation} records what was delivered and where the plan changed.

\begin{table}[h]
\centering
\caption{Sprint 1 plan versus Sprint 2 delivery}
\label{tab:deviation}
\begin{tabular}{p{3.6cm} p{3cm} p{7cm}}
\hline
\textbf{Planned} & \textbf{Status} & \textbf{Note} \\ \hline
Flutter mobile app & Changed & Built in React Native (Expo) as required by the project instructor, so the app shares TypeScript with the web and server code. The earlier Flutter prototype relied on Firebase and on endpoints the server never implemented. \\
Push notifications (FCM) & Not done & Local notifications fire while the app is open. FCM push is future work. \\
Agentic AI chatbot & Partial & A Gemini-based assistant that receives the user's location, nearby alerts and shelters as context. It does not call tools or generate routes itself. \\
Geofencing / background location & Not done & Danger detection runs while the app is open; background tracking needs a development build. \\
Offline mode & Partial & The alert list is cached on the device. Offline map tiles are future work. \\
Regional languages & Partial & The website supports Hindi and other Indian languages; the mobile app is English only. \\ \hline
\end{tabular}
\end{table}

The focus also moved from resource allocation and report deduplication (Sprint 1 planning) towards personal safety on the phone: escape guidance, friend and family status, and SOS. News aggregation was simplified from headless-browser scraping to RSS feeds, because scraping was unreliable on the free hosting tier.
```

### A2. Fix the language sentence in Chapter 6
Replace: "Hindi and regional-language support" in the future-scope list with:
"extending the website's existing Hindi and regional-language support to the mobile application"

### A3. Map description
Resolved in code: `mobile/` now renders Leaflet + OpenStreetMap in a WebView (react-native-webview 14.0.1) and `eas.json` exists, so the report's map text matches the repo. Verified: `tsc` 0 errors, `expo lint` clean, `expo-doctor` 20/20, Android bundle 2.9 MB. Not yet run on a physical phone.

## B. Things to do yourselves
1. Redeploy the server on Render and set `GEMINI_API_KEY` (friends and AI routes return 404 on the live server).
2. Test the mobile map once on a real phone (Expo Go).
3. Warm the server (`/status`) 10 minutes before presenting; first request takes about 18 s.
4. Reddit feed returns 403 from Render; skip it in the demo.

## C. Likely viva questions and honest answers

**Why React Native, not Flutter?** Instructor requirement; one TypeScript stack across web, server and mobile; the Flutter prototype called endpoints that did not exist.

**Why Haversine and not a geofencing library?** Zones are circles (centre plus radius), so great-circle distance is exact enough at 1–300 km and O(n) for about 100 alerts.

**How do you handle GDACS having no radius?** Per-type estimate scaled by alert level, labelled "estimated" in the UI. Authority alerts carry an exact radius.

**Passwords?** Unsalted SHA-256 inherited from Sprint 1. Known weakness; bcrypt or Argon2 is the fix.

**Why Turso?** The free host wiped the SQLite file on each redeploy, so accounts reset.

**Why does the first shelter search take about 7 s?** It queries several public Overpass mirrors; results are cached on the server and reused on the device until the user moves 2 km.

**Sprint 1 report claims (bcrypt, Socket.io, rate limiting, resource allocation, NDMA/IMD scraping)?** Do not claim these. Say they were planned or prototyped and the final code differs. The current code uses SHA-256, plain REST, and BBC/NDTV RSS.

**Does it work in the background?** No. Foreground only; background needs a development build.
