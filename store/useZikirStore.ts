import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Esma List (genişletilmiş) ──────────────────────────────────────────────

export const ESMA_LIST = [
    // ── Temel Tesbihler ─────────────────────────────────────────────────────
    { id: 'subhanallah',   ar: 'سبحان الله',     tr: 'Sübhanallah',      category: 'Tesbih',        target: 33  },
    { id: 'elhamdulillah', ar: 'الحمد لله',       tr: 'Elhamdülillah',    category: 'Tesbih',        target: 33  },
    { id: 'allahuekber',   ar: 'الله أكبر',       tr: 'Allahu Ekber',     category: 'Tesbih',        target: 33  },
    { id: 'la_ilahe',      ar: 'لا إله إلا الله',  tr: 'Lailaheillallah',  category: 'Tesbih',        target: 100 },
    { id: 'salavat',       ar: 'اللهم صل على محمد', tr: 'Salavatı Şerife', category: 'Salavat',       target: 100 },
    { id: 'estağfirullah', ar: 'أستغفر الله',     tr: 'Estağfirullah',    category: 'İstiğfar',      target: 100 },
    { id: 'hasbunallah',   ar: 'حسبنا الله ونعم الوكيل', tr: 'Hasbünallah', category: 'Dua',          target: 40  },

    // ── Esma-ül Hüsna ────────────────────────────────────────────────────────
    { id: 'ya_allah',      ar: 'يا الله',         tr: 'Ya Allah',         category: 'Esma-ül Hüsna', target: 1000 },
    { id: 'ya_rahman',     ar: 'يا رحمن',         tr: 'Ya Rahman',        category: 'Esma-ül Hüsna', target: 100  },
    { id: 'ya_rahim',      ar: 'يا رحيم',         tr: 'Ya Rahim',         category: 'Esma-ül Hüsna', target: 100  },
    { id: 'ya_kerim',      ar: 'يا كريم',         tr: 'Ya Kerim',         category: 'Esma-ül Hüsna', target: 33   },
    { id: 'ya_hafiz',      ar: 'يا حفيظ',         tr: 'Ya Hafız',         category: 'Esma-ül Hüsna', target: 33   },
    { id: 'ya_safi',       ar: 'يا شافي',         tr: 'Ya Şafi',          category: 'Esma-ül Hüsna', target: 41   },
    { id: 'ya_razzaq',     ar: 'يا رزاق',         tr: 'Ya Rezzak',        category: 'Esma-ül Hüsna', target: 308  },
    { id: 'ya_vedud',      ar: 'يا ودود',         tr: 'Ya Vedud',         category: 'Esma-ül Hüsna', target: 33   },
    { id: 'ya_shakur',     ar: 'يا شكور',         tr: 'Ya Şekür',         category: 'Esma-ül Hüsna', target: 40   },
    { id: 'ya_fattah',     ar: 'يا فتاح',         tr: 'Ya Fettah',        category: 'Esma-ül Hüsna', target: 489  },
];

// ─── Types ──────────────────────────────────────────────────────────────────

export type Esma = typeof ESMA_LIST[0];

interface ZikirSession {
    esmaId: string;
    count: number;
    lastUpdated: string; // ISO date string
}

interface ZikirState {
    // Current session
    activeEsmaId: string;
    sessions: Record<string, ZikirSession>; // keyed by esmaId

    // Actions
    setActiveEsma: (esmaId: string) => void;
    increment: () => void;
    resetActive: () => void;
    resetAll: () => void;
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useZikirStore = create<ZikirState>()(
    persist(
        (set, get) => ({
            activeEsmaId: 'ya_allah',
            sessions: {},

            setActiveEsma: (esmaId) => {
                set({ activeEsmaId: esmaId });
            },

            increment: () => {
                const { activeEsmaId, sessions } = get();
                const current = sessions[activeEsmaId];
                const newCount = (current?.count ?? 0) + 1;
                set({
                    sessions: {
                        ...sessions,
                        [activeEsmaId]: {
                            esmaId: activeEsmaId,
                            count: newCount,
                            lastUpdated: new Date().toISOString(),
                        },
                    },
                });
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
        }),
        {
            name: 'pera-zikir-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
