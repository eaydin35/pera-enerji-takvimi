import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Image,
    StyleSheet,
    Switch,
    Alert,
    Linking,
    ActivityIndicator,
    Modal,
    TextInput,
} from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import { useStore } from '../../store/useStore';
import { useProfileStore } from '../../store/profileStore';
import { useZikirStore } from '../../store/useZikirStore';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../utils/supabase';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { uploadAvatar } from '../../utils/storage';
import BirthDataEditorModal from '../../components/BirthDataEditorModal';
import { calculateChart, getZodiacSign } from '../../utils/astrology';

// ─── Helper ───────────────────────────────────────────────────────────────────

function getSunSign(birthDate: string): string {
    if (!birthDate) return 'Bilinmiyor';
    const [day, month] = birthDate.split('.').map(Number);
    if (!day || !month) return 'Bilinmiyor';
    const signs = [
        { name: 'Oğlak',   end: [19, 1]  }, { name: 'Kova',      end: [18, 2]  },
        { name: 'Balık',   end: [20, 3]  }, { name: 'Koç',       end: [19, 4]  },
        { name: 'Boğa',   end: [20, 5]  }, { name: 'İkizler',   end: [20, 6]  },
        { name: 'Yengeç', end: [22, 7]  }, { name: 'Aslan',     end: [22, 8]  },
        { name: 'Başak',  end: [22, 9]  }, { name: 'Terazi',    end: [22, 10] },
        { name: 'Akrep',  end: [21, 11] }, { name: 'Yay',       end: [21, 12] },
        { name: 'Oğlak',  end: [31, 12] },
    ];
    for (const s of signs) {
        if (month < s.end[1] || (month === s.end[1] && day <= s.end[0])) return s.name;
    }
    return 'Oğlak';
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionCard({ children }: { children: React.ReactNode }) {
    return (
        <View style={styles.sectionCard}>{children}</View>
    );
}

function InfoRow({ label, value, isLast, onPress }: { label: string; value: string; isLast?: boolean; onPress?: () => void; }) {
    return (
        <TouchableOpacity 
            style={[styles.infoRow, isLast && { borderBottomWidth: 0 }]}
            onPress={onPress}
            disabled={!onPress}
        >
            <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color="#d1d5db" />
        </TouchableOpacity>
    );
}

function SettingsRow({
    icon, label, right, isLast,
}: {
    icon: string; label: string; right: React.ReactNode; isLast?: boolean;
}) {
    return (
        <View style={[styles.settingsRow, isLast && { borderBottomWidth: 0 }]}>
            <View style={styles.settingsRowLeft}>
                <View style={styles.settingsIconBox}>
                    <MaterialIcons name={icon as any} size={20} color="#374151" />
                </View>
                <Text style={styles.settingsLabel}>{label}</Text>
            </View>
            {right}
        </View>
    );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ProfileScreen() {
    const { tokens, setAvatarUrl: setStoreAvatar, resetOnboarding } = useStore();
    const { profile: userProfile, isGuest } = useProfileStore();
    const { sessions, resetAll: resetZikir } = useZikirStore();



    const { colorScheme, setColorScheme } = useColorScheme();
    const { user } = useAuthStore();
    const router = useRouter();
    const isDark = colorScheme === 'dark';

    const [notificationsOn, setNotificationsOn] = useState(true);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [birthEditorVisible, setBirthEditorVisible] = useState(false);
    const [nameEditorVisible, setNameEditorVisible] = useState(false);
    const [editFirstName, setEditFirstName] = useState(userProfile?.firstName ?? '');
    const [editLastName, setEditLastName] = useState(userProfile?.lastName ?? '');

    // Reset name edit state whenever it opens or profile changes
    useEffect(() => {
        setEditFirstName(userProfile?.firstName ?? '');
        setEditLastName(userProfile?.lastName ?? '');
    }, [userProfile?.firstName, userProfile?.lastName, nameEditorVisible]);

    const sunSign = getSunSign(userProfile?.birthDate ?? '');
    
    const ascendantSign = React.useMemo(() => {
        if (userProfile?.birthDate && userProfile?.birthTime && userProfile?.birthLat && userProfile?.birthLng) {
            try {
                const chart = calculateChart(userProfile.birthDate, userProfile.birthTime, userProfile.birthLat, userProfile.birthLng);
                return getZodiacSign(chart.ascendant).sign + ' Yükselen';
            } catch (e) {
                return 'Yükselen Belirsiz';
            }
        }
        return 'Yükselen Belirsiz';
    }, [userProfile?.birthDate, userProfile?.birthTime, userProfile?.birthLat, userProfile?.birthLng]);

    const totalZikir = Object.values(sessions).reduce((sum, s) => sum + (s.count ?? 0), 0);

    // Load saved avatar on mount
    useEffect(() => {
        if (userProfile?.avatarUrl) {
            setAvatarUrl(userProfile.avatarUrl);
        }
    }, [userProfile?.avatarUrl]);

    // Upload photo to Supabase Storage
    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için galeri erişimine izin verin.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets.length > 0) {
            const localUri = result.assets[0].uri;
            
            if (user) {
                setUploadingPhoto(true);
                try {
                    const uploadedUrl = await uploadAvatar(localUri, user.id);
                    
                    if (uploadedUrl) {
                        // Update local state and store
                        setAvatarUrl(uploadedUrl);
                        useProfileStore.getState().updateProfile({ avatarUrl: uploadedUrl });
                        setStoreAvatar(uploadedUrl);

                        // Update Supabase profiles table
                        const { error: updateError } = await supabase
                            .from('profiles')
                            .update({ avatar_url: uploadedUrl })
                            .eq('id', user.id);

                        if (!updateError) {
                            Alert.alert('✨ Başarılı', 'Profil fotoğrafın güncellendi!');
                        } else {
                            console.error('[Profile] Database update error:', updateError);
                            Alert.alert('Hata', 'Profil resmi veritabanına kaydedilemedi: ' + updateError.message);
                        }
                    } else {
                        Alert.alert('Hata', 'Fotoğraf yüklenemedi. Supabase Storage "avatars" bucket ayarlarını ve izinlerini kontrol edin.');
                    }
                } catch (err) {
                    Alert.alert('Hata', 'Beklenmeyen bir hata oluştu.');
                } finally {
                    setUploadingPhoto(false);
                }
            } else {
                setAvatarUrl(localUri);
                useProfileStore.getState().updateProfile({ avatarUrl: localUri });
                setStoreAvatar(localUri);
            }
        }
    };

    const handleSaveName = async () => {
        if (!editFirstName.trim()) {
            Alert.alert('Eksik Bilgi', 'Lütfen adınızı girin.');
            return;
        }
        try {
            await useProfileStore.getState().updateProfile({ 
                firstName: editFirstName.trim(), 
                lastName: editLastName.trim() 
            });
            setNameEditorVisible(false);
        } catch (e: any) {
            Alert.alert('Hata', 'İsim güncellenirken bir hata oluştu: ' + e.message);
        }
    };

    const handleLogout = () => {
        Alert.alert('Oturumu Kapat', 'Çıkmak istediğinize emin misiniz?', [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Çıkış Yap', style: 'destructive', onPress: async () => {
                    resetZikir();
                    resetOnboarding();
                    useProfileStore.getState().clearProfile();
                    await useAuthStore.getState().signOut();
                    router.replace('/onboarding');
                }
            },
        ]);
    };

    const toggleTheme = () => setColorScheme(isDark ? 'light' : 'dark');

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerBtn}>
                    <MaterialIcons name="arrow-back" size={22} color={isDark ? '#f1f5f9' : '#374151'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, isDark && { color: '#f1f5f9' }]}>Profil</Text>
                <TouchableOpacity style={styles.headerBtn}>
                    <MaterialIcons name="settings" size={22} color={isDark ? '#f1f5f9' : '#374151'} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

                {/* Header (Avatar & Name) */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarWrapper}>
                        <View style={styles.avatarRing}>
                            <View style={styles.avatarInner}>
                                {avatarUrl ? (
                                    <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
                                ) : (
                                    <MaterialIcons name="person" size={60} color="#c4b5c9" />
                                )}
                            </View>
                        </View>
                        <TouchableOpacity style={styles.editBtn} onPress={handlePickImage} disabled={uploadingPhoto}>
                            {uploadingPhoto ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <MaterialIcons name="edit" size={14} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.profileName, isDark && { color: '#f1f5f9' }]}>
                        {userProfile?.firstName ?? 'Misafir'} {userProfile?.lastName ?? ''}
                    </Text>
                    
                    {isGuest && (
                        <View style={styles.guestBadgeContainer}>
                            <View style={styles.guestBadge}>
                                <Text style={styles.guestBadgeText}>Misafir Kullanıcı</Text>
                            </View>
                            <TouchableOpacity 
                                style={styles.registerBtn}
                                onPress={() => router.push('/auth')}
                            >
                                <MaterialIcons name="person-add" size={16} color="#fff" />
                                <Text style={styles.registerBtnText}>Hemen Üye Ol</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    <View style={styles.badgeRow}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{sunSign} Burcu</Text>
                        </View>
                        <View style={styles.dot} />
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{ascendantSign}</Text>
                        </View>
                    </View>
                    {userProfile?.birthPlace ? (
                        <View style={styles.locationRow}>
                            <MaterialIcons name="location-on" size={14} color="#9ca3af" />
                            <Text style={styles.locationText}>{userProfile.birthPlace}</Text>
                        </View>
                    ) : null}
                </View>

                {/* Jeton Cüzdanı (Kozmik Cüzdan) */}
                <View style={styles.section}>
                    <LinearGradient
                        colors={['#1e1127', '#2d1a3e']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={styles.premiumCard}
                    >
                        <View style={styles.premiumBlob} />
                        <View style={{ zIndex: 1 }}>
                            <View style={styles.premiumHeader}>
                                <View>
                                    <View style={styles.tokenRow}>
                                        <MaterialIcons name="stars" size={18} color="#f7e1e8" />
                                        <Text style={styles.premiumLabel}>
                                            {`${tokens} YILDIZIN VAR`}
                                        </Text>
                                    </View>
                                    <Text style={styles.premiumTitle}>
                                        Kozmik Cüzdan
                                    </Text>
                                </View>
                                <MaterialIcons name="auto-awesome" size={26} color="#f7e1e8" />
                            </View>
                            <Text style={styles.premiumDesc}>
                                AI Danışman Sema ile yapacağın her soru 1 yıldız, harita güncellemeleri 3 yıldız harcamaktadır.
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TouchableOpacity 
                                    style={[styles.premiumBtn, { flex: 1 }]}
                                    onPress={() => router.push('/paywall')}
                                >
                                    <Text style={styles.premiumBtnText}>Yıldız Al / Abone Ol</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </LinearGradient>
                </View>



                {/* Stats */}
                <View style={styles.section}>
                    <View style={styles.statsRow}>
                        <View style={[styles.statCard, isDark && styles.statCardDark]}>
                            <Text style={[styles.statNum, isDark && { color: '#f1f5f9' }]}>{totalZikir.toLocaleString('tr-TR')}</Text>
                            <Text style={styles.statLabel}>Toplam Zikir</Text>
                        </View>
                        <View style={[styles.statCard, isDark && styles.statCardDark]}>
                            <Text style={[styles.statNum, isDark && { color: '#f1f5f9' }]}>{Object.keys(sessions).length}</Text>
                            <Text style={styles.statLabel}>Esma Türü</Text>
                        </View>
                    </View>
                </View>


                {/* Kişisel Bilgiler */}

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { paddingHorizontal: 16, marginBottom: 10 }, isDark && { color: '#f1f5f9' }]}>
                        Kişisel Bilgiler
                    </Text>
                    <SectionCard>
                        <InfoRow 
                            label="AD SOYAD" 
                            value={`${userProfile?.firstName ?? '—'} ${userProfile?.lastName ?? ''}`} 
                            onPress={() => setNameEditorVisible(true)} 
                        />
                        <InfoRow 
                            label="E-POSTA" 
                            value={(userProfile as any)?.email ?? '—'} 
                            onPress={() => Alert.alert('Bilgi', 'Güvenliğiniz için hesap E-posta değişimleri destek paneli üzerinden yürütülmektedir.')} 
                        />
                        <InfoRow 
                            label="DOĞUM TARİHİ" 
                            value={userProfile?.birthDate ?? '—'} 
                            onPress={() => setBirthEditorVisible(true)} 
                        />
                        <InfoRow 
                            label="DOĞUM SAATİ" 
                            value={userProfile?.birthTime || '—'} 
                            onPress={() => setBirthEditorVisible(true)} 
                        />
                        <InfoRow 
                            label="DOĞUM YERİ" 
                            value={userProfile?.birthPlace ?? '—'} 
                            onPress={() => setBirthEditorVisible(true)} 
                        />
                        <TouchableOpacity 
                            style={styles.editBirthDataBtn}
                            onPress={() => setBirthEditorVisible(true)}
                        >
                            <Text style={styles.editBirthDataBtnText}>
                                {(userProfile && !('isGuest' in userProfile)) ? "Doğum Bilgilerimi Güncelle (3 Yıldız)" : "Doğum Bilgilerini Gir"}
                            </Text>
                            <MaterialIcons name="edit" size={16} color="#ad92c9" />
                        </TouchableOpacity>
                    </SectionCard>
                </View>

                {/* Uygulama Ayarları */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { paddingHorizontal: 16, marginBottom: 10 }, isDark && { color: '#f1f5f9' }]}>
                        Uygulama Ayarları
                    </Text>
                    <SectionCard>
                        <SettingsRow
                            icon="notifications"
                            label="Bildirimler"
                            right={
                                <Switch
                                    value={notificationsOn}
                                    onValueChange={setNotificationsOn}
                                    trackColor={{ false: '#e5e7eb', true: '#f7e1e8' }}
                                    thumbColor={notificationsOn ? '#ad92c9' : '#9ca3af'}
                                />
                            }
                        />
                        <SettingsRow
                            icon="dark-mode"
                            label="Görünüm"
                            right={
                                <TouchableOpacity onPress={toggleTheme}>
                                    <Text style={styles.settingsValue}>{isDark ? 'Koyu Tema' : 'Açık Tema'}</Text>
                                </TouchableOpacity>
                            }
                        />
                        <SettingsRow
                            icon="language"
                            label="Dil"
                            right={<Text style={styles.settingsValue}>Türkçe</Text>}
                            isLast
                        />
                    </SectionCard>
                </View>

                {/* Destek & Yasal */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { paddingHorizontal: 16, marginBottom: 10 }, isDark && { color: '#f1f5f9' }]}>
                        Destek & Yasal
                    </Text>
                    <SectionCard>
                        <TouchableOpacity style={styles.supportRow}>
                            <MaterialIcons name="help-center" size={20} color="#9ca3af" />
                            <Text style={[styles.supportLabel, isDark && { color: '#f1f5f9' }]}>Nasıl Çalışır?</Text>
                            <MaterialIcons name="chevron-right" size={20} color="#d1d5db" style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.supportRow}
                            onPress={() => Linking.openURL('https://pera-enerji-takvimi.com/gizlilik')}>
                            <MaterialIcons name="verified-user" size={20} color="#9ca3af" />
                            <Text style={[styles.supportLabel, isDark && { color: '#f1f5f9' }]}>Gizlilik Politikası</Text>
                            <MaterialIcons name="chevron-right" size={20} color="#d1d5db" style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.supportRow, { borderBottomWidth: 0 }]}>
                            <MaterialIcons name="support-agent" size={20} color="#9ca3af" />
                            <Text style={[styles.supportLabel, isDark && { color: '#f1f5f9' }]}>Destek Ekibiyle İletişim</Text>
                            <MaterialIcons name="chevron-right" size={20} color="#d1d5db" style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>
                    </SectionCard>
                </View>

                {/* Oturumu Kapat */}
                <View style={[styles.section, { marginTop: 8 }]}>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <MaterialIcons name="logout" size={20} color="#dc2626" />
                        <Text style={styles.logoutText}>Oturumu Kapat</Text>
                    </TouchableOpacity>
                    <Text style={styles.versionText}>PET v1.0.0 • Pera Enerji Takvimi</Text>
                </View>

            </ScrollView>

            <BirthDataEditorModal 
                visible={birthEditorVisible} 
                onClose={() => setBirthEditorVisible(false)} 
            />

            {/* Name Editor Modal */}
            <Modal visible={nameEditorVisible} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                    <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 24, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8 }}>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 }}>Ad ve Soyadını Güncelle</Text>
                        
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Ad</Text>
                        <TextInput 
                            style={{ height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#d1d5db', paddingHorizontal: 16, fontSize: 15, marginBottom: 16, color: '#111827' }}
                            value={editFirstName}
                            onChangeText={setEditFirstName}
                            placeholder="Adını gir"
                            placeholderTextColor="#9ca3af"
                        />

                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Soyad</Text>
                        <TextInput 
                            style={{ height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#d1d5db', paddingHorizontal: 16, fontSize: 15, marginBottom: 24, color: '#111827' }}
                            value={editLastName}
                            onChangeText={setEditLastName}
                            placeholder="Soyadını gir"
                            placeholderTextColor="#9ca3af"
                        />

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity onPress={() => setNameEditorVisible(false)} style={{ flex: 1, height: 50, borderRadius: 12, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151' }}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSaveName} style={{ flex: 1, height: 50, borderRadius: 12, backgroundColor: '#ad92c9', alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Kaydet</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
    containerDark: { backgroundColor: '#1f1317' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12,
    },
    headerBtn: {
        width: 40, height: 40, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },

    // Avatar
    avatarSection: { alignItems: 'center', paddingVertical: 20 },
    avatarWrapper: { position: 'relative', marginBottom: 12 },
    avatarRing: {
        width: 130, height: 130, borderRadius: 65,
        borderWidth: 2, borderColor: 'rgba(247,225,232,0.8)',
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#fff',
    },
    avatarInner: {
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarImg: {
        width: '100%', height: '100%', borderRadius: 60,
    },
    editBtn: {
        position: 'absolute', bottom: 4, right: 4,
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: '#1f2937',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: '#f8f6f7',
    },
    profileName:  { fontSize: 24, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
    badgeRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    badge: {
        paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999,
        backgroundColor: 'rgba(247,225,232,0.6)',
    },
    badgeText:    { fontSize: 12, fontWeight: '600', color: '#374151' },
    dot:          { width: 4, height: 4, borderRadius: 2, backgroundColor: '#d1d5db' },
    locationRow:  { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 8 },
    locationText: { fontSize: 13, color: '#9ca3af' },

    // Section
    section:       { marginBottom: 8 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 },
    sectionTitle:  { fontSize: 16, fontWeight: '700', color: '#111827' },
    sectionAction: { fontSize: 13, fontWeight: '600', color: '#9ca3af' },

    // Stats
    statsRow:   { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
    statCard: {
        flex: 1, backgroundColor: '#fff', borderRadius: 20,
        padding: 16, alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    statCardDark: { backgroundColor: '#261933' },
    statNum:   { fontSize: 28, fontWeight: '800', color: '#111827' },
    statLabel: { fontSize: 12, color: '#9ca3af', marginTop: 2 },

    // Premium Card
    premiumCard: {
        marginHorizontal: 16, borderRadius: 20, padding: 20,
        overflow: 'hidden', position: 'relative',
    },
    premiumBlob: {
        position: 'absolute', top: -20, right: -20,
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: 'rgba(247,225,232,0.15)',
    },
    premiumHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    tokenRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
    premiumLabel:  { fontSize: 10, fontWeight: '600', color: '#9ca3af', letterSpacing: 1, marginBottom: 3 },
    premiumTitle:  { fontSize: 18, fontWeight: '700', color: '#f7e1e8' },

    premiumDesc:   { fontSize: 13, color: '#94a3b8', lineHeight: 18, marginBottom: 16 },
    premiumBtn: {
        backgroundColor: '#f7e1e8', borderRadius: 10,
        paddingVertical: 14, alignItems: 'center',
    },
    premiumBtnText: { fontSize: 14, fontWeight: '700', color: '#1f1317' },

    // Connected profiles
    profileChip:    { alignItems: 'center', gap: 6 },
    profileAvatar: {
        width: 56, height: 56, borderRadius: 28,
        borderWidth: 2, alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
    },
    profileAvatarAdd: { borderColor: '#d1d5db', borderStyle: 'dashed', backgroundColor: 'transparent' },
    profileChipLabel: { fontSize: 11, fontWeight: '500', color: '#374151' },

    // Section card
    sectionCard: {
        marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    },
    // Info rows
    infoRow: {
        flexDirection: 'row', alignItems: 'center',
        padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
    },
    infoLabel: { fontSize: 10, fontWeight: '600', color: '#9ca3af', letterSpacing: 1, marginBottom: 3 },
    infoValue: { fontSize: 15, fontWeight: '500', color: '#111827' },
    editBirthDataBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#f3f4f6', backgroundColor: '#faf5ff'
    },
    editBirthDataBtnText: { fontSize: 13, fontWeight: '600', color: '#ad92c9' },
    // Settings rows
    settingsRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
    },
    settingsRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    settingsIconBox: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: 'rgba(247,225,232,0.5)', alignItems: 'center', justifyContent: 'center',
    },
    settingsLabel: { fontSize: 15, fontWeight: '500', color: '#111827' },
    settingsValue: { fontSize: 13, fontWeight: '600', color: '#9ca3af' },
    // Support rows
    supportRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        padding: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
    },
    supportLabel: { fontSize: 15, fontWeight: '500', color: '#111827' },
    // Logout
    logoutBtn: {
        marginHorizontal: 16, backgroundColor: '#fef2f2',
        borderRadius: 16, paddingVertical: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    logoutText:   { fontSize: 15, fontWeight: '700', color: '#dc2626' },
    versionText:  { textAlign: 'center', fontSize: 11, color: '#9ca3af', marginTop: 16 },
    userName: { fontSize: 24, fontWeight: '700', color: '#111827' },
    guestBadgeContainer: { alignItems: 'center', marginTop: 8, gap: 12 },
    guestBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    guestBadgeText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
    registerBtn: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#ad92c9',
        paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24, gap: 6,
        shadowColor: '#ad92c9', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    registerBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
