import { create } from 'zustand';
import { 
    getSubscriptionState, 
    initialize, 
    purchase as rcPurchase, 
    restorePurchases, 
    checkAccess 
} from '../utils/revenue-cat';
import type { SubscriptionTier } from '../utils/revenue-cat';

interface SubscriptionStore {
    tier: SubscriptionTier;
    expiresAt: Date | null;
    calendarWindow: { start: Date; end: Date };
    isLoading: boolean;
    error: string | null;

    initialize: (appUserId?: string) => Promise<void>;
    purchase: (productId: string) => Promise<void>;
    restore: () => Promise<void>;
    checkAccess: (date: Date) => boolean;
}

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
    tier: 'free',
    expiresAt: null,
    calendarWindow: { start: new Date(), end: new Date() }, // Will be hydrated
    isLoading: true,
    error: null,

    initialize: async (appUserId?: string) => {
        set({ isLoading: true, error: null });
        try {
            await initialize(appUserId);
            const state = await getSubscriptionState();
            set({
                tier: state.tier,
                expiresAt: state.expiresAt,
                calendarWindow: { 
                    start: state.calendarWindowStart, 
                    end: state.calendarWindowEnd 
                },
                isLoading: false,
            });
        } catch (e: any) {
            set({ error: e.message, isLoading: false });
        }
    },

    purchase: async (productId: string) => {
        set({ isLoading: true, error: null });
        try {
            const newState = await rcPurchase(productId);
            set({
                tier: newState.tier,
                expiresAt: newState.expiresAt,
                calendarWindow: { 
                    start: newState.calendarWindowStart, 
                    end: newState.calendarWindowEnd 
                },
                isLoading: false,
            });
        } catch (e: any) {
            set({ error: e.message, isLoading: false });
        }
    },

    restore: async () => {
        set({ isLoading: true, error: null });
        try {
            const restoredState = await restorePurchases();
             set({
                tier: restoredState.tier,
                expiresAt: restoredState.expiresAt,
                calendarWindow: { 
                    start: restoredState.calendarWindowStart, 
                    end: restoredState.calendarWindowEnd 
                },
                isLoading: false,
            });
        } catch (e: any) {
            set({ error: e.message, isLoading: false });
        }
    },

    checkAccess: (date: Date) => {
        const { tier, calendarWindow } = get();
        // Construct a temporary state object to use the pure util function
        return checkAccess(date, { 
            tier, 
            expiresAt: null, 
            isInGracePeriod: false, 
            calendarWindowStart: calendarWindow.start, 
            calendarWindowEnd: calendarWindow.end 
        });
    }
}));
