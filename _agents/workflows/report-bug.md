---
description: Report a new bug to the bug tracker with priority, screen, and description
---

# Report Bug Workflow

When the user reports a bug (e.g., "şu ekranda şu hata var", "crash oluyor", "X çalışmıyor"), follow these steps:

## 1. Gather Bug Information
Ask the user (or extract from context) the following:
- **Screen**: Which screen does the bug occur on? (e.g., Chat, Profil, Takvim)
- **Description**: What happens? (e.g., "Mesaj gönderince uygulama çöküyor")
- **Steps to Reproduce**: How to trigger the bug (optional but helpful)
- **Priority**: Use these guidelines:
  - 🔴 Kritik: App crashes, data loss, blocking
  - 🟠 Yüksek: Important feature broken
  - 🟡 Orta: Minor functionality issue
  - 🟢 Düşük: Cosmetic / UX improvement

## 2. Generate Bug ID
Use the format `BUG-XXX` where XXX is the next sequential number.
// turbo
```bash
cd /Users/emrullahaydin/Desktop/PET && grep -c "^| BUG-" docs/bug-tracker.md 2>/dev/null || echo "0"
```

## 3. Add to Bug Tracker
Add a new row to the "Aktif Hatalar" table in `docs/bug-tracker.md`:
```
| BUG-XXX | YYYY-MM-DD | Screen | Description | Priority | 🔧 Açık | - |
```

## 4. Create GitHub Issue (if applicable)
```bash
cd /Users/emrullahaydin/Desktop/PET && gh issue create --title "[BUG-XXX] Description" --body "**Ekran:** Screen\n**Açıklama:** Description\n**Öncelik:** Priority\n**Adımlar:**\n1. ...\n2. ...\n" --label "bug"
```
Note: If `gh` CLI is not available, skip this step and inform the user.

## 5. Check Sentry (if available)
If EXPO_PUBLIC_SENTRY_DSN is configured, suggest the user check Sentry dashboard for related crash reports.

## 6. Confirm to User
Respond with:
```
✅ Hata kaydedildi!
📋 ID: BUG-XXX
📱 Ekran: [Screen]
🔴 Öncelik: [Priority]
📊 Durum: 🔧 Açık

Bu hatayı düzeltmek için `/fix-bug BUG-XXX` komutunu kullanabilirsin.
```
