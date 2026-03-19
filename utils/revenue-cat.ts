import Purchases, { PurchasesPackage, CustomerInfo, LogLevel } from 'react-native-purchases';
import { Platform } from 'react-native';

const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

export const PRODUCT_IDS = {
    MONTHLY: 'pet.monthly.99',
    YEARLY: 'pet.yearly.699',
    PREMIUM_PLUS: 'pet.premium_plus',   // simdilik disabled
} as const;

export type SubscriptionTier = 'free' | 'monthly' | 'yearly';

export interface SubscriptionState {
    tier: SubscriptionTier;
    expiresAt: Date | null;
    isInGracePeriod: boolean;
    calendarWindowStart: Date;
    calendarWindowEnd: Date;
}

/**
 * 2 Aylık Kayan Pencere Mantığı (Rolling Window)
 * Her zaman bulunulan ayın 1. günü başlar, bir sonraki ayın son günü biter.
 */
function getCalendarWindow(now: Date): { start: Date; end: Date } {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Bulunulan ay + 1 = Sonraki Ay. Onun da 0. günü = Sonraki ayın son günü.
    // Ancak JavaScript'te (Y, M+2, 0) yaparsak M(Current) -> M+1(Next) -> M+2(Next of Next). Ayın '0'ıncı günü bir önceki ayın sonudur.
    // Dolayısıyla (Y, M+2, 0) bize (M+1)'in son gününü verir.
    const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
}

/** RevenueCat SDK Initialization */
export async function initialize(appUserId?: string): Promise<void> {
    if (!REVENUECAT_API_KEY) {
        console.warn('[RevenueCat] API Key is missing.');
        return;
    }

    if (process.env.NODE_ENV === 'development') {
        Purchases.setLogLevel(LogLevel.DEBUG);
    }

    if (Platform.OS === 'ios') {
        Purchases.configure({ apiKey: REVENUECAT_API_KEY, appUserID: appUserId });
    } else if (Platform.OS === 'android') {
        // Android API key can be added here once generated
        // Purchases.configure({ apiKey: 'goog_api_key', appUserID: appUserId });
        console.warn('[RevenueCat] Android is not yet configured with an API key.');
    }
}

/** Fetch and parse the user's current subscription status */
export async function getSubscriptionState(): Promise<SubscriptionState> {
    try {
        const customerInfo = await Purchases.getCustomerInfo();
        return parseCustomerInfo(customerInfo);
    } catch (e) {
        console.error('[RevenueCat] Failed to get customer info:', e);
        return getFallbackState();
    }
}

/** Purchase a specific package */
export async function purchase(productId: string): Promise<SubscriptionState> {
    try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current && offerings.current.availablePackages.length !== 0) {
            const packageToBuy = offerings.current.availablePackages.find(p => p.product.identifier === productId);
            
            if (packageToBuy) {
                const { customerInfo } = await Purchases.purchasePackage(packageToBuy);
                return parseCustomerInfo(customerInfo);
            }
        }
        throw new Error('Product not found in current offerings.');
    } catch (e: any) {
        if (!e.userCancelled) {
            console.error('[RevenueCat] Purchase failed:', e);
            throw e;
        }
        return getSubscriptionState(); // Return current state if cancelled
    }
}

/** Restore previous purchases */
export async function restorePurchases(): Promise<SubscriptionState> {
    try {
        const customerInfo = await Purchases.restorePurchases();
        return parseCustomerInfo(customerInfo);
    } catch (e) {
        console.error('[RevenueCat] Restore failed:', e);
        throw e;
    }
}

/** Check if a requested date falls within the user's authorized calendar window */
export function checkAccess(date: Date, state: SubscriptionState): boolean {
    if (state.tier === 'free') {
        // Free tier can only see today
        const todayStr = new Date().toISOString().split('T')[0];
        const reqStr = date.toISOString().split('T')[0];
        return reqStr === todayStr;
    }

    // Premium users are restricted by the rolling window
    return date >= state.calendarWindowStart && date <= state.calendarWindowEnd;
}

// ─── Internal Parsing logic ───

function parseCustomerInfo(info: CustomerInfo): SubscriptionState {
    const window = getCalendarWindow(new Date());
    
    // Assuming 'Premium' is the name of the entitlement in RevenueCat dashboard
    const entitlement = info.entitlements.active['Premium'];
    
    if (entitlement) {
        let tier: SubscriptionTier = 'monthly'; // default to monthly if active
        if (entitlement.productIdentifier === PRODUCT_IDS.YEARLY) {
            tier = 'yearly';
        }

        return {
            tier,
            expiresAt: entitlement.expirationDate ? new Date(entitlement.expirationDate) : null,
            isInGracePeriod: entitlement.willRenew === false && new Date(entitlement.expirationDate as string) > new Date(),
            calendarWindowStart: window.start,
            calendarWindowEnd: window.end,
        };
    }

    return getFallbackState(window);
}

function getFallbackState(window?: { start: Date; end: Date }): SubscriptionState {
    const w = window || getCalendarWindow(new Date());
    return {
        tier: 'free',
        expiresAt: null,
        isInGracePeriod: false,
        calendarWindowStart: w.start,
        calendarWindowEnd: w.end,
    };
}
