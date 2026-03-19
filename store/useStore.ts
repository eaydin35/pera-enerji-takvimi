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
    isPremium: boolean;
    completeOnboarding: (profile: UserProfile) => void;
    resetOnboarding: () => void;
    useTokens: (amount: number) => boolean;
    addTokens: (amount: number) => void;
    setPremiumStatus: (status: boolean) => void;
    setAvatarUrl: (url: string) => void;
    syncPremiumStatus: () => Promise<void>;
    syncProfileFromSupabase: (userId: string) => Promise<void>;
}


export const useStore = create<AppState>((set, get) => ({
    hasCompletedOnboarding: false,
    userProfile: null,
    tokens: 10,
    isPremium: false,
    completeOnboarding: (profile) => set({ hasCompletedOnboarding: true, userProfile: profile }),
    resetOnboarding: () => set({ hasCompletedOnboarding: false, userProfile: null }),
    useTokens: (amount) => {
        if (get().isPremium) return true; // Unlimited for premium
        const currentTokens = get().tokens;
        if (currentTokens >= amount) {
            set({ tokens: currentTokens - amount });
            return true;
        }
        return false;
    },
    addTokens: (amount) => set((state) => ({ tokens: state.tokens + amount })),
    setPremiumStatus: (status) => set({ isPremium: status }),
    setAvatarUrl: (url) => set((state) => ({
        userProfile: state.userProfile ? { ...state.userProfile, avatarUrl: url } : null
    })),
    syncPremiumStatus: async () => {
        try {
            const customerInfo = await getCustomerInfo();
            if (customerInfo && customerInfo.entitlements.active['Premium']) {
                set({ isPremium: true });
            } else {
                set({ isPremium: false });
            }
        } catch (e) {
            console.error('[Store] Premium sync failed:', e);
        }
    },
    syncProfileFromSupabase: async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error || !data) return;

            const profile: UserProfile = {
                firstName: data.first_name || '',
                lastName: data.last_name || '',
                birthDate: data.birth_date || '',
                birthTime: data.birth_time || '',
                birthPlace: data.birth_place || '',
                birthLat: data.birth_lat,
                birthLng: data.birth_lng,
                avatarUrl: data.avatar_url || undefined,
            };

            set({ hasCompletedOnboarding: true, userProfile: profile });
        } catch (e) {
            console.error('[Store] Profile sync failed:', e);
        }
    },
}));

