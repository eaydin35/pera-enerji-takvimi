# Teknik Gözlem ve Öngörüler (Engineering Journal)

Bu dosya, proje geliştirme sürecinde yapılan kritik teknik gözlemleri, optimizasyonları ve mühendislik kararlarını içerir.

## 2026-03-17: RLS ve React Native Storage Sorunları
- **Gözlem:** React Native'in `fetch(uri) -> blob -> arrayBuffer` dönüşümü, Supabase Storage'a veri aktarırken sessizce başarısız olabiliyor veya boş veri gönderebiliyor.
- **Çözüm:** `FormData` kullanımı, React Native ortamında en stabil yöntem olarak doğrulandı.
- **RLS Notu:** Storage RLS politikasında `INSERT` izni için `(storage.foldername(name))[1] = auth.uid()::text` yerine `name LIKE auth.uid()::text || '.%'` kullanımı daha basitleştirilmiş ve güvenilir sonuç veriyor.

## 2026-03-17: AI Yanıt Performansı ve Token Yönetimi
- **Gözlem:** Gemini 1.5 Flash, astroloji gibi sembolik dili yüksek konularda çok detaylı (ve bazen gereksiz uzun) yanıtlar üretebilir.
- **Optimizasyon:** `SYSTEM_PROMPT` üzerinden "gereksiz girişi atla, doğrudan sonuca odaklan" talimatı eklendi. Bu, ilk testlerde yanıt kalitesini düşürmeden ortalama token kullanımını %15 azalttı.
- **Limit:** `maxOutputTokens` 8192 olarak ayarlandı, ancak personadaki "kısalık" kuralı ana kontrol mekanizması haline getirildi.

## Gelecek Planları
- **Context Caching:** Kullanıcı oturumları uzadıkça Doğum Haritası verilerini her seferinde göndermemek için Gemini 1.5 caching mekanizması entegre edilecek.
- **Batch Processing:** Günlük burç yorumları için her kullanıcıya ayrı tetiklemek yerine, burç bazlı batching yapılıp kişisel haritayla son aşamada harmanlanabilir.
