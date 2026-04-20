---
description: Fix a reported bug by ID from the bug tracker
---

# Fix Bug Workflow

When the user says `/fix-bug BUG-XXX` or asks to fix a specific bug:

## 1. Load Bug Details
// turbo
```bash
cd /Users/emrullahaydin/Desktop/PET && grep "BUG-XXX" docs/bug-tracker.md
```
Extract: Screen, Description, Priority from the tracker row.

## 2. Analyze Root Cause
- Read the relevant screen/component files
- Check Sentry for crash reports related to this bug (if available)
- Search codebase for related error patterns:
// turbo
```bash
cd /Users/emrullahaydin/Desktop/PET && grep -rn "console.error\|throw\|catch" app/ components/ utils/ --include="*.tsx" --include="*.ts" | head -30
```

## 3. Implement Fix
- Apply the necessary code changes
- Ensure the fix follows project patterns (error-handling skill, app-rules)
- Add proper error handling using `captureError` from `utils/error-reporter.ts`

## 4. Verify Fix
Run type checking to ensure no new errors:
// turbo
```bash
cd /Users/emrullahaydin/Desktop/PET && npx tsc --noEmit 2>&1 | tail -20
```

## 5. Update Bug Tracker
Move the bug from "Aktif Hatalar" to "Çözülmüş Hatalar" in `docs/bug-tracker.md`:
- Change status from `🔧 Açık` to `✅ Çözüldü`
- Add the current date as "Çözüm Tarihi"
- Add commit hash (after commit) as "Commit"

## 6. Commit Fix
Follow the /commit workflow with message format:
```
fix(screen): BUG-XXX description of fix
```

## 7. Report to User
```
✅ BUG-XXX düzeltildi!
📱 Ekran: [Screen]
🔧 Değişiklik: [Brief description of what was changed]
📊 Durum: ✅ Çözüldü
💾 Commit: [hash]

TestFlight'a yüklemek için `/deploy` komutunu kullanabilirsin.
```
