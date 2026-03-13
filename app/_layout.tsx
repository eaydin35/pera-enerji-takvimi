import '../global.css';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useAuthStore, initAuthListener } from '../store/useAuthStore';

// Initialize Supabase auth session listener once at app startup
initAuthListener();

export default function RootLayout() {
    const { hasCompletedOnboarding } = useStore();
    const { session } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        const inTabsGroup   = segments[0] === '(tabs)';
        const inAuthScreen  = segments[0] === 'auth';
        const inOnboarding  = segments[0] === 'onboarding';
        const inWorkout     = segments[0] === 'workout';

        // Allow workout screen irrespective of auth (launched from within tabs)
        if (inWorkout) return;

        if (!hasCompletedOnboarding) {
            // Not onboarded: always go to onboarding
            if (!inOnboarding) router.replace('/onboarding');
        } else if (!session) {
            // Onboarded but not signed in → auth screen
            if (!inAuthScreen) router.replace('/auth');
        } else {
            // Fully authenticated → app
            if (!inTabsGroup) router.replace('/(tabs)');
        }
    }, [hasCompletedOnboarding, session, segments]);

    return <Slot />;
}
