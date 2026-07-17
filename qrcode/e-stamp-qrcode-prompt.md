# Project: E-Stamp QR Code System for University Open House Event (QR/Scanner Layer Only)

## Context
This is for a university "Open House" event. Attendees (students) must collect stamps from every club booth. Once they have collected stamps from all clubs at a given location, they bring their QR code to a reward booth to redeem a prize. This system replaces the old paper-stamp process with QR code scanning.

## Scope (Important)
- Build ONLY the frontend + business logic of the QR code system.
- Do NOT integrate a real database (no Supabase, no backend persistence layer). Another team is handling the database and an analytics dashboard separately.
- Implement the data layer as a clean abstraction/interface backed by mock data or local storage for now. Write it as a set of async functions with clear signatures (e.g. `getStudentByToken`, `createStudent`, `recordStamp`, `getStampsForStudent`, `getRewardClaim`, `createRewardClaim`, etc.) isolated in a single file (e.g. `lib/dataClient.ts`) so another team can later swap the internal implementation to call Supabase without touching any UI code.

## Device Support (Important)
- The system must work reliably on **both iPad and smartphones** (iOS Safari and Android Chrome), since:
  - Students will show their personal QR code on their own phones.
  - Club booth staff and reward booth staff will most likely use **iPads** (larger screen, easier to mount/hold at a booth) to run the scanner, though some may use phones too.
- Camera scanning must explicitly request the **rear/back camera** (`facingMode: "environment"`) by default, since staff will hold the device up to scan attendees' phone screens.
- Must handle iOS Safari's camera permission quirks (camera access requires HTTPS or localhost, and a user-initiated gesture to start the camera — do not auto-start scanning before a tap on iOS).
- Layout must adapt gracefully to both iPad's larger/landscape-friendly screen and a phone's narrow portrait screen (responsive breakpoints, not just mobile-only design). Buttons and scan target area should be large and easy to tap/read at booth distance on both device types.
- Test/design assuming the scanner page may be left open for hours at a booth — camera should be able to restart cleanly between scans without memory leaks or requiring a full page reload.

## Tech Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- `qrcode` (npm) for generating QR code images
- `html5-qrcode` for scanning QR codes via device camera in the browser
- Responsive design covering iPad and phone form factors (not just phone-only)

## Data Model
Use these as TypeScript interfaces and the shape of the mock data:

```typescript
interface Student {
  id: string;
  studentCode: string; // 13-digit student ID
  qrToken: string;     // static token bound to the student for the whole event (no expiry)
  createdAt: string;
}

interface Club {
  id: string;
  name: string;
  location: 'anekprasong' | 'palm_garden'; // two physical event locations
  token: string; // encoded into this club booth's QR code
}

interface Stamp {
  id: string;
  studentId: string;
  clubId: string;
  scannedAt: string;
  // must be unique per (studentId, clubId)
}

interface RewardBooth {
  id: string;
  location: 'anekprasong' | 'palm_garden';
  token: string; // encoded into this reward booth's QR code
}

interface RewardClaim {
  id: string;
  studentId: string;
  location: 'anekprasong' | 'palm_garden';
  claimedAt: string;
  // must be unique per (studentId, location) => one redemption per location only
}
```

## User Flows to Build

### 1) Attendee registration page (`/register`)
- Form to enter a 13-digit student ID (validate length/numeric).
- On submit, call `dataClient.createStudent()`.
  - If this student ID was already registered, return the existing `qrToken` instead of creating a duplicate.
- Display the result as a QR code image (generated from `qrToken` using the `qrcode` library).
- Clear instructional text: "Save a screenshot of this screen — show it to club/booth staff to be scanned."
- Include a "Download QR" button to save the QR as an image (useful since some students may have spotty connectivity later).

### 2) Club booth scanner page (`/club/[token]`)
- Load club info from the `token` in the URL via `dataClient.getClubByToken()`.
- If the token is invalid, show a clear error state.
- Display the club's name prominently at the top.
- Show a "Start Scanning" button (required for iOS camera permission gesture) that opens the rear camera and starts `html5-qrcode` scanning.
- On successful scan of a student's QR (yields the student's `qrToken`):
  - Look up the student; if not found, show "Attendee not found — please register first."
  - If found and this club hasn't been stamped yet, record a new stamp and show "✅ [Club Name] stamped successfully."
  - If this club was already stamped for this student, show a neutral "Already stamped" notice (not a hard error).
- Debounce/lock scanning while a scan is being processed, to prevent duplicate rapid-fire scans.
- Include a "Scan Next Person" button that resets the camera/scanner cleanly for the next attendee.

### 3) Reward booth scanner page (`/reward/[token]`)
- Load booth info from the `token` in the URL to determine its `location` (`anekprasong` or `palm_garden`).
- Fetch the full list of clubs belonging to that `location` from the mock clubs data.
- Show a "Start Scanning" button and open the rear camera scanner.
- On successful scan of a student's QR:
  a. Look up the student; if not found, show "Attendee not found."
  b. Fetch all of that student's stamps and compare against the required clubs for this location.
  c. If stamps are incomplete, show the specific missing club names, e.g. "Missing 3 clubs: Club A, Club B, Club C."
  d. If all clubs at this location are stamped:
     - Check whether a `RewardClaim` already exists for this student at this `location`.
     - If not claimed yet, create a new `RewardClaim` and show "🎉 Prize can be redeemed."
     - If already claimed, show "Prize already redeemed at this location — cannot redeem again."
- Include a "Scan Next Person" button to reset for the next attendee.

## Mock Data
- Create at least 6–8 mock clubs, split across the two locations (e.g. 4 at `anekprasong`, 4 at `palm_garden`).
- Create 2 mock reward booths, one per location.
- Add a `/dev` page (or clear console logging) that lists the generated URLs/QR codes for every club and reward booth, so the whole flow can be tested end-to-end without waiting on real data.

## UI/UX Requirements
- Responsive for both iPad and phone screens — large tappable buttons and a large, clearly framed scan target area, since this will be used in a noisy, crowded, fast-paced event environment.
- Clear success/error/warning states using color + icon (green = success, red = error, yellow = already done).
- Thai language for all UI text and user-facing messages.
- No full user-authentication system needed — booth identity is authenticated simply via the token in the URL.

## Out of Scope
- No real Supabase integration (use the mock/local data layer, designed to be swappable later).
- No analytics/summary dashboard.
- No full admin authentication system.

## Deliverable
- A Next.js project that runs immediately with `npm run dev`.
- Clear file structure, with `lib/dataClient.ts` isolated as the future backend integration point.
- A README explaining how to run the project, how to test the full QR flow using the `/dev` page, and how to later swap `dataClient` to call real Supabase endpoints.
