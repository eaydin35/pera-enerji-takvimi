---
description: Build and deploy the app using EAS (Expo Application Services)
---

# Deploy Workflow

## 1. Pre-deploy Checks
Run these checks before building:

### TypeScript Check
// turbo
```bash
cd /Users/emrullahaydin/Desktop/PET && npx tsc --noEmit 2>&1 | tail -10
```

### Expo Doctor
// turbo
```bash
cd /Users/emrullahaydin/Desktop/PET && npx expo-doctor 2>&1 | tail -20
```

## 2. Choose Build Profile
Ask the user which profile to use:
- **development**: Debug build for development (simulator/device)
- **preview**: Internal distribution build for testing
- **production**: Production build for App Store / Play Store

## 3. Choose Platform
Ask the user which platform:
- **ios**: iOS only
- **android**: Android only
- **all**: Both platforms

## 4. Start EAS Build
```bash
cd /Users/emrullahaydin/Desktop/PET && npx eas-cli build --profile <PROFILE> --platform <PLATFORM> --non-interactive
```

## 5. Monitor Build
After the build starts, provide the build URL for monitoring.

## 6. After Successful Build
- For **preview**: Provide the download link or QR code
- For **production**: Guide user through the submission process:
```bash
cd /Users/emrullahaydin/Desktop/PET && npx eas-cli submit --platform <PLATFORM>
```

## 7. OTA Update (for minor changes)
If the change doesn't require a new binary:
```bash
cd /Users/emrullahaydin/Desktop/PET && npx eas-cli update --branch production --message "<update_message>"
```
