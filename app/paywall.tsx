import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { getOfferings, purchasePackage, restorePurchases } from '../utils/purchases';
import { PurchasesPackage } from 'react-native-purchases';
import { addTokens } from '../utils/profile-service';
import { useAuthStore } from '../store/useAuthStore';
import { useStore } from '../store/useStore';
import { useProfileStore } from '../store/profileStore';
import { getCustomerInfo } from '../utils/purchases';

export default function PaywallScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { profile } = useProfileStore();

    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
    const [hasActiveSub, setHasActiveSub] = useState(false);

    useEffect(() => {
        loadPackages();
    }, []);

    const loadPackages = async () => {
        setIsLoading(true);
        const packs = await getOfferings();
        setPackages(packs);
        
        const customerInfo = await getCustomerInfo();
        if (customerInfo && Object.keys(customerInfo.entitlements.active).length > 0) {
             setHasActiveSub(true);
        }

        if (packs.length > 0) {
            // Auto-select yearly if available to push the anchor pricing
            const yearly = packs.find(p => p.packageType === 'ANNUAL');
            setSelectedPackage(yearly || packs[0]);
        }
        setIsLoading(false);
    };

    const handlePurchase = async () => {
        if (!selectedPackage) return;
        if (!user) {
            Alert.alert('Giriş Gerekli', 'Satın alma işlemi için giriş yapmalısınız.');
            return;
        }

        if (selectedPackage && selectedPackage.identifier === 'dummy_stars') {
            // Simulate consumable purchase logic for test mode until RC is strictly wired
            setIsPurchasing(true);
            setTimeout(async () => {
                const currentTokens = profile?.tokens || 0;
                const added = await addTokens(user.id, 100, currentTokens);
                if (added) {
                    useStore.getState().setTokens(currentTokens + 100);
                    useProfileStore.getState().initialize();
                    Alert.alert('🎉 Tebrikler!', 'Satın alım başarılı! 100 Kozmik Yıldız hesabınıza aktarıldı.');
                    router.back();
                }
                setIsPurchasing(false);
            }, 1000);
            return;
        }

        setIsPurchasing(true);
        const customerInfo = await purchasePackage(selectedPackage);
        setIsPurchasing(false);

        if (customerInfo) {
            // Purchase Successful!
            // According to our logic: every active subscription yields 100 tokens as a top-up
            const currentTokens = profile?.tokens || 0;
            const added = await addTokens(user.id, 100, currentTokens);
            if (added) {
                useStore.getState().setTokens(currentTokens + 100);
                useProfileStore.getState().initialize(); // Reload DB profile
                Alert.alert('🎉 Tebrikler!', 'Abonelik başlatıldı ve 100 Yıldız hesabınıza yüklendi.');
                router.back();
            } else {
                Alert.alert('Hata', 'Satın alım başarılı ancak yıldızlar yüklenemedi. Lütfen destek ile iletişime geçin.');
            }
        }
    };

    const handleRestore = async () => {
        setIsPurchasing(true);
        const customerInfo = await restorePurchases();
        setIsPurchasing(false);
        if (customerInfo && customerInfo.entitlements.active['Premium']) {
            Alert.alert('Başarılı', 'Satın alımlarınız geri yüklendi.');
            router.back();
        } else {
            Alert.alert('Bilgi', 'Aboneliğiniz bulunamadı.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#1a1025', '#0f0a18']}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Glowing Orbs */}
            <View style={[styles.orb, { top: -100, left: -100, backgroundColor: 'rgba(173,146,201,0.15)' }]} />
            <View style={[styles.orb, { bottom: -100, right: -100, backgroundColor: 'rgba(76,29,149,0.2)' }]} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                    <MaterialIcons name="close" size={24} color="#f7e1e8" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleRestore} style={styles.restoreBtn}>
                    <Text style={styles.restoreText}>Geri Yükle</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Visual Hook */}
                <View style={styles.heroSection}>
                    <MaterialIcons name="nights-stay" size={48} color="#ad92c9" style={{ marginBottom: 16 }} />
                    <Text style={styles.title}>Yıldızların Sesi Kesildi...</Text>
                    <Text style={styles.subtitle}>
                        Sana özel astrolojik analizleri almaya ve evrensel takvimde yolunu bulmaya devam etmek için rehberliğini aktifleştir.
                    </Text>
                </View>

                {/* Features Box */}
                <View style={styles.featuresBox}>
                    <Text style={styles.featuresHeading}>Neden Bunu Almalısınız?</Text>
                    <View style={styles.featureItem}>
                        <MaterialIcons name="auto-awesome" size={20} color="#ad92c9" />
                        <Text style={styles.featureText}>Kozmik yapay zeka asistanı Sema, sadece genel burç yorumu yapmaz; anlık gökyüzü hareketlerini doğrudan sana özel doğum haritanla birleştirerek yıl boyu 7/24 baş ucu danışmanın olur.</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <MaterialIcons name="notifications-active" size={20} color="#ad92c9" />
                        <Text style={styles.featureText}>Beklenmedik Merkür Retro'larından, hayati Satürn döngülerine kadar tüm önemli astrolojik ve yaşamsal olayları kaçırmadan anlık bildirimlerle takip et.</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <MaterialIcons name="stars" size={20} color="#ad92c9" />
                        <Text style={styles.featureText}>Hesabına tanımlanan 100 Yıldız ile; ilişki, kariyer, finans veya sağlığın üzerine dilediğin an derinlemesine içgörüler al, haritanı yeniden yorumlat.</Text>
                    </View>
                </View>

                {/* Packages */}
                <View style={styles.packagesContainer}>
                    {isLoading ? (
                        <ActivityIndicator color="#ad92c9" size="large" />
                    ) : (
                        <>
                            {packages.slice(0, 2).map((pack) => {
                                const isYearly = pack.packageType === 'ANNUAL' || pack.identifier.toLowerCase().includes('annual') || pack.identifier.toLowerCase().includes('yearly');
                                // Force deselect if active subscriber to prevent sub purchases
                                const isSelected = !hasActiveSub && selectedPackage?.identifier === pack.identifier;
                                
                                const displayPrice = isYearly ? "6.999,99 ₺" : "799,99 ₺";
                                const displayTitle = isYearly ? "Yıllık Pera Rehberliği" : "Aylık Pera Yolculuğu";

                                return (
                                    <TouchableOpacity
                                        key={pack.identifier}
                                        style={[
                                            styles.packageCard, 
                                            isSelected && styles.packageCardSelected,
                                            hasActiveSub && { opacity: 0.4, borderColor: 'rgba(255,255,255,0.05)' } // Block out if sub is active
                                        ]}
                                        disabled={hasActiveSub}
                                        onPress={() => setSelectedPackage(pack)}
                                    >
                                        {isYearly && !hasActiveSub && (
                                            <View style={styles.badge}>
                                                <Text style={styles.badgeText}>EN POPÜLER / %37 TASARRUF ET</Text>
                                            </View>
                                        )}
                                        {hasActiveSub && (
                                            <View style={[styles.badge, { backgroundColor: '#475569' }]}>
                                                <Text style={[styles.badgeText, { color: '#e2e8f0' }]}>ZATEN ABONESİNİZ</Text>
                                            </View>
                                        )}
                                        <View style={styles.packContent}>
                                            <View>
                                                <Text style={[styles.packTitle, isSelected && { color: '#fff' }]}>
                                                    {displayTitle}
                                                </Text>
                                                <Text style={[styles.packDesc, isSelected && { color: '#e2e8f0' }]}>
                                                    Her Ay 100 Yıldız
                                                </Text>
                                            </View>
                                            <Text style={[styles.packPrice, isSelected && { color: '#fff' }]}>
                                                {displayPrice}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}

                            {/* Consumable Yıldız Package Drop-In for Active Subscribers */}
                            {hasActiveSub && (
                                <TouchableOpacity
                                    style={[styles.packageCard, selectedPackage?.identifier === 'dummy_stars' && styles.packageCardSelected, { marginTop: 8 }]}
                                    onPress={() => setSelectedPackage({ identifier: 'dummy_stars', packageType: 'CUSTOM', product: { priceString: '199,99 ₺' } } as any)}
                                >
                                    <View style={[styles.badge, { backgroundColor: '#eab308' }]}>
                                        <Text style={[styles.badgeText, { color: '#1f1317' }]}>EK YILDIZ PAKETİ</Text>
                                    </View>
                                    <View style={styles.packContent}>
                                        <View>
                                            <Text style={[styles.packTitle, selectedPackage?.identifier === 'dummy_stars' && { color: '#fff' }]}>
                                                100 Kozmik Yıldız
                                            </Text>
                                            <Text style={[styles.packDesc, selectedPackage?.identifier === 'dummy_stars' && { color: '#e2e8f0' }]}>
                                                Tek seferlik dolum
                                            </Text>
                                        </View>
                                        <Text style={[styles.packPrice, selectedPackage?.identifier === 'dummy_stars' && { color: '#fff' }]}>
                                            199,99 ₺
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        </>

                    )}
                </View>

            </ScrollView>

            {/* Footer / CTA */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitBtn, (!selectedPackage || isPurchasing) && { opacity: 0.7 }]}
                    onPress={handlePurchase}
                    disabled={!selectedPackage || isPurchasing}
                >
                    {isPurchasing ? (
                        <ActivityIndicator color="#1f1317" />
                    ) : (
                        <Text style={styles.submitText}>
                            {selectedPackage 
                                ? `${selectedPackage.identifier === 'dummy_stars' ? '199,99 ₺' : (selectedPackage.packageType === 'ANNUAL' ? '6.999,99 ₺' : '799,99 ₺')} / Satın Al` 
                                : "Lütfen Plan Seçin"}
                        </Text>
                    )}
                </TouchableOpacity>
                <View style={styles.footerLinksRow}>
                    <Text style={styles.footerLink}>Gizlilik Politikası</Text>
                    <Text style={styles.footerLinkDot}>•</Text>
                    <Text style={styles.footerLink}>Kullanım Koşulları</Text>
                </View>
            </View>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f0a18' },
    orb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, filter: 'blur(50px)' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, zIndex: 10 },
    closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    restoreBtn: { paddingHorizontal: 12, paddingVertical: 6 },
    restoreText: { color: '#ad92c9', fontSize: 13, fontWeight: '600' },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 20 },
    heroSection: { alignItems: 'center', marginBottom: 32 },
    title: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 12, letterSpacing: -0.5 },
    subtitle: { fontSize: 15, color: '#94a3b8', textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 },
    featuresBox: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 20, marginBottom: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    featuresHeading: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 16, letterSpacing: 1 },
    featureItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    featureText: { color: '#cbd5e1', fontSize: 14, flex: 1 },
    packagesContainer: { gap: 16 },
    packageCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 20, borderWidth: 2, borderColor: 'rgba(255,255,255,0.05)', position: 'relative' },
    packageCardSelected: { borderColor: '#ad92c9', backgroundColor: 'rgba(173,146,201,0.15)' },
    packContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    packTitle: { fontSize: 16, fontWeight: '700', color: '#cbd5e1', marginBottom: 4 },
    packDesc: { fontSize: 13, color: '#64748b' },
    packPrice: { fontSize: 18, fontWeight: '800', color: '#e2e8f0' },
    badge: { position: 'absolute', top: -12, alignSelf: 'center', backgroundColor: '#ad92c9', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 10, fontWeight: '800', color: '#1f1317', letterSpacing: 1 },
    footer: { padding: 24, paddingBottom: Platform.OS === 'ios' ? 34 : 24, backgroundColor: 'rgba(15,10,24,0.9)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
    submitBtn: { height: 56, borderRadius: 20, backgroundColor: '#ad92c9', alignItems: 'center', justifyContent: 'center', shadowColor: '#ad92c9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
    submitText: { fontSize: 16, fontWeight: '800', color: '#1f1317' },
    footerLinksRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16, gap: 8 },
    footerLink: { fontSize: 12, color: '#64748b' },
    footerLinkDot: { fontSize: 12, color: '#475569' },
});
