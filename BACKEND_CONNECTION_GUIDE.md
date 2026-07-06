# Backend Connection Guide — Something.to

> **Who this is for:** The backend developer. You already know Node/Express/MongoDB. This document does not tell you how to write code — it tells you exactly what the frontend expects from every single endpoint, what the frontend sends to it, which file in the frontend the call lives in, and any nuances you need to know. Read this top to bottom once before touching anything.

---

## Part 0 — Environment & The Axios Setup

### Where the base URL lives

The frontend has **three** different HTTP client configurations. Know all three or you will miss requests.

**Client A — `frontend/lib/axios.ts`** (the named `apiClient` instance)  
This is the only proper Axios instance created with `axios.create()`. Its `baseURL` is hardcoded to `'https://your-backend-api-url.com/api'` — that string is the placeholder to replace with the real URL. This client auto-attaches the JWT from `localStorage.getItem('token')` as `Authorization: Bearer <token>` on every request via a request interceptor. It also has a response interceptor that fires on `401` — it clears the token from localStorage and redirects to `/login`. This client is used **only** by the auth flow.

**Client B — raw `axios` with `NEXT_PUBLIC_API_BASE_URL`**  
Most of the inner-app founder pages import `axios` directly (not the `apiClient` instance) and concatenate `process.env.NEXT_PUBLIC_API_BASE_URL` in front of each path. This env var must be set in `frontend/.env.local` like this:
```
NEXT_PUBLIC_API_BASE_URL=https://your-backend-api-url.com/api
```
Files using this pattern: `app/founder/page.tsx`, `app/founder/ideas/page.tsx`, `app/founder/chats/page.tsx`, `components/notifications-dropdown.tsx`.

**Client C — raw `axios` with path-only relative strings**  
The investor-side pages call axios with strings like `"/api/investor/portfolio"` and `"/api/chats"`. These are plain relative paths — they will be sent to the same origin as the frontend app. To make them hit your backend, you must either:  
- Add a `rewrites` block in `frontend/next.config.js` that rewrites `/api/**` to your backend URL, OR  
- Replace these calls in the investor pages to use `apiClient` from `lib/axios.ts` instead of raw axios.  
Files using this pattern: `app/investor/investments/page.tsx`, `app/investor/profile/page.tsx`, `app/investor/settings/page.tsx`, `app/investor/chats/page.tsx`.

---

### Token storage

The JWT is stored in `localStorage` under the key `"token"`. Your login and signup endpoints return `{ token: "..." }` and the frontend writes it. Every subsequent call reads it from localStorage manually. There are no cookies involved.

---

### localStorage keys you must know about

The frontend maintains a full mock database in localStorage as an offline fallback. Once your endpoints respond correctly, the API calls take over and localStorage is only used for some settings persistence. Do not use these keys for your own backend-side logic as the frontend owns them client-side.

| Key | File that owns it | Contents |
|---|---|---|
| `token` | Auth globally | JWT string |
| `demo_name` | Auth globally | User display name string |
| `demo_email` | Auth globally | User email string |
| `demo_role` | Auth globally | `"founder"` or `"investor"` |
| `selected_plan` | Signup, Settings pages | `"free"`, `"something"`, or `"nothing"` |
| `onboarding_complete` | Onboarding modal component | `"true"` string |
| `founder_your_ideas` | `app/founder/ideas/page.tsx` | JSON array of Idea objects |
| `founder_discover_ideas` | `app/founder/ideas/page.tsx` | JSON array of Idea objects |
| `founder_milestones` | `app/founder/funding/page.tsx`, `app/investor/investments/page.tsx` | JSON array of Milestone objects |
| `founder_notifications` | `components/notifications-dropdown.tsx` | JSON array of Notification objects |
| `investor_portfolio` | `app/investor/investments/page.tsx` | JSON array of investment Row objects |
| `investor_profile_data` | `app/investor/profile/page.tsx` | JSON object matching InvestorProfile shape |
| `investor_watchlisted_ids` | `app/investor/search/page.tsx` | JSON array of project ID strings |
| `investor_ghost_mode` | `app/investor/settings/page.tsx`, `app/investor/search/page.tsx` | `"true"` or `"false"` string |
| `founder_settings_accent` | Both settings pages | Accent color key string |

---

## Part 1 — Authentication Endpoints

**Files:** `frontend/components/auth-provider.tsx`, `frontend/app/login/page.tsx`, `frontend/app/signup/page.tsx`  
**Client used:** Client A (`apiClient` from `lib/axios.ts`)

