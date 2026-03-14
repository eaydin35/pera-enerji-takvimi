import '../global.css';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useAuthStore, initAuthListener } from '../store/useAuthStore';

// Initialize Supabase auth session listener once at app startup
initAuthListener();

export default function RootLayout() {
    const { hasCompletedOnboarding } = useStore();
    const { session, isLoading } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        // Wait until everything is loaded before making routing decisions
        if (isLoading) return;

        // Check for navigation within a timeout to ensure layout is mounted
        const timeout = setTimeout(() => {
            const inTabsGroup   = segments[0] === '(tabs)';
            const inAuthScreen  = segments[0] === 'auth';
            const inOnboarding  = segments[0] === 'onboarding';
            const inWorkout     = segments[0] === 'workout';

            // Allow standalone screens (workout etc.) to stay open
            if (inWorkout) return;

            if (!hasCompletedOnboarding) {
                if (!inOnboarding) router.replace('/onboarding');
            } else if (!session) {
                if (!inAuthScreen) router.replace('/auth');
            } else {
                if (!inTabsGroup) router.replace('/(tabs)');
            }
        }, 100);

        return () => clearTimeout(timeout);
    }, [hasCompletedOnboarding, session, segments, isLoading]);

    if (isLoading) return null; // Or a splash screen

    return <Slot />;
}
