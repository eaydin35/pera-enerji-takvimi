// utils/woocommerce-auth.ts
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/profileStore';

// TODO: Replace with your actual domain if stonesofpera.com changes
const WP_AUTH_ENDPOINT = 'https://stonesofpera.com/wp-json/pet/v1/auth';

export async function signInWithWooCommerce(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
        // 1. Authenticate with WordPress
        const response = await fetch(WP_AUTH_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const err: any = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Geçersiz e-posta veya şifre.');
        }

        const data = await response.json();
        const wpUserId = data.wp_user_id;
        const wpFirstName = data.first_name || '';
        const wpLastName = data.last_name || '';
        const fullName = `${wpFirstName} ${wpLastName}`.trim() || 'Stones of Pera Üyesi';

        const authStore = useAuthStore.getState();

        // 2. Let's sign in to Supabase.
        await authStore.signIn(email, password);

        // If signIn failed because of 'Invalid login credentials', they might not be registered yet.
        // Or they simply have a different password in Supabase. We will try signUp.
        if (useAuthStore.getState().error && useAuthStore.getState().error?.includes('login credentials')) {
            await authStore.signUp(email, password, fullName);
        }

        // If still error, throw
        if (useAuthStore.getState().error) {
           throw new Error(useAuthStore.getState().error || 'Bilinmeyen auth hatası');
        }

        // 3. Wait for session to map correctly
        const session = useAuthStore.getState().session;
        if (!session?.user) throw new Error('Oturum açılamadı.');

        // 4. Link WooCommerce ID to Profile
        const profileStore = useProfileStore.getState();
        await profileStore.linkWooCommerce(wpUserId);

        return { success: true };
    } catch (error: any) {
        console.error('[WooAuth]', error);
        return { success: false, error: error.message || 'Beklenmeyen bir hata oluştu.' };
    }
}
