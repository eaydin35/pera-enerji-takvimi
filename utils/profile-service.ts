// utils/profile-service.ts
import { supabase } from './supabase';
import { UserProfile, GuestProfile, AnyProfile } from '../types/profile';
import { getGuestProfileForMigration } from './secure-storage';

/**
 * Loads the user profile from Supabase.
 */
export async function loadUserProfile(userId: string): Promise<UserProfile | null> {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !data) return null;

        return {
            id: data.id,
            email: data.email,
            firstName: data.first_name || '',
            lastName: data.last_name || '',
            birthDate: data.birth_date || '',
            birthTime: data.birth_time || '',
            birthPlace: data.birth_place || '',
            birthLat: data.birth_lat,
            birthLng: data.birth_lng,
            avatarUrl: data.avatar_url,
            chartUpdatesRemaining: data.chart_updates_remaining ?? 1,
            chartLastUpdatedAt: data.chart_last_updated_at,
            wpUserId: data.wp_user_id,
            wpLinkedAt: data.wp_linked_at,
            migratedFromGuest: data.migrated_from_guest || false,
            guestMigratedAt: data.guest_migrated_at,
            createdAt: data.created_at,
        } as UserProfile;
    } catch (e) {
        console.error('[ProfileService] Error loading profile:', e);
        return null;
    }
}

/**
 * Updates basic profile information (excluding birth data rights logic).
 */
export async function saveProfileInfo(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    try {
        // Map camelCase to snake_case for DB
        const dbUpdates: any = {};
        if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
        if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
        if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
        
        const { error } = await supabase
            .from('profiles')
            .upsert({ id: userId, ...dbUpdates });

        if (error) throw error;
        return true;
    } catch (e) {
        console.error('[ProfileService] Error saving profile info:', e);
        return false;
    }
}

/**
 * Updates birth data and manages the chart updates token logic.
 */
export async function updateBirthData(
    userId: string,
    currentUpdatesRemaining: number,
    newBirthData: { date: string; time: string; place: string; lat: number; lng: number },
    isPremium: boolean = false
): Promise<{ success: boolean; remainingUpdates: number; error?: string }> {
    try {
        if (!isPremium && currentUpdatesRemaining <= 0) {
            return {
                success: false,
                remainingUpdates: 0,
                error: 'Güncelleme hakkınız bulunmamaktadır.',
            };
        }

        const updates = {
            birth_date: newBirthData.date,
            birth_time: newBirthData.time,
            birth_place: newBirthData.place,
            birth_lat: newBirthData.lat,
            birth_lng: newBirthData.lng,
            chart_updates_remaining: isPremium ? currentUpdatesRemaining : Math.max(0, currentUpdatesRemaining - 1),
            chart_last_updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from('profiles')
            .upsert({ id: userId, ...updates });

        if (error) throw error;

        // Invalidate AI cache for all analysis types since birth data changed
        await supabase
            .from('ai_cache')
            .delete()
            .eq('user_id', userId);

        return {
            success: true,
            remainingUpdates: isPremium ? currentUpdatesRemaining : currentUpdatesRemaining - 1,
        };
    } catch (e) {
        console.error('[ProfileService] Error updating birth data:', e);
        return { success: false, remainingUpdates: currentUpdatesRemaining, error: 'Bir hata oluştu.' };
    }
}

/**
 * Migrates local guest profile to Supabase upon registration.
 */
export async function migrateGuestToRegistered(userId: string): Promise<boolean> {
    try {
        const guestData = await getGuestProfileForMigration();
        if (!guestData) return false;

        const updates: any = {
            first_name: guestData.firstName,
            last_name: guestData.lastName,
            birth_date: guestData.birthDate,
            birth_time: guestData.birthTime,
            birth_place: guestData.birthPlace,
            birth_lat: guestData.birthLat,
            birth_lng: guestData.birthLng,
        };

        let finalAvatarUrl = guestData.avatarUrl;

        // If guest uploaded photo locally before signing up, migrate it to Supabase Storage
        if (finalAvatarUrl && finalAvatarUrl.startsWith('file://')) {
            try {
                const { uploadAvatar } = await import('./storage');
                const uploadedUrl = await uploadAvatar(finalAvatarUrl, userId);
                if (uploadedUrl) finalAvatarUrl = uploadedUrl;
            } catch (err) {
                console.error('[ProfileService] Failed to upload local guest avatar during migration', err);
            }
        }

        if (finalAvatarUrl) {
            updates.avatar_url = finalAvatarUrl;
        }

        const { error } = await supabase
            .from('profiles')
            .upsert({ id: userId, ...updates });

        if (error) throw error;
        return true;
    } catch (e) {
        console.error('[ProfileService] Error migrating guest:', e);
        return false;
    }
}

/**
 * Links a WooCommerce user to the current Supabase profile.
 */
export async function linkWooCommerceAccount(userId: string, wpUserId: number): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                wp_user_id: wpUserId,
                wp_linked_at: new Date().toISOString(),
            });

        if (error) throw error;
        return true;
    } catch (e) {
        console.error('[ProfileService] Error linking WooCommerce account:', e);
        return false;
    }
}
