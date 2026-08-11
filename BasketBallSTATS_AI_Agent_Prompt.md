# Project Requirements Document (PRD): BasketBallistic
*System Context for AI Agent Execution*

## 1. Project Overview
**Project Name:** Basketball Stats
**Description:** A courtside basketball match statistics application designed for mobile and tablet devices. It tracks play-by-play events (points, rebounds, assists, fouls, etc.) and generates box scores. 
**Constraint:** The backend relies entirely on Google Apps Script (GAS) and Google Sheets.
**Primary Architecture:** Offline-First Progressive Web App (PWA).

## 2. Technical Stack
*   **Frontend Framework:** React.js / Next.js or Vue.js (use Tailwind CSS for styling).
*   **Local Storage (Offline Database):** IndexedDB via `Dexie.js`.
*   **PWA Capabilities:** Service Worker (for caching UI assets) & Web App Manifest.
*   **Backend / API:** Google Apps Script (`doPost` endpoint).
*   **Cloud Database:** Google Sheets (acting as a relational-lite database).

## 3. Core System Architecture
### A. Offline-First Mechanism
1.  **Asset Caching:** The Service Worker must cache all HTML, CSS, JS, and UI assets so the app loads instantly in airplane mode.
2.  **Local Data Write:** All user inputs (play-by-play events) are written **only** to IndexedDB locally during the game. Do NOT make API calls per event.
3.  **Batch Synchronization:** When the game ends and internet is available, the app wraps the entire game's events into a single JSON array payload and sends it via HTTP POST to the GAS endpoint.

### B. Mobile/Courtside UI/UX Standards
*   **Zero Tap Delay:** Apply `touch-action: manipulation;` on all interactive elements to disable double-tap zoom and ensure 0ms input latency.
*   **Wake Lock:** Implement `navigator.wakeLock.request('screen')` to keep the device screen on during the match.
*   **Optimistic UI:** UI must reflect state changes immediately without waiting for any background process.
*   **Responsive:** Optimize for both phones (vertical stacking) and tablets (split view: court/events on one side, roster on the other).

## 4. Data Models & Schema
### Local Schema (Dexie.js)
Define the following tables/collections:
*   `games`: `{ id (UUID), teamA, teamB, date, status (ongoing/finished), syncStatus (pending/synced) }`
*   `players`: `{ id, teamId, name, jerseyNumber }`
*   `playByPlay`: `{ id (UUID), gameId, timestamp, quarter, teamId, playerId, eventType (e.g., 2PT_MAKE, REB_DEF, FOUL), syncStatus }`

### Cloud Schema (Google Sheets Tabs)
The GAS script should map data to these sheets:
1.  **Games**: Game ID, Date, Team A, Team B.
2.  **PlayByPlay**: Event ID, Game ID, Timestamp, Quarter, Team, Player, Event Type.
3.  **BoxScore** (Aggregated): Game ID, Player, PTS, REB, AST, STL, BLK, TOV, PF.

## 5. Google Apps Script (GAS) Implementation Guide
*   Write a `doPost(e)` function to receive the bulk JSON payload.
*   Parse the JSON payload: `var data = JSON.parse(e.postData.contents);`
*   Use `LockService.getScriptLock()` to prevent race conditions if multiple games sync concurrently.
*   Use batch write operations (e.g., `sheet.getRange(...).setValues(dataArray)`) instead of writing row-by-row to avoid GAS execution timeouts.
*   Implement Idempotency: Check if a `Game ID` or `Event ID` already exists before appending to avoid duplicate data on double-sync.

## 6. Execution Tasks for AI Agent
When executing this project, proceed in the following phases:
1.  **Phase 1: Project Setup & UI Shell.** Initialize the frontend framework, configure Tailwind, and set up the Web App Manifest.
2.  **Phase 2: Service Worker & Offline Capability.** Write the Service Worker logic to cache the app shell.
3.  **Phase 3: Local Database (Dexie.js).** Set up the database instance and write CRUD functions for games and play-by-play events.
4.  **Phase 4: Courtside UI.** Build the input buttons, live scoreboard, and play-by-play log. Ensure 0ms latency and wake lock.
5.  **Phase 5: Sync Logic & GAS Backend.** Write the `doPost` Google Apps Script, then connect the frontend "Sync" button to send the Dexie.js payload to the deployed GAS web app URL.

Please read through this document and begin with Phase 1.
