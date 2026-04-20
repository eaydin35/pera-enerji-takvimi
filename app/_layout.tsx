import '../global.css';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useAuthStore, initAuthListener } from '../store/useAuthStore';
import { useProfileStore } from '../store/profileStore';
import { initPurchases } from '../utils/purchases';
import { supabase } from '../utils/supabase';
import * as Linking from 'expo-linking';
import { Platform, View, ActivityIndicator } from 'react-native';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { initErrorReporting, setUserContext, clearUserContext, captureError, addBreadcrumb } from '../utils/error-reporter';

// Initialize error reporting (Sentry) as early as possible
initErrorReporting();

// Initialize Supabase auth session listener once at app startup
initAuthListener();

export default function RootLayout() {
    const { session, isLoading: isAuthLoading } = useAuthStore();
    const { profile, isGuest, isLoading: isProfileLoading, initialize } = useProfileStore();
    const segments = useSegments();
    const router = useRouter();

    // 1. Initialize Profile Store when Auth is ready or changes
    useEffect(() => {
        if (!isAuthLoading) {
            initialize();
        }
    }, [isAuthLoading, session?.user?.id]);

    // 1.5. Sync new profile store to legacy useStore 
    useEffect(() => {
        useStore.setState({ userProfile: profile as any });
    }, [profile]);

    // 2. Auto-sync premium status and initiate purchases when user logs in
    useEffect(() => {
        if (session?.user?.id) {
            // Set user context for error reporting (Sentry)
            setUserContext(session.user.id, session.user.email);
            addBreadcrumb('auth', 'User logged in', { userId: session.user.id });

            // Initialize RevenueCat
            initPurchases(session.user.id).catch(console.error);
        } else {
            // Clear user context when logged out
            clearUserContext();
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
                if (error) captureError(new Error(error.message), { screen: 'RootLayout', action: 'DeepLink setSession' });
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

    // 4. Routing Logic
    useEffect(() => {
        // Wait until everything is loaded before making routing decisions
        if (isAuthLoading || isProfileLoading) return;

        // Check for navigation within a timeout to ensure layout is mounted
        const timeout = setTimeout(() => {
            const inTabsGroup   = segments[0] === '(tabs)';
            const inAuthScreen  = segments[0] === 'auth';
            const inOnboarding  = segments[0] === 'onboarding';
            const inWorkout     = segments[0] === 'workout';
            const inPaywall     = segments[0] === 'paywall';

            // Allow standalone screens (workout, paywall etc.) to stay open
            if (inWorkout || inPaywall) return;

            // --- USER-REQUESTED STRICT ROUTING LOGIC ---
            // If the user has an active session, NEVER show onboarding. Go straight to tabs.
            // EXCEPTION: If the user signed up but lacks birth details, permit them to enter onboarding.
            if (session) {
                if (!profile?.birthDate && inOnboarding) {
                    return; // Allow users missing birth data to stay in onboarding
                }

                if (!inTabsGroup) {
                    router.replace('/(tabs)');
                }
                return;
            }

            // User is NOT logged in.
            // Check if they are a guest who already completed the map.
            if (isGuest && profile) {
                // Guests with a profile can access the app or go to auth to register
                if (!inTabsGroup && !inAuthScreen) {
                    router.replace('/(tabs)');
                }
            } else {
                // No session and no guest profile. 
                // They belong either in onboarding or auth.
                if (!inOnboarding && !inAuthScreen) {
                    router.replace('/onboarding');
                }
            }
        }, 100);

        return () => clearTimeout(timeout);
    }, [profile, isGuest, session, isAuthLoading, isProfileLoading, segments]);

    if (isAuthLoading || isProfileLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#ad92c9" />
            </View>
        );
    }

    return (
        <ErrorBoundary>
            <Slot />
        </ErrorBoundary>
    );
}
