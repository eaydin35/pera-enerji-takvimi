# CHANGELOG — Pera Enerji Takvimi

> Bu dosya, her sürümde yapılan değişikliklerin resmi kaydıdır.
> Yeni bir chat oturumu açıldığında AI asistanın ilk okuyacağı dosyadır.
> Format: [Semantic Versioning](https://semver.org/lang/tr/)

---

## [1.4.0] — 2026-04-20

### 🌟 Yıldız Abonelik Sistemi (Büyük Güncelleme)
- **Terminoloji:** Tüm "Jeton" ifadeleri → "Yıldız" (⭐) olarak değiştirildi
- **Dual-Star Sistemi:**
  - `sub_stars`: Aylık yenilenen abonelik yıldızları (devretmez)
  - `bonus_stars`: Tek seferlik satın alınan ekstra yıldızlar (devreder)
- **Supabase RPC Güvenlik Katmanı:**
  - `deduct_stars()`: Hack korumalı yıldız harcama fonksiyonu (önce sub, sonra bonus)
  - `add_bonus_stars()`: Güvenli yıldız yükleme fonksiyonu
  - Her iki fonksiyon `SECURITY DEFINER` ile çalışır — frontend'den doğrudan DB güncellemesi engellendi
- **Paywall:** Aylık 799.99₺, Yıllık 6999.99₺ (TL bazlı)
- **Paywall Güvenlik:** Aktif aboneliği olan kullanıcılar mükerrer ödeme yapamaz
- **RevenueCat Webhook:** `supabase/functions/revenuecat-webhook/index.ts` hazırlandı (RENEWAL → sub sıfırlama, PURCHASE → bonus ekleme)

### 🕌 Esma & Zikirmatik İyileştirmeleri
- **Esma Deep-Link Düzeltmesi:** Ana sayfadan Zikirmatik'e geçişte "Ya Allah" fallback sorunu çözüldü
- **Çözüm:** `gemstone_kb.json`'a tüm önerilen esmalara `esma_id` alanı eklendi
- **Yönlendirme:** Artık isim bazlı fuzzy-match yerine doğrudan ID bazlı eşleştirme kullanılıyor
- **recommendation-engine.ts:** `EsmaRecommendation` arayüzüne `id` alanı eklendi

### 📋 Onboarding
- **Odak Sınırı:** "Hayattaki Odak Noktanız" seçimi maksimum 3 ile sınırlandırıldı

### 🏗️ Altyapı
- **Gemini API:** Ücretsiz katmandan ücretli (Pay-as-you-go) katmana geçildi — 503 hataları sona erdi
- **Sentry:** `error-reporter.ts` utility eklendi
- **ios/ klasörü:** Native dosyalar kaldırıldı (Managed Workflow — EAS Cloud derler)
- **EAS:** `eas.json` yapılandırma dosyası eklendi

### 📅 Veri
- `astro_events_2026.json` genişletildi (dini, resmî ve astrolojik olaylar)
- `daily_guidance_2026.json` oluşturuldu (365 günlük rehberlik verisi)

---

## [1.3.0] — 2026-03-28

### 📅 Takvim Ekranı Yeniden Tasarımı
- Bento-style kart düzeni ile modern takvim arayüzü
- Transit bazlı astrolojik olaylar entegrasyonu
- `CalendarGrid`, `CategoryChips`, `DayBentoCards` bileşenleri eklendi

### 👤 Persona Sistemi
- Cinsiyet (`gender`) ve Hayat Odağı (`life_focus`) alanları kayıt akışına eklendi
- `types/profile.ts`'ye `Gender` ve `LifeFocus` tipleri eklendi

---

## [1.2.0] — 2026-03-22

### 🔐 Auth & Profil İyileştirmeleri
- Auth hataları Türkçe'ye çevrildi
- Yanlış giriş denemesinde kullanıcı login ekranında kalıyor
- Token harcama ile harita güncelleme kilidi mekanizması
- Yükselen burç (Ascendant) dinamik hesaplama

### 🗨️ Chat
- AI Chat önerileri (suggestion chips) eklendi
- Sohbet geçmişi veritabanında saklanıyor (son 10 oturum)

---

## [1.1.0] — 2026-03-20

### 🔑 Sosyal Giriş
- Google, Apple ve Instagram sosyal login entegrasyonu
- Deep-linking yapılandırması

### 🖼️ Profil
- Profil fotoğrafı yükleme (Supabase Storage)
- Avatar senkronizasyonu (profil → dashboard)

---

## [1.0.0] — 2026-03-18

### 🎉 İlk Sürüm
- Doğum haritası hesaplama (astrology.ts)
- AI destekli astroloji yorumları (Gemini 2.0 Flash)
- Zikirmatik (99 Esma + Tesbih)
- Günlük taş, renk ve esma önerileri
- Token ekonomisi (5 ücretsiz analiz)
- Expo Router tab navigasyonu
- Supabase auth + profil yönetimi
- Günlük esneme rutini ekranı

---

## Veritabanı Durumu (Manuel Çalıştırılması Gerekenler)

> [!IMPORTANT]
> Aşağıdaki SQL kodları Supabase SQL Editor'de çalıştırılmalıdır:

| Dosya | Durum | Açıklama |
|-------|-------|----------|
| `db_stars_update.sql` | ✅ Çalıştırıldı (2026-04-20) | deduct_stars, add_bonus_stars RPC fonksiyonları |
| `supabase/functions/revenuecat-webhook` | ⏳ Deploy edilecek | RevenueCat webhook Edge Function |

## Ortam Değişkenleri (.env)

```
EXPO_PUBLIC_SUPABASE_URL=***
EXPO_PUBLIC_SUPABASE_ANON_KEY=***
EXPO_PUBLIC_GEMINI_API_KEY=*** (Ücretli katman — Pay-as-you-go)
EXPO_PUBLIC_REVENUECAT_API_KEY=*** (appl_ ile başlamalı — test_ YASAK)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=***
EXPO_PUBLIC_META_APP_ID=***
EXPO_PUBLIC_SENTRY_DSN=***
```
