# FocusFlow Mac App + PWA Sync Design

Date: 2026-06-30

## Goal

Turn FocusFlow into a practical cross-device focus companion:

- On Mac, FocusFlow should feel like its own application in Dock and the app switcher, not another browser tab.
- On iPhone, FocusFlow should be installable as a PWA for local testing without App Store distribution.
- A focus session started on Mac, browser, or iPhone should show the same live timer after signing into the same account.
- The iPhone should work well as a calm, beautiful second-screen timer while charging or sitting beside the computer.

## Non-Goals

- Do not build a native iOS app in the first pass.
- Do not submit anything to the App Store.
- Do not build Home Screen or Lock Screen widgets yet.
- Do not rebuild the timer UI from scratch.
- Do not add multi-user collaboration, teams, payments, or public sharing.
- Do not sync timer state by writing every visual tick to the database.

## Product Principles

1. The timer remains the product.
   The main experience should stay quiet, beautiful, and immediate: current mode, remaining time, goal, controls, and music.

2. The Mac app must reduce browser friction.
   The first win is a separate app surface that appears in Dock and the app switcher, so FocusFlow is easy to switch to while other browser tabs are busy.

3. Phone as second screen.
   The iPhone experience should prioritize readability, low interaction, landscape/portrait resilience, and an elegant running timer view.

4. Sync must be honest.
   If two devices are signed into the same account, an active timer should converge to the same state within a short delay. If sync is unavailable, the app should say so and keep the local timer usable.

5. Use absolute time, not tick replication.
   Store timestamps and durations so every device can calculate the same remaining time locally. Do not push timer updates every 250ms.

## Current Project Context

FocusFlow is currently a Next.js App Router application with:

- A client-side Zustand timer store persisted in localStorage.
- A local session history store persisted in localStorage.
- Email/password authentication and Google account support foundations.
- A `user_settings` table and `/api/settings` endpoint for durable profile settings.
- A visible "Cloud Sync" settings toggle that is currently local/decorative.
- A Chrome side panel extension folder.

The important gap for this project is that active timer state is local to one browser context. A second device cannot yet reconstruct the current active session from the account.

## Recommended Approach

Build this in two coordinated layers.

### Layer 1: Installable App Shell

Make the existing Next.js application installable and pleasant as an app:

- Add a web app manifest with FocusFlow name, icon set, theme color, display mode, and start URL.
- Add Apple mobile web app metadata for iPhone Home Screen usage.
- Add app icons and maskable icons.
- Add a service worker only for the safe shell assets needed by installability. Avoid caching authenticated API responses in the first pass.
- Add install documentation for:
  - Mac app-style install from Chromium-based browsers.
  - iPhone "Add to Home Screen".
  - Future local Xcode/Capacitor path if native packaging becomes worthwhile.

For the Mac "separate app" requirement, start with an installable PWA because it gives Dock and Alt+Tab behavior quickly while keeping the deployment simple. If the PWA shell feels insufficient after testing, wrap the same deployed app in Tauri as a later pass.

### Layer 2: Cloud Active Timer

Add a cloud-backed active timer state per user.

The server stores one active timer row per user containing:

- `userId`
- `mode`
- `status`: `idle`, `running`, `paused`, or `complete`
- `sessionLabel`
- `plannedDuration`
- `activeElapsedSeconds`
- `sessionStartedAt`
- `runStartedAt`
- `completedAt`
- `version`
- `updatedAt`

Devices calculate remaining time from:

- `plannedDuration`
- `activeElapsedSeconds`
- `runStartedAt`
- current wall-clock time

When a device starts, pauses, resumes, stops, or completes the timer, it writes one mutation to the server. Other devices poll or refresh the active timer state and update their local Zustand store.

This keeps the app responsive locally while giving account-level continuity.

## Data Model

Add a table similar to `active_timers`:

- `id`: UUID primary key.
- `userId`: UUID, unique, references `users.id`.
- `mode`: text.
- `status`: text.
- `sessionLabel`: text.
- `plannedDuration`: integer seconds.
- `activeElapsedSeconds`: integer seconds.
- `sessionStartedAt`: timestamp with timezone, nullable.
- `runStartedAt`: timestamp with timezone, nullable.
- `completedAt`: timestamp with timezone, nullable.
- `version`: integer, increments on every mutation.
- `createdAt`: timestamp with timezone.
- `updatedAt`: timestamp with timezone.

The first implementation should not move full session history to Postgres unless needed for completion correctness. Completed sessions can continue to be saved locally initially, but the active timer schema should be compatible with a later cloud session history table.

