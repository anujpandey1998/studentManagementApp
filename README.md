## Vidya — Student Management App

Vidya is a portfolio-focused React Native + TypeScript student management app
using Supabase Auth, Postgres, and Row Level Security. Supabase was chosen over
a separate Node/Express API so mobile and a future web client can share the
same database permissions and auth contract without maintaining duplicate
authorization logic.

The repository includes secure session persistence, role-gated navigation,
seeded local school data, student search/pagination and admin editing, daily
attendance with monthly summaries, results, timetable, assignments, fees, and
notices. See [the implementation status and run guide](docs/phase-3-7.md) for
what is implemented and the remaining production integrations. Auth setup and
demo accounts are documented in [Phase 2](docs/phase-2.md); the schema and
security model are documented in [Phase 1](docs/phase-1.md).

### Stack

- React Native 0.87, TypeScript strict mode, React Navigation 7
- Redux Toolkit for auth/global state; TanStack Query 5 for server state
- Supabase Auth/Postgres/Storage with RLS
- React Hook Form + Zod for input validation
- Axios/Supabase REST client with centralized API error normalization

### Quick start

1. Install Node.js 22.11+ and Docker Desktop, then run `npm ci`.
2. Copy `.env.example` to `.env`; start/reset the local Supabase backend and
   configure its local publishable key using the steps in
   [docs/phase-2.md](docs/phase-2.md).
3. Start Metro with `npm start -- --reset-cache`, then in another terminal run
   `npm run android` with an Android emulator available.

Use only the Supabase **publishable** key in the mobile app. Never add a
service-role key or server-side Firebase credential to `.env` or a client
bundle. Local reset erases local data and must never target production.

### Checks

```powershell
npm run typecheck
npm run lint:foundation
npm run format:check
npm test -- --runInBand
npm run backend:test
```

The current feature and release boundary is explicit in
[docs/phase-3-7.md](docs/phase-3-7.md): payments are sandbox-only; FCM delivery
requires Firebase native configuration and server credentials; full offline
mutation/reconciliation, analytics, functional language/theme settings, and
signed store builds remain release work. Never commit secrets or production
credentials.

## React Native CLI reference

# Getting Started

## Phase 2: run the authenticated app

The app uses the local Supabase project for authentication and account roles.
Follow [the Phase 2 setup guide](docs/phase-2.md) to configure `.env`, start the
backend, and sign in with a seeded demo account. On Android, run Metro and the
Android app in separate terminals after starting an emulator.

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
