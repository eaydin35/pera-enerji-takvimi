import { create } from 'zustand';

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
}));



