# PET - Pera Enerji Takvimi v2.0 Mimari ve Geliştirici Kılavuzu

**ZORUNLU OKUMA — Proje Standartları**
Bu projeye dokunan her geliştirici ve her AI ajanı aşağıdaki kurallara harfiyen uymak zorundadır. Kod yazmaya başlamadan önce tüm maddeleri oku.

## 🔴 Kesin Kurallar — İhlal Edilemez
*   **TypeScript zorunlu** — `any` kullanımı kesinlikle yasak, her veri yapısı interface/type ile tanımlanmalı
*   **Global state** sadece Zustand (`store/` klasörü) — bileşen içi `useState` sadece geçici UI durumları için
*   **Tüm AI çağrıları** `utils/ai-astrology.ts` üzerinden — dağınık direkt çağrı yasak
*   **Tüm Supabase işlemleri** `utils/supabase.ts` üzerinden
*   **Planlama:** Kod yazmadan önce `docs/` altına (veya `task.md` içine) planı yaz
*   **Gemini model:** `gemini-2.0-flash` veya `gemini-2.0-flash-lite` — eski sürümler yasak
*   **Hata Yönetimi:** Tüm AI çağrılarında exponential backoff + retry mekanizması zorunlu
*   **Test:** Her yeni util/store için XCTest/Jest unit test yazılmalı
*   **Güvenlik:** Supabase tablolarında RLS policy eksik bırakılamaz

## 🛠 Teknoloji Stack
*   **Framework:** Expo (managed) + Expo Router + React Native
*   **Dil:** TypeScript — strict mode
*   **State:** Zustand
*   **Veritabanı:** Supabase (auth + DB + RLS)
*   **AI:** Google Gemini AI
*   **Abonelik:** RevenueCat (react-native-purchases)
*   **Bildirim:** Expo Notifications + Notifee
*   **Analytics:** PostHog React Native

---

## BÖLÜM 1 — Token Ekonomisi & Cache Sistemi
**Hedef:** Aktif kullanıcı başına aylık AI maliyeti $0.08–0.12 aralığında kalmalı.
*   **Sistem:** `utils/cache-manager.ts` üzerinden Supabase tabanlı (`ai_cache` tablosu) önbellekleme.
*   **Model Seçimi (`utils/ai-astrology.ts`):** Analizler için `flash`, hızlı/JSON işlemler (panel, takvim) için `flash-lite`.
*   **Batch İşlemler:** Bildirimler 7 günlük tek prompt ile Pazartesi sabahı üretilir (`utils/notification-batch-producer.ts`).

## BÖLÜM 2 — Bildirim Mühendisliği
**Hedef:** Psikolojik kancalar (`warning`, `loss_aversion`, `fomo`, `ritual`) kullanarak açılma oranını %45+ yapmak. Maksimum günlük 3 bildirim.
*   **Sistem:** `utils/notification-scheduler.ts` ve `store/notificationStore.ts`.
*   **Katmanlar:** Sabah (Her zaman), Öğle (Sadece tetikleyici varsa - void moon, tutulma), Akşam (Esma durumu), Haftalık, Olay Bazlı (Event-Driven).
*   **Analytics:** Her açılan bildirim `notification_log` tablosuna kaydedilecek.

## BÖLÜM 3 — RevenueCat Abonelik Sistemi
**Strateji:** 2 aylık kayan pencere (Rolling Window).
*   **Sistem:** `utils/revenue-cat.ts` ve `store/subscriptionStore.ts`.
*   **Katmanlar:** `free` (sadece bugünkü panel), `pet.monthly.99` (kayan 2 aylık takvim), `pet.yearly.699` (tüm özellikler).
*   **UI:** Premium günler detaylı olacak, kilitli günler `LockedDayOverlay.tsx` ile bulanıklaştırılacak (Blur + CTA).

## BÖLÜM 4 — Analytics & Streak Sistemi
*   **Analytics:** PostHog üzerinden (`utils/analytics.ts`) `PETEvent` tiplemesiyle engagement, retention ve paywall tetikleyicileri takip edilecek.
*   **Streak:** `store/streakStore.ts` ve Supabase `user_streaks` tablosu üzerinden uygulama açma ve Esma tamamlama serileri tutulacak. 3'ün katlarında kutlama animasyonu gösterilecek.

## BÖLÜM 5 — Kalite Kontrol & Commit Stratejisi
Her görev ayrı commit olarak atılacak. Büyük güncellemeler test edilmeden main'e alınmayacak. `feat: [açıklama]` formatı kullanılacak. Kod tesliminden önce Kesin Kurallar listesi check edilecek.
