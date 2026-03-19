# Pera Enerji Takvimi (PET) - Proje Rehberi ve Geliştirme Standartları

Bu döküman, projenin profesyonel, sürdürülebilir ("agile") ve hatasız (anti-spaghetti) bir şekilde ilerlemesi için oluşturulmuş kesin kurallar ve mimari prensipler bütünüdür. Herhangi bir yapay zeka asistanı veya yeni bir geliştirici bu projeye dokunmadan önce **bu dökümanı okumalı ve kurallara harfiyen uymalıdır.**

## 1. Mimari Prensipler (Architecture Guidelines)

- **Tek Sorumluluk Prensibi (Single Responsibility):** Her bileşen (component), yardımcı fonksiyon (util) veya hook sadece tek bir işi yapmalıdır. 
- **Modülerlik:** Klasör yapısı modüler olmalı, devasa dosyalar oluşturulmamalıdır. (Örn: `chart.tsx` çok büyüdüğünde içindeki elementler `components/` klasörüne taşınmalıdır).
- **Zustand ile Global State:** Uygulama içi durum yönetimi (State Management) tamamen `store/` altındaki Zustand hook'ları üzerinden yapılmalıdır. Bileşen içi state'ler (`useState`) sadece o bileşene özgü geçici durumlar (UI toggles, input değerleri) için kullanılmalıdır.
- **Tip Güvenliği (Type Safety):** Uygulama TypeScript ile yazılmıştır. `any` kullanımı kesinlikle yasaktır, her veri yapısının `interface` veya `type` tanımlaması Typescript kurallarına göre yapılmalıdır.

## 2. Klasör Yapısı (Directory Structure)

Projedeki herkes klasör hiyerarşisine uymak zorundadır:

```text
/app             # Ekranlar ve sayfa yönlendirmeleri (Expo Router)
  /(tabs)        # Alt navigasyon barına sahip ana sayfalar
  /auth.tsx      # Kimlik doğrulama işlemleri
  /_layout.tsx   # Genel sarmalayıcı ve navigasyon ayarları
/components      # Tekrar kullanılabilir, bağımsız arayüz bileşenleri (UI Components)
/store           # Zustand ile yönetilen global state dosyaları
/utils           # Veritabanı (Supabase), AI bağlantıları ve genel fonksiyonlar
/data            # Statik JSON verileri ve sabit bilgiler
/docs            # Dokümantasyonlar ve proje notları
```

## 3. Git ve Versiyon Kontrol Süreci (Git Workflow)

Amatörce geliştirmelerin önüne geçmek için katı bir Git akışı (Workflow) uygulanacaktır.
- **Atomik Commitler:** Her özellik (feature) veya hata düzeltmesi (bugfix) için küçük, anlamlı commitler atılmalıdır. Commit mesajları standartlara uygun olmalıdır:
  - Eklemeler: `feat: [Özellik açıklaması]`
  - Düzeltmeler: `fix: [Hata açıklaması]`
  - Yeniden yapılandırma: `refactor: [yapı açıklaması]`
- **Büyük Güncellemeler:** Kapsamlı bir geliştirme tamamlandığında, kod test edilmeden ana dala (main) atılmamalıdır. Mutlaka `/commit` aracı kullanılarak temiz bir mesajla Github'a gönderilmelidir. 
- *"Bir adım ileri iki adım geri"* yaşanmaması için, çalışan stabil versiyonlar daima GitHub'da bir geri dönüş noktası olarak tutulmalıdır.

## 4. API ve Dış Servis Standartları

- **Supabase Entegrasyonları:**
  - `utils/supabase.ts` üzerinden yapılandırılmış istemci (client) kullanılacaktır.
  - Veri okuma/yazma işlemlerinde olası Row-Level Security (RLS) politikaları her zaman hesaba katılacaktır. Klasörleme mantığı RLS ile eşleşmek zorundadır.
  
- **Yapay Zeka (Gemini AI) Entegrasyonları:**
  - AI çağrıları `utils/ai-astrology.ts` üzerinden merkezi olarak yönetilmektedir.
  - **Sürüm Kontrolü:** Kullanılan model kodları daima en güncel API standartlarına uygun olmalıdır (Örn: Eski `gemini-1.5-flash` yerine `gemini-2.0-flash` kullanılmalıdır).
  - Her AI çağrısında yaşanabilecek kesintiler (HTTP 4xx/5xx) için hataya dayanıklı (error resilience), exponential backoff ve retry mekanizmaları devrede tutulmalıdır.

## 5. Çözüm Metodolojisi (Geliştirici Davranış Kodu)

- **Düşün ve Planla:** Yeni bir kod yazılmadan önce mimari plan `1-plan.md` veya `task.md` olarak kaydedilmelidir.
- **Bozuk Kod Üzerine Kod Yazılmaz:** Eğer bir özellik bozuksa, önce o özellik kökünden onarılmalı, geçici bir yara bandı yapıştırılmamalıdır. Temel sorun (Root Cause) çözüme kavuşmalıdır.
- **Silinmeyen Loglar:** Konsol logları (Console logs) debug için değerlidir ancak prodüksiyona hazır, kullanıcının gözüne çarpan arayüzde saçma (işlevsiz) uyarılar oluşturmamasına özen gösterilmelidir.

---
*Bu rehber, projenin "Spaghetti Code" haline gelmesini engellemek, her adımı planlı, güvenilir ve yüksek standartlı bir ürün ortaya çıkarmak için bir "Sözleşme" niteliğindedir.*
