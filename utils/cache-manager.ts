import { supabase } from './supabase';
import CryptoJS from 'crypto-js';

export type CacheType = 
    | 'natal_analysis'      // TTL: null (sonsuz)
    | 'daily_panel'         // TTL: gece 23:59
    | 'weekly_calendar'     // TTL: pazar 23:59
    | 'monthly_calendar'    // TTL: ayın son günü
    | 'notification_batch'  // TTL: 7 gün
    | 'gemini_transits';    // TTL: 24 saat

export interface CacheRecord {
    id: string;
    user_id: string;
    cache_key: string;        // format: {userId}_{type}_{YYYY-MM-DD}
    payload: Record<string, unknown>;
    created_at: string;
    expires_at: string | null;
    version: number;
    payload_hash: string;     // SHA-256, delta kontrolu icin
}

/** Compute SHA-256 hash of a JSON stringified object */
function computeHash(payload: unknown): string {
    return CryptoJS.SHA256(JSON.stringify(payload)).toString();
}

/** Get the Expiry Date for a specific CacheType */
function getExpiryForType(type: CacheType): Date | null {
    const now = new Date();
    
    switch (type) {
        case 'natal_analysis':
            return null; // Sonsuz
        case 'daily_panel':
        case 'gemini_transits':
            // Bugunun sonu (23:59:59.999)
            now.setHours(23, 59, 59, 999);
            return now;
        case 'weekly_calendar':
            // Pazar 23:59
            const dayOfWeek = now.getDay();
            const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
            now.setDate(now.getDate() + daysUntilSunday);
            now.setHours(23, 59, 59, 999);
            return now;
        case 'monthly_calendar':
            // Ayın son günü
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            nextMonth.setHours(23, 59, 59, 999);
            return nextMonth;
        case 'notification_batch':
            // 7 gün sonra
            now.setDate(now.getDate() + 7);
            return now;
        default:
            return null;
    }
}

/** Build a standardized cache key */
export function buildCacheKey(userId: string, type: CacheType, date?: string): string {
    const dateStr = date || new Date().toISOString().split('T')[0];
    if (type === 'natal_analysis') {
        return `${userId}_${type}`; // Date is irrelevant for lifelong natal cache
    }
    return `${userId}_${type}_${dateStr}`;
}

/** Retrieves a valid cache if it exists and hasn't expired */
export async function getCached<T>(key: string): Promise<T | null> {
    try {
        const { data, error } = await supabase
            .from('ai_cache')
            .select('*')
            .eq('cache_key', key)
            .single();

        if (error || !data) return null;

        const record = data as CacheRecord;

        // Check TTL
        if (record.expires_at) {
            const isExpired = new Date() > new Date(record.expires_at);
            if (isExpired) return null;
        }

        return record.payload as unknown as T;
    } catch (e) {
        console.error('[CacheManager] Error fetching cache:', e);
        return null;
    }
}

/** Save a new cache entry, or update if it exists (Upsert) */
export async function setCached<T>(userId: string, key: string, payload: T, type: CacheType): Promise<void> {
    try {
        const hash = computeHash(payload);
        const expiresAt = getExpiryForType(type);

        const { error } = await supabase
            .from('ai_cache')
            .upsert({
                user_id: userId,
                cache_key: key,
                payload: payload as any,
                payload_hash: hash,
                expires_at: expiresAt ? expiresAt.toISOString() : null,
            }, {
                onConflict: 'user_id,cache_key'
            });

        if (error) throw error;
    } catch (e) {
        console.error('[CacheManager] Error setting cache:', e);
    }
}

/** Forcefully invalidates (deletes) a cache key */
export async function invalidateCache(userId: string, key: string): Promise<void> {
    try {
        await supabase
            .from('ai_cache')
            .delete()
            .eq('user_id', userId)
            .eq('cache_key', key);
    } catch (e) {
        console.error('[CacheManager] Error invalidating cache:', e);
    }
}

/** Compare SHA-256 hashes to detect delta changes */
export async function isDeltaChanged(key: string, newPayload: unknown): Promise<boolean> {
    try {
        const { data } = await supabase
            .from('ai_cache')
            .select('payload_hash')
            .eq('cache_key', key)
            .single();

        if (!data) return true; // Cache doesn't exist, heavily changed

        const newHash = computeHash(newPayload);
        return data.payload_hash !== newHash;
    } catch (e) {
        return true; // Assume changed on error
    }
}
