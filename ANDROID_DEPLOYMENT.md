# NOVARA Android & Cross-Platform Deployment Guide

NOVARA delivers a unified, production-grade placement preparation platform across both **Web** (`https://novara-qzce.onrender.com`) and **Android** (`com.novara.placement`) from a **single codebase**.

---

## 1. Cross-Platform Architecture Overview

Both Web and Android share:
- **One Backend:** Node/Express API hosted on Render (`https://novara-qzce.onrender.com`).
- **One PostgreSQL Database:** Hosted on Supabase with strict SSL CA verification.
- **One Object Storage:** Supabase Private S3-compatible bucket for roadmap files and resume uploads.
- **One Authentication System:** Sessions, JWT tokens, and Google OAuth user records are identical across devices.
- **Account Sync:** Users who register or log in on Web can immediately log in on Android (and vice-versa) with real-time synchronized progress.

```
┌───────────────────────────────────────────────────────────┐
│                     NOVARA Platform                       │
├────────────────────────────┬──────────────────────────────┤
│         Web Client         │      Android Application     │
│   (Mobile/Desktop Browser) │      (Capacitor Native)      │
│   https://novara-qzce...   │     com.novara.placement     │
└──────────────┬─────────────┴──────────────┬───────────────┘
               │                            │
               └─────────────┬──────────────┘
                             ▼
              ┌─────────────────────────────┐
              │   Node/Express API (Render) │
              │   https://novara-qzce.../api│
              └──────────────┬──────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
┌───────────────────────┐         ┌───────────────────────┐
│  Supabase PostgreSQL  │         │   Supabase Storage    │
│  (Data, Progress, DB) │         │   (Roadmap Uploads)   │
└───────────────────────┘         └───────────────────────┘
```

---

## 2. Android Project Specifications

| Property | Value |
| :--- | :--- |
| **Package ID / Application ID** | `com.novara.placement` |
| **App Name** | `NOVARA` |
| **Capacitor Core Version** | `^6.2.0` |
| **Android Min SDK** | `22` (Android 5.1+) |
| **Android Target SDK** | `34` (Android 14+) / `35` (Android 15+) |
| **Android Compile SDK** | `34` |
| **JDK Required** | Temurin OpenJDK 17 LTS (configured in `gradle.properties`) |
| **Debug APK Output** | `android/app/build/outputs/apk/debug/app-debug.apk` |
| **Release AAB Output** | `android/app/build/outputs/bundle/release/app-release.aab` |

---

## 3. Configured Android Permissions

