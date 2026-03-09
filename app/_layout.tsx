import '../global.css';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useStore } from '../store/useStore';

export default function RootLayout() {
    const { hasCompletedOnboarding } = useStore();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        const inTabsGroup = segments[0] === '(tabs)';

        // Auto-routing logic based on onboarding state
        if (!hasCompletedOnboarding && inTabsGroup) {
            router.replace('/onboarding');
        } else if (hasCompletedOnboarding && !inTabsGroup) {
            router.replace('/(tabs)');
        }
    }, [hasCompletedOnboarding, segments]);

    return <Slot />;
}