---

### POST /auth/login

**Called from:** `auth-provider.tsx`, inside the `login()` function, at line ~89.

**Request body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**What the frontend does with the response:** Reads `res.data.token`. If present, stores it in localStorage under `"token"`, then immediately calls `GET /auth/me` to get the user object and populate the React auth context.

**Required response shape:**
```json
{
  "token": "string (a valid JWT)"
}
```

**Important nuance about role routing:** After login the frontend redirects to `/investor` or `/founder` based on `localStorage.getItem("demo_role")`. That key is set during signup. For returning users logging in, this key may no longer be present in a fresh browser. You have two options to fix this: (1) Include `role` in the `/auth/me` response (you already need to) and have the auth provider write it to localStorage when that call succeeds, or (2) include it in the login response alongside the token. Currently the production path does neither — it only works in mock mode because the demo fallback writes it. This is a critical wiring task before real logins work end-to-end.

---

### GET /auth/me

**Called from:** `auth-provider.tsx` at lines ~46, ~71, ~92. Called on every page load when a token exists.

**Request:** No body. The `Authorization: Bearer <token>` header is added automatically by the Client A interceptor.

**Required response shape:**
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "string  (founder or investor)"
}
```

If this returns `401`, Client A's interceptor auto-clears the token and redirects to `/login`. Any other non-2xx error sets the user context to null without redirect.

---

### POST /auth/signup

**Called from:** `app/signup/page.tsx`, inside `onSubmit()`, at line ~313. This is a 4-step wizard; all data is batched into one POST at the end of step 4.

**Request body when role is "founder":**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "founder",
  "plan": "free | something | nothing",
  "experience": "junior | mid | senior | founder | executive (optional)",
  "linkedin": "string (optional URL)",
  "github": "string (optional URL)",
  "twitter": "undefined (not collected for founders)",
  "firm": "undefined (founder field not used)",
  "expertise": ["Product", "Engineering", "AI/ML"],
  "interests": "undefined (investor field not used)",
  "age": "number (optional)",
  "occupation": "software_engineer | product_manager | designer | business_owner | student | other (optional)",
  "accepted_terms": "boolean"
}
```