## API Design

Add authenticated route handlers:

- `GET /api/timer/active`
  Returns the user's active timer state or a normalized idle state.

- `PUT /api/timer/active`
  Accepts a timer mutation from the current device: start, pause, resume, stop, reset, complete, or label update.

Validation rules:

- Reject unauthenticated requests with 401.
- Normalize invalid mode/status values.
- Clamp durations to the existing timer setting limits.
- Use server time for mutation timestamps.
- Return the saved canonical state after every mutation.

Conflict handling:

- Include a `version` number in responses.
- The first pass can use last-write-wins with version awareness in the client.
- If a client sends a stale version, the server may still accept the mutation but should return the new canonical state. Later, this can become stricter if needed.

## Client Sync Design

Add a small sync layer around the existing timer store:

- On app load, fetch `/api/timer/active`.
- If signed out or offline, keep the local timer behavior.
- When the local user starts, pauses, resumes, stops, resets, completes, or edits the label, send a server mutation.
- While an authenticated timer is active, poll the server periodically, for example every 3-5 seconds.
- On visibility change or window focus, refresh immediately.
- Apply remote state only when it is newer than the current local state.

The local timer should still tick locally at the current smooth interval. Sync should update the source state, not the animation cadence.

## iPhone PWA Experience

The existing timer screen should work on mobile, but add a dedicated "display mode" behavior:

- Large timer remains centered and readable in portrait and landscape.
- Controls stay reachable but become visually quiet while running.
- Zen mode remains useful on touch devices, where movement events are less frequent.
- PWA standalone mode should not rely on browser chrome.
- The app should tolerate screen rotation without clipping the circular timer or controls.

The first pass can reuse the current timer page and improve responsive constraints where needed. A separate `/display` route can be added later if the normal timer screen feels too control-heavy on iPhone.

## Mac App Experience

For the first pass, the Mac app experience is:

- Install FocusFlow as a PWA.
- Launch from Dock.
- Switch via the app switcher.
- Keep its own window separate from the main browser.
- Use the same authenticated app and synced timer.

If a more native app is needed after testing, build a Tauri wrapper:

- Load the local or deployed FocusFlow URL.
- Provide app icon and bundle metadata.
- Keep authentication cookie behavior intact.
- Avoid duplicating timer logic in native code.

Tauri is preferred over Electron for a future native wrapper because FocusFlow is visually rich but does not need heavy desktop APIs yet.

## Error Handling

- If `/api/timer/active` returns 401, show signed-out state and continue local timer behavior.
- If sync fails while a timer is running, keep the local timer going and show a subtle sync status.
- If another device changes the timer, update the current device to the newest canonical state.
- If two devices issue conflicting commands at nearly the same time, accept the latest server mutation and reflect it everywhere.
- If completion happens while another device is open, all devices should show `complete` once they refresh.

## Testing

Automated tests:

- Active timer normalization and duration validation.
- Start mutation creates a running state with server timestamps.
- Pause mutation stores elapsed active time.
- Resume mutation preserves elapsed active time and sets a new run start.
- Stop/reset mutation returns idle state.
- Completion mutation marks complete and preserves planned duration.
- Client elapsed-time calculation from a remote running state.
- Stale/remote state application rules.

Manual checks:

- Mac PWA installs and opens as a separate app.
- Dock and app switcher behavior works on Mac.
- iPhone PWA can be added to Home Screen and launched standalone.
- Starting focus on Mac appears on iPhone after refresh/poll.
- Pausing on iPhone updates Mac.
- Resuming on Mac updates iPhone.
- Completing on one device completes on the other.
- Mobile portrait and landscape timer layouts do not clip.

## Build Order

1. Add active timer database schema and migration.
2. Add server normalization utilities and tests.
3. Add authenticated active timer API route and tests.
4. Add client sync adapter around the existing Zustand timer store.
5. Wire start/pause/resume/stop/reset/complete actions to sync mutations.
6. Add polling/focus refresh for remote updates.
7. Add PWA manifest, icons, metadata, and safe service worker.
8. Improve mobile standalone timer layout where needed.
9. Add setup documentation for Mac install and iPhone Home Screen install.
10. Run end-to-end manual verification on desktop and mobile-sized browser views.

## Later Enhancements

- Native Tauri Mac wrapper if PWA behavior is not enough.
- Native iOS wrapper through Capacitor/Xcode for local device installation.
- iOS Home Screen, Lock Screen, or Live Activity support.
- macOS menu bar mini timer.
- Cloud session history migration.
- Push notifications across devices.
