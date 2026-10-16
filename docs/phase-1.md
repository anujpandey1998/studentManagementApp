# Phase 1: foundation

## Decisions

Supabase is the shared backend for mobile and the future React web app. Postgres
constraints and RLS enforce the same permissions regardless of client. An Express
service would add deployment and authentication work without a current need.
Use Edge Functions for account invitations, payments and notification delivery.

Keep existing React Navigation 7 (satisfies v6+) and React Query 5. Redux Toolkit
stores only global UI/auth state; queries own remote records. Keychain is the
recommended secure token store in Phase 2. Axios will call Supabase REST and
trusted functions; Supabase Auth will manage sessions with a Keychain adapter.
Never run two independent token refresh implementations.

Use the existing npm lockfile for reproducible installs. The older yarn lockfile
is preserved; do not mix package managers. The blue/slate theme is a starting
design system. Dark mode and Hindi strings are planned for later phases.

## Schema and relations

| Table               | Purpose / relationships                                    |
| ------------------- | ---------------------------------------------------------- |
| institutes          | Tenant / school boundary                                   |
| users               | Profile linked to auth.users; institute and protected role |
| classes             | Institute + academic year                                  |
| sections            | Class group, e.g. Class 8 / A                              |
| subjects            | Institute subject catalogue                                |
| teacher_allocations | Teacher + section + subject authorization                  |
| students            | Section, admission number, optional linked login, guardian |
| attendance          | Student + section + date; unique student/day               |
| exams               | Exam in a section                                          |
| exam_subjects       | Exam subjects and maximum marks                            |
| marks               | Student + exam + subject; unique result; maximum validated |
| timetable           | Section, subject, teacher, weekday and start/end           |
| assignments         | Section + subject + teacher, deadline and file path        |
| submissions         | Student + assignment; one submission, feedback             |
| fee_structures      | Section tuition amount in integer paise and due date       |
| fees                | Student invoice linked to a fee structure                  |
| payments            | Invoice ledger, status and unique provider reference       |
| notices             | Institute-wide or section-specific announcement            |

Roles use the `app_role` enum (admin/teacher/student) rather than a mutable roles
lookup table. One account belongs to one institute and has one role. Multiple
schools per account would require a membership table; it is outside this scope.
Student records can exist before login invitations. Academic year is on classes;
students currently have one section. Historical transfer/enrollment modelling is
a future schema extension, not implemented here.

```mermaid
erDiagram
  institutes ||--o{ users : contains
  institutes ||--o{ classes : contains
  classes ||--o{ sections : groups
  sections ||--o{ students : enrolls
  users ||--o| students : login
  sections ||--o{ teacher_allocations : assigns
  subjects ||--o{ teacher_allocations : covers
  users ||--o{ teacher_allocations : teaches
  students ||--o{ attendance : has
  sections ||--o{ exams : schedules
  exams ||--o{ exam_subjects : includes
  exam_subjects ||--o{ marks : records
  students ||--o{ marks : earns
  sections ||--o{ timetable : schedules
  sections ||--o{ assignments : receives
  assignments ||--o{ submissions : receives
  students ||--o{ submissions : uploads
  sections ||--o{ fee_structures : defines
  fee_structures ||--o{ fees : bills
  students ||--o{ fees : owes
  fees ||--o{ payments : settles
  institutes ||--o{ notices : publishes
```

Composite foreign keys stop cross-institute and cross-section record links.
Attendance percentage and grade are derived from source records, not independently
stored. Phase 3 will define whether late/excused days count in the denominator;
Phase 4 will define grading thresholds. Fees paid/pending derives from succeeded
payments. Phase 5's payment handler must enforce invoice totals and idempotency
transactionally; the app has no direct write grant to payments.

## RLS policy matrix

Every public table has RLS; anonymous clients have no table privileges.

| Area                             | Admin                                            | Teacher                                            | Student                            |
| -------------------------------- | ------------------------------------------------ | -------------------------------------------------- | ---------------------------------- |
| School/classes/sections/subjects | Manage own institute                             | Read institute catalogue                           | Read institute catalogue           |
| User profiles/roles              | Read institute; provisioning via trusted backend | Own profile                                        | Own profile                        |
| Teacher allocations              | Manage institute                                 | Read own allocations                               | No access                          |
| Students                         | Manage institute                                 | Read assigned sections                             | Read own record                    |
| Attendance                       | Manage institute                                 | Read/write assigned sections                       | Read own history                   |
| Exams / max marks                | Manage institute                                 | Read assigned sections                             | Read own section                   |
| Marks                            | Manage institute                                 | Write assigned section + subject                   | Read own marks                     |
| Timetable                        | Manage institute                                 | Read assigned sections                             | Read own section                   |
| Assignments                      | Manage institute                                 | Create/update assigned section + subject           | Read own section                   |
| Submissions                      | Read institute                                   | Read assigned section                              | Read own submissions               |
| Fee structures                   | Manage institute                                 | Read assigned section structure                    | Read own section structure         |
| Invoices                         | Manage institute                                 | No access                                          | Read own invoices                  |
| Payments                         | Read institute; trusted backend writes           | No access                                          | Read own payments                  |
| Notices                          | Manage institute                                 | Read relevant notices; create for assigned section | Read institute/own section notices |

