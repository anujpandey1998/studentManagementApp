# Phase 2: authentication and role-based navigation

## Plan and decisions

- Supabase Auth owns sign-in, refresh, expiry and logout; the app does not
  implement a second token-refresh mechanism.
- Supabase session persistence uses React Native Keychain. The Redux auth slice
  holds only the profile needed by the UI, never access/refresh tokens.
- The role is read from the protected `public.users` row after authentication.
  RLS remains the authorization boundary; role-specific navigation is a UX
  guard, not a replacement for database policies.
- `react-native-dotenv` loads only the local Supabase URL and publishable key.
  These public client values are compiled into the app; never add a service-role
  key to `.env` or any mobile/web bundle.
- Password reset uses the `vidya://auth/reset-password` deep link and a
  React Hook Form/Zod-validated password update form.

## What is implemented

- Email/password sign-in and forgot/update-password forms with validation and
  visible API errors.
- Secure Keychain session storage, initial session restoration, foreground
  token refresh, and sign-out when Supabase invalidates the session.
- Role-gated admin, teacher and student home screens, based on the profile
  returned for the signed-in account.
- Android and iOS URL scheme registration for password recovery.
- An Axios Supabase REST client that reads the current Supabase-managed session
  for each request and normalizes API errors without refreshing tokens itself.
- Jest checks for secure session storage and role-to-home-route mapping.

## Configure local Supabase

Start Docker Desktop, then run the local backend from the repository root:

```powershell
npm run backend:start
npm run backend:status
```

Create `.env` from the example and add the **publishable** key shown by
`npm run backend:status`. Do not use `SECRET_KEY` or `SERVICE_ROLE_KEY`.

```powershell
Copy-Item .env.example .env
```

For an Android emulator, keep the URL as `http://10.0.2.2:54321`. For the iOS
simulator, use `http://localhost:54321`. A physical device needs the host's
reachable LAN IP and local firewall access.

The local Supabase project must allow the `vidya://auth/reset-password` redirect.
That redirect is in `supabase/config.toml`; if Supabase was already running when
the setting changed, restart services without resetting the database:

```powershell
npm run backend:stop
npm run backend:start
```

## Run on Android

Use two PowerShell terminals. Start an Android emulator before running the app.
Restart Metro after changing Babel/environment configuration.

```powershell
# Terminal 1
npm start -- --reset-cache
```

```powershell
# Terminal 2
npm run android
```

For iOS, install Pods on macOS after installing dependencies, then run the
Metro server and `npm run ios`. Windows cannot build the iOS app.

## Demo accounts and acceptance

The seeded local accounts all use password `VidyaDemo!2026`:

| Role    | Email                   |
| ------- | ----------------------- |
| Admin   | `admin@vidya.example`   |
| Teacher | `teacher@vidya.example` |
| Student | `student@vidya.example` |

Sign in with each account and verify the correct role title and home areas
appear. Sign out, reopen the app, and verify the saved session is restored.
For password recovery, request a reset, open the email in local Mailpit at
`http://127.0.0.1:54324`, follow the link on the emulator, and set a new password.
Run `npm run backend:test` to recheck seed and access policies.

Automated checks:

```powershell
npm run typecheck
npm run lint:foundation
npm run format:check
npm test -- --runInBand
```

## Scope boundary

The role home screens are authenticated shells; student management and attendance
are Phase 3. Password reset depends on local Mailpit for development email.
Production email delivery, account provisioning/invitations, lockout policy and
hosted redirect URLs require environment-specific deployment setup.