The Android application requests the following production permissions in [`android/app/src/main/AndroidManifest.xml`](file:///f:/NOVARA/android/app/src/main/AndroidManifest.xml):

| Permission | Purpose |
| :--- | :--- |
| `android.permission.INTERNET` | Communicates with the Render production API and Supabase Storage. |
| `android.permission.ACCESS_NETWORK_STATE` | Detects online/offline connectivity to drive offline caching & sync ledger. |
| `android.permission.POST_NOTIFICATIONS` | Delivers daily revision reminders and interview alerts on Android 13+ (API 33+). |
| `android.permission.READ_EXTERNAL_STORAGE` | File upload picker fallback (maxSdkVersion 32) for roadmap uploads. |

---

## 4. Google OAuth Configuration: Web vs Android

Google OAuth behaves differently on Web vs Android WebViews:

### A. Web Application Credentials
- **Client Type:** Web application
- **Authorized JavaScript Origins:**
  - `https://novara-qzce.onrender.com`
  - `http://localhost:3000`
- **Authorized Redirect URIs:**
  - `https://novara-qzce.onrender.com`
  - `https://novara-qzce.onrender.com/api/auth/google`
  - `http://localhost:3000`
- **Render Environment Variables:**
  - `GOOGLE_CLIENT_ID`
  - `VITE_GOOGLE_CLIENT_ID`

### B. Android Native Application Credentials
Inside an Android WebView, Google blocks OAuth popup flows if identified as an embedded WebView (`Error 403: disallowed_useragent`). To register your Android app in Google Cloud Console:

1. Open [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Click **Create Credentials** > **OAuth client ID**.
3. Select **Application type: Android**.
4. Set **Package name**: `com.novara.placement`.
5. Provide the **SHA-1 certificate fingerprint**:

#### Debug Keystore SHA-1 (Used for local testing & debug APKs):
```text
8E:C2:A9:D0:1F:CB:70:FC:C7:0A:39:9B:37:4A:7B:1D:B0:C8:41:4B
```

#### Extracting Release Keystore SHA-1 (Before Play Store submission):
```bash
keytool -list -v -keystore path/to/your/release.keystore -alias your-key-alias
```

### C. Native Google Play Services Authentication
- NOVARA uses `@codetrix-studio/capacitor-google-auth` on Android.
- Tapping "Continue with Google" summons the native Android Google Play Services account picker directly over the app (zero WebView popup issues, zero `disallowed_useragent` errors).
- On Web, NOVARA continues to use the Google Identity Services (`gsi/client`) token popup.
- Both flows deliver the verified Google token to `POST /api/auth/google` for server-side verification and session creation.

> [!IMPORTANT]
> **Render Environment Variables Requirement:**
> In the Render Dashboard under **Environment**, ensure `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID` are configured with your valid Web Application Client ID (`939390230171-...apps.googleusercontent.com`).
> When configured, Render serves this ID to both the Web application and the Android app via `GET /api/auth/config`.

> [!SECURITY]
> **Zero Client Secrets in APK:** Android OAuth client IDs require NO client secret. Never put OAuth secrets, Supabase service-role keys, database passwords, or JWT secrets inside the Android application.

---

## 5. NPM Build Scripts

The following scripts have been configured in [`package.json`](file:///f:/NOVARA/package.json):

```bash
# Build React frontend for production
npm run build

# Sync web assets and plugins to the native Android project
npm run cap:sync

# Launch local Android development emulator/device
npm run android:dev

# Build local Debug APK
npm run android:build:debug

# Build production Release Android App Bundle (AAB) for Play Store
npm run android:build:release
```

---

## 6. How to Build and Install the Debug APK

### Step 1: Sync Assets & Build APK
```bash
npm run build
npm run cap:sync
npm run android:build:debug
```

### Step 2: Locate the Generated APK
The debug APK is generated at:
```text
android/app/build/outputs/apk/debug/app-debug.apk
```

### Step 3: Install onto Device via ADB
Connect an Android device with USB debugging enabled (or start an emulator) and run:
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 7. How to Generate a Signed AAB for Google Play Store

Google Play requires the **Android App Bundle (.aab)** format for all new apps.

### Step 1: Generate Release Keystore (One-Time Setup)
Run the following command in a terminal (store the resulting `.keystore` file in a safe, uncommitted location):
```bash
keytool -genkeypair -v -keystore novara-release-key.keystore -alias novara-key -keyalg RSA -keysize 2048 -validity 10000
```

### Step 2: Set Environment Variables
Set your release signing credentials in your local shell session (do NOT hardcode in git):
```powershell
# PowerShell
$env:NOVARA_RELEASE_KEYSTORE = "C:\path\to\novara-release-key.keystore"
$env:NOVARA_RELEASE_KEYSTORE_PASSWORD = "YourSecureKeystorePassword"
$env:NOVARA_RELEASE_KEY_ALIAS = "novara-key"
$env:NOVARA_RELEASE_KEY_PASSWORD = "YourSecureKeyPassword"
```

### Step 3: Run the Release Build Command
```bash
npm run android:build:release
```
*(Equivalent to: `cd android && .\gradlew.bat bundleRelease`)*

### Step 4: Locate the Output AAB
The production-ready signed bundle will be generated at:
```text
android/app/build/outputs/bundle/release/app-release.aab
```
Upload this `.aab` file directly to the [Google Play Console](https://play.google.com/console).

---

## 8. Android UX Features Implemented

1. **Hardware Back Button Handling:**
   - Pressing the Android back button automatically unwinds any open modal dialogs (Revision modal, Roadmap upload, Focus session, Auth modal, Onboarding, etc.).
   - If no modals are open and the user is on another tab (e.g. Coach, Interview, Calendar), it navigates back to the `'today'` dashboard.
   - If on the `'today'` dashboard with no open modals, it cleanly exits the app rather than trapping the user.
2. **Safe Area & Edge-to-Edge Design:**
   - Insets (`env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`) ensure status bars and gesture navigation bars never clip content.
   - Status bar is styled in `#0B0F19` dark mode matching NOVARA branding.
3. **Soft Keyboard Layout Mode:**
   - `android:windowSoftInputMode="adjustResize"` prevents the virtual keyboard from squashing form inputs and search dialogs.
4. **PWA Prompt Suppression:**
   - The "Install App" PWA banner is automatically hidden when running inside the native Android app.
