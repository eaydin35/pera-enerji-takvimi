import { create } from 'zustand';
import { AnyProfile, UserProfile, GuestProfile, isGuestProfile } from '../types/profile';
import { 
    loadUserProfile, 
    saveProfileInfo, 
    updateBirthData, 
    migrateGuestToRegistered, 
    linkWooCommerceAccount 
} from '../utils/profile-service';
import { saveGuestProfile, loadGuestProfile, clearGuestProfile } from '../utils/secure-storage';
import { useStore } from './useStore';
import { useAuthStore } from './useAuthStore';
import { supabase } from '../utils/supabase';

interface ProfileState {
    profile: AnyProfile | null;
    isGuest: boolean;
    isLoading: boolean;
    error: string | null;

    initialize: () => Promise<void>;
    updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
    updateBirthDataInfo: (newData: { date: string; time: string; place: string; lat: number; lng: number }) => Promise<{ success: boolean; error?: string }>;
    createGuestProfile: (data: Omit<GuestProfile, 'createdAt' | 'isGuest'>) => Promise<void>;
    migrateToRegistered: () => Promise<boolean>;
    linkWooCommerce: (wpUserId: number) => Promise<boolean>;
    clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
    profile: null,
    isGuest: false,
    isLoading: false,
    error: null,

    initialize: async () => {
        set({ isLoading: true, error: null });
        try {
            const authState = useAuthStore.getState();
            if (authState.session?.user?.id) {
                const userProfile = await loadUserProfile(authState.session.user.id);
                if (userProfile) {
                    set({ profile: userProfile, isGuest: false });
                    set({ isLoading: false });
                    return;
                }
            }

            // Fallback to guest
            const guestProfile = await loadGuestProfile();
            if (guestProfile) {
                set({ profile: guestProfile, isGuest: true });
            } else {
                set({ profile: null, isGuest: false });
            }
        } catch (e: any) {
            set({ error: e.message || 'Error initializing profile' });
        } finally {
            set({ isLoading: false });
        }
    },

    updateProfile: async (data: Partial<UserProfile>) => {
        const { isGuest } = get();
        let targetProfile = get().profile;
        if (isGuest) return false;

        const authUser = useAuthStore.getState().user;
        
        // --- Fallback Profile Creation ---
        if (!targetProfile && authUser) {
            try {
                const { error: insertError } = await supabase.from('profiles').insert({
                    id: authUser.id,
                    chart_updates_remaining: 1
                });
                if (!insertError) {
                    const p = await loadUserProfile(authUser.id);
                    if (p) {
                        targetProfile = p;
                        set({ profile: p, isGuest: false });
                    }
                }
            } catch (err) {
                console.error('[ProfileStore] Fallback insert failed in updateProfile', err);
            }
        }

        if (!targetProfile) return false;

        set({ isLoading: true, error: null });
        try {
            const userId = (targetProfile as UserProfile).id;
            const success = await saveProfileInfo(userId, data);
            if (success) {
                set({ profile: { ...targetProfile, ...data } as UserProfile });
                return true;
            }
            throw new Error('Update failed');
        } catch (e: any) {
            set({ error: e.message });
            return false;
        } finally {
            set({ isLoading: false });
        }
    },

    updateBirthDataInfo: async (newData) => {
        const { isGuest } = get();
        let targetProfile = get().profile;
        
        const authUser = useAuthStore.getState().user;

        // --- Fallback Profile Creation ---
        if (!targetProfile && authUser) {
            try {
                const { error: insertError } = await supabase.from('profiles').insert({
                    id: authUser.id,
                    chart_updates_remaining: 1,
                    first_name: authUser.user_metadata?.full_name || 'Misafir'
                });
                if (!insertError) {
                    const p = await loadUserProfile(authUser.id);
                    if (p) {
                        targetProfile = p;
                        set({ profile: p, isGuest: false });
                    }
                }
            } catch (err) {
                console.error('[ProfileStore] Fallback insert failed in updateBirthDataInfo', err);
            }
        }

        if (!targetProfile) return { success: false, error: 'Profil bulunamadı ve oluşturulamadı. Lütfen uygulamayı yeniden başlatın.' };

        set({ isLoading: true, error: null });
        try {
            if (isGuest) {
                // Update local guest profile. Guest can update freely.
                const updatedGuest: GuestProfile = {
                    ...(targetProfile as GuestProfile),
                    birthDate: newData.date,
                    birthTime: newData.time,
                    birthPlace: newData.place,
                    birthLat: newData.lat,
                    birthLng: newData.lng,
                };
                await saveGuestProfile(updatedGuest);
                set({ profile: updatedGuest });
                return { success: true };
            }

            // Registered user
            const p = targetProfile as UserProfile;
            const isPremium = useStore.getState().isPremium;
            const res = await updateBirthData(p.id, p.chartUpdatesRemaining, newData, isPremium);
            if (res.success) {
                set({
                    profile: {
                        ...p,
                        birthDate: newData.date,
                        birthTime: newData.time,
                        birthPlace: newData.place,
                        birthLat: newData.lat,
                        birthLng: newData.lng,
                        chartUpdatesRemaining: res.remainingUpdates,
                        chartLastUpdatedAt: new Date().toISOString(),
                    }
                });
                return { success: true };
            } else {
                set({ error: res.error });
                return { success: false, error: res.error };
            }
        } catch (e: any) {
            set({ error: e.message });
            return { success: false, error: e.message };
        } finally {
            set({ isLoading: false });
        }
    },

    createGuestProfile: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const guest: GuestProfile = {
                ...data,
                createdAt: new Date().toISOString(),
                isGuest: true,
            };
            await saveGuestProfile(guest);
            set({ profile: guest, isGuest: true });
        } catch (e: any) {
            set({ error: e.message });
        } finally {
            set({ isLoading: false });
        }
    },

    migrateToRegistered: async () => {
        const authState = useAuthStore.getState();
        const userId = authState.session?.user?.id;
        
        if (!userId) return false;

        set({ isLoading: true, error: null });
        try {
            // Attempt to migrate guest data if it exists
            const migrated = await migrateGuestToRegistered(userId);
            
            // Failsafe: Guarantee the profile row exists in case migration was skipped
            if (!migrated) {
                await supabase.from('profiles').upsert({ id: userId });
            }
            
            // Always reload profile from DB after login/signup
            const userProfile = await loadUserProfile(userId);
            if (userProfile) {
                set({ profile: userProfile, isGuest: false });
                return true;
            }
            
            // Deep fallback to clear old stuck states
            set({ profile: null, isGuest: false });
            return false;
        } catch (e: any) {
            set({ error: e.message });
            return false;
        } finally {
            set({ isLoading: false });
        }
    },

    linkWooCommerce: async (wpUserId: number) => {
        const { profile, isGuest } = get();
        if (isGuest || !profile) return false;

        set({ isLoading: true, error: null });
        try {
            const p = profile as UserProfile;
            const success = await linkWooCommerceAccount(p.id, wpUserId);
            if (success) {
                set({ profile: { ...p, wpUserId, wpLinkedAt: new Date().toISOString() } });
                return true;
            }
            return false;
        } catch (e: any) {
            set({ error: e.message });
            return false;
        } finally {
            set({ isLoading: false });
        }
    },

    clearProfile: () => {
        clearGuestProfile().catch(err => console.error('[ProfileStore] clearGuestProfile error:', err));
        set({ profile: null, isGuest: false, error: null });
    },
}));
