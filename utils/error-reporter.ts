import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

// ─── Error Severity Levels ───────────────────────────────────────────────────
export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

// ─── Error Context ───────────────────────────────────────────────────────────
export interface ErrorContext {
    screen?: string;
    action?: string;
    userId?: string;
    extra?: Record<string, unknown>;
}

// ─── Sentry DSN ──────────────────────────────────────────────────────────────
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';

// ─── Initialize ──────────────────────────────────────────────────────────────
/**
 * Initialize Sentry error reporting.
 * Call this ONCE in the root _layout.tsx before anything else renders.
 */
export function initErrorReporting(): void {
    if (!SENTRY_DSN) {
        console.warn('[ErrorReporter] EXPO_PUBLIC_SENTRY_DSN is not set. Crash reporting is DISABLED.');
        return;
    }

    Sentry.init({
        dsn: SENTRY_DSN,
        debug: __DEV__,
        enabled: !__DEV__, // Only send reports in production builds
        environment: __DEV__ ? 'development' : 'production',
        release: Constants.expoConfig?.version ?? '1.0.0',
        tracesSampleRate: 0.2, // 20% of transactions for performance monitoring
        attachScreenshot: true,
        attachViewHierarchy: true,

        // Filter out noisy/irrelevant errors
        beforeSend(event) {
            // Don't send network timeout errors in dev
            if (__DEV__ && event.exception?.values?.[0]?.type === 'TypeError') {
                return null;
            }
            return event;
        },
    });

    console.log('[ErrorReporter] Sentry initialized successfully');
}

// ─── Capture Error ───────────────────────────────────────────────────────────
/**
 * Capture and report an error to Sentry with additional context.
 * Also logs to console for local debugging.
 */
export function captureError(
    error: Error | string,
    context?: ErrorContext,
    severity: ErrorSeverity = 'error'
): void {
    const errorObj = typeof error === 'string' ? new Error(error) : error;

    // Always log locally
    console.error(`[${severity.toUpperCase()}]`, errorObj.message, context ?? '');

    // Add breadcrumb for trail
    if (context?.action) {
        Sentry.addBreadcrumb({
            category: context.screen ?? 'app',
            message: context.action,
            level: severity as Sentry.SeverityLevel,
            data: context.extra,
        });
    }

    // Set extra context on the scope
    Sentry.withScope((scope) => {
        scope.setLevel(severity as Sentry.SeverityLevel);

        if (context?.screen) scope.setTag('screen', context.screen);
        if (context?.action) scope.setTag('action', context.action);
        if (context?.userId) scope.setUser({ id: context.userId });
        if (context?.extra) scope.setExtras(context.extra);

        Sentry.captureException(errorObj);
    });
}

// ─── Capture Message ─────────────────────────────────────────────────────────
/**
 * Send a non-error message to Sentry (warnings, informational notes).
 */
export function captureMessage(
    message: string,
    level: ErrorSeverity = 'info',
    extra?: Record<string, unknown>
): void {
    console.log(`[${level.toUpperCase()}]`, message, extra ?? '');

    Sentry.withScope((scope) => {
        scope.setLevel(level as Sentry.SeverityLevel);
        if (extra) scope.setExtras(extra);
        Sentry.captureMessage(message);
    });
}

// ─── User Context ────────────────────────────────────────────────────────────
/**
 * Associate the current user with all future error reports.
 * Call after login / session restore.
 */
export function setUserContext(userId: string, email?: string): void {
    Sentry.setUser({
        id: userId,
        email: email ?? undefined,
    });
}

/**
 * Clear user context (call on logout).
 */
export function clearUserContext(): void {
    Sentry.setUser(null);
}

// ─── Breadcrumbs ─────────────────────────────────────────────────────────────
/**
 * Add a breadcrumb to the trail. Breadcrumbs show the sequence of events
 * leading up to a crash, making debugging much easier.
 */
export function addBreadcrumb(
    category: string,
    message: string,
    data?: Record<string, unknown>
): void {
    Sentry.addBreadcrumb({
        category,
        message,
        level: 'info',
        data,
        timestamp: Date.now() / 1000,
    });
}

// ─── Performance ─────────────────────────────────────────────────────────────
/**
 * Start a custom performance transaction.
 * Use for measuring critical operations like API calls, heavy computations.
 */
export function startTransaction(name: string, op: string) {
    return Sentry.startInactiveSpan({ name, op });
}

// ─── Wrap Navigation ─────────────────────────────────────────────────────────
/**
 * Re-export Sentry's navigation integration for expo-router.
 */
export const SentryNavigationIntegration = Sentry.reactNavigationIntegration;
