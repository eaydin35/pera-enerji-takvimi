import { create } from 'zustand';
import { supabase } from '../utils/supabase';
import { getCustomerInfo } from '../utils/purchases';

interface UserProfile {
    firstName: string;
    lastName: string;
    birthDate: string;
    birthTime: string;
    birthPlace: string;
    birthLat?: number;
    birthLng?: number;
    sunSign?: string;
    moonSign?: string;
    ascendant?: string;
    avatarUrl?: string;
}


interface AppState {
    hasCompletedOnboarding: boolean;
    userProfile: UserProfile | null;
    tokens: number;
    useTokens: (amount: number) => boolean;
    setTokens: (amount: number) => void;
    addTokens: (amount: number) => void;
    setAvatarUrl: (url: string) => void;
    syncProfileFromSupabase: (userId: string) => Promise<void>;
}


export const useStore = create<AppState>((set, get) => ({
    hasCompletedOnboarding: false,
    userProfile: null,
    tokens: 10,
    completeOnboarding: (profile) => set({ hasCompletedOnboarding: true, userProfile: profile }),
    resetOnboarding: () => set({ hasCompletedOnboarding: false, userProfile: null }),
    useTokens: (amount) => {
        // Keep standard UI deductions locally. 
        // Actual server-side sync is handled in profile store or chat service natively.
        const currentTokens = get().tokens;
        if (currentTokens >= amount) {
            set({ tokens: currentTokens - amount });
            return true;
        }
        return false;
    },
    setTokens: (amount) => set({ tokens: amount }),
    addTokens: (amount) => set((state) => ({ tokens: state.tokens + amount })),
    setAvatarUrl: (url) => set((state) => ({
        userProfile: state.userProfile ? { ...state.userProfile, avatarUrl: url } : null
    })),
    syncProfileFromSupabase: async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error || !data) return;

            const profile: UserProfile = {
                id: data.id,
                firstName: data.first_name || '',
                lastName: data.last_name || '',
                birthDate: data.birth_date || '',
                birthTime: data.birth_time || '',
                birthPlace: data.birth_place || '',
                birthLat: data.birth_lat,
                birthLng: data.birth_lng,
                avatarUrl: data.avatar_url || undefined,
                tokens: data.tokens || 5,
                chartUpdatesRemaining: data.chart_updates_remaining || 1,
                migratedFromGuest: data.migrated_from_guest || false
            };

            set({ hasCompletedOnboarding: true, userProfile: profile, tokens: profile.tokens });
        } catch (e) {
            console.error('[Store] Profile sync failed:', e);
        }
    },
}));

