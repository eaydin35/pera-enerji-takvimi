import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';

// ─── Esma List ───────────────────────────────────────────────────────────────

export const ESMA_LIST = [
    { id: 'subhanallah',   ar: '\u0633\u0628\u062d\u0627\u0646 \u0627\u0644\u0644\u0647',     tr: 'S\u00fcbhanallah',      category: 'Tesbih',        target: 33   },
    { id: 'elhamdulillah', ar: '\u0627\u0644\u062d\u0645\u062f \u0644\u0644\u0647',       tr: 'Elhamt\u00fcllah',    category: 'Tesbih',        target: 33   },
    { id: 'allahuekber',   ar: '\u0627\u0644\u0644\u0647 \u0623\u0643\u0628\u0631',       tr: 'Allahu Ekber',     category: 'Tesbih',        target: 33   },
    { id: 'la_ilahe',      ar: '\u0644\u0627 \u0625\u0644\u0647 \u0625\u0644\u0627 \u0627\u0644\u0644\u0647',  tr: 'Lailaheillallah',  category: 'Tesbih',        target: 100  },
    { id: 'salavat',       ar: '\u0627\u0644\u0644\u0647\u0645 \u0635\u0644 \u0639\u0644\u0649 \u0645\u062d\u0645\u062f', tr: 'Salav\u0131t\u0131 \u015eerife', category: 'Salavat', target: 100  },
    { id: 'estagfirullah', ar: '\u0623\u0633\u062a\u063a\u0641\u0631 \u0627\u0644\u0644\u0647',     tr: 'Esta\u011ffirullah',    category: '\u0130sti\u011ffar',      target: 100  },
    { id: 'hasbunallah',   ar: '\u062d\u0633\u0628\u0646\u0627 \u0627\u0644\u0644\u0647 \u0648\u0646\u0639\u0645 \u0627\u0644\u0648\u0643\u064a\u0644', tr: 'Hasb\u00fcnallah', category: 'Dua', target: 40 },
    { id: 'ya_allah',      ar: '\u064a\u0627 \u0627\u0644\u0644\u0647',         tr: 'Ya Allah',         category: 'Esma-\u00fcl H\u00fcsna', target: 1000 },
    { id: 'ya_rahman',     ar: '\u064a\u0627 \u0631\u062d\u0645\u0646',         tr: 'Ya Rahman',        category: 'Esma-\u00fcl H\u00fcsna', target: 100  },
    { id: 'ya_rahim',      ar: '\u064a\u0627 \u0631\u062d\u064a\u0645',         tr: 'Ya Rahim',         category: 'Esma-\u00fcl H\u00fcsna', target: 100  },
    { id: 'ya_kerim',      ar: '\u064a\u0627 \u0643\u0631\u064a\u0645',         tr: 'Ya Kerim',         category: 'Esma-\u00fcl H\u00fcsna', target: 33   },
    { id: 'ya_hafiz',      ar: '\u064a\u0627 \u062d\u0641\u064a\u0638',         tr: 'Ya Haf\u0131z',         category: 'Esma-\u00fcl H\u00fcsna', target: 33   },
    { id: 'ya_safi',       ar: '\u064a\u0627 \u0634\u0627\u0641\u064a',         tr: 'Ya \u015eafi',          category: 'Esma-\u00fcl H\u00fcsna', target: 41   },
    { id: 'ya_razzaq',     ar: '\u064a\u0627 \u0631\u0632\u0627\u0642',         tr: 'Ya Rezzak',        category: 'Esma-\u00fcl H\u00fcsna', target: 308  },
    { id: 'ya_vedud',      ar: '\u064a\u0627 \u0648\u062f\u0648\u062f',         tr: 'Ya Vedud',         category: 'Esma-\u00fcl H\u00fcsna', target: 33   },
    { id: 'ya_shakur',     ar: '\u064a\u0627 \u0634\u0643\u0648\u0631',         tr: 'Ya \u015eek\u00fcr',         category: 'Esma-\u00fcl H\u00fcsna', target: 40   },
    { id: 'ya_fattah',     ar: '\u064a\u0627 \u0641\u062a\u0627\u062d',         tr: 'Ya Fettah',        category: 'Esma-\u00fcl H\u00fcsna', target: 489  },
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
