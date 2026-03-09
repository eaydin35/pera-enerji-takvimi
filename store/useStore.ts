import { create } from 'zustand';

interface UserProfile {
    firstName: string;
    lastName: string;
    birthDate: string;
    birthTime: string;
    birthPlace: string;
    sunSign?: string;
    moonSign?: string;
    ascendant?: string;
}

interface AppState {
    hasCompletedOnboarding: boolean;
    userProfile: UserProfile | null;
    completeOnboarding: (profile: UserProfile) => void;
    resetOnboarding: () => void;
}

export const useStore = create<AppState>((set) => ({
    hasCompletedOnboarding: false,
    userProfile: null,
    completeOnboarding: (profile) => set({ hasCompletedOnboarding: true, userProfile: profile }),
    resetOnboarding: () => set({ hasCompletedOnboarding: false, userProfile: null }),
}));
