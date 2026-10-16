# Product phases 3–7

Vidya is a React Native client over the same Supabase/Postgres contract intended
for a future web client. The migrations define the shared schema and row-level
security; local seed data contains 60 students, three classes, historical
attendance, marks, timetables, assignments, invoices, payments, and notices.
Apply it only to a disposable local Supabase database.

## Phase 3: students and attendance

Student lists use Supabase pagination, name/admission-number search, section
filtering, and pull-to-refresh. Admins can add/edit student records and upload
photos to private storage; teachers can browse students only in assigned
sections. Attendance can be recorded by admins and allocated teachers, with an
optimistic status update and rollback on API failure. Students can read only
their own record.

Monthly attendance counts `present` and `late` as attended, excludes `excused`
days from the denominator, and reports percentages from saved attendance
records only. Unmarked school days are not inferred. There is no separate
student-detail route yet.

## Phase 4: results, timetable, and assignments

Marks are read through RLS and displayed with subject/exam, percentage, and an
initial grade scale: A+ (90%+), A (80%+), B (70%+), C (60%+), D (40%+), F
(below 40%). Teachers can enter marks for their allocated subjects. These
display defaults are not institute-configurable grading rules. Timetables
support day and week filters.

Admins and allocated teachers can create class/subject-scoped assignments with
validated instructions and due dates. Students can submit a document, and
teachers can open submissions and save feedback through trusted database
functions and private storage. A separate configurable subject-performance
chart is not implemented.

## Phase 5: fees, notices, and push notifications

The fees view reads invoices and succeeded payments from Supabase and shows the
remaining balance. A sandbox-only mock payment flow is implemented; it does not
charge money and is explicitly guarded against production use.

Admins can publish institute-wide or section notices; teachers can publish to
allocated sections. The app can register FCM device tokens, and a Supabase Edge
Function sends notice notifications using a server-side Firebase credential.
Delivery requires deployment/configuration of the function, Firebase Android
and iOS native configuration, and server secrets. Do not place service-role or
Firebase server credentials in the app bundle.

## Phase 6: reliability and polish

Implemented: reusable loading skeleton, error/retry and empty states; React
Query server-state caching with persisted cache; NetInfo offline banner;
student pagination; pull-to-refresh; optimistic attendance updates; input
validation; accessible action labels; and unit tests for attendance and grade
calculations. A React error boundary displays a retry screen and reports
render-time failures to Sentry when a DSN is configured. The persisted cache is
cleared on sign-out/account switching.

Still needed before production: full offline mutation/reconciliation; Sentry
project/DSN configuration and crash-report verification; analytics events and
provider/consent policy; functional English/Hindi and dark-mode settings;
device-level accessibility review; and Android/iOS end-to-end testing.

## Phase 7: release and portfolio handoff

Demo credentials and local backend/run instructions are in
[phase-2.md](./phase-2.md). The Android debug APK built and launched on a Pixel
6 Android 15 emulator with Metro; no startup crash was reported. This does not
verify the complete authenticated/data flow or real push delivery. Android
release signing, a release build, iOS archive, store metadata, and device
screenshots have not been produced or tested here. The repository is not
store-ready until the Phase 5–6 integrations, signing configuration, and
platform acceptance checks are completed.

## Run and validate locally

From the repository root, with Docker Desktop running:

```powershell
npm ci
Copy-Item .env.example .env
npm run backend:start
npm run backend:reset
npm run backend:status
```

Set `.env` to the local API URL and **publishable** key shown by
`npm run backend:status`, then start Metro and the Android app in separate
terminals:

```powershell
npm start -- --reset-cache
npm run android
```

Run the automated checks:

```powershell
npm run typecheck
npm run lint:foundation
npm run format:check
npm test -- --runInBand
npm run backend:test
```

On Windows, iOS builds require a separate macOS/Xcode environment. `backend:reset`
deletes and recreates local database contents; never use it with production data.
