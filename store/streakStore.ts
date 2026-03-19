import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';
import { track } from '../utils/analytics';

interface StreakStore {
    appOpenStreak: number;
    esmaStreak: number;
    lastAppOpenDate: string | null;
    lastEsmaCompleteDate: string | null;
    
    // Actions
    hydrateFromSupabase: (userId: string) => Promise<void>;
    recordAppOpen: (userId: string) => Promise<void>;
    recordEsmaComplete: (userId: string, esmaName: string) => Promise<void>;
    shouldShowStreakCelebration: () => boolean;
}

/** Format Date as YYYY-MM-DD local */
const getLocalDateString = () => {
    return new Date().toLocaleDateString('en-CA'); // Outputs YYYY-MM-DD locally
};

export const useStreakStore = create<StreakStore>()(
    persist(
        (set, get) => ({
            appOpenStreak: 0,
            esmaStreak: 0,
            lastAppOpenDate: null,
            lastEsmaCompleteDate: null,

            hydrateFromSupabase: async (userId: string) => {
                try {
                    const { data, error } = await supabase
                        .from('user_streaks')
                        .select('*')
                        .eq('user_id', userId)
                        .single();

                    if (!error && data) {
                        set({
                            appOpenStreak: data.app_open_streak,
                            esmaStreak: data.esma_streak,
                            lastAppOpenDate: data.last_app_open,
                            lastEsmaCompleteDate: data.last_esma_complete
                        });
                    }
                } catch (e) {
                    console.error('[StreakStore] Hydration error:', e);
                }
            },

            recordAppOpen: async (userId: string) => {
                const today = getLocalDateString();
                const { lastAppOpenDate, appOpenStreak } = get();

                if (lastAppOpenDate === today) return; // Already recorded today

                let newStreak = 1;
                if (lastAppOpenDate) {
                    const lastDate = new Date(lastAppOpenDate);
                    const now = new Date(today);
                    // Calculates diff in whole days
                    const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
                    
                    if (diffDays === 1) {
                        newStreak = appOpenStreak + 1;
                    }
                }

                set({ appOpenStreak: newStreak, lastAppOpenDate: today });
                track({ name: 'day_streak_updated', count: newStreak });

                // Sync to Supabase
                await supabase.from('user_streaks').upsert({
                    user_id: userId,
                    app_open_streak: newStreak,
                    last_app_open: today,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });
            },

            recordEsmaComplete: async (userId: string, esmaName: string) => {
                const today = getLocalDateString();
                const { lastEsmaCompleteDate, esmaStreak } = get();

                track({ name: 'esma_completed', esma_name: esmaName });

                if (lastEsmaCompleteDate === today) return;

                let newStreak = 1;
                if (lastEsmaCompleteDate) {
                    const lastDate = new Date(lastEsmaCompleteDate);
                    const now = new Date(today);
                    const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
                    
                    if (diffDays === 1) {
                        newStreak = esmaStreak + 1;
                    }
                }

                set({ esmaStreak: newStreak, lastEsmaCompleteDate: today });

                // Sync to Supabase
                await supabase.from('user_streaks').upsert({
                    user_id: userId,
                    esma_streak: newStreak,
                    last_esma_complete: today,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });
            },

            shouldShowStreakCelebration: () => {
                const streak = get().appOpenStreak;
                return streak > 0 && streak % 3 === 0;
            }
        }),
        {
            name: 'pet-streak-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
