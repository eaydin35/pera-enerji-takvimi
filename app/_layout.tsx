import '../global.css';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useAuthStore, initAuthListener } from '../store/useAuthStore';
import { initPurchases } from '../utils/purchases';
import { supabase } from '../utils/supabase';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

// Initialize Supabase auth session listener once at app startup
initAuthListener();

export default function RootLayout() {
    const { hasCompletedOnboarding, syncProfileFromSupabase, syncPremiumStatus } = useStore();
    const { session, isLoading } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();

    // Auto-sync profile and initiate purchases from Supabase when user logs in
    useEffect(() => {
        if (session?.user?.id) {
            syncProfileFromSupabase(session.user.id);
            
            // Initialize RevenueCat and sync premium status
            initPurchases(session.user.id).then(() => {
                syncPremiumStatus();
            });
        }
    }, [session?.user?.id]);

    // Handle deep links for social authentication (OAuth)
    useEffect(() => {
        const handleDeepLink = async (url: string | null) => {
            if (!url) return;
            
            const { queryParams } = Linking.parse(url);
            
            if (queryParams?.access_token || queryParams?.refresh_token) {
                const { error } = await supabase.auth.setSession({
                    access_token: queryParams.access_token as string,
                    refresh_token: queryParams.refresh_token as string,
                });
                if (error) console.error('[DeepLink] Error setting session:', error.message);
            }
        };

        // Handle initial URL
        Linking.getInitialURL().then(handleDeepLink);

        // Listen for new URLs
        const subscription = Linking.addEventListener('url', (event) => {
            handleDeepLink(event.url);
        });

        return () => subscription.remove();
    }, []);

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
