import React, { useState } from 'react';
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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import { useStore } from '../../store/useStore';
import { useZikirStore } from '../../store/useZikirStore';
import { useRouter } from 'expo-router';

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

function InfoRow({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
    return (
        <TouchableOpacity style={[styles.infoRow, isLast && { borderBottomWidth: 0 }]}>
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
    const { userProfile, resetOnboarding } = useStore();
    const { sessions, resetAll: resetZikir } = useZikirStore();
    const { colorScheme, setColorScheme } = useColorScheme();
    const router = useRouter();
    const isDark = colorScheme === 'dark';

    const [notificationsOn, setNotificationsOn] = useState(true);

    const sunSign = getSunSign(userProfile?.birthDate ?? '');
    const totalZikir = Object.values(sessions).reduce((sum, s) => sum + (s.count ?? 0), 0);

    const handleLogout = () => {
        Alert.alert('Oturumu Kapat', 'Çıkmak istediğinize emin misiniz?', [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Çıkış Yap', style: 'destructive', onPress: () => {
                    resetZikir();
                    resetOnboarding();
                }
            },
        ]);
    };

    const toggleTheme = () => setColorScheme(isDark ? 'light' : 'dark');

    return (
        <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
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

                {/* Avatar + Name */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarWrapper}>
                        <View style={styles.avatarRing}>
                            <View style={styles.avatarInner}>
                                <MaterialIcons name="person" size={60} color="#c4b5c9" />
                            </View>
                        </View>
                        <TouchableOpacity style={styles.editBtn}>
                            <MaterialIcons name="edit" size={14} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.profileName, isDark && { color: '#f1f5f9' }]}>
                        {userProfile?.firstName ?? 'Misafir'} {userProfile?.lastName ?? ''}
                    </Text>
                    <View style={styles.badgeRow}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{sunSign} Burcu</Text>
                        </View>
                        <View style={styles.dot} />
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Yükselen Belirsiz</Text>
                        </View>
                    </View>
                    {userProfile?.birthPlace ? (
                        <View style={styles.locationRow}>
                            <MaterialIcons name="location-on" size={14} color="#9ca3af" />
                            <Text style={styles.locationText}>{userProfile.birthPlace}</Text>
                        </View>
                    ) : null}
                </View>

                {/* Premium Plan Card */}
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
                                    <Text style={styles.premiumLabel}>MEVCUT PLAN</Text>
                                    <Text style={styles.premiumTitle}>Premium Enerji Takvimi</Text>
                                </View>
                                <MaterialIcons name="auto-awesome" size={24} color="#f7e1e8" />
                            </View>
                            <Text style={styles.premiumDesc}>
                                Kişiselleştirilmiş günlük analizler ve detaylı doğum haritası yorumları aktif.
                            </Text>
                            <TouchableOpacity style={styles.premiumBtn}>
                                <Text style={styles.premiumBtnText}>Yükselt veya Yönet</Text>
                            </TouchableOpacity>
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

                {/* Bağlı Profiller */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, isDark && { color: '#f1f5f9' }]}>Bağlı Profiller</Text>
                        <TouchableOpacity><Text style={styles.sectionAction}>Düzenle</Text></TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}>
                        {/* Me */}
                        <View style={styles.profileChip}>
                            <View style={[styles.profileAvatar, { borderColor: '#f7e1e8', backgroundColor: '#fdf2f5' }]}>
                                <MaterialIcons name="person" size={26} color="#c4b5c9" />
                            </View>
                            <Text style={[styles.profileChipLabel, isDark && { color: '#f1f5f9' }]}>Sen</Text>
                        </View>
                        {/* Spouse */}
                        <View style={styles.profileChip}>
                            <View style={[styles.profileAvatar, { borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }]}>
                                <MaterialIcons name="person" size={26} color="#9ca3af" />
                            </View>
                            <Text style={[styles.profileChipLabel, isDark && { color: '#f1f5f9' }]}>Eşim</Text>
                        </View>
                        {/* Add */}
                        <View style={styles.profileChip}>
                            <TouchableOpacity style={[styles.profileAvatar, styles.profileAvatarAdd]}>
                                <MaterialIcons name="add" size={24} color="#9ca3af" />
                            </TouchableOpacity>
                            <Text style={[styles.profileChipLabel, isDark && { color: '#f1f5f9' }]}>Yeni Ekle</Text>
                        </View>
                    </ScrollView>
                </View>

                {/* Kişisel Bilgiler */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { paddingHorizontal: 16, marginBottom: 10 }, isDark && { color: '#f1f5f9' }]}>
                        Kişisel Bilgiler
                    </Text>
                    <SectionCard>
                        <InfoRow label="AD SOYAD" value={`${userProfile?.firstName ?? '—'} ${userProfile?.lastName ?? ''}`} />
                        <InfoRow label="DOĞUM TARİHİ" value={userProfile?.birthDate ?? '—'} />
                        <InfoRow label="DOĞUM SAATİ" value={userProfile?.birthTime || '—'} />
                        <InfoRow label="DOĞUM YERİ" value={userProfile?.birthPlace ?? '—'} isLast />
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
        </SafeAreaView>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container:     { flex: 1, backgroundColor: '#f8f6f7' },
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
        width: 128, height: 128, borderRadius: 64,
        borderWidth: 4, borderColor: '#f7e1e8',
        padding: 4, overflow: 'hidden',
        backgroundColor: '#fff',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12, shadowRadius: 12, elevation: 6,
    },
    avatarInner: {
        flex: 1, borderRadius: 60, backgroundColor: '#fdf2f5',
        alignItems: 'center', justifyContent: 'center',
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
    premiumLabel:  { fontSize: 10, fontWeight: '600', color: '#9ca3af', letterSpacing: 2, marginBottom: 4 },
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
});