Submission creation/grading uses scoped RPCs in Phase 4 so students cannot write
feedback. Private Storage buckets exist with size/MIME limits, and deny all client
object access until feature-specific upload/read policies arrive in Phases 3/4.
No client has role/profile update permission; account provisioning is a trusted
backend operation in Phase 2. `private` security-definer helpers have empty search
paths and restricted execution grants; they avoid recursive RLS on user tables.

## Folder ownership

`src/app` contains providers/navigation. `src/features/dashboard/screens` contains
the foundation preview. Shared UI lives in `src/components`; tokens in `src/theme`;
global state in `src/store`; domain types in `src/types/domain.ts`.
Feature API/hooks/types and services/utils folders are created when their actual
implementations arrive. Existing `src/screens`, `src/navigation`, `src/api` and
`src/query` remain as prototype reference; the new root does not route to them.

Phase 1 established the static foundation preview, design tokens, reusable UI,
navigation and local Supabase schema/seed. Phase 2 replaces that preview entry
point with Supabase email/password auth, Keychain session storage and role-gated
home screens. See [phase-2.md](./phase-2.md) for setup and demo instructions.
Offline persistence, Sentry and analytics are not implemented yet.

## Run the app

Use Node >=22.11 and the React Native Android toolchain already required by this
repository. From the project root:

```powershell
npm ci
npm run typecheck
npm run lint:foundation
npm run format:check
npm test -- --runInBand
npm start
# In a second terminal with a running Android emulator:
npm run android
```

On macOS, install iOS pods using the repository Gemfile and run `npm run ios`.
Windows cannot build/test iOS. Native device and simulator checks must be reported
separately from JS unit checks.

Husky runs lint-staged and typecheck before commits. Only staged code is linted;
the legacy prototype may still have repository-wide lint findings. Hook installation
requires Git config write access. If `npm run prepare` cannot write `.git/config`,
run it locally with the required permissions.

## Run the local backend

Docker Desktop and WSL have been installed on this Windows machine. Supabase CLI
is installed as a project dev dependency (`npm ci` restores it). Docker must be
running. From this project:

```powershell
npm run backend:start
npm run backend:reset
npm run backend:status
# Run SQL permission/seed checks using psql inside the Docker container:
npm run backend:test
# Optional SQL permission/seed checks with PostgreSQL psql installed:
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 -f supabase/tests/access.sql
```

`db reset --local` destroys/recreates the LOCAL database; use only for disposable
development data. It applies migrations in order, then seed.sql. Never execute
the seed against production. Hosted environments receive migrations only through
an explicitly selected project deployment workflow.

Seed contains 60 students, 3 classes/sections, 3 subjects, 35 calendar days of
weekday attendance, 6 exams, 360 marks, 45 timetable entries, 9 assignments,
60 invoices, 40 succeeded demo payments and 2 notices. Dates are relative to reset.
Three local Auth accounts share password `VidyaDemo!2026`:

| Role    | Email                 |
| ------- | --------------------- |
| Admin   | admin@vidya.example   |
| Teacher | teacher@vidya.example |
| Student | student@vidya.example |

Student login maps to Aarav Sharma. These accounts can be used against local Auth
now; app sign-in is implemented in Phase 2. Direct auth-table seeding is for this
local fixture only; production accounts use the Auth Admin API.

For the Phase 2 environment setup and platform-specific URLs, see
[phase-2.md](./phase-2.md). Public/publishable keys may ship in clients;
service-role keys must never do so.

## Manual acceptance

Phase 1 preview acceptance was completed before authentication was added. Continue
with Phase 2's sign-in, role-routing and local backend acceptance steps before
starting the student/attendance feature work.

## Validation in this workspace

Strict TypeScript, repository-wide ESLint, foundation Prettier checks and the
preview render test passed. Navigation is mocked in the JS test; it does not
validate native transitions or accessibility on devices. Husky was installed
and Git's hooks path points to `.husky/_`.

On October 9, 2026, Docker Desktop 4.94.0, Docker CLI 29.8.2, WSL 2.7.13.0 and
project-local Supabase CLI 2.120.0 were installed. The Docker installer enabled
VirtualMachinePlatform and Microsoft-Windows-Subsystem-Linux and explicitly
reported that a computer restart is required. Docker Desktop was launched, but
its engine cannot start before those Windows features become active.

The PC has not been restarted by the agent. Migrations, seed and access.sql have
not been executed yet. After restarting, start Docker Desktop, verify the engine
is running, then use the backend commands above. `backend:reset` is local only and
recreates local data; it does not deploy to a hosted Supabase project.
`backend:test` uses the database container's psql, so a host psql installation is
optional. Android and iOS builds/device checks were not run.
The dependency installer reported 55 audit findings (5 moderate, 50 high);
dependency advisory triage remains required before release. No automatic breaking
dependency upgrades were applied. This is a Phase 1 scaffold, not a release build.
