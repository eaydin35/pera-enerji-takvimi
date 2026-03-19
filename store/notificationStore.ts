import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import { generateWeeklyNotificationBatch } from '../utils/notification-batch-producer';
import { NotificationScheduler } from '../utils/notification-scheduler';

export type HookType = 'warning' | 'loss_aversion' | 'ritual' | 'fomo';

export interface ScheduledNotification {
    id: string;
    scheduledTime: Date;
    title: string;
    body: string;
    hookType: HookType;
    triggerCondition: string | null;
    data: Record<string, unknown>;   // deep link icin
}

export interface NotificationBatch {
    weekStartDate: string; // YYYY-MM-DD
    days: {
        date: string; // YYYY-MM-DD
        morning: { title: string; body: string; hook_type: string; has_void_alert: boolean };
        midday: { title: string; body: string; hook_type: string; trigger_condition: string; should_send: boolean };
        evening: { title: string; body: string; hook_type: string; esma_completed: boolean };
    }[];
}

interface NotificationStore {
    permissionStatus: 'granted' | 'denied' | 'undetermined';
    scheduledNotifications: ScheduledNotification[];
    weeklyBatch: NotificationBatch | null;
    lastBatchGeneratedAt: string | null;
    
    // Actions
    requestPermission: () => Promise<void>;
    checkPermissionStatus: () => Promise<void>;
    scheduleWeeklyBatch: (userId: string) => Promise<void>;
    cancelAll: () => Promise<void>;
    trackOpened: (notificationId: string) => void;
    setBatch: (batch: NotificationBatch) => void;
}

export const useNotificationStore = create<NotificationStore>()(
    persist(
        (set, get) => ({
            permissionStatus: 'undetermined',
            scheduledNotifications: [],
            weeklyBatch: null,
            lastBatchGeneratedAt: null,

            checkPermissionStatus: async () => {
                const settings = await notifee.getNotificationSettings();
                if (settings.authorizationStatus === AuthorizationStatus.AUTHORIZED || settings.authorizationStatus === AuthorizationStatus.PROVISIONAL) {
                    set({ permissionStatus: 'granted' });
                } else if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
                    set({ permissionStatus: 'denied' });
                } else {
                    set({ permissionStatus: 'undetermined' });
                }
            },

            requestPermission: async () => {
                const settings = await notifee.requestPermission();
                if (settings.authorizationStatus === AuthorizationStatus.AUTHORIZED || settings.authorizationStatus === AuthorizationStatus.PROVISIONAL) {
                    set({ permissionStatus: 'granted' });
                } else {
                    set({ permissionStatus: 'denied' });
                }
            },

            scheduleWeeklyBatch: async (userId: string) => {
                console.log(`[NotificationStore] Generating weekly batch for user: ${userId}`);
                // In a real flow, you would fetch actual transits/profile instead of placeholders here
                const userProfileText = "Test User Profile";
                const transitsText = "Test Week Transits";
                const eventsText = "Test Events";

                const batch = await generateWeeklyNotificationBatch(userId, userProfileText, transitsText, eventsText);
                
                if (batch) {
                    get().setBatch(batch);
                    await NotificationScheduler.scheduleWeeklyBatch(batch);
                }
            },

            cancelAll: async () => {
                await notifee.cancelAllNotifications();
                set({ scheduledNotifications: [] });
                console.log('[NotificationStore] All scheduled notifications cancelled.');
            },

            trackOpened: (notificationId: string) => {
                console.log(`[NotificationStore] Notification opened: ${notificationId}`);
                // Analytics call will be handled in utils/analytics.ts
            },

            setBatch: (batch: NotificationBatch) => {
                set({ 
                    weeklyBatch: batch, 
                    lastBatchGeneratedAt: new Date().toISOString() 
                });
            }
        }),
        {
            name: 'pet-notification-storage',
            storage: createJSONStorage(() => AsyncStorage),
            // Only persist essential state, not the active scheduling instances
            partialize: (state) => ({ 
                permissionStatus: state.permissionStatus,
                weeklyBatch: state.weeklyBatch,
                lastBatchGeneratedAt: state.lastBatchGeneratedAt
            }),
        }
    )
);
