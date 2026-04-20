---
description: Application specific rules, guidelines, and workflow constraints
---

# PET Application Guidelines & Rules

This document outlines core requirements and behaviors requested by the primary stakeholder. These rules MUST be followed during any development or maintenance of this application.

## 1. UI Theme Enforcement
- **Crucial Rule**: The application MUST ALWAYS USE THE LIGHT THEME.
- Dark theme has caused repeated issues, especially on the login and auth pages.
- Action: Ensure configuration files (`app/_layout.tsx`, Tailwind configs, or NativeWind options) are permanently set to light mode.
- Developers MUST NOT re-introduce dark mode options unless explicitly instructed to do so.

## 2. Forms & Inputs
- **City Selection**: In all dropdowns or lists referencing cities, the most prominent ones (`İstanbul`, `Ankara`, `İzmir`, `Bursa`) must appear at the top.
- **Turkish Characters Check**: Any search or filter functionality (especially for cities) must explicitly handle English-to-Turkish character mapping silently. For example, typing "Izmir" must seamlessly match "İzmir".

## 3. Profile & Member Synchronization
- Profile picture sync across the app is paramount. When a user updates their profile picture in the Profil tab, the system must synchronize this update instantly with the home page's circular avatar and the underlying database.

## 4. Onboarding & Authentication Workflow
- Onboarding Map Data: The app always boots into a map setup screen. A "Log In" / "Sign Up" option must be clearly visible (e.g., top right).
- Post-Signup: New users should be prompted for their map info (birth data) after successful signup.
- Pre-Signup Flow: If a user enters map info *before* creating an account and immediately decides to sign up or log in, the mapped data must be securely associated with that new or existing account automatically.

## 5. Map Calculation (Onboarding) Defaults
- The map profile system is single-profile ONLY for the time being. Any "Sen", "Eşim", "Ekle" buttons/tabs above the Name input must be hidden or removed.

## 6. Authentication Integrity
- The database querying mechanism during login MUST be professional and flawless. Users should absolutely not be able to log in by entering random or non-existent data.
- Relational constraints must be enforced tightly.

## 7. Chat & History
- The AI chat needs memory. The last 10 chat sessions must be saved in the database. When the user logs in and visits the chat section, they must see their previous interactions.

## 8. Zikirmatik Application Logic
- The Zikirmatik must track dhikr counts based on the specific "Esma" (Name) being recited.
- This data must persist to the database.
- Users must be able to continue their session seamlessly from where they left off.

## 9. Navigation Real Estate
- The primary bottom navigation (Navbar) structure must be strictly ordered as:
  1. Ana sayfa (Home)
  2. Haritam (My Map)
  3. Takvim (Calendar)
  4. Danış (Consult)
  5. Zikirmatik
  6. Profil
- The "Egzersiz" (Exercise) tab must be removed.

## 10. EAS Build & TestFlight Pipeline (CRITICAL — NEVER VIOLATE)
This project uses Expo/React Native with **EAS Build** for CI/CD. TestFlight distributions are triggered via EAS CLI. The following rules are absolute:

1. **NEVER** create or commit `ios/` or `android/` folders. This is a **Managed Workflow** project.
2. **NEVER** run `npx expo prebuild` — EAS handles native code generation in the cloud.
3. **ALWAYS** use `npx expo install` for adding new dependencies to ensure SDK compatibility.
4. **ALWAYS** keep `eas.json` environment variables in sync with `.env`.
5. **NEVER** hardcode API keys directly in source code — use `process.env.EXPO_PUBLIC_*` pattern.
6. **NEVER** change `bundleIdentifier` without coordinating with Apple Developer Portal.

## 11. Deployment (EAS Build via Terminal)
When instructed to deploy (e.g., "TestFlight'a yolla", "Güncellemeyi çık", "Deploy et"), follow the `/deploy` workflow which runs:

```bash
npx eas-cli build --platform ios --profile production --auto-submit --non-interactive
```

After the build, confirm with: "Build başarıyla EAS'a gönderildi. Ortalama 15-25 dakika içinde uygulama paketlenip TestFlight'a otomatik yüklenecektir."

## 12. Error Reporting & Bug Tracking
1. **All errors** must be reported through `captureError()` from `utils/error-reporter.ts`, not raw `console.error`.
2. **New bugs** must be logged in `docs/bug-tracker.md` using the `/report-bug` workflow.
3. **Bug fixes** must update the tracker using the `/fix-bug` workflow.
4. **Never swallow errors silently** — every catch block must either handle or report.

