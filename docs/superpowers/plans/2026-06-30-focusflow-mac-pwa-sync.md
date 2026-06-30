# FocusFlow Mac PWA Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a first pass where FocusFlow installs like an app on Mac/iPhone and syncs the active timer across signed-in devices.

**Architecture:** Keep the existing Next.js app as the UI. Add a per-user `active_timers` table and a small server/client sync layer that stores canonical timer state with absolute timestamps while the existing Zustand store keeps local ticking smooth.

**Tech Stack:** Next.js App Router, React, Zustand, Drizzle/Postgres, Vitest, Web App Manifest/PWA metadata.

---

## File Structure

- Modify `src/db/schema.ts`: add `activeTimers` table.
- Add `drizzle/0004_active_timers.sql`: migration for the new table.
- Add `src/lib/timer/active-timer.ts`: shared timer state normalization and mutation helpers.
- Add `src/lib/timer/active-timer.test.ts`: TDD coverage for normalization and mutations.
- Add `src/app/api/timer/active/route.ts`: authenticated GET/PUT endpoint.
- Modify `src/lib/store/timer-store.ts`: add hydration/apply helpers for remote timer state.
- Add `src/lib/timer/timer-sync.ts`: client API adapter for remote state.
- Add `src/lib/timer/timer-sync.test.ts`: tests for stale/newer remote state behavior.
- Add `src/components/timer/TimerSyncStatus.tsx`: subtle sync status indicator.
- Modify `src/lib/hooks/useTimer.ts`: send mutations on timer commands and refresh/poll remote state.
- Modify `src/components/timer/TimerScreen.tsx`: include sync status and improve mobile standalone layout.
- Add `src/app/manifest.ts`: Next.js metadata route for installable PWA manifest.
- Modify `src/app/layout.tsx`: add PWA/mobile metadata.
- Add `public/sw.js`: conservative service worker shell.
- Add app icon files under `public/`.
- Add `docs/install-focusflow-app.md`: Mac/iPhone install notes.

## Task 1: Active Timer Domain Model

**Files:**
- Create: `src/lib/timer/active-timer.test.ts`
- Create: `src/lib/timer/active-timer.ts`

- [ ] **Step 1: Write failing normalization tests**

```ts
import { describe, expect, it } from "vitest";
import { normalizeActiveTimerInput } from "./active-timer";

describe("active timer normalization", () => {
  it("normalizes invalid input to an idle focus timer", () => {
    expect(normalizeActiveTimerInput({ mode: "bad", status: "bad", plannedDuration: 1 })).toMatchObject({
      mode: "focus",
      status: "idle",
      plannedDuration: 25 * 60,
      activeElapsedSeconds: 0,
      runStartedAt: null,
    });
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- src/lib/timer/active-timer.test.ts`

Expected: fail because `src/lib/timer/active-timer.ts` does not exist.

- [ ] **Step 3: Implement normalization and mutation helpers**

Add exported types for `ActiveTimerState`, `ActiveTimerMutation`, `normalizeActiveTimerInput`, `applyActiveTimerMutation`, `calculateActiveElapsedSeconds`, and `calculateSecondsRemaining`.

- [ ] **Step 4: Run the active timer tests and verify GREEN**

Run: `npm test -- src/lib/timer/active-timer.test.ts`

Expected: pass.

## Task 2: Database Schema And Migration

**Files:**
- Modify: `src/db/schema.ts`
- Create: `drizzle/0004_active_timers.sql`
- Modify: `drizzle/meta/_journal.json`

- [ ] **Step 1: Add schema table**

Add `activeTimers` with one row per user, timer mode/status fields, timestamps, version, and update timestamps.

- [ ] **Step 2: Add SQL migration**

Create table SQL with a unique `user_id`, cascade delete, and safe defaults matching the domain model.

- [ ] **Step 3: Run schema-related tests**

Run: `npm test -- src/lib/timer/active-timer.test.ts`