**Request body when role is "investor":**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "investor",
  "plan": "free | something | nothing",
  "experience": "undefined (investor field not used)",
  "linkedin": "string (optional URL)",
  "github": "undefined (not collected for investors)",
  "twitter": "string (optional handle/URL)",
  "firm": "string (fund name, optional)",
  "expertise": "undefined (founder field not used)",
  "interests": ["Pre-seed", "AI/ML", "Climate"],
  "age": "number (optional)",
  "occupation": "undefined",
  "accepted_terms": "boolean"
}
```

**Required response shape:**
```json
{
  "token": "string (a valid JWT)"
}
```

On success, the frontend stores the token, name, email, role in localStorage, removes the `onboarding_complete` key so the onboarding modal fires on first load, dispatches a `auth:login` window event, and pushes to `/investor` or `/founder` based on the role field.

---

## Part 2 — Founder Dashboard

**File:** `frontend/app/founder/page.tsx`  
**Client used:** Client B (`NEXT_PUBLIC_API_BASE_URL`)

---

### GET /founder/overview

**Called from:** `app/founder/page.tsx`, inside `overviewAPI.getOverviewData()`, at line ~31. Requires auth.

**Request:** No body. `Authorization: Bearer <token>` header.

**Required response shape:**
```json
{
  "kpis": {
    "ideas": "number (count of their ideas)",
    "teamMembers": "number",
    "fundsRaised": "string formatted like $84,400",
    "unreadChats": "number"
  },
  "ideas": [
    {
      "id": "string",
      "title": "string",
      "status": "Funded | Seeking | Draft",
      "funding": "string formatted like $8,000 / $25,000",
      "stage": "string like MVP or Prototype",
      "tags": ["string"],
      "fundedPct": "number 0 to 100 integer"
    }
  ],
  "team": [
    {
      "id": "string",
      "initials": "string like AR",
      "name": "string",
      "role": "string like Co-Founder & CTO",
      "lastActive": "string like Active now or 3h ago"
    }
  ],
  "activity": [
    {
      "id": "string",
      "text": "string describing the event",
      "timestamp": "string like 2h ago",
      "important": "boolean (optional, highlights the row)"
    }
  ],
  "escrow": {
    "raised": "number in USD",
    "goal": "number in USD"
  }
}
```

If this endpoint fails, the component falls back to hardcoded mock data silently — the page stays functional.

---

## Part 3 — Ideas (Founder Side)

**Files:** `frontend/app/founder/ideas/page.tsx`, `frontend/app/founder/ideas/[id]/page.tsx`  
**Client used:** Client B

---

### GET /ideas/user

**Called from:** `ideas/page.tsx`, inside `ideasAPI.fetchYourIdeas()`, at line ~149. Requires auth (`Authorization: Bearer <token>` header).

Returns all ideas the currently authenticated founder created.

**Required response shape — array of objects, each with:**
```json
{
  "id": "string",
  "title": "string",
  "author": "string (display name)",
  "desc": "string (short ~120 char preview)",
  "description": "string (full text)",
  "tags": ["string"],
  "stage": "concept | prototype | mvp | launched",
  "likes": "number",
  "comments": "number (count)",
  "views": "number",
  "isYours": true,
  "lookingFor": ["string like Frontend developer or ML engineer"],
  "isDraft": "boolean",
  "createdAt": "string ISO date or YYYY-MM-DD",
  "attachments": [
    {
      "name": "string (filename with extension)",
      "size": "string formatted like 4.8 MB",
      "type": "presentation | video | audio | document"
    }
  ]
}
```

---

### GET /ideas/discover

**Called from:** `ideas/page.tsx`, inside `ideasAPI.fetchDiscoverIdeas()`, at line ~161. No auth required.

Returns all public ideas from all founders for the discovery feed. Same shape as `/ideas/user` but `isYours` is `false` for ideas that do not belong to the requesting user.

---

### POST /ideas

**Called from:** `ideas/page.tsx`, inside `ideasAPI.createIdea()`, at line ~173. Requires auth.

**Request body:**
```json
{
  "title": "string",
  "description": "string",
  "stage": "concept | prototype | mvp | launched",
  "tags": ["string"],
  "lookingFor": ["string"],
  "isDraft": "boolean",
  "attachments": [
    {
      "name": "string",
      "size": "string",
      "type": "presentation | video | audio | document"
    }
  ]
}
```

**Important note on attachments:** The frontend currently sends only **metadata** (name, size, type) — not the actual file binaries. See Part 14 for the full file upload strategy discussion. You and the frontend developer need to agree on Option A (pre-upload) or Option B (multipart) before this is production-ready.

**Required response shape:** A full Idea object matching the shape defined in GET /ideas/user above, representing the newly created idea.

---

### PUT /ideas/:id

**Called from:** `ideas/page.tsx`, inside `ideasAPI.updateIdea()`, at line ~206. Requires auth.

**Request body:** Identical to `POST /ideas` body.

**Required response shape:** The updated Idea object (same shape as above).

---

### DELETE /ideas/:id

**Called from:** `ideas/page.tsx`, inside `ideasAPI.deleteIdea()`, at line ~243. Requires auth.

**Request:** No body. `Authorization: Bearer <token>` header.

**Required response:** Any 2xx. Body is ignored.

---

### POST /ideas/:id/like

**Called from:** `ideas/page.tsx`, inside `ideasAPI.likeIdea()`, at line ~255. Requires auth.

**Request:** No body. `Authorization: Bearer <token>` header.

**Required response:** Any 2xx. Body is ignored.

This is called on every like action without a toggle flag. Your backend decides the logic — toggle if already liked, or always increment.

---

### GET /ideas/:id

**Called from:** `ideas/page.tsx`, inside `ideasAPI.getIdeaById()`, at line ~274. Also referenced by `ideas/[id]/page.tsx` which falls back to localStorage when the API is unavailable.

No auth required for reading a single idea.

**Required response shape** — the `ideas/[id]/page.tsx` file has its own Idea interface (line ~22) that expects these additional fields beyond the list shape:
```json
{
  "id": "string",
  "title": "string",
  "author": "string",
  "authorAvatar": "string (URL to avatar image)",
  "authorHeadline": "string like Hardware Tech Lead",
  "stage": "concept | prototype | mvp | launched",
  "tags": ["string"],
  "description": "string",
  "lookingFor": ["string"],
  "likes": "number",
  "downvotes": "number",
  "commentsCount": "number",
  "flagged": "boolean",
  "flagReason": "string (optional)",
  "attachments": [
    {
      "name": "string",
      "size": "string",
      "type": "presentation | video | audio | document"
    }
  ]
}
```

The detail page currently manages comments as hardcoded local state only — there is no comments API call yet.

---

## Part 4 — Founder Chats

**File:** `frontend/app/founder/chats/page.tsx`  
**Client used:** Client B

---

### GET /founder/threads

**Called from:** `chats/page.tsx`, inside `fetchThreads()`, at line ~344. Requires auth.

**Request:** `Authorization: Bearer <token>` header.

**Required response shape — array of:**
```json
{
  "id": "string",
  "name": "string (display name of the other participant, e.g. Sarah Chen • Horizon Ventures)",
  "preview": "string (last message text, truncated)",
  "unread": "number",
  "category": "co | requests | general",
  "participants": ["string (display names of all people in the thread)"],
  "lastActive": "string like 10m or 1h or 2d",
  "isOnline": "boolean",
  "isGhostMode": "boolean (optional, defaults false)"
}
```

Category meanings: `co` = co-founder threads, `requests` = investor inquiry threads, `general` = cohort/support threads.

---

### GET /founder/threads/:threadId/messages

**Called from:** `chats/page.tsx`, inside `fetchMessages()`, at line ~362. Requires auth.

**Request:** `Authorization: Bearer <token>` header.

**Required response shape — array of:**
```json
{
  "id": "string",
  "from": "you | them",
  "text": "string",
  "when": "string like 10 min ago or Yesterday",
  "timestamp": "number (Unix milliseconds)",
  "delivered": "boolean",
  "seen": "boolean"
}
```

The `from` field must be computed per-requesting-user by your backend. Look at who sent the message and return `"you"` if the message sender ID matches the authenticated user, `"them"` otherwise.

---

### POST /founder/threads/:threadId/messages

**Called from:** `chats/page.tsx`, inside `sendMessage()`, at line ~387. Requires auth.

**Request body:**
```json
{
  "text": "string"
}
```

`Authorization: Bearer <token>` header.

**Required response shape:** The newly created Message object (same shape as items in the messages array above).

---

### PATCH /founder/threads/:threadId/messages/read

**Called from:** `chats/page.tsx`, inside `markMessagesAsRead()`, at line ~487. Requires auth.

**Request body:**
```json
{
  "messageIds": ["string array of message IDs to mark as read"]
}
```

**Required response:** Any 2xx. Body is ignored.

---

## Part 5 — Founder Funding & Milestones

**File:** `frontend/app/founder/funding/page.tsx`

**Current status:** This page is entirely localStorage-based. There are zero API calls in this file. All milestone data is read from and written to `localStorage.getItem("founder_milestones")`.

**What you need to build and have the frontend developer wire up:**

The `handleRequestPayout()` function at line ~132 currently simulates a delay and writes to localStorage. You need to create these two endpoints and the frontend developer will wire them in:

**GET /founder/milestones** — returns all milestones for the authenticated founder.

**POST /founder/milestones/:milestoneId/submit** — called when the founder submits a payout request.

Request body the form collects:
```json
{
  "proofLink": "string (must be a valid URL starting with http:// or https://)",
  "workSummary": "string (free text, at least 10 chars)"
}
```

On success, the milestone's status changes from `"Active"` to `"Pending Verification"` and a `submittedDate` field is populated.

**Milestone object shape:**
```json
{
  "id": "string",
  "title": "string",
  "amount": "string formatted like $40,000",
  "status": "Released | Pending Verification | Active | Locked",
  "description": "string",
  "submittedDate": "string ISO date YYYY-MM-DD (optional)",
  "releasedDate": "string ISO date YYYY-MM-DD (optional)",
  "proofLink": "string (optional)",
  "workSummary": "string (optional)"
}
```

The investor investments page (`app/investor/investments/page.tsx`) also loads milestone data via a cross-window event `"founder-milestones-updated"`. Once both pages use real API endpoints they should both call `/founder/milestones` or `/investor/milestones/:ideaId` rather than relying on localStorage cross-talk.

---

## Part 6 — Notifications

**File:** `frontend/components/notifications-dropdown.tsx`  
**Client used:** Client B

---

### GET /notifications

**Called from:** `notifications-dropdown.tsx`, inside `notificationsAPI.getNotifications()`, at line ~71. Requires auth.

**Request:** `Authorization: Bearer <token>` header.

**Required response shape — array of:**
```json
{
  "id": "string",
  "text": "string (e.g. Ava Reynolds accepted your introduction request.)",
  "read": "boolean",
  "timestamp": "string human readable like 10m ago"
}
```

---

### POST /notifications/mark-all-read

**Called from:** `notifications-dropdown.tsx`, inside `notificationsAPI.markAllAsRead()`, at line ~83. Requires auth.

**Request:** No body. `Authorization: Bearer <token>` header.

**Required response:** Any 2xx. Body is ignored.

---

## Part 7 — Investor Profile

**File:** `frontend/app/investor/profile/page.tsx`  
**Client used:** Client C (path-only strings)

Important note: The investor profile pages use raw axios with path-only strings like `"/api/investor/profile"`. These requests do NOT automatically include the JWT — there is no interceptor on raw axios instances. You have two options to handle auth: (1) add `next.config.js` rewrites and a global axios default header, or (2) have the frontend developer switch these to use `apiClient` from `lib/axios.ts`. Coordinate this before testing.

---

### GET /api/investor/profile

**Called from:** `profile/page.tsx`, inside `fetchProfile()`, at line ~162.

**Required response shape:**
```json
{
  "name": "string",
  "firm": "string (fund/firm name)",
  "minCheck": "number (USD integer)",
  "maxCheck": "number (USD integer)",
  "bio": "string",
  "interests": ["string like AI/ML or Climate"],
  "escrowRequired": "boolean",
  "ndaPreferred": "boolean",
  "pacePerQuarter": "number (deals per quarter)",
  "stageFocus": ["Pre‑seed | Angel | Seed"],
  "publicProfile": "boolean",
  "handle": "string (public profile slug)",
  "avatarUrl": "string (URL)"
}
```

---

### PUT /api/investor/profile

**Called from:** `profile/page.tsx`, inside `saveProfile()`, at line ~198.

**Request body:**
```json
{
  "name": "string",
  "firm": "string",
  "minCheck": "number",
  "maxCheck": "number",
  "bio": "string"
}
```

**Required response:** Any 2xx. Frontend re-fetches the full profile after this call.

---

### PUT /api/investor/preferences

**Called from:** `profile/page.tsx`, inside `savePreferences()`, at line ~216.

**Request body:**
```json
{
  "escrowRequired": "boolean",
  "ndaPreferred": "boolean",
  "pacePerQuarter": "number",
  "stageFocus": ["string"]
}
```

**Required response:** Any 2xx. Frontend re-fetches the full profile after this call.

---

### PUT /api/investor/interests

**Called from:** `profile/page.tsx`, inside `updateInterests()`, at line ~231.

**Request body:**
```json
{
  "interests": ["AI/ML", "Climate"]
}
```

**Required response:** Any 2xx.

---

### PUT /api/investor/visibility

**Called from:** `profile/page.tsx`, inside `updateVisibility()`, at line ~245. Called separately for each field.

**Request body (one field at a time):**
```json
{ "publicProfile": "boolean" }
```
OR
```json
{ "handle": "string" }
```

**Required response:** Any 2xx.

---

### POST /api/investor/avatar

**Called from:** `profile/page.tsx`, inside `uploadAvatar()`, at line ~263. Also called from `investor/settings/page.tsx`, inside `uploadAvatar()`, at line ~64.

**Request:** `multipart/form-data`. The binary file is attached under the field name `"avatar"`.

**Required response shape:**
```json
{
  "url": "string (public accessible URL to the uploaded image)"
}
```

After success, the frontend stores this URL in React state and also writes it to the `investor_profile_data` localStorage object under `avatarUrl`.

---

### POST /api/investor/reverify

**Called from:** `profile/page.tsx`, inside `requestReverification()`, at line ~280.

**Request:** No body.

**Required response:** Any 2xx. Frontend shows an `alert()` dialog on success.

---

## Part 8 — Investor Investments & Portfolio

**File:** `frontend/app/investor/investments/page.tsx`  
**Client used:** Client C

---

### GET /api/investor/portfolio

**Called from:** `investments/page.tsx`, inside `fetchPortfolio()`, at line ~136.

**Required response shape:**
```json
{
  "data": [
    {
      "id": "string",
      "name": "string (project name)",
      "stage": "Pre‑seed | Seed | Angel",
      "location": "string like San Francisco, CA",
      "trustPoints": "number 1 to 100",
      "committed": "number (USD total committed)",
      "released": "number (USD total released)",
      "perf": "string like Good or Stable or At Risk",
      "next": "string (label for the next milestone)",
      "founders": [
        {
          "id": "string",
          "name": "string",
          "role": "string",
          "bio": "string",
          "links": [
            {
              "label": "string like Twitter or LinkedIn",
              "href": "string (URL)"
            }
          ]
        }
      ]
    }
  ],
  "totalCommitted": "number",
  "totalReleased": "number"
}
```

---

### POST /api/investor/release-request

**Called from:** `investments/page.tsx`, inside `handleRequestRelease()`, at line ~171.

**Request body:**
```json
{
  "projectId": "string",
  "timestamp": "string (ISO datetime)"
}
```

**Required response:** Any 2xx. Frontend shows an `alert()` on success.

---

## Part 9 — Investor Chats

**File:** `frontend/app/investor/chats/page.tsx`  
**Client used:** Client C

---

### GET /api/chats

**Called from:** `investor/chats/page.tsx` at line ~205.

**Required response shape:** Array of Thread objects. Same shape as Founder Threads (Part 4, GET /founder/threads).

---

### GET /api/chats/:id/messages

**Called from:** `investor/chats/page.tsx` at line ~261.

**Required response shape:** Array of Message objects. Same shape as Founder Messages (Part 4, GET /founder/threads/:id/messages).

---

### POST /api/chats/:id/messages

**Called from:** `investor/chats/page.tsx` at line ~403.

**Request body:**
```json
{
  "text": "string"
}
```

**Required response shape:** The newly created Message object.

---

## Part 10 — Investor Search / Discovery

**File:** `frontend/app/investor/search/page.tsx`

**Current status:** Entirely static. All project data comes from a hardcoded `MOCK` array defined at the top of the file (line ~50). Filtering (domain, location, trust points, investment size, launch date window) runs client-side. There are zero API calls.

**What you need to build and have the frontend developer wire up:**

Add a `GET /api/projects` endpoint that returns all discoverable projects. The frontend can continue filtering client-side, or you can accept query params — your call.

**Expected project object shape:**
```json
{
  "id": "string",
  "name": "string",
  "domains": ["Edge AI", "Robotics"],
  "desc": "string (short description)",
  "stage": "Pre‑seed | Seed | Angel | Series A",
  "launchedAt": "string (ISO datetime) or null",
  "trustPoints": "number 1 to 100",
  "location": "string like SF Bay or Berlin or Remote",
  "investmentNeeded": "number (USD integer)"
}
```

The watchlist star button writes project IDs to `localStorage.getItem("investor_watchlisted_ids")`. There is no API call for watchlisting yet — purely client-side for now.

---

## Part 11 — Investor Dashboard

**File:** `frontend/app/investor/page.tsx`

**Current status:** Fully mocked. The `fetchData()` function at line ~155 simulates a 400ms delay and returns the hardcoded `MOCK_DATA` constant. There are zero API calls.

**What you need to build and have the frontend developer wire up:**

Add a `GET /api/investor/overview` endpoint. The expected response shape:
```json
{
  "kpis": {
    "availableBalance": "string like $128,400",
    "committedCapital": "string like $86,200",
    "activeProjects": "number",
    "unreadChats": "number"
  },
  "pipeline": [
    {
      "id": "string",
      "name": "string",
      "stage": "assess | match | mobilize"
    }
  ],
  "recentActivity": [
    {
      "id": "string",
      "description": "string",
      "timestamp": "string human readable"
    }
  ]
}
```

---

## Part 12 — Settings Pages

**Files:** `frontend/app/founder/settings/page.tsx`, `frontend/app/investor/settings/page.tsx`

**Founder settings current status:** All controls (profile, notifications, security, billing, danger zone) write to localStorage only. There are zero API calls anywhere in this file.

**Investor settings current status:** Has one real API call — `POST /api/investor/avatar` at line ~64. Everything else only `console.log()`s or writes to localStorage.

**Endpoints you need to build for both settings pages** (the frontend developer will need to wire these in when you're ready):

For founders:
- `GET /api/founder/profile` — load the founder's profile data on settings mount
- `PUT /api/founder/profile` — save name, headline, location, about, socials, skills
- `POST /api/founder/avatar` — multipart, same as `/api/investor/avatar`, returns `{ url: string }`
- `PUT /api/founder/settings/notifications` — save notification preferences
- `PUT /api/founder/settings/security` — update email and/or password
- `DELETE /api/founder/account` — delete account (the danger zone button)

For investors:
- `PUT /api/investor/settings/notifications` — notification preferences
- `PUT /api/investor/settings/privacy` — profile visibility, ghost mode, allow messages flags
- `PUT /api/investor/settings/security` — update email and/or password
- `DELETE /api/investor/account` — delete account
- `POST /api/investor/billing/upgrade` — when payment integration is added (currently just an alert)

---

## Part 13 — Investor Diligence

**File:** `frontend/app/investor/diligence/page.tsx`

**Current status:** Entirely static. No API calls. Hardcoded diligence checklist data.

No endpoints needed right now. Wire up when diligence workflow is defined.

---

## Part 14 — File Uploads for Pitch Materials

**Files involved:**
- `frontend/components/post-idea-modal.tsx` — where pitch files are selected in the UI
- `frontend/app/founder/ideas/page.tsx` — the `createIdea()` and `updateIdea()` calls

**Current situation:** The modal has four `<input type="file">` elements — one for each pitch type (Pitch Deck accepts `.pdf .ppt .pptx`, Video accepts `.mp4 .mov .webm`, Audio accepts `.mp3 .wav .m4a`, Documents accept `.pdf .doc .docx .txt`). When files are selected, the `handleFileUpload()` function creates `{ name, size, type }` metadata objects and pushes them into `formData.attachments`. The actual `File` binary objects are NOT stored in state — only the metadata strings.

This means when `createIdea()` is called, your backend currently receives only:
```json
{
  "attachments": [
    { "name": "pitch.pdf", "size": "4.8 MB", "type": "presentation" }
  ]
}
```

**You need to decide on a file upload strategy and tell the frontend developer so they can implement it.** Two options:

**Option A — Pre-upload:** Add a `POST /uploads` endpoint. When a file is selected in the modal, the frontend immediately POSTs it there and receives back a URL. The attachment object stored in state becomes `{ name, size, type, url }`. When the idea is finally created, those URLs are included in the idea payload. This keeps idea creation as a clean JSON POST.

**Option B — Multipart idea creation:** Change `createIdea()` to use `multipart/form-data`, with idea fields as form fields and files as file attachments. The backend parses both together.

**Recommendation is Option A.** It's cleaner and lets you validate/store files independently of idea creation. The endpoint should accept a single file field named `"file"` and return `{ url: string, fileId: string }`.

**ZIP blocking:** The modal already enforces this on the frontend — `handleFileUpload()` rejects files with `type === "application/zip"` or names ending in `.zip`. Enforce it server-side too.

**Accepted file types to enforce server-side:**
- Presentation: `.pdf`, `.ppt`, `.pptx`
- Video: `.mp4`, `.mov`, `.webm`
- Audio: `.mp3`, `.wav`, `.m4a`
- Document: `.pdf`, `.doc`, `.docx`, `.txt`
- Blocked: `.zip` and any archive format

---

## Part 15 — Waitlist Form

**File:** `frontend/components/waitlist-form.tsx`

**Current status:** POSTs to `"#"` (a literal hash string, so nothing happens). The call at line ~42 is `axios.post("#", { email: email.trim() })`.

**What you need to build:** A `POST /waitlist` endpoint accepting `{ email: string }` that returns any 2xx. Then update the URL in `waitlist-form.tsx` to your real endpoint. The frontend already handles both success and error states around this call.

---

## Part 16 — Critical: Role Routing Fix Needed

After a real login (not demo mode), the frontend's routing logic in `app/login/page.tsx` at line ~30 reads `localStorage.getItem("demo_role")` to decide where to push the user. For a real user logging in from a fresh browser, this key won't exist.

You and the frontend developer need to fix this together. The cleanest fix: after a successful `/auth/me` call returns `{ role: "investor" }`, write `localStorage.setItem("demo_role", user.role)` in the `auth-provider.tsx` at the point where `setUser(res.data)` is called (around line ~47). This is a frontend change but you need to coordinate it.

---

## Part 17 — CORS

Your backend must send the correct CORS headers for requests from the frontend's origin.

- `Access-Control-Allow-Origin`: The exact frontend domain (not `*` when using Authorization headers)
- `Access-Control-Allow-Headers`: `Content-Type, Authorization`
- `Access-Control-Allow-Methods`: `GET, POST, PUT, PATCH, DELETE, OPTIONS`
- `Access-Control-Allow-Credentials`: `true` (in case cookies are added later)
- Handle `OPTIONS` preflight requests with a `200` response

Dev origin: `http://localhost:3000`  
Production origin: wherever the frontend deploys

