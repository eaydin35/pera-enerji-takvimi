import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';
import type { Session, User } from '@supabase/supabase-js';

// ─── Localization ───────────────────────────────────────────────────────────

function translateAuthError(message: string): string {
    if (message.includes('Invalid login credentials')) return 'Geçersiz e-posta veya şifre.';
    if (message.includes('User already registered')) return 'Bu e-posta adresiyle zaten bir hesap mevcut.';
    if (message.includes('Email not confirmed')) return 'Lütfen e-posta adresinizi doğrulayın.';
    if (message.includes('Password should be at least 6 characters')) return 'Şifre en az 6 karakter olmalıdır.';
    if (message.includes('Unable to validate email address')) return 'Geçersiz e-posta adresi.';
    return message;
}

interface AuthState {
    session: Session | null;
    user: User | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    signUp: (email: string, password: string, fullName: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    setSession: (session: Session | null) => void;
    clearError: () => void;
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()((set) => ({
    session: null,
    user: null,
    isLoading: false,
    error: null,

    setSession: (session) => {
        set({ session, user: session?.user ?? null });
    },

    clearError: () => set({ error: null }),

    signUp: async (email, password, fullName) => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: fullName } },
            });
            if (error) throw error;
            set({ session: data.session, user: data.user, isLoading: false });
        } catch (e: any) {
            set({ error: e.message, isLoading: false });
        }
    },

    signIn: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            set({ session: data.session, user: data.user, isLoading: false });
        } catch (e: any) {
            set({ error: e.message, isLoading: false });
        }
    },

    signOut: async () => {
        set({ isLoading: true });
        await supabase.auth.signOut();
        set({ session: null, user: null, isLoading: false });
    },
}));

// ─── Listen to auth state changes (call once in _layout) ────────────────────

export function initAuthListener() {
    supabase.auth.getSession().then(({ data: { session } }) => {
        useAuthStore.getState().setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
        useAuthStore.getState().setSession(session);
    });
}
