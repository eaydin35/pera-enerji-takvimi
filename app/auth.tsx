import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator, Alert, StatusBar, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/profileStore';
import { useSocialAuth, type SocialProvider } from '../hooks/useSocialAuth';
import { supabase } from '../utils/supabase';
import WooCommerceLoginModal from '../components/WooCommerceLoginModal';

type Mode = 'login' | 'register';

export default function AuthScreen() {
    const router = useRouter();
    const { signIn, signUp, resetPassword, isLoading, error, clearError } = useAuthStore();

    const [mode, setMode]           = useState<Mode>('login');
    const [email, setEmail]         = useState('');
    const [password, setPassword]   = useState('');
    const [fullName, setFullName]   = useState('');
    const [showPass, setShowPass]   = useState(false);
    const [wooModalVisible, setWooModalVisible] = useState(false);
    const [resetModalVisible, setResetModalVisible] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);

    const handleSubmit = async () => {
        clearError();
        if (mode === 'login') {
            await signIn(email.trim(), password);
            const state = useAuthStore.getState();
            if (state.session) {
                // Link any guest data map to the newly logged in user
                await useProfileStore.getState().migrateToRegistered();
                router.replace('/(tabs)');
            } else if (state.error) {
                Alert.alert('Hata', state.error);
            }
        } else {
            if (!fullName.trim()) { Alert.alert('Ad Soyad gerekli'); return; }
            await signUp(email.trim(), password, fullName.trim());
            const state = useAuthStore.getState();
            if (state.session) {
                await useProfileStore.getState().migrateToRegistered();
                router.replace('/(tabs)');
            } else if (state.error) {
                Alert.alert('Hata', state.error);
            } else {
                Alert.alert('✅ Kayıt Başarılı', 'E-postaınızı doğrulayın, ardından giriş yapın.', [{ text: 'Tamam', onPress: () => setMode('login') }]);
            }
        }
    };

    const { signInWithSocial, isSocialLoading } = useSocialAuth();

    const handleSocialLogin = async (provider: SocialProvider) => {
        await signInWithSocial(provider);
    };

    const handleWooCommerceSuccess = () => {
        setWooModalVisible(false);
        router.replace('/(tabs)');
    };

    const handleResetPassword = async () => {
        if (!resetEmail.trim()) {
            Alert.alert('Uyarı', 'Lütfen e-posta adresinizi girin.');
            return;
        }
        setResetLoading(true);
        const result = await resetPassword(resetEmail.trim());
        setResetLoading(false);
        if (result.success) {
            Alert.alert('✅ Başarılı', result.message, [
                { text: 'Tamam', onPress: () => { setResetModalVisible(false); setResetEmail(''); } }
            ]);
        } else {
            Alert.alert('Hata', result.message);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#ffffff' }]} />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: '#ffffff' }}>
                <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: '#ffffff', paddingTop: 10 }} keyboardShouldPersistTaps="handled">
                    {/* Back Button */}
                    <TouchableOpacity 
                        style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, marginTop: 10 }}
                        onPress={() => router.replace('/onboarding')}
                    >
                        <MaterialIcons name="arrow-back-ios" size={18} color="#ad92c9" />
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#ad92c9', marginLeft: 4 }}>Geri Dön</Text>
                    </TouchableOpacity>

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

                        {/* Şifremi Unuttum Link — only in login mode */}
                        {mode === 'login' && (
                            <TouchableOpacity
                                style={{ alignSelf: 'flex-end', marginBottom: 12, marginTop: -4 }}
                                onPress={() => { setResetEmail(email); setResetModalVisible(true); }}
                            >
                                <Text style={{ fontSize: 13, color: '#ad92c9', fontWeight: '600' }}>Şifremi Unuttum</Text>
                            </TouchableOpacity>
                        )}

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
                                disabled={isSocialLoading}
                            >
                                <FontAwesome name="google" size={24} color="#DB4437" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.socialBtn}
                                onPress={() => handleSocialLogin('instagram')}
                                disabled={isSocialLoading}
                            >
                                <FontAwesome name="instagram" size={26} color="#E4405F" />
                            </TouchableOpacity>
                            {Platform.OS === 'ios' && (
                                <TouchableOpacity 
                                    style={styles.socialBtn}
                                    onPress={() => handleSocialLogin('apple')}
                                    disabled={isSocialLoading}
                                >
                                    <FontAwesome name="apple" size={24} color="#000" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.wooBtn, { opacity: 0.5 }]}
                            onPress={() => {}}
                            disabled={true}
                        >
                            <MaterialIcons name="storefront" size={20} color="#ad92c9" />
                            <Text style={styles.wooBtnText}>Stones of Pera ile Giriş (Yakında)</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <WooCommerceLoginModal 
                visible={wooModalVisible}
                onClose={() => setWooModalVisible(false)}
                onSuccess={handleWooCommerceSuccess}
            />

            {/* ─── Şifre Sıfırlama Modal ─── */}
            <Modal
                visible={resetModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setResetModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={styles.modalTitle}>Şifremi Sıfırla</Text>
                            <TouchableOpacity onPress={() => setResetModalVisible(false)}>
                                <MaterialIcons name="close" size={24} color="#71717a" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalDesc}>
                            E-posta adresinizi girin. Size şifre sıfırlama linki göndereceğiz.
                        </Text>
                        <TextInput
                            style={[styles.input, { marginBottom: 20 }]}
                            placeholder="ornek@mail.com"
                            placeholderTextColor="#a1a1aa"
                            value={resetEmail}
                            onChangeText={setResetEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoFocus
                        />
                        <TouchableOpacity
                            style={[styles.submitBtn, resetLoading && { opacity: 0.7 }]}
                            onPress={handleResetPassword}
                            disabled={resetLoading}
                        >
                            {resetLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitText}>Sıfırlama Linki Gönder</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
    logoSection: { alignItems: 'center', paddingTop: 60, paddingBottom: 32 },
    logoCircle: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e4e4e7',
        alignItems: 'center', justifyContent: 'center', marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 10, elevation: 4,
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
    wooBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, height: 48, borderRadius: 16,
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#ad92c9',
        marginHorizontal: 20, marginBottom: 16,
    },
    wooBtnText: {
        fontSize: 14, fontWeight: '600', color: '#ad92c9',
    },
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', alignItems: 'center', padding: 24,
    },
    modalCard: {
        backgroundColor: '#fff', borderRadius: 24, padding: 28,
        width: '100%', maxWidth: 400,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15, shadowRadius: 24, elevation: 12,
    },
    modalTitle: {
        fontSize: 20, fontWeight: '700', color: '#1f1317',
    },
    modalDesc: {
        fontSize: 14, color: '#71717a', lineHeight: 20, marginBottom: 20,
    },
});
