import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../utils/supabase';

type Mode = 'login' | 'register';

export default function AuthScreen() {
    const router = useRouter();
    const { signIn, signUp, isLoading, error, clearError } = useAuthStore();

    const [mode, setMode]           = useState<Mode>('login');
    const [email, setEmail]         = useState('');
    const [password, setPassword]   = useState('');
    const [fullName, setFullName]   = useState('');
    const [showPass, setShowPass]   = useState(false);

    const handleSubmit = async () => {
        clearError();
        if (mode === 'login') {
            await signIn(email.trim(), password);
            const state = useAuthStore.getState();
            if (state.session) router.replace('/(tabs)');
        } else {
            if (!fullName.trim()) { Alert.alert('Ad Soyad gerekli'); return; }
            await signUp(email.trim(), password, fullName.trim());
            const state = useAuthStore.getState();
            if (state.session) router.replace('/(tabs)');
            else if (!state.error) Alert.alert('✅ Kayıt Başarılı', 'E-postaınızı doğrulayın, ardından giriş yapın.', [{ text: 'Tamam', onPress: () => setMode('login') }]);
        }
    };

    const handleDevBypass = async () => {
        const dummySession = {
            access_token: 'dummy',
            refresh_token: 'dummy',
            expires_in: 3600,
            token_type: 'bearer' as const,
            user: { id: 'dev-user', email: 'test@pera.com' } as any
        };
        useAuthStore.setState({ session: dummySession as any, user: dummySession.user });
    };

    const handleSocialLogin = async (provider: 'google' | 'facebook' | 'apple') => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: 'pet://home', // Replace with your app scheme
                }
            });
            if (error) throw error;
        } catch (e: any) {
            Alert.alert('Hata', e.message);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <LinearGradient colors={['#fdf2f8', '#f8f6f7']} style={StyleSheet.absoluteFill} />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                    {/* Logo */}
                    <View style={styles.logoSection}>
                        <View style={styles.logoCircle}>
                            <MaterialIcons name="auto-awesome" size={36} color="#ad92c9" />
                        </View>
                        <Text style={styles.logoTitle}>Pera Enerji Takvimi</Text>
                        <Text style={styles.logoSub}>Kozmik enerjinle yeniden bağlan</Text>
                    </View>

                    {/* Mode Toggle */}
                    <View style={styles.toggleRow}>
                        <TouchableOpacity
                            style={[styles.toggleBtn, mode === 'login' && styles.toggleBtnActive]}
                            onPress={() => { setMode('login'); clearError(); }}
                        >
                            <Text style={[styles.toggleText, mode === 'login' && styles.toggleTextActive]}>Giriş Yap</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleBtn, mode === 'register' && styles.toggleBtnActive]}
                            onPress={() => { setMode('register'); clearError(); }}
                        >
                            <Text style={[styles.toggleText, mode === 'register' && styles.toggleTextActive]}>Kayıt Ol</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        {mode === 'register' && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Ad Soyad</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Adını ve soyadını gir"
                                    placeholderTextColor="#a1a1aa"
                                    value={fullName}
                                    onChangeText={setFullName}
                                    autoCapitalize="words"
                                />
                            </View>
                        )}

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>E-posta</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="ornek@mail.com"
                                placeholderTextColor="#a1a1aa"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Şifre</Text>
                            <View style={{ position: 'relative' }}>
                                <TextInput
                                    style={[styles.input, { paddingRight: 52 }]}
                                    placeholder="En az 6 karakter"
                                    placeholderTextColor="#a1a1aa"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPass}
                                />
                                <TouchableOpacity
                                    style={styles.eyeBtn}
                                    onPress={() => setShowPass(s => !s)}
                                >
                                    <MaterialIcons name={showPass ? 'visibility-off' : 'visibility'} size={20} color="#71717a" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {error && (
                            <View style={styles.errorBox}>
                                <MaterialIcons name="error-outline" size={16} color="#dc2626" />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.submitBtn}
                            onPress={handleSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitText}>
                                    {mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Social Login Divider */}
                        <View style={styles.dividerRow}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>veya şununla devam et</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Social Buttons */}
                        <View style={styles.socialRow}>
                            <TouchableOpacity 
                                style={styles.socialBtn}
                                onPress={() => handleSocialLogin('google')}
                            >
                                <FontAwesome name="google" size={24} color="#DB4437" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.socialBtn}
                                onPress={() => handleSocialLogin('facebook')}
                            >
                                <FontAwesome name="facebook" size={24} color="#4267B2" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.socialBtn}
                                onPress={() => handleSocialLogin('apple')}
                            >
                                <FontAwesome name="apple" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>

                        {/* Dev bypass */}
                        <TouchableOpacity
                            style={styles.devBtn}
                            onPress={handleDevBypass}
                        >
                            <Text style={styles.devText}>Test Hesabiyla Gec →</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f6f7' },
    logoSection: { alignItems: 'center', paddingTop: 60, paddingBottom: 32 },
    logoCircle: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: '#fdf2f8', borderWidth: 2, borderColor: '#f7e1e8',
        alignItems: 'center', justifyContent: 'center', marginBottom: 16,
        shadowColor: '#ad92c9', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 12, elevation: 6,
    },
    logoTitle: { fontSize: 24, fontWeight: '800', color: '#1f1317', letterSpacing: -0.5 },
    logoSub:   { fontSize: 14, color: '#71717a', marginTop: 6 },
    toggleRow: {
        flexDirection: 'row', marginHorizontal: 24, marginBottom: 24,
        backgroundColor: '#f1f5f9', borderRadius: 16, padding: 4,
    },
    toggleBtn:       { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 13 },
    toggleBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
    toggleText:       { fontSize: 14, fontWeight: '600', color: '#71717a' },
    toggleTextActive: { color: '#1f1317' },
    form: { paddingHorizontal: 24 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
    input: {
        height: 54, borderRadius: 16, borderWidth: 1, borderColor: '#e4e4e7',
        backgroundColor: '#fff', paddingHorizontal: 18,
        fontSize: 15, color: '#111827',
    },
    eyeBtn: { position: 'absolute', right: 16, top: 15 },
    errorBox: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca',
        borderRadius: 12, padding: 12, marginBottom: 16,
    },
    errorText: { fontSize: 13, color: '#dc2626', flex: 1 },
    submitBtn: {
        height: 56, borderRadius: 20, backgroundColor: '#ad92c9',
        alignItems: 'center', justifyContent: 'center', marginTop: 8,
        shadowColor: '#ad92c9', shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
    },
    submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    devBtn:  { alignItems: 'center', paddingVertical: 20 },
    devText: { fontSize: 13, color: '#a1a1aa', fontWeight: '500' },
    dividerRow: {
        flexDirection: 'row', alignItems: 'center', marginVertical: 24, gap: 12,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#e4e4e7' },
    dividerText: { fontSize: 13, color: '#71717a', fontWeight: '500' },
    socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 10 },
    socialBtn: {
        width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#e4e4e7',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
});