---

## Part 18 — Real-Time / WebSocket Integration Points

The chats pages currently use HTTP fetch + a local mock typing simulation. There is no WebSocket code at all.

When you add real-time, here is where to hook in on the frontend side (communicate this to the frontend developer):

In `founder/chats/page.tsx` at line ~320, there is a `useEffect` that listens for `"founder-chat-sync"` and `"storage"` window events. When your WebSocket receives an incoming message, dispatching `window.dispatchEvent(new CustomEvent("founder-chat-sync"))` from the socket handler will trigger the chat UI to re-fetch messages without any other changes.

Alternatively, the WebSocket handler can directly call `fetchMessages(activeThreadId)` if you have access to that function in scope. The cleanest pattern is a `useEffect` inside the chat page that establishes the socket connection and calls `fetchMessages` on incoming message events for the active thread.

---

## Summary — All Endpoints at a Glance

| Method | Path | Auth Required | Frontend File | Status |
|--------|------|---------------|---------------|--------|
| POST | /auth/login | No | `components/auth-provider.tsx` | Needs wiring |
| GET | /auth/me | Bearer | `components/auth-provider.tsx` | Needs wiring |
| POST | /auth/signup | No | `app/signup/page.tsx` | Needs wiring |
| GET | /founder/overview | Bearer | `app/founder/page.tsx` | Needs wiring |
| GET | /ideas/user | Bearer | `app/founder/ideas/page.tsx` | Needs wiring |
| GET | /ideas/discover | No | `app/founder/ideas/page.tsx` | Needs wiring |
| POST | /ideas | Bearer | `app/founder/ideas/page.tsx` | Needs wiring |
| PUT | /ideas/:id | Bearer | `app/founder/ideas/page.tsx` | Needs wiring |
| DELETE | /ideas/:id | Bearer | `app/founder/ideas/page.tsx` | Needs wiring |
| POST | /ideas/:id/like | Bearer | `app/founder/ideas/page.tsx` | Needs wiring |
| GET | /ideas/:id | No | `app/founder/ideas/page.tsx` | Needs wiring |
| GET | /founder/threads | Bearer | `app/founder/chats/page.tsx` | Needs wiring |
| GET | /founder/threads/:id/messages | Bearer | `app/founder/chats/page.tsx` | Needs wiring |
| POST | /founder/threads/:id/messages | Bearer | `app/founder/chats/page.tsx` | Needs wiring |
| PATCH | /founder/threads/:id/messages/read | Bearer | `app/founder/chats/page.tsx` | Needs wiring |
| GET | /notifications | Bearer | `components/notifications-dropdown.tsx` | Needs wiring |
| POST | /notifications/mark-all-read | Bearer | `components/notifications-dropdown.tsx` | Needs wiring |
| GET | /api/investor/profile | Bearer* | `app/investor/profile/page.tsx` | Needs wiring |
| PUT | /api/investor/profile | Bearer* | `app/investor/profile/page.tsx` | Needs wiring |
| PUT | /api/investor/preferences | Bearer* | `app/investor/profile/page.tsx` | Needs wiring |
| PUT | /api/investor/interests | Bearer* | `app/investor/profile/page.tsx` | Needs wiring |
| PUT | /api/investor/visibility | Bearer* | `app/investor/profile/page.tsx` | Needs wiring |
| POST | /api/investor/avatar | Bearer* | `app/investor/profile/page.tsx`, `app/investor/settings/page.tsx` | Needs wiring |
| POST | /api/investor/reverify | Bearer* | `app/investor/profile/page.tsx` | Needs wiring |
| GET | /api/investor/portfolio | Bearer* | `app/investor/investments/page.tsx` | Needs wiring |
| POST | /api/investor/release-request | Bearer* | `app/investor/investments/page.tsx` | Needs wiring |
| GET | /api/chats | Bearer* | `app/investor/chats/page.tsx` | Needs wiring |
| GET | /api/chats/:id/messages | Bearer* | `app/investor/chats/page.tsx` | Needs wiring |
| POST | /api/chats/:id/messages | Bearer* | `app/investor/chats/page.tsx` | Needs wiring |
| GET | /api/investor/overview | Bearer | `app/investor/page.tsx` | Not wired yet |
| GET | /api/projects | Bearer | `app/investor/search/page.tsx` | Not wired yet |
| GET | /founder/milestones | Bearer | `app/founder/funding/page.tsx` | Not wired yet |
| POST | /founder/milestones/:id/submit | Bearer | `app/founder/funding/page.tsx` | Not wired yet |
| POST | /waitlist | No | `components/waitlist-form.tsx` | URL is "#" currently |
| POST | /uploads | Bearer | future (see Part 14) | Not wired yet |

*Bearer* = auth is required but currently the investor-side pages use path-only axios without an interceptor. See Part 7 for the fix options.
