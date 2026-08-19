# MELDA — Student app

The student learning companion of MELDA, for the **AFRETEC Innovation Challenge** — built for **low-resource classrooms** (low-end Android, unreliable power, patchy connectivity). This is the **EXPERIENCE** surface: read lessons, ask for a simpler explanation, take reviews.

## What a student does here

- **Read** the lessons their teacher has published, with any simpler explanations the teacher (with MELDA) has already saved shown inline.
- Tap **"I don't get this"** on a section that isn't landing — that posts a `REQUEST_SIMPLER` signal the teacher sees **live**, and a simpler take shows up here once they add it. On-demand AI is a **teacher-only** feature (the key and its cost stay on the server), so help comes back through the teacher, not straight from the model.
- **Take a review** — the server grades it and returns the score. The app never receives the answer key, so it can't grade (or leak) locally.

This app is a **thin client**: it reads its own data and submits through [src/api/client.ts](src/api/client.ts), and holds no shared state. It only ever sees **this student's** data — classmates' papers and the answer key never reach it.

## Stack

**Expo (SDK 54) + React Native + TypeScript** — iOS / Android / web from one codebase; Android is the target device. State is **session-only**: a JWT in a small Zustand store, persisted to AsyncStorage so a reload keeps you signed in. Shared types come from [melda-shared](https://github.com/David3Emmanuel/melda-shared) as a type-only import (erased at build).

## Running

This app needs the backend. Start [melda-backend](https://github.com/David3Emmanuel/melda-backend) first (it runs with zero setup), then:

```bash
pnpm install
pnpm start
```

Open in **Expo Go** — scan the QR from a physical Android or iPhone (works from Windows), or press `a` (Android emulator) / `w` (web). Point the app at your backend with `EXPO_PUBLIC_API_URL` (defaults to `http://localhost:4000`; a physical device needs the host LAN IP). Copy [.env.example](.env.example) to `.env` to set it.

The login screen is prefilled with the seeded demo student — **`s1@melda.africa` / `melda`** — so a reviewer signs in with one tap.

Runnable checks (assert-based, no framework):

```bash
pnpm check      # API client contract
pnpm typecheck
```

## Project layout

- `app/` — Expo Router routes: `index.tsx` (student login), `(student)/index.tsx` (home), `lesson/[lessonId].tsx` (reader + "I don't get this"), `quiz/[assignmentId].tsx` (take a review)
- `src/api/` — `client.ts` (the one door to the backend) + `useApi.ts` (fetch hook)
- `src/state/` — `store.ts`, the session-only Zustand store (JWT)
- `src/ui/` — design tokens + the shared component kit

## The four repos

- **[melda-student](https://github.com/David3Emmanuel/melda-student)** — this app (student EXPERIENCE)
- **[melda-teacher](https://github.com/David3Emmanuel/melda-teacher)** — teacher app (CREATE + UNDERSTAND) — where authoring and insights live
- **[melda-backend](https://github.com/David3Emmanuel/melda-backend)** — Express + Postgres/PGlite + Drizzle + JWT; owns the data, proxies AI, grades submissions
- **[melda-shared](https://github.com/David3Emmanuel/melda-shared)** — pure domain types, aggregation logic, and REST DTOs
