---
description: Build and deploy the app using EAS (Expo Application Services) to TestFlight
---

# Deploy Workflow (EAS Build → TestFlight)

## 1. Pre-deploy Checks
Run these checks before building:

### TypeScript Check
// turbo
```bash
cd /Users/emrullahaydin/Desktop/PET && npx tsc --noEmit 2>&1 | tail -20
```

### Expo Doctor
// turbo
```bash
cd /Users/emrullahaydin/Desktop/PET && npx -y expo-doctor 2>&1 | tail -20
```

### Verify no ios/ or android/ folders exist (Managed Workflow)
// turbo
```bash
cd /Users/emrullahaydin/Desktop/PET && ls -d ios android 2>/dev/null && echo "⚠️ Native folders found! Remove with: rm -rf ios android" || echo "✅ Clean managed project"
```

## 2. Choose Build Profile
Ask the user which profile to use:
- **preview**: Internal distribution build for testing (TestFlight internal)
- **production**: Production build for App Store / TestFlight (auto-submitted)

Default to **production** if user says "TestFlight'a yolla" or "deploy et".

## 3. Start EAS Build with Auto-Submit
```bash
cd /Users/emrullahaydin/Desktop/PET && npx eas-cli build --platform ios --profile <PROFILE> --auto-submit --non-interactive
```

**Important Notes:**
- `--auto-submit`: Automatically submits to TestFlight after build completes
- `--non-interactive`: Uses saved credentials (no Apple ID prompts after first setup)
- `autoIncrement` in eas.json ensures build number increases automatically
- Build number is managed remotely (`cli.appVersionSource: "remote"`)

## 4. Monitor Build
After the build starts, provide the build URL for monitoring.
The build typically takes 15-25 minutes.

## 5. After Successful Submission
Confirm with:
```
✅ Build başarıyla tamamlandı ve TestFlight'a gönderildi!
📱 Sürüm: X.X.X (Build N)
⏱️ Apple şu an işliyor, 5-10 dakika içinde TestFlight'ta görünecek.
🔗 App Store Connect: https://appstoreconnect.apple.com/apps/6761992914/testflight/ios
```

## 6. Update Bug Tracker
After successful deploy, update any `✅ Çözüldü` bugs to `🚀 Deployed` status in `docs/bug-tracker.md`.

## 7. OTA Update (for minor JS-only changes)
If the change doesn't require a new binary (no native code changes):
```bash
cd /Users/emrullahaydin/Desktop/PET && npx eas-cli update --branch production --message "<update_message>"
```