Expected: pass.

## Task 3: Active Timer API

**Files:**
- Create: `src/app/api/timer/active/route.ts`
- Extend: `src/lib/timer/active-timer.test.ts` if normalization gaps are found.

- [ ] **Step 1: Add authenticated GET**

Return 401 when signed out, otherwise return the user's active timer row or normalized idle state.

- [ ] **Step 2: Add authenticated PUT**

Parse JSON mutation, load existing row, apply mutation using server time, upsert by `userId`, increment `version`, and return canonical JSON.

- [ ] **Step 3: Run targeted tests**

Run: `npm test -- src/lib/timer/active-timer.test.ts`

Expected: pass.

## Task 4: Client Store Sync Hooks

**Files:**
- Modify: `src/lib/store/timer-store.ts`
- Add: `src/lib/timer/timer-sync.ts`
- Add: `src/lib/timer/timer-sync.test.ts`

- [ ] **Step 1: Write failing tests for remote state application**

Test that newer remote timer state hydrates the store and older versions are ignored by the helper.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- src/lib/timer/timer-sync.test.ts`

Expected: fail because sync helper is missing.

- [ ] **Step 3: Implement sync adapter**

Add fetch helpers and a pure `shouldApplyRemoteTimerState` function. Add store actions to apply remote active timer state.

- [ ] **Step 4: Run sync tests and verify GREEN**

Run: `npm test -- src/lib/timer/timer-sync.test.ts src/lib/store/timer-store.test.ts`

Expected: pass.

## Task 5: Wire Timer Commands To Sync

**Files:**
- Modify: `src/lib/hooks/useTimer.ts`
- Add: `src/components/timer/TimerSyncStatus.tsx`
- Modify: `src/components/timer/TimerScreen.tsx`

- [ ] **Step 1: Add sync status state**

Track `idle`, `syncing`, `synced`, `offline`, and `signed-out` states in the hook.

- [ ] **Step 2: Send mutations**

On start, pause, resume, stop, reset, complete, and label update where practical, call the active timer API without blocking local timer responsiveness.

- [ ] **Step 3: Add polling and focus refresh**

Poll while signed in and active. Refresh on visibility change and window focus.

- [ ] **Step 4: Show subtle status**

Render a small non-intrusive sync status near the timer controls.

## Task 6: PWA Installability

**Files:**
- Create: `src/app/manifest.ts`
- Modify: `src/app/layout.tsx`
- Create: `public/sw.js`
- Create: `public/icon.svg`
- Create: `public/maskable-icon.svg`
- Create: `src/components/pwa/ServiceWorkerRegistration.tsx`
- Modify: `src/app/(app)/layout.tsx`
- Create: `docs/install-focusflow-app.md`

- [ ] **Step 1: Add manifest and metadata**

Provide app name, start URL, standalone display, theme/background colors, and SVG icons.

- [ ] **Step 2: Register a safe service worker**

Register only in the browser and avoid caching authenticated API responses.

- [ ] **Step 3: Document install paths**

Add Mac and iPhone local installation notes.

## Task 7: Verification

**Files:**
- All changed files.

- [ ] **Step 1: Run targeted timer tests**

Run: `npm test -- src/lib/timer/active-timer.test.ts src/lib/timer/timer-sync.test.ts src/lib/store/timer-store.test.ts`

Expected: pass.

- [ ] **Step 2: Run full tests**

Run: `npm test`

Expected: pass or report pre-existing failures with exact files.

- [ ] **Step 3: Run lint**

Run: `npm run lint`

Expected: pass or report pre-existing failures with exact files.

- [ ] **Step 4: Run build**

Run: `npm run build`

Expected: pass or report environment blockers such as missing `DATABASE_URL`.

- [ ] **Step 5: Summarize changed files**

Run: `git status --short`

Expected: only intended implementation files plus pre-existing unrelated changes remain.
