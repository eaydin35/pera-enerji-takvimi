import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import { supabase } from '../utils/supabase';
import { makeRedirectUri } from 'expo-auth-session';

export type SocialProvider = 'google' | 'apple' | 'instagram';

export const useSocialAuth = () => {
    const [isSocialLoading, setIsSocialLoading] = useState(false);

    const signInWithSocial = async (provider: SocialProvider) => {
        setIsSocialLoading(true);
        try {
            // Standard redirect URI for Expo
            const redirectUri = makeRedirectUri({
                scheme: 'peraenerji',
                path: 'auth-callback',
            });

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: provider as any,
                options: {
                    redirectTo: redirectUri,
                    skipBrowserRedirect: false,
                    queryParams: provider === 'google' ? {
                        access_type: 'offline',
                        prompt: 'consent',
                    } : undefined,
                },
            });

            if (error) throw error;
            
            // On mobile, Supabase usually handles the redirect via the browser.
            // For a more native feel with Google/Apple, later steps might include 
            // native SDKs (expo-google-sign-in / expo-apple-authentication)
            
        } catch (error: any) {
            console.error(`[SocialAuth] ${provider} error:`, error.message);
            Alert.alert('Giriş Hatası', `${provider} ile giriş yapılırken bir sorun oluştu.`);
        } finally {
            setIsSocialLoading(false);
        }
    };

    return {
        signInWithSocial,
        isSocialLoading
    };
};
