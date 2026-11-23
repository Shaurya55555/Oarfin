# OARFIN, Explained Simply

This document explains the whole OARFIN project in plain language, with
examples, so you can confidently talk about it in an interview or just
remind yourself how it works. It assumes you know how to code, but not
necessarily every tool used here — each new concept is introduced before
it's used. **Note:** OARFIN was built as a team project for the LNMIIT
HackCrux Hackathon (Runner-Up) — this doc explains the shared codebase as a
whole; be ready to speak specifically to the pieces you personally built.

---

## 1. What is OARFIN, in one sentence?

**It's a real-time disaster alert system with three connected pieces: a
live map website for authorities, a mobile app that warns people near a
danger zone, and a backend that scrapes disaster news and finds nearby
safe locations (hospitals, shelters, police, fire stations).**

Live: [Website](https://oarfin-website-nine.vercel.app) ·
[API Server](https://oarfin-server.onrender.com)

---

## 2. Prerequisites — concepts you should know first

| Concept | What it is, in one line |
|---|---|
| **Web scraping (headless browser)** | Instead of calling an API, you launch a real (but invisible/"headless") browser, load a web page, and pull data out of its HTML — used here because BBC/NDTV don't offer a public news API. |
| **Playwright** | A library for controlling a headless browser (Chromium/Firefox/WebKit) from code — navigate to a page, click things, read text out of it. OARFIN uses it to scrape BBC and NDTV. |
| **CSS selectors** | The syntax used to pick specific elements out of a page's HTML (e.g. `a[href*="/news/articles"]` selects all links whose URL contains that text) — this is how the scraper finds article links and paragraph text. |
| **LLM-as-classifier** | Instead of only using an LLM to generate conversational text, you can ask it a yes/no question about a piece of data (e.g. "is this article about a natural disaster?") and use the answer to filter data programmatically. |
| **REST API (third-party)** | A public web service with predictable endpoints. OARFIN calls several: the Reddit archive API (Pullpush), OpenStreetMap's Overpass API, and FEMA's shelter API. |
| **Geospatial query / Haversine formula** | A formula for calculating the real-world distance between two latitude/longitude points on a sphere — used to filter "nearby" results and sort them by distance. |
| **JWT (JSON Web Token)** | A signed piece of text proving "this request came from a logged-in user," checked on every protected request. |
| **SQLite** | A lightweight, file-based SQL database — no separate database server to run, good for a project like this. |
| **WebSocket / real-time push** | A persistent connection between client and server that lets the server push updates (e.g. a new danger-zone alert) without the client having to repeatedly ask. |
| **Flutter** | A framework for building one mobile app codebase (in Dart) that compiles to both Android and iOS. |

---

## 3. The big picture (architecture)

```
   ┌────────────────────┐        ┌─────────────────────────┐
   │   Website (React)   │        │  Mobile App (Flutter)     │
   │  Authority-facing    │        │  Public-facing            │
   │  live disaster map   │        │  danger-zone alerts       │
   └──────────┬──────────┘        └───────────┬──────────────┘
              │  REST (axios)                  │  REST
              └────────────────┬───────────────┘
                                ▼
                  ┌───────────────────────────┐
                  │   Server (Node.js/Express)  │
                  │  JWT auth · SQLite store     │
                  └──┬──────────┬──────────┬───┘
                     │          │          │
        ┌────────────┘          │          └───────────────┐
        ▼                       ▼                           ▼
 ┌─────────────┐      ┌──────────────────┐        ┌──────────────────┐
 │  Scraping    │      │   Overpass API +   │        │  Gemini / OpenAI   │
 │  (Playwright │      │   FEMA API         │        │  (news classifier, │
 │  + Reddit    │      │  (nearby shelters, │        │   chat assistant)  │
 │  archive API)│      │   hospitals, etc.) │        │                    │
 └─────────────┘      └──────────────────┘        └──────────────────┘
```

**Three connected pieces, each doing one job**: the website is for
authorities to see the big picture; the app is for individuals to get
warned and navigate to safety; the server is the shared brain both talk to.

---

## 4. The scraper — three different techniques for three different sources

This is the part worth understanding in most depth, because it isn't one
technique used three times — each news source needed a different approach:

**BBC and NDTV (`scraperService.js`) — headless-browser scraping with Playwright**,
because neither site offers a public API:

```javascript
async function scrapeBBC() {
  const browser = await chromium.launch({ headless: true, args: [...] });
  const page = await browser.newPage();
  await page.goto('https://bbc.com/future-planet', { waitUntil: 'domcontentloaded' });

  // CSS selector picks out every link to an article
  const articleUrls = await page.$$eval(
    'a[href*="/news/articles"]',
    (links) => links.map((l) => l.href)
  );
  // ...then visits each article URL and pulls the title + paragraph text
}
```

**Reddit — not scraped at all**, actually called via **Pullpush**, a free
public REST API that archives Reddit posts (faster and more reliable than
scraping Reddit's own site, but it has an aggressive rate limit — see the
gotcha below).

**Filtering what's actually disaster-relevant** — every scraped/fetched
article is passed through Gemini as a **yes/no classifier** before being
shown to users, so a headless-browser pull of an entire news homepage
doesn't dump irrelevant articles onto the map:

```javascript
async function isDisasterNews({ title, content }) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `...ONLY ANSWER IN YES OR NO. Is this a natural disaster article?`,
  });
  return response.text.trim().toUpperCase().includes('YES') ? 'YES' : 'NO';
}
```

Results are cached (`node-cache`, 2–5 minute TTL) so the scraper doesn't
re-launch a browser on every single request.

---

## 5. Finding nearby safe locations — merging two unreliable data sources

`overpassService.js` is the most robust piece of engineering in this
codebase. To answer "what shelters/hospitals are near this point," it:

1. Queries **OpenStreetMap's Overpass API** (community-run, several public
   mirrors) for tagged amenities (`hospital`, `shelter`, `police`,
   `fire_station`, etc.) within a radius — trying **GET before POST**
   (GET is less rate-limited on these mirrors), across **4 different
   Overpass mirror endpoints** in sequence, with a final retry after a
   3-second backoff if every mirror fails.
2. Queries **FEMA's shelter API** in parallel (`Promise.allSettled`, so one
   source failing doesn't block the other).
3. Merges both result sets, deduplicates by rounding coordinates to ~1km
   precision, and sorts by real-world distance using the **Haversine
   formula**.
4. Caches the combined result for 30 minutes, keyed by a rounded
   lat/lng so nearby repeat queries hit the cache.

This is deliberately defensive: public geospatial APIs are flaky, so the
code assumes failure is normal and is built to degrade gracefully instead
of erroring out.

---

## 6. A real constraint worth mentioning: Reddit's rate limit

Pullpush (the Reddit archive API used instead of scraping Reddit directly)
has an aggressive, often-shared public rate limit. The code retries once
with a short backoff, and if it *still* fails, it serves the **last
known-good result** — cached for 6 hours, far longer than the normal
2-minute cache — rather than showing an error to the user:

```javascript
// a 429 there is common and not something we can eliminate outright,
// so we retry once with backoff, and if it still fails we serve the
// last known-good result instead of surfacing a raw error to the UI.
```

---

## 7. If you had to explain this in an interview in 60 seconds

> "OARFIN is a real-time disaster monitoring platform I built with a team
> for a hackathon — a React map for authorities, a Flutter app for
> individuals, and a Node.js/Express backend tying them together. The
> backend does three interesting things: it scrapes BBC and NDTV with
> Playwright (a headless browser) since they don't offer news APIs, pulls
> Reddit posts through the Pullpush archive API, and runs every article
> through Gemini as a yes/no classifier so only genuinely disaster-related
> content surfaces. Separately, it finds nearby safe locations by merging
> OpenStreetMap's Overpass API and FEMA's shelter API — with retries across
> four Overpass mirrors and Haversine-distance deduplication — since either
> public data source can be flaky on its own. Everything's behind JWT auth
> with a SQLite store, and cached aggressively since scraping and mapping
> APIs are both slow and rate-limited."
