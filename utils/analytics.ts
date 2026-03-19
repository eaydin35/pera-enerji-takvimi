import PostHog from 'posthog-react-native';
import type { HookType } from '../store/notificationStore';

// In production, move this to .env (EXPO_PUBLIC_POSTHOG_API_KEY)
const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY || 'phc_placeholder_key';

export const posthog = new PostHog(POSTHOG_API_KEY, {
    host: 'https://eu.i.posthog.com', // or 'https://us.i.posthog.com'
    enable: true,
});

export type PETEvent =
    // Engagement
    | { name: 'daily_panel_opened'; source: 'notification' | 'direct' | 'widget' }
    | { name: 'calendar_day_tapped'; days_ahead: number }
    | { name: 'notification_opened'; hook_type: HookType; delivery_slot: 'morning' | 'midday' | 'evening' | 'weekly' | 'event' }
    | { name: 'esma_completed'; esma_name: string }
    // Retention
    | { name: 'day_streak_updated'; count: number }
    | { name: 'session_ended'; duration_seconds: number }
    // Monetization
    | { name: 'paywall_shown'; trigger: string }
    | { name: 'subscription_started'; plan: 'monthly' | 'yearly' }
    | { name: 'subscription_cancelled'; days_since_start: number }
    | { name: 'churn_save_success' }
    | { name: 'locked_day_tapped'; days_ahead: number };

/** Send an event to PostHog ensuring strict type constraints */
export function track(event: PETEvent): void {
    const { name, ...properties } = event;
    posthog.capture(name, properties);
    console.log(`[Analytics] Tracked: ${name}`, properties);
}

/** Identify the user across devices/sessions */
export function identify(userId: string, traits: Record<string, unknown> = {}): void {
    posthog.identify(userId, traits);
}

/** Reset tracking identity (e.g., on logout) */
export function resetIdentity(): void {
    posthog.reset();
}
