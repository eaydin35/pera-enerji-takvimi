import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { signInWithWooCommerce } from '../utils/woocommerce-auth';

interface Props {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function WooCommerceLoginModal({ visible, onClose, onSuccess }: Props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Hata', 'Lütfen e-posta ve şifrenizi girin.');
            return;
        }

        setIsLoading(true);
        try {
            const success = await signInWithWooCommerce(email.trim(), password);
            if (success) {
                Alert.alert('Başarılı', 'Stones of Pera hesabınızla başarıyla giriş yaptınız.', [
                    { text: 'Tamam', onPress: onSuccess }
                ]);
            } else {
                Alert.alert('Hata', 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
            }
        } catch (error: any) {
            Alert.alert('Hata', error.message || 'Bağlantı sorunu oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.container}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>Stones of Pera Girişi</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <MaterialIcons name="close" size={24} color="#71717a" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.subtitle}>
                        stonesofpera.com hesabınızla giriş yaparak geçmiş bilgilerinizi ve siparişlerinizi Pera uygulamasına bağlayın.
                    </Text>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>E-posta</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Stones of Pera E-posta Adresi"
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
                                    placeholder="Stones of Pera Şifresi"
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

                        <TouchableOpacity
                            style={styles.submitBtn}
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitText}>Giriş Yap ve Bağla</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1f1317',
    },
    closeBtn: {
        padding: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#71717a',
        marginBottom: 24,
        lineHeight: 20,
    },
    form: {
        marginBottom: 8,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        height: 54,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e4e4e7',
        backgroundColor: '#f9fafb',
        paddingHorizontal: 18,
        fontSize: 15,
        color: '#111827',
    },
    eyeBtn: {
        position: 'absolute',
        right: 16,
        top: 15,
    },
    submitBtn: {
        height: 56,
        borderRadius: 20,
        backgroundColor: '#ad92c9',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        shadowColor: '#ad92c9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});
