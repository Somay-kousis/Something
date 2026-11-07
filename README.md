<div align="center">
  <img src="logo.svg" width="220" height="220" alt="something logo" />
  <h1>something</h1>
  <p><i>ideas find their people</i></p>
</div>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6.svg" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Next.js-15-000000.svg" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB.svg" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4.svg" alt="Tailwind CSS" />
</p>

A platform where founders post ideas, test them against two AI reviewers, and meet investors and co-founders. **Something** argues for the idea (hooks, why people would care). **Nothing** argues against it (scale limits, adoption friction, churn risk).

**Status: front-end prototype.** The founder and investor apps are built in Next.js and run on mock data kept in `localStorage`. The backend has Mongoose models but no server yet.

## What's built

**Founder app** (`frontend/app/founder/`): ideas, the Something vs. Nothing review (`mutiny/`), problems, chats, funding (milestone escrow view with proof-link submission), profile, settings.

**Investor app** (`frontend/app/investor/`): search and watchlist, diligence, investments, problems, chats, profile, settings.

**Also:** login and signup with JWT handling in `frontend/lib/axios.ts`, onboarding modal, notifications, plan picker.

**Backend** (`backend/src/models/`): Mongoose schemas for founders, investors, firms and investments. `BACKEND_CONNECTION_GUIDE.md` lists every endpoint the front end calls, what it sends and what it expects back.

## Run it

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. Everything works offline against mock data.

## Not built yet

- **Server.** `backend/src/app.js` and `backend/src/index.js` are empty. Until they exist, all API calls fall back to `localStorage`.
- **AI review.** The Something vs. Nothing results come from `frontend/lib/mock-mutiny.ts`, which returns fixed sample people, investors, ideas and patents after a 900 ms delay. No model is called.
- **Matching.** Planned: normalize each profile into "what I have / what I need", search for similar and complementary profiles, filter by stage, location, language and commitment, then have a reasoning model check the fit. None of this is in the code.
- **Escrow.** Planned: community pledges locked per milestone, released when at least 50% of a review committee approves the founder's proof. The funding page shows the flow; there is no payment or escrow logic.
- **Tests.** `frontend/tests/mutiny-page.spec.tsx` is a placeholder and there is no test runner configured.
