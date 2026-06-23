# FocusFlow Cloud + Chrome Extension MVP Design

Date: 2026-06-23

## Goal

Turn FocusFlow from a local-only focus timer into a small, reliable personal productivity service while preserving the current minimalist dark design, timer-first flow, music-first feel, and existing animation language.

The MVP should add:

- Normal email/password registration with email verification.
- Cloud-backed session history in Postgres.
- Post-session activity tagging.
- Personal YouTube music links/playlists.
- A Chrome-first side panel extension for quick access.

## Non-Goals

- Do not redesign the main timer screen.
- Do not build Safari support in the first implementation pass.
- Do not download YouTube audio or playlists inside the app.
- Do not build social login, teams, payments, public profiles, AI reports, or mobile apps.
- Do not replace the current visual system unless a component cannot support the new workflow.

## Product Principles

1. The timer stays calm.
   The main screen should remain almost as minimal as it is today: mode selector, circular timer, session goal, controls, and music access.

2. Meaning comes after focus.
   Users classify completed focus work after the session ends, because real work often changes direction while it is happening.

3. Music is personal.
   YouTube links and playlists are first-class user data. Built-in/generated sounds remain fallback options.

4. Cloud sync is honest.
   If the UI says data is synced, it must be backed by the database. Decorative toggles should be removed or wired to real behavior.

5. Chrome first, web app always.
   The web app remains the full experience. The Chrome side panel is a compact companion, not a replacement dashboard.

## Architecture

### Application

Keep the current Next.js app as the primary UI. Add server-side modules for authentication, database access, email verification, and API/server actions.

Recommended stack:

- Next.js App Router.
- Postgres.
- Drizzle ORM and Drizzle Kit migrations.
- Auth/session layer built around secure HTTP-only cookies.
- Resend for transactional email, behind an internal email provider wrapper.

The app should retain the existing component style: dark background, glass surfaces, emerald accent, soft animation, compact controls, and restrained dashboard cards.

### Database

Use Postgres as the source of truth for authenticated users.

Initial tables:

- `users`
  Stores account identity, email verification state, password hash, and timestamps.

- `email_verification_codes`
  Stores hashed one-time email codes, expiry, resend metadata, and attempt counts.

- `sessions`
  Stores focus/break sessions, planned duration, actual duration, start/end timestamps, completion status, activity reference, label, and audio track reference.

- `activities`
  Stores user-defined activity categories such as SQL, Writing, Research, Design, and Admin. Activities should support color/accent metadata for dashboards.

- `audio_tracks`
  Stores user music options, including YouTube video IDs, playlist IDs, display names, and track type.

- `user_settings`
  Stores timer durations, preferred audio track, notification preference, and other durable settings.

### Auth And Verification

Registration flow:

1. User enters email and password.
2. Server validates email and password.
3. Server hashes password and creates user with `emailVerifiedAt = null`.
4. Server generates a 6-digit code.
5. Server stores only a hash of the code with a short expiry, default 10 minutes.
6. Server sends a branded FocusFlow email with the verification code.
7. User enters the code.
8. Server verifies the code, marks email as verified, deletes or expires the code, and creates a session.

Security controls:

- Passwords must be hashed with a modern password hashing library.
- Verification codes must be hashed in the database.
- Verification codes expire after 10 minutes.
- Limit code verification attempts.
- Rate-limit registration and resend attempts by email and IP where possible.
- Store sessions in secure HTTP-only cookies.
- Do not expose database IDs or secrets in client state.

### Email

Use an internal email provider wrapper. The first implementation targets Resend. The wrapper boundary must keep provider-specific code out of registration and verification logic so Mailgun, Postmark, or SMTP can replace Resend in a future change without rewriting auth.

For development before a domain exists:

- Allow a local/dev mode that logs the verification code and email payload to the server console.
- Keep the production email provider interface the same.

For production:

- Use a verified custom domain when available.
- Sender format should be similar to `FocusFlow <hello@focusflow-domain>`.
- Email template should match the product: dark background, glass-like central panel, emerald accent, large verification code, short copy, and expiration notice.

### Session And Activity Flow

Current behavior saves a session immediately when the timer completes. The new flow should support classification after completion.

Proposed flow:

1. Timer completes.
2. App creates or holds a completed session in a pending classification state.
3. Completion modal opens.
4. User chooses an activity template or creates a new activity.
5. App saves the completed session with activity metadata.
6. User may start a break or skip it.

Interrupted sessions can be saved without an activity. The MVP does not include a separate "tag later" workflow.

### Dashboard And History

History should keep the current date-grouped session list but add activity labels and colors.

Dashboard should add activity-level summaries:

- Total focus time by activity.
- This week activity distribution.
- Activity cards with hours, session count, and recent trend.
- Existing streak and total focus metrics remain.

The dashboard should not become a marketing page. It should feel like a quiet operational view.

### Music

Music sources:

- `youtube_video`
- `youtube_playlist`
- `generated_noise`
- `file` for future bundled/local audio

MVP behavior:

- User can add a YouTube video or playlist URL.
- Server/client parses and stores the stable YouTube ID or playlist ID.
- App shows saved music under a personal library section.
- Playback uses the official embedded player path rather than downloading audio.
- Generated noise remains available as a reliable fallback.

Do not implement YouTube downloading in the app.

### Chrome Side Panel

The first extension target is Chrome.

The side panel should include:

- Compact circular or linear timer.
- Start, pause, resume, stop.
- Current mode and remaining time.
- Current music track and compact controls.
- Link/open action to the full dashboard.
- Completion/tagging surface when a focus session ends.

The side panel should use the same design tokens and core timer/session logic as the web app where practical. It should not duplicate large dashboard views.

### Migration From Local Data

When a signed-in user has existing local sessions:

- Detect local `focusflow-sessions`.
- Offer a one-time import.
- Import sessions into the authenticated user's account.
- Mark imported sessions to avoid duplicate imports.

This can be implemented after the first auth/database path if needed, but the schema should not block it.

## Error Handling

- If email sending fails, keep the account unverified and show a clear resend option.
- If verification code expires, ask the user to request a new code.
- If YouTube playback fails, show a small status message and keep generated noise available.
- If cloud saving fails after a completed session, keep a local pending copy and retry when possible.

## Testing

Minimum verification:

- Registration form validation.
- Password hashing path.
- Email code creation, expiry, attempt limit, and verification.
- Session creation after completed focus.
- Activity creation and assignment.
- Dashboard aggregation by activity.
- YouTube URL parsing for common video and playlist URL formats.
- Local-to-cloud import path when implemented.

Manual UI checks:

- Main timer remains visually uncluttered.
- Completion modal fits desktop and mobile.
- Auth screens match FocusFlow styling.
- Dashboard cards do not overcrowd the existing layout.
- Chrome side panel remains usable in a narrow width.

## Open User Inputs Needed

- A production domain for branded emails. Not needed for local/dev work.
- Resend account and API key, or an alternative email provider account.
- A Postgres database URL, local or hosted.
- A list of initial YouTube links/playlists for the personal music library.
- Preferred initial activity templates.

## Recommended Build Order

1. Database schema and Drizzle setup.
2. Auth and email verification in dev mode.
3. Branded email provider wrapper with Resend support.
4. Move sessions/settings from local storage to authenticated database APIs.
5. Post-session activity tagging.
6. Activity dashboard and history updates.
7. Personal YouTube music library.
8. Chrome side panel extension MVP.
9. Optional import of existing local sessions.
