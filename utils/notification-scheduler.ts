import notifee, { TimestampTrigger, TriggerType } from '@notifee/react-native';
import { useNotificationStore, type HookType, type NotificationBatch } from '../store/notificationStore';
import { supabase } from './supabase';

const EVENT_TEMPLATES = {
    eclipse: {
        title: '{{TUTULMA_TURU}} {{BURC}} burcunda',
        body: 'Senin {{EV}}. evine düşüyor — hazır mısın?',
        hookType: 'fomo' as HookType,
        daysBeforeEvent: 3,
    },
    retrograde_entry: {
        title: 'Yarın {{GEZEGEN}} retroya giriyor',
        body: '{{KISISEL_ETKI}} — bugün hazırlık zamanı',
        hookType: 'warning' as HookType,
        daysBeforeEvent: 1,
    },
    full_moon: {
        title: 'Dolunay — {{BURC}} burcunda doruk',
        body: 'Senin {{EV}}. evinde etkisi en güçlü',
        hookType: 'ritual' as HookType,
        daysBeforeEvent: 0,
    },
    churn_save_7: {
        title: 'Bir sonraki ay {{SAYI}} kritik olay var',
        body: 'Aboneliğin {{GUN}} gün sonra bitiyor',
        hookType: 'fomo' as HookType,
        daysBeforeEvent: 7,
    },
    churn_save_3: {
        title: '{{OLAY_ADI}} yaklaşıyor',
        body: '{{TARIH}} haritanı doğrudan etkiliyor',
        hookType: 'loss_aversion' as HookType,
        daysBeforeEvent: 3,
    },
    churn_save_1: {
        title: 'Yarın erişim kapanıyor',
        body: '{{AY}} içeriğine erişimini kaybedeceksin',
        hookType: 'loss_aversion' as HookType,
        daysBeforeEvent: 1,
    },
} as const;

export class NotificationScheduler {
    
    /**
     * İptal edilebilecek tüm bildirimleri temizler.
     */
    static async clearAll() {
        await notifee.cancelAllNotifications();
    }

    /**
     * Batch üreticiden gelen 7 günlük payload'ı sisteme (Notifee) ekler
     */
    static async scheduleWeeklyBatch(batch: NotificationBatch) {
        if (!batch?.days || batch.days.length === 0) return;

        // İzin kontrolü
        const settings = await notifee.getNotificationSettings();
        if (settings.authorizationStatus === 0) {
            console.warn('[NotificationScheduler] Push izinleri kapalı.');
            return;
        }

        // Eski bekleyenleri her yenilemede temizle (Örn: Pazartesi)
        await this.clearAll();

        console.log(`[NotificationScheduler] Scheduling ${batch.days.length} days of notifications...`);

        for (const day of batch.days) {
            const dateStr = day.date; // YYYY-MM-DD
            
            // Katman 1 — Sabah (06:30)
            if (day.morning) {
                const triggerDate = new Date(`${dateStr}T06:30:00`);
                if (triggerDate > new Date()) {
                    await this.scheduleNotification(
                        `morning_${dateStr}`,
                        day.morning.title,
                        day.morning.body,
                        triggerDate,
                        day.morning.hook_type as HookType,
                        'morning'
                    );
                }
            }

            // Katman 2 — Öğle (13:15) - Conditional
            if (day.midday && day.midday.should_send) {
                const triggerDate = new Date(`${dateStr}T13:15:00`);
                if (triggerDate > new Date()) {
                    await this.scheduleNotification(
                        `midday_${dateStr}`,
                        day.midday.title,
                        day.midday.body,
                        triggerDate,
                        day.midday.hook_type as HookType,
                        'midday',
                        day.midday.trigger_condition
                    );
                }
            }

            // Katman 3 — Akşam (20:00)
            if (day.evening) {
                const triggerDate = new Date(`${dateStr}T20:00:00`);
                if (triggerDate > new Date()) {
                    await this.scheduleNotification(
                        `evening_${dateStr}`,
                        day.evening.title,
                        day.evening.body,
                        triggerDate,
                        day.evening.hook_type as HookType,
                        'evening'
                    );
                }
            }
        }
    }

    /**
     * Bireysel Notifee Scheduling Fonksiyonu
     */
    private static async scheduleNotification(
        id: string,
        title: string,
        body: string,
        date: Date,
        hookType: HookType,
        deliverySlot: string,
        triggerCondition: string | null = null
    ) {
        // Create a time-based trigger
        const trigger: TimestampTrigger = {
            type: TriggerType.TIMESTAMP,
            timestamp: date.getTime(),
        };

        // Create the notification channel (Android requires this)
        const channelId = await notifee.createChannel({
            id: 'pera_astrology',
            name: 'Pera Astrolojik Bildirimler',
            vibration: true,
        });

        // Schedule
        await notifee.createTriggerNotification(
            {
                id,
                title,
                body,
                data: {
                    hookType,
                    deliverySlot,
                    ...(triggerCondition && { triggerCondition })
                },
                android: {
                    channelId,
                    // Psikolojik kancalarda kırmızı (uyarı) veya mor (ritüel) ikon renkleri eklenebilir.
                    color: hookType === 'warning' ? '#E4405F' : '#6A1B9A',
                    pressAction: {
                        id: 'default',
                    },
                },
                ios: {
                    sound: hookType === 'warning' ? 'critical.wav' : 'default',
                }
            },
            trigger
        );
        console.log(`[NotificationScheduler] Scheduled: [${hookType}] ${title} -> ${date.toLocaleTimeString()}`);
    }

    /**
     * Olay Bazlı (Event-Driven) Acil Bildirimler
     */
    static async scheduleEventNotification(eventKey: keyof typeof EVENT_TEMPLATES, targetDate: Date, replacements: Record<string, string>) {
        const template = EVENT_TEMPLATES[eventKey];
        let title: string = template.title;
        let body: string = template.body;

        // Şablon değişkenlerini değiştir (Örn: {{GEZEGEN}} -> Merkür)
        for (const [key, val] of Object.entries(replacements)) {
            title = title.replace(new RegExp(`{{${key}}}`, 'g'), val);
            body = body.replace(new RegExp(`{{${key}}}`, 'g'), val);
        }

        // Tetiklenme zamanını hesapla (Örn: 3 gün önce)
        const triggerDate = new Date(targetDate);
        triggerDate.setDate(triggerDate.getDate() - template.daysBeforeEvent);
        triggerDate.setHours(11, 0, 0, 0); // Olay bildirimleri 11:00'da gider

        if (triggerDate > new Date()) {
            await this.scheduleNotification(
                `event_${eventKey}_${targetDate.getTime()}`,
                title,
                body,
                triggerDate,
                template.hookType,
                'event',
                eventKey
            );
        }
    }
}
