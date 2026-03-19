import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';

// ─── Esma List ───────────────────────────────────────────────────────────────

import esmaData from '../data/esma_ul_husna.json';

// Classic tesbihat entries
const TESBIHAT = [
    { id: 'subhanallah',   ar: 'سبحان الله',     tr: 'Sübhanallah',      meaning: 'Allah\'ı tüm noksanlıklardan tenzih ederim', category: 'Tesbih',        target: 33   },
    { id: 'elhamdulillah', ar: 'الحمد لله',       tr: 'Elhamdülillah',    meaning: 'Hamd Allah\'a mahsustur',                    category: 'Tesbih',        target: 33   },
    { id: 'allahuekber',   ar: 'الله أكبر',       tr: 'Allahu Ekber',     meaning: 'Allah en büyüktür',                          category: 'Tesbih',        target: 33   },
    { id: 'la_ilahe',      ar: 'لا إله إلا الله',  tr: 'Lailaheillallah',  meaning: 'Allah\'tan başka ilah yoktur',               category: 'Tesbih',        target: 100  },
    { id: 'salavat',       ar: 'اللهم صل على محمد', tr: 'Salavâtı Şerife', meaning: 'Hz. Peygambere salat ve selam',              category: 'Salavat',       target: 100  },
    { id: 'estagfirullah', ar: 'أستغفر الله',     tr: 'Estağfirullah',    meaning: 'Allah\'ım beni bağışla',                     category: 'İstiğfar',      target: 100  },
    { id: 'hasbunallah',   ar: 'حسبنا الله ونعم الوكيل', tr: 'Hasbünallah', meaning: 'Allah bize yeter, O ne güzel vekildir', category: 'Dua',           target: 40   },
];

export const ESMA_LIST = [
    ...TESBIHAT,
    ...esmaData.map((e: any) => ({
        id: e.id,
        ar: e.ar,
        tr: e.tr,
        meaning: e.meaning,
        category: e.category,
        target: e.target,
    })),
];

export type Esma = typeof ESMA_LIST[0];


// ─── Types ───────────────────────────────────────────────────────────────────

interface ZikirSession {
    esmaId: string;
    count: number;
    lastUpdated: string;
}

interface ZikirState {
    activeEsmaId: string;
    sessions: Record<string, ZikirSession>;

    setActiveEsma: (esmaId: string) => void;
    increment: (userId?: string) => void;
    resetActive: () => void;
    resetAll: () => void;
    syncFromSupabase: (userId: string) => Promise<void>;
}

// ─── Supabase helpers ────────────────────────────────────────────────────────

async function upsertSession(userId: string, esmaId: string, count: number) {
    await supabase.from('zikir_sessions').upsert(
        { user_id: userId, esma_id: esmaId, count, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,esma_id' }
    );
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useZikirStore = create<ZikirState>()(
    persist(
        (set, get) => ({
            activeEsmaId: 'ya_allah',
            sessions: {},

            setActiveEsma: (esmaId) => set({ activeEsmaId: esmaId }),

            increment: (userId?: string) => {
                const { activeEsmaId, sessions } = get();
                const current = sessions[activeEsmaId];
                const newCount = (current?.count ?? 0) + 1;
                const updated = new Date().toISOString();

                set({
                    sessions: {
                        ...sessions,
                        [activeEsmaId]: { esmaId: activeEsmaId, count: newCount, lastUpdated: updated },
                    },
                });

                // Fire-and-forget cloud sync if logged in
                if (userId) upsertSession(userId, activeEsmaId, newCount).catch(() => {});
            },

            resetActive: () => {
                const { activeEsmaId, sessions } = get();
                set({
                    sessions: {
                        ...sessions,
                        [activeEsmaId]: {
                            esmaId: activeEsmaId,
                            count: 0,
                            lastUpdated: new Date().toISOString(),
                        },
                    },
                });
            },

            resetAll: () => set({ sessions: {} }),

            syncFromSupabase: async (userId: string) => {
                const { data, error } = await supabase
                    .from('zikir_sessions')
                    .select('esma_id, count, updated_at')
                    .eq('user_id', userId);

                if (error || !data) return;

                const updates: Record<string, ZikirSession> = {};
                for (const row of data) {
                    updates[row.esma_id] = {
                        esmaId: row.esma_id,
                        count: row.count,
                        lastUpdated: row.updated_at,
                    };
                }

                // Merge: prefer whichever is more recent
                const current = get().sessions;
                const merged: Record<string, ZikirSession> = { ...current };
                for (const [esmaId, remote] of Object.entries(updates)) {
                    const local = current[esmaId];
                    if (!local || new Date(remote.lastUpdated) > new Date(local.lastUpdated)) {
                        merged[esmaId] = remote;
                    }
                }
                set({ sessions: merged });
            },
        }),
        {
            name: 'pera-zikir-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
