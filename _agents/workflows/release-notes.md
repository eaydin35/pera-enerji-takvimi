---
description: Generate release notes for the latest deployment
---

# Release Notes Workflow

## 1. Get Changes Since Last Deploy
// turbo
```bash
cd /Users/emrullahaydin/Desktop/PET && git log --oneline $(git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD)..HEAD --no-merges | head -30
```

## 2. Check Resolved Bugs
// turbo
```bash
cd /Users/emrullahaydin/Desktop/PET && grep "✅ Çözüldü\|🚀 Deployed" docs/bug-tracker.md 2>/dev/null || echo "No resolved bugs found"
```

## 3. Generate Release Notes
Based on the commits and resolved bugs, create release notes in both Turkish and English:

### Turkish Format
```markdown
## 📝 Sürüm Notları - vX.X.X

### 🆕 Yeni Özellikler
- Feature description

### 🐛 Hata Düzeltmeleri
- BUG-XXX: Description
- BUG-YYY: Description

### ⚡ İyileştirmeler
- Performance/UX improvements
```

### English Format (for App Store)
```markdown
## Release Notes - vX.X.X

### New Features
- Feature description

### Bug Fixes
- Fixed issue where...

### Improvements
- Performance/UX improvements
```

## 4. Save Release Notes
Save to `docs/releases/vX.X.X.md`
