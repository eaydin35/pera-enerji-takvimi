import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';
import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

// ─── Localization ───────────────────────────────────────────────────────────

/**
 * Translates Supabase auth error messages to Turkish.
 * Covers all known Supabase GoTrue error messages.
 */
function translateAuthError(message: string): string {
    const msg = message.toLowerCase();

    // ── Login / Credentials ──
    if (msg.includes('invalid login credentials'))
        return 'Geçersiz e-posta veya şifre.';
    if (msg.includes('invalid email or password'))
        return 'Geçersiz e-posta veya şifre.';
    if (msg.includes('email not confirmed'))
        return 'E-posta adresiniz henüz doğrulanmamış. Lütfen gelen kutunuzu kontrol edin.';
    if (msg.includes('invalid claim'))
        return 'Oturum bilgileri geçersiz. Lütfen tekrar giriş yapın.';

    // ── Registration ──
    if (msg.includes('user already registered'))
        return 'Bu e-posta adresiyle zaten bir hesap mevcut.';
    if (msg.includes('signup is disabled'))
        return 'Yeni kayıtlar şu an devre dışıdır.';
    if (msg.includes('unable to validate email'))
        return 'Geçersiz e-posta adresi. Lütfen kontrol edin.';
    if (msg.includes('invalid email'))
        return 'Geçersiz e-posta adresi.';

    // ── Password ──
    if (msg.includes('password should be at least'))
        return 'Şifre en az 6 karakter olmalıdır.';
    if (msg.includes('weak password'))
        return 'Şifre çok zayıf. Lütfen daha güçlü bir şifre seçin.';
    if (msg.includes('new password should be different'))
        return 'Yeni şifre eski şifreden farklı olmalıdır.';
    if (msg.includes('same password'))
        return 'Yeni şifre eski şifreden farklı olmalıdır.';

    // ── Rate Limiting ──
    if (msg.includes('email rate limit exceeded'))
        return 'Çok fazla e-posta gönderildi. Lütfen birkaç dakika bekleyin.';
    if (msg.includes('rate limit'))
        return 'Çok fazla deneme yaptınız. Lütfen birkaç dakika bekleyin.';
    if (msg.includes('too many requests'))
        return 'Çok fazla istek gönderildi. Lütfen biraz bekleyin.';
    if (msg.includes('for security purposes, you can only request this after'))
        return 'Güvenlik nedeniyle biraz beklemeniz gerekiyor. Lütfen bir dakika sonra tekrar deneyin.';
    if (msg.includes('over_email_send_rate_limit'))
        return 'E-posta gönderim limiti aşıldı. Lütfen birkaç dakika bekleyin.';

    // ── Token / Session ──
    if (msg.includes('token has expired') || msg.includes('token is invalid'))
        return 'Doğrulama süresi dolmuş veya geçersiz. Lütfen tekrar deneyin.';
    if (msg.includes('refresh token'))
        return 'Oturum süresi dolmuş. Lütfen tekrar giriş yapın.';
    if (msg.includes('session expired') || msg.includes('session not found'))
        return 'Oturumunuz sona erdi. Lütfen tekrar giriş yapın.';
    if (msg.includes('not authorized') || msg.includes('unauthorized'))
        return 'Bu işlem için yetkiniz bulunmuyor.';

    // ── User ──
    if (msg.includes('user not found'))
        return 'Bu e-posta adresiyle kayıtlı bir hesap bulunamadı.';
    if (msg.includes('user banned'))
        return 'Bu hesap askıya alınmıştır. Lütfen destek ile iletişime geçin.';

    // ── Network ──
    if (msg.includes('network request failed') || msg.includes('fetch failed'))
        return 'İnternet bağlantısı kurulamadı. Lütfen bağlantınızı kontrol edin.';
    if (msg.includes('network') || msg.includes('timeout'))
        return 'Bağlantı zaman aşımına uğradı. Lütfen tekrar deneyin.';

    // ── OTP / Phone ──
    if (msg.includes('otp') && msg.includes('expired'))
        return 'Doğrulama kodu süresi dolmuş. Lütfen yeni bir kod isteyin.';

    // ── Fallback: her zaman Türkçe mesaj döndür ──
    // Bilinmeyen hataları asla İngilizce gösterme
    console.warn('[Auth] Untranslated error:', message);
    return 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
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
    resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
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
            set({ error: translateAuthError(e.message), isLoading: false });
        }
    },

    signIn: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            set({ session: data.session, user: data.user, isLoading: false });
        } catch (e: any) {
            set({ error: translateAuthError(e.message), isLoading: false });
        }
    },

    resetPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
            const redirectUrl = Linking.createURL('reset-password');
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: redirectUrl,
            });
            set({ isLoading: false });
            if (error) {
                const translatedError = translateAuthError(error.message);
                set({ error: translatedError });
                return { success: false, message: translatedError };
            }
            return {
                success: true,
                message: 'Şifre sıfırlama linki e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.',
            };
        } catch (e: any) {
            const translatedError = translateAuthError(e.message);
            set({ error: translatedError, isLoading: false });
            return { success: false, message: translatedError };
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

