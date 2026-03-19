import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, PurchasesPackage } from 'react-native-purchases';

const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || '';

export const initPurchases = async (userId: string) => {
    if (!REVENUECAT_API_KEY || REVENUECAT_API_KEY.includes('YOUR_')) {
        console.warn('[RevenueCat] API Key missing or invalid');
        return;
    }

    try {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        if (Platform.OS === 'ios') {
            await Purchases.configure({ apiKey: REVENUECAT_API_KEY, appUserID: userId });
        } else if (Platform.OS === 'android') {
            // Android key would go here if needed
            await Purchases.configure({ apiKey: REVENUECAT_API_KEY, appUserID: userId });
        }
        console.log('[RevenueCat] Configured for user:', userId);
    } catch (e) {
        console.error('[RevenueCat] Configuration error:', e);
    }
};

export const getCustomerInfo = async () => {
    try {
        return await Purchases.getCustomerInfo();
    } catch (e) {
        console.error('[RevenueCat] Error fetching customer info:', e);
        return null;
    }
};

export const getOfferings = async () => {
    try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
            return offerings.current.availablePackages;
        }
        return [];
    } catch (e) {
        console.error('[RevenueCat] Error fetching offerings:', e);
        return [];
    }
};

export const purchasePackage = async (pack: PurchasesPackage) => {
    try {
        const { customerInfo } = await Purchases.purchasePackage(pack);
        return customerInfo;
    } catch (e: any) {
        if (!e.userCancelled) {
            console.error('[RevenueCat] Purchase error:', e);
        }
        return null;
    }
};

export const restorePurchases = async () => {
    try {
        return await Purchases.restorePurchases();
    } catch (e) {
        console.error('[RevenueCat] Restore error:', e);
        return null;
    }
};
