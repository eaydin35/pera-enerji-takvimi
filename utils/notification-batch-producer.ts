import { callAI } from './ai-astrology';
import { supabase } from './supabase';
import { buildCacheKey } from './cache-manager';
import { type NotificationBatch } from '../store/notificationStore';
import { type ChartData } from './astrology';

const BATCH_PROMPT_TEMPLATE = `
Kullanici profili: {{userProfile}}
Bu haftanin transit verisi: {{weekTransits}}
Astrolojik olaylar: {{events}}

Kullanıcının haritasına ve yukarıdaki gökyüzü durumuna göre tam 7 günlük bildirim metinleri üret.
Hedef kitle: Günlük astroloji ve maneviyat (esma/ritüel) takibi yapan, Pera Enerji Takvimi uygulaması kullanıcısı.
Sadece geçerli bir JSON formatında cevap ver, başka hiçbir açıklama yapma. Format tamamen aşağıdaki gibi olmalı:

[
  {
    "date": "YYYY-MM-DD",
    "morning": {
      "title": "max 6 kelime (örn: Güne başlarken uyarı)",
      "body": "max 12 kelime (örn: Güçlü bir Mars açısı var, tartışmalara dikkat et.)",
      "hook_type": "warning|ritual|fomo|loss_aversion",
      "has_void_alert": true|false
    },
    "midday": {
      "title": "max 6 kelime",
      "body": "max 12 kelime",
      "hook_type": "warning|loss_aversion|fomo|ritual",
      "trigger_condition": "void_moon|retrograde|eclipse|personal_peak|null",
      "should_send": true|false
    },
    "evening": {
      "title": "max 6 kelime",
      "body": "max 12 kelime",
      "hook_type": "ritual",
      "esma_completed": false
    }
  }
]
`;

/**
 * Üretilen 7 günlük batch verisini alır. Sadece Pazartesi sabahları (veya cache yoksa) tetiklenir.
 */
export async function generateWeeklyNotificationBatch(
    userId: string,
    userProfile: string,
    weekTransits: string,
    events: string
): Promise<NotificationBatch | null> {
    
    const now = new Date();
    // Haftanın başlangıcını Pazartesi kabul ediyoruz
    const dayOfWeek = now.getDay() || 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek + 1);
    const dateStr = startOfWeek.toISOString().split('T')[0];

    // Notification batch cache key
    const cacheKey = buildCacheKey(userId, 'notification_batch', dateStr);

    const prompt = BATCH_PROMPT_TEMPLATE
        .replace('{{userProfile}}', userProfile)
        .replace('{{weekTransits}}', weekTransits)
        .replace('{{events}}', events);

    try {
        console.log(`[Notification Batch] Triggering generation for week starting: ${dateStr}`);
        
        // Bu çağrı otomatik olarak cache_manager sisteminden geçecek, 
        // daha önce bu Pazartesi için üretildiyse (7 günlük TTL) direkt dönecek,
        // üretilmediyse flash-lite kullanarak üretecek ve cache'e yazacaktır.
        const responseData = await callAI<any[]>(userId, 'notification_batch', prompt, cacheKey);

        if (!responseData || !Array.isArray(responseData) || responseData.length !== 7) {
            console.error('[Notification Batch] Invalid API response format:', responseData);
            // Log to error table or docs/errors fallback.
            return null;
        }

        const batch: NotificationBatch = {
            weekStartDate: dateStr,
            days: responseData
        };

        return batch;

    } catch (e: any) {
        console.error('[Notification Batch] Generation failed:', e.message);
        return null; // Fallback eklenebilir, eski cache döndürülebilir.
    }
}
