# 🌿 Lume

**The calm, shared space where families take care of someone together.**

A bilingual mobile app for informal caregivers in Belgium.
Shared agenda with tasks and notes · privacy-first medication scanner · wellbeing module · real-time notifications.

[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react)](https://reactnative.dev/)
[![Expo SDK](https://img.shields.io/badge/Expo_SDK-54-000020?logo=expo)](https://expo.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Languages](https://img.shields.io/badge/i18n-NL_·_FR-7FA99B)]()
[![Status](https://img.shields.io/badge/status-thesis%20project-AACC00)]()

---

## ✨ About

Lume turns informal care into a shared rhythm. Every member of the care circle sees the same calendar, the same notes and the same medication moments in real time, in their own language. When a dose is given, a quick scan of the package confirms the right medicine at the right time; if something is off, the family is alerted. And in the quiet moments in between, Lume nudges the caregiver to breathe, to rest, or to ask for support, because looking after someone shouldn't mean forgetting yourself. 💚

---

## 🧩 Features

- **🗓️ Shared agenda** — tasks, times, icons, assignees, one-tap sync to the system calendar.
- **📝 Shared logbook** — notes, photos, important flags, daily summary on home.
- **💊 Privacy-first medication module**
  - Neutral _"Medicatiemoment"_ visible to all members
  - Real medicine name, dose & instructions only readable by authorised members (rule-enforced)
  - Scan-to-attach (admin), scan-to-confirm (caregiver), audit trail with override
- **📷 FAGG medicine scanner** — reads 2D Data Matrix (FMD) and 1D barcodes; matched against the imported Belgian FAGG database (10 516 entries).
- **🧘 Wellbeing**
  - Skia-animated breathing exercises (box / 4-7-8 / coherent)
  - Mental energy battery + "Deel je status" SOS that pings the circle
- **🔔 Real push notifications** — Firebase Cloud Functions + Expo Push (medication overrides + SOS).
- **🌍 Bilingual** — Nederlands & Français, automatic from device locale.

---

## 🛠️ Tech Stack

| Layer              | Technology                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------- |
| **Mobile**         | React Native 0.81, Expo SDK 54, TypeScript                                                  |
| **Routing**        | expo-router (file-system based)                                                             |
| **State & forms**  | Custom hooks (one per feature)                                                              |
| **UI / animation** | @shopify/react-native-skia, react-native-reanimated 4, expo-blur, expo-linear-gradient      |
| **Camera**         | expo-camera (Data Matrix + 13 barcode symbologies)                                          |
| **Backend**        | Firebase Auth · Firestore · Cloud Storage · Cloud Functions Gen 2 (Node 20, `europe-west1`) |
| **Push**           | expo-notifications + Expo Push API + FCM V1                                                 |
| **i18n**           | react-i18next (`locales/nl.json`, `locales/fr.json`)                                        |
| **Build**          | EAS Build (Android dev/preview/production)                                                  |
| **Fonts**          | Bricolage Grotesque + Inter (via @expo-google-fonts)                                        |
| **Icons**          | Lucide, @expo/vector-icons                                                                  |

---

## 🚀 Get Started

### Prerequisites

- **Node.js ≥ 20**
- **npm ≥ 10**
- A **Firebase project** on the **Blaze** plan (needed for Cloud Functions)
- An **Expo account** (free)
- For Android dev builds: nothing extra — EAS builds in the cloud
- For local iOS builds: **macOS + Xcode + Apple Developer Program** (€99/yr)

### 1. Clone & install

```bash
git clone https://github.com/BeatriceBjoko/finalwork-lume.git
cd finalwork-lume
npm install
```

### 2. Configure Firebase

Create a `.env` file at the project root:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

Place these two files at the project root:

- **`google-services.json`** → Firebase Console → Project Settings → your Android app _(committed; required by EAS)_
- **`scripts/serviceAccountKey.json`** → Firebase Console → Service Accounts → Generate key _(local only — gitignored, never commit)_

### 3. Install the global CLIs (one-time)

```bash
npm install -g eas-cli firebase-tools
eas login
firebase login
```

### 4. Run the app

```bash
npx expo start --dev-client
```

In the terminal, press:

- **`a`** to open Android
- **`s`** to toggle between _development build_ and _Expo Go_
- **`r`** to reload

---

## 📦 Build & Deploy

### Android development build

```bash
eas build --profile development --platform android
```

→ Scan the resulting QR with your Android phone to install.

### Production build (.aab for Play Store)

```bash
eas build --profile production --platform android
```

### Cloud Functions

```bash
firebase deploy --only functions
```

### Refresh the FAGG medicine database

```bash
node scripts/import-fagg.js
```

---

## 🗂️ Project Structure

```
finalwork-lume/
├── app/                   Screens (expo-router file-based routing)
│   ├── (app)/(tabs)/      Home · Agenda · Wellbeing · Notes
│   ├── sign-in.tsx        Public flow
│   ├── sign-up.tsx
│   ├── onboarding.tsx
│   ├── create-circle.tsx
│   └── join-circle.tsx
├── components/
│   ├── ui/                Design-system widgets (Button, TaskCard, …)
│   └── onboarding/        Onboarding step screens
├── hooks/                 Feature hooks (useCalendarFeed, useMedicationScan, …)
├── context/               SessionProvider + useSession
├── lib/                   Firebase config & low-level wrappers
├── services/firebase/     Domain Firestore services (tasks, notes, medication)
├── constants/             Theme tokens, quotes
├── locales/               nl.json · fr.json
├── assets/                Fonts, images, icons
├── scripts/               FAGG import + maintenance scripts
├── functions/             Firebase Cloud Functions (own package.json)
└── app.json · eas.json · firebase.json
```

---

## 🗄️ Database Model (Firestore)

| Collection          | Purpose                                                         |
| ------------------- | --------------------------------------------------------------- |
| `users`             | User profile + auth link + `pushToken` + `careCircleId`         |
| `careCircles`       | One circle per care receiver                                    |
| `careCircleMembers` | `{circleId}_{userId}` membership documents (role, relationship) |
| `careCircleInvites` | Pending invitations (7-day expiry)                              |
| `careCircleTasks`   | Shared calendar tasks (incl. neutral medication slots)          |
| `careCircleNotes`   | Shared logbook (notes, photos, SOS shares)                      |
| `medicationDetails` | 🔒 Real medicine info — rule-restricted by visibility           |
| `medicationLogs`    | 🔒 Confirmation/override audit trail                            |
| `fagg_medicijnen`   | Belgian FAGG reference (10 516 medicines, doc-id = GTIN)        |

---

## 🔐 Privacy & Security

- **Firebase Authentication** with `AsyncStorage` persistence.
- **Firestore Security Rules** enforce all access; helpers `isMember(circleId)` and `isAdmin(circleId)` gate every read/write.
- **Medication privacy split**: public neutral slot + protected detail record. Unauthorised members literally cannot read the medicine name.
- **Audit trail** carries an `allowedUserIds` snapshot at write time so retroactive access stays correctly scoped.
- **No secret leakage**: `serviceAccountKey.json` and `.env` are gitignored; the public Firebase Android API key is restricted in Google Cloud to the app's package + SHA-1.

---

## 🌿 Git Workflow

- **`main`** — production-ready, deployable, never committed to directly.
- **`dev`** — integration branch for the next release.
- **`feature/<short-name>`** — every task gets its own branch (e.g. `feature/scanmedication`).

Feature branches are created off `dev`, merged back only when the feature is finished, tested and reviewed. `dev` is merged into `main` for releases.
Commits follow **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`, …).

---

## 📲 Notifications Architecture

```
careCircleNotes (SOS) ─┐
                       ├──► Cloud Function ──► Expo Push API ──► APNs / FCM ──► phones
medicationLogs (over.) ─┘
```

- `onMedicationOverride` (Gen-2 Firestore trigger) — notifies authorised members of a medicine when a dose is confirmed off-schedule. Excludes the doer.
- `onSosNote` — notifies the whole circle (except the author) when a _"Deel je status"_ note is shared.

Both use the Firebase Admin SDK to read recipients (privacy-safe) and post to Expo's batch endpoint.

---

## 🌍 Internationalisation

Every UI string lives in `locales/nl.json` and `locales/fr.json`, loaded by `react-i18next`. The active language follows the device locale (`expo-localization`). To add a string: add the same key to both files, then `t("path.to.key")`.

---

## 📜 Standards & Sources

- 🇧🇪 **FAGG (Federaal Agentschap voor Geneesmiddelen en Gezondheidsproducten)** — Belgian medicine reference database (https://geneesmiddelendatabank.be/menselijk-gebruik).
- 📦 **GS1 Belgilux** — GTIN + Application Identifier syntax (`01` prefix on Data Matrix) (https://www.gs1belu.org/nl/gs1-datamatrix)
- 📜 **EU Falsified Medicines Directive (2016/161)** — legal basis for the 2D Data Matrix on EU medicine boxes since 9 February 2019 (https://eur-lex.europa.eu/legal-content/NL/TXT/?uri=CELEX:32016R0161).
- 💊 **APB (Algemene Pharmaceutische Bond)** — owner of the CNK national pharmacy code (https://www.apb.be/nl-BE).
- 🧠 **Breathing science** — Lehrer & Gevirtz (HRV biofeedback) (https://www.innsightful.com/hrv-biofeedback-and-its-role-in-emotional-health/), Dr Andrew Weil (4-7-8)(https://www.drweil.com/health-wellness/body-mind-spirit/stress-anxiety/three-breathing-exercises-and-techniques/), tactical box breathing (https://quietkit.com/box-breathing/).
- **ChatGPT** - questions about firebase + security rules (https://chatgpt.com/share/6a20615b-1a84-8393-aab3-dbd509a6c327)
- **React Native** — Official documentation: Used to learn the core components (View, Text, Pressable, Image, ScrollView, Modal) and the lifecycle / styling rules used on every screen of the application etc ... (https://reactnative.dev/docs/getting-started)
- **Expo SDK 54** - documentation: Reference for the whole Expo ecosystem, used for picking and configuring the right modules (camera, notifications, blur, calendar, image picker, etc.) and for understanding the development-build vs Expo Go workflow (https://docs.expo.dev/)
- **Expo Router** - (file-based routing): Used to design the navigation structure of the app: the (app) authenticated group, the (tabs) layout, and protected layouts with auth-based redirects. (https://docs.expo.dev/router/introduction/)
- **TypeScript Handbook** - Introduction to TypeScript. Used to define typed interfaces for the data model (UserData, CalendarTask, MedicationDetails, FaggMedicine) and to keep hook/component signatures consistent.(https://www.typescriptlang.org/docs/)
- **Firebase JavaScript SDK reference** - Used throughout lib/firebase-config.ts and services/firebase/\* to call Auth, Firestore and Storage from the React Native client. (https://firebase.google.com/docs/reference/js)
- **Firestore: Queries & real-time listeners (onSnapshot)** - Used to build all the live screens: the agenda, the home tasks, the daily note feed and the per-document live updates of medicine details. (https://firebase.google.com/docs/firestore/query-data/listen)
- **Firestore: Security Rules language reference** - Used to write the privacy rules that enforce the medication visibility model and the per-circle access control. (https://firebase.google.com/docs/firestore/security/rules-structure)
- **Firestore: get() and exists() inside Security Rules** - Used to implement the isMember(circleId) and isAdmin(circleId) helper functions that gate every read/write on circle-scoped data. (https://firebase.google.com/docs/firestore/security/rules-conditions#access_other_documents)
- **React Native Skia** - youtube video linked to github repo (https://www.youtube.com/shorts/_F7ctExwbVU)
- **Introduction to React Native Skia** - tutorial (https://www.youtube.com/watch?v=q59GZ3E4k7w)
- **Liquid glass with React Native Skia** - tutorial youtube (https://www.youtube.com/watch?v=qYFMOMVZoPY&t=354s)
- **Expo Image** - for loading and rendering images. Images compressed as well were too big, slow loading (https://docs.expo.dev/versions/latest/sdk/image/)
- **ChatGpt** - helping setting barscan, privacy rules etc ... (https://chatgpt.com/share/6a22dc79-84b8-8390-b8b3-98f0e137ef00)
- **Prefetching images** - For prefetching and caching images by using expo image, was too slow in the beginning. (https://www.reddit.com/r/reactnative/comments/1nzfspe/need_help_in_prefetching_and_caching_images/)
- **Firebase Auth: React Native persistence** - (initializeAuth + AsyncStorage): Used in firebase-config.ts to make the user's session survive app restarts, so they stay logged in between launches. (https://firebase.google.com/docs/auth/web/start) (https://firebase.google.com/docs/auth/web/auth-state-persistence)
- **Firestore offline persistence & cache behaviour** - Consulted to fix the "sometimes redirected to onboarding on app start" race — the session now waits for a non-cache snapshot via metadata.fromCache. (https://firebase.google.com/docs/firestore/manage-data/enable-offline)
- **Firebase Storage upload from React Native** - Used in uploadImageAsync to upload the care-receiver profile photo, user profile photos and note attachments. (https://firebase.google.com/docs/storage/web/upload-files)
- **Aaron Saunders: Simple React Native Firebase Authentication With Expo Router (YouTube tutorial)** - Used as the initial walk-through for combining Firebase Authentication with Expo Router, specifically the pattern of an (app) group layout that checks the auth state and redirects unauthenticated users to the sign-in screen. The structure of app/(app)/\_layout.tsx in Lume is directly inspired by this tutorial.
  (https://www.youtube.com/watch?v=Yva2Ep717v0)
- **Aaron Saunders — firebase-exporouter-app (GitHub example repository)** - Reference implementation used while wiring the SessionProvider / useSession context in context/index.tsx. The combination of onAuthStateChanged with a React context that exposes user, signIn, signUp and signOut to the rest of the application follows the same approach as this open-source example. (https://github.com/aaronksaunders/firebase-exporouter-app/blob/main/app/(app)/(drawer)/(tabs)/index.tsx)
- **Cloud Functions for Firebase (2nd gen) overview** - Used to set up the functions/ folder, pick the Node 20 runtime and the europe-west1 region for the push senders. (https://firebase.google.com/docs/functions/2nd-gen-upgrade)
- **React Native: KeyboardAvoidingView** - Used in AddTaskModal and AddNoteModal to push the bottom sheet up when the on-screen keyboard appears, so the active TextInput stays visible while typing a task title, description or note content. (https://reactnative.dev/docs/keyboardavoidingview) -**React Native: TextInput** - Used everywhere there is a form: sign-in / sign-up, onboarding (relation, circle name), task creation (title, description), note creation (title, content), medication form (medicine name, dose, instructions), invite-code entry. (https://reactnative.dev/docs/textinput) -**React Native: Modal** - Used for every overlay that takes over the screen: AddTaskModal, AddNoteModal, the time-picker sheet, the override-confirmation alert and the image viewer in the note card. (https://reactnative.dev/docs/modal) -**React Native: Pressable** - detect press interactions. Used as the touchable of every button, card, FAB ... across the app. (https://reactnative.dev/docs/pressable)
- **React Native: ScrollView & RefreshControl** - Used together on the Agenda and Notes screens to give the user a native pull-to-refresh gesture and a smooth scrolling timeline of the day's tasks and notes. (https://reactnative.dev/docs/scrollview) (https://reactnative.dev/docs/refreshcontrol)
- **React Native: Platform** - Used to branch behaviour between iOS and Android in several places: the time-picker (iOS spinner sheet vs. Android dialog), KeyboardAvoidingView's behavior prop, the deep-link scheme used when opening the system calendar (calshow: vs. content://com.android.calendar/...), (https://reactnative.dev/docs/platform)
- **React Native: Alert** - Used for native error / confirmation pop-ups (form validation, camera permission denied, FAGG lookup not found, override warning). (https://reactnative.dev/docs/alert)
- **React Native: Share** - Used in useCreateCircleStep2.handleShareLink to open the system share sheet so the admin can send the care-circle invite code through WhatsApp, Messages, email, etc. (https://reactnative.dev/docs/share)
- **React Native: Linking** - Used to deep-link from the "task synced" alert directly into the device's calendar app (calshow:<seconds> on iOS, content://com.android.calendar/time/<ms> on Android) and to open an email client pre-filled with the invitation message. (https://reactnative.dev/docs/linking)
- **React Native: Dimensions** - Used in the note card's full-screen image viewer to size each page to exactly Dimensions.get("window").width, so swipes paginate cleanly between photos. (https://reactnative.dev/docs/dimensions)
- **React Native: ActivityIndicator** - Used as the loading spinner in the authenticated layout before the first Firestore snapshot arrives. (https://reactnative.dev/docs/activityindicator)
- **expo-image-picker** - Used during onboarding (profile picture) and in the note-creation modal (attach up to three photos).
  (https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- **expo-haptics** - Used in the energy slider, the task cards, the tab bar and several buttons to give the user a soft tactile response on every meaningful interaction. (https://docs.expo.dev/versions/latest/sdk/haptics/)
- **expo-linear-gradient** - (https://docs.expo.dev/versions/latest/sdk/linear-gradient/)
- **Implementing Internationalization in Expo / React Native (i18next + expo-localization)** - Used as the initial walk-through for wiring react-i18next together with expo-localization in a fresh Expo project specifically the pattern of detecting the device language at start-up, loading the nl.json / fr.json resource files and exposing t() to the rest of the application. The i18n setup in lib/i18n.ts follows the same approach as this tutorial. (https://medium.com/@kgkrool/implementing-internationalization-in-expo-react-native-i18next-expo-localization-8ed810ad4455)
- **MDN — Intl.DateTimeFormat / Date.toLocaleDateString / toLocaleTimeString** - Built-in JavaScript locale-aware date/time formatting API. Used on the home screen and the agenda to format the current date in the user's language (NL → "Woensdag", FR → "Mercredi") the fix that made the day name switch correctly when the app is toggled to French. (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString)
- **Expo: expo-status-bar** - Used in app/\_layout.tsx + app(app)/scan.tsx (https://docs.expo.dev/versions/latest/sdk/status-bar/)
- **Firebase Authentication: error codes reference** - Used to map Firebase Auth error.code values (auth/email-already-in-use, auth/weak-password, auth/invalid-email) to the translated user-facing messages in nl.json / fr.json.
  (https://firebase.google.com/docs/auth/admin/errors)
- **React Native: FlatList component** - Used in the Notes screen as the main scrollable list of notes (https://reactnative.dev/docs/flatlist)
- **Reanimated: animation utilities (withTiming, withSpring, withRepeat, withSequence)** - used to swipe reveal of note card + withSequence to make note card float gently up and down (https://docs.swmansion.com/react-native-reanimated/docs/animations/withTiming)
- **Reanimated: useSharedValue** - vertical float, horziontal swipe, scale ... (https://docs.swmansion.com/react-native-reanimated/docs/core/useSharedValue)
- **Reanimated: useAnimatedStyle** - floating note card, breathing shapes scale, mental-energy slider ...
  (https://docs.swmansion.com/react-native-reanimated/docs/core/useAnimatedStyle)
- \*_Reanimated: animating styles_ - Present in NoteCard, TaskCard, TaskSummaryCards, ContactCard, EnergyBattery, EnergyPanel, CalendarMonth, BottomTabBar, BreathingModal and BreathingShapes.
  (https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/animating-styles-and-props/)
- **Reanimated: gestures + animations together** - the gesture writes to a shared value, the shared value drives the animated style, no React re-render needed. Which is how the note card's swipe-to-reveal photos
  (https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/glossary#gesture-handler) -**Firebase Authentication: updatePassword** - Used in useEditProfile.handleSave to change the signed-in user's password from the Edit Profile screen (https://firebase.google.com/docs/reference/js/auth#updatepassword)

- **Firestore-triggered Cloud Functions** - Used to write onMedicationOverride and onSosNote the document-create triggers that detect when an override is logged or a status share is posted. (https://firebase.google.com/docs/functions/firestore-events)
- **onDocumentCreated API reference** - Used to read event.data.data(), event.params.noteId, etc. inside the trigger handlers. (https://firebase.google.com/docs/reference/functions/2nd-gen/node/firebase-functions.firestore)
- **Firebase Admin SDK Firestore** - Used inside the Cloud Functions to read careCircleMembers, medicationDetails and users with full privileges, so push tokens stay private from the client. (https://firebase.google.com/docs/firestore/quickstart#admin)
- **First-deploy IAM / Eventarc propagation issue** - Consulted to understand the "permission denied while using the Eventarc Service Agent" error we hit on the first firebase deploy --only functions confirms that retrying after a few minutes is the correct fix. (https://docs.cloud.google.com/eventarc/docs/issues)
- **europe-west1 region availability** - Used to confirm that the EU region also hosts Firestore + Cloud Functions, which matters for GDPR (https://firebase.google.com/docs/functions/locations)
- **Expo Notifications overview** - Used to learn setNotificationHandler, permission flow and Android notification channels in usePushNotifications.ts. (https://docs.expo.dev/versions/latest/sdk/notifications/)
- **Expo getting a push token** - (getExpoPushTokenAsync): Used to fetch the device's Expo push token at first sign-in and store it on users/{uid}.pushToken + eas cli. So got google-services.json and added in app.json. Now I can send notifications to Android devices via Expo push Notifications (https://docs.expo.dev/push-notifications/push-notifications-setup/)
- **Expo Push API message format** - Used inside the Cloud Functions to build the message body (to, title, body, sound, data) and POST batches to https://exp.host/--/api/v2/push/send. (https://docs.expo.dev/push-notifications/sending-notifications/)
- **Expo / FCM credentials (the FCM V1 service-account key upload)** - Used during eas credentials to link the Firebase service account so Android push actually gets delivered. (https://docs.expo.dev/push-notifications/fcm-credentials/)
- **Why remote push doesn't work in Expo Go any more** - Consulted to understand why a development build is required to test notifications, and how to build one with EAS. (https://docs.expo.dev/develop/development-builds/introduction/)
- **Apple Push Notification service (APNs) basics** - Background reading for the iOS push limitation (paid Apple Developer Program required for delivery on a physical iPhone). (https://developer.apple.com/documentation/usernotifications)
- **Firebase Cloud Messaging HTTP V1 API** - Reference for the FCM V1 transport that Expo Push uses under the hood on Android. (https://firebase.google.com/docs/cloud-messaging/send/v1-api)
- **expo-camera: CameraView, barcode scanning settings** - Used to build the medication scanner (full-screen camera + barcodeScannerSettings list including datamatrix, qr, ean13, code128, …) https://docs.expo.dev/versions/latest/sdk/camera/
- **GS1 General Specifications — Application Identifiers** - Used to understand the 01 prefix on the 2D Data Matrix that contains the GTIN the regex /01(\d{14})/ in extractCode() comes from here. (https://www.gs1.org/standards/barcodes/application-identifiers)
- **GS1 Belgilux: Identification of medicines** - Used to confirm the GTIN / CNK split on Belgian medicine boxes and to plan the FAGG import + scanning logic. (https://www.gs1belu.org/nl/identificatie-van-geneesmiddelen)
- **European Medicines Verification System (EMVS)** - Background reading on how the FMD (Falsified Medicines Directive) verification network operates EU-wide. (https://emvo-medicines.eu/)
- **FAGG Geneesmiddelendatabank** - Public, free-to-download database maintained by the Belgian medicines authority (FAGG / AFMPS), listing every human medicine licensed for sale on the Belgian market. The database is exported as a semicolon-separated CSV with one row per package size, containing the trade name, active ingredient, ATC class, dosage form, delivery status (prescription / over-the-counter), the marketing-authorisation holder, and crucially the two identifiers used by Lume: the GTIN (the global 14-digit barcode printed on the box, also encoded in the 2D Data Matrix) and the CNK (the 7-digit Belgian national pharmacy code). The script scripts/import-fagg.js reads this CSV with csvtojson, keeps only the rows still being commercialised (Gecommercialiseerd === "ja"), splits cells that contain multiple GTINs into separate entries, and writes 10 516 documents to the Firestore collection fagg_medicijnen — using the GTIN itself as the document ID so a scanned box can be resolved in a single read. So: source of the public CSV imported by scripts/import-fagg.js (10 516 licensed human medicines, document ID = GTIN)(https://geneesmiddelendatabank.fagg-afmps.be/)
- **APB / CNK code overview** - Reference for the Belgian national pharmacy code used as a fallback identifier when only a 1D barcode is present.(https://www.apb.be/)
- **@shopify/react-native-skia documentation** - Used to draw the breathing shapes (Hoberman polygon, blob, blooming flower) and the glassmorphism medication cards and other (https://shopify.github.io/react-native-skia/)
- **Skia Shadow / BlurMask image filters** - Consulted while iterating on the scan-frame glow effect (rounded yellow corners with a soft yellow halo). (https://shopify.github.io/react-native-skia/docs/image-filters/shadows/) (https://shopify.github.io/react-native-skia/docs/image-filters/blur/) (https://shopify.github.io/react-native-skia/docs/image-filters/overview/)
- **react-native-reanimated 4 migration to worklets** - Used to fix the runOnJS deprecation replaced by scheduleOnRN from react-native-worklets in the mental-energy slider. (https://docs.swmansion.com/react-native-reanimated/docs/guides/migration-from-3.x/)
- **react-native-gesture-handler Gesture.Pan API** - Used to build the pan gesture on the mental-energy slider and the swipe-to-reveal on the note card etc ... (https://docs.swmansion.com/react-native-gesture-handler/docs/)
- **expo-blur: iOS / Android BlurView** - Used in the scan result card, the override CustomAlert background and the glassy task cards etc ...
  (https://docs.expo.dev/versions/latest/sdk/blur-view/)
- **Lucide icons (lucide.dev)** - for the icons for example in navigation (https://lucide.dev/)
- **react-i18next documentation** - Used to wire up t() everywhere and to set up the language detection at start-up. (https://react.i18next.com/)
- **i18next pluralisation rules** - Used to fix the "1 foto's" bug count argument + _\_one / _\_other keys produce the right singular/plural form automatically. (https://www.i18next.com/translation-function/plurals)
- **expo-localization: reading the device locale** - Used to detect whether the user's phone is set to Dutch or French and select the right translation file at start-up. (https://docs.expo.dev/versions/latest/sdk/localization/)
- **EAS Build overview** - Used to produce the Android development APK and the production AAB in the cloud, without needing a local Android Studio setup. (https://docs.expo.dev/build/introduction/)
- **EAS development build setup** - Used to create the development profile in eas.json with developmentClient: true and distribution: internal.
  (https://docs.expo.dev/develop/development-builds/create-a-build/)
- **EAS eas.json configuration reference** - Used to define the development / preview / production profiles and choose the Android buildType: "apk" for testing. (https://docs.expo.dev/build-reference/eas-json/)
- **EAS Credentials managing the Android keystore + FCM V1** - Used during eas credentials to let EAS generate the signing keystore in the cloud and to upload the FCM service-account key. (https://docs.expo.dev/app-signing/managed-credentials/) (https://docs.expo.dev/push-notifications/fcm-credentials/)
- **Expo app.json googleServicesFile**: Used to wire google-services.json into the Android build so the Firebase native SDK initialises correctly (the fix for the "Default FirebaseApp is not initialized" error). (https://docs.expo.dev/versions/latest/config/app/#googleservicesfile)
- **Configuring app icons & adaptive icons in Expo** - Consulted to fix the first EAS build failure the missing icon files referenced in app.json.
  (https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/)
- **expo-calendar events API** - Used in exportToDeviceCalendar to add a Lume task to the user's iOS or Google calendar with a 15-minute reminder.
  (https://docs.expo.dev/versions/latest/sdk/calendar/)
- **Google Play User Data policy + mandatory account deletion** - Informing about the "delete account" feature required before publishing on the Play Store. (https://support.google.com/googleplay/android-developer/answer/13327111)
- **Google Cloud API key restrictions** - Used to restrict the public Firebase Android API key to the application's package name + SHA-1 fingerprint after GitHub Secret Scanning flagged it. (https://cloud.google.com/docs/authentication/api-keys#restrictions)
- **csvtojson (npm)** - Used inside scripts/import-fagg.js to parse the semicolon-separated FAGG export into JSON before writing to Firestore.
  (https://www.npmjs.com/package/csvtojson)
- **Unsplash License + Pexels** - Legal basis for the stock photos used in for example the onboarding and sign-in / sign-up backgrounds. Free for commercial and personal use, no attribution required. (https://unsplash.com/license) + (https://www.pexels.com/license/)

---

## 📍 Status & Roadmap

**Implemented end-to-end:**

- ✅ Authentication & care-circle onboarding
- ✅ Real-time shared agenda + notes
- ✅ Privacy-first medication module with scan-to-confirm and override
- ✅ FAGG database import (10 516 medicines)
- ✅ Wellbeing module (breathing + SOS)
- ✅ Push notifications on Android (override + SOS)
- ✅ Bilingual NL / FR

**Planned:**

- 🚧 In-app account deletion (required for Play Store)
- 🚧 Google Play Internal Testing release
- 🚧 iOS push (requires Apple Developer Program)

---

## 👩‍💻 Author

**Beatrice Bjoko** — final-year bachelor project, _Erasmushogeschool Brussel Multimedia en Creatieve Technologie_.
Built with care, in Brussels. 💚

---

## 📄 License

This project is part of an academic thesis and is not currently distributed under an open-source license. Please get in touch before reusing any part of it.
