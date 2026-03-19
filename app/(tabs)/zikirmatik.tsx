import React, { useCallback } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    Animated,
    Vibration,
    Alert,
    SectionList,
    Dimensions,
    StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useZikirStore, ESMA_LIST, Esma } from '../../store/useZikirStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useRef, useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Stone Definitions ───────────────────────────────────────────────────────

const STONES = [
    { id: 'malachite', name: 'Malakit',  colors: ['#064e3b', '#065f46', '#022c22'] as const },
    { id: 'amethyst',  name: 'Ametist',  colors: ['#c084fc', '#7c3aed', '#581c87'] as const },
    { id: 'turquoise', name: 'Turkuaz',  colors: ['#2dd4bf', '#0d9488', '#0f766e'] as const },
    { id: 'agate',     name: 'Akik',     colors: ['#fb923c', '#ea580c', '#7c2d12'] as const },
    { id: 'quartz',    name: 'Kuvars',   colors: ['#fce7f3', '#fbcfe8', '#f9a8d4'] as const },
];

// ─── Progress Ring ────────────────────────────────────────────────────────────

const RING_SIZE = 268;
const RADIUS = 118;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CENTER = RING_SIZE / 2;

function ProgressRing({ progress }: { progress: number }) {
    const offset = CIRCUMFERENCE * (1 - Math.min(progress, 1));
    return (
        <Svg width={RING_SIZE} height={RING_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle cx={CENTER} cy={CENTER} r={RADIUS} stroke="#e2e8f0" strokeWidth={5} fill="transparent" />
            <Circle
                cx={CENTER} cy={CENTER} r={RADIUS}
                stroke="#C5A059" strokeWidth={5} fill="transparent"
                strokeDasharray={`${CIRCUMFERENCE}`}
                strokeDashoffset={`${offset}`}
                strokeLinecap="round"
            />
        </Svg>
    );
}

// ─── Stone Bead ───────────────────────────────────────────────────────────────

function StoneBead({ stone, size, onPress, opacity = 1 }: {
    stone: typeof STONES[0]; size: number; onPress?: () => void; opacity?: number;
}) {
    const scale = useRef(new Animated.Value(1)).current;
    const handleIn  = () => Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, speed: 30 }).start();
    const handleOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 20 }).start();

    const bead = (
        <Animated.View style={{
            width: size, height: size, borderRadius: size / 2,
            overflow: 'hidden', opacity, transform: [{ scale }],
            shadowColor: '#000', shadowOffset: { width: 4, height: 12 },
            shadowOpacity: 0.35, shadowRadius: 16, elevation: 12,
        }}>
            <LinearGradient colors={stone.colors} start={{ x: 0.2, y: 0.1 }} end={{ x: 0.8, y: 0.9 }} style={StyleSheet.absoluteFill} />
            {/* Glare */}
            <View style={{ position: 'absolute', top: '10%', left: '14%', width: '34%', height: '24%',
                borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.45)', transform: [{ rotate: '-15deg' }] }} />
            {/* Depth */}
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.45)']}
                start={{ x: 0.3, y: 0.3 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
    );

    if (!onPress) return bead;
    return (
        <TouchableOpacity activeOpacity={1} onPressIn={handleIn} onPressOut={handleOut} onPress={onPress}>
            {bead}
        </TouchableOpacity>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ZikirmatikScreen() {
    const params = useLocalSearchParams<{ esma?: string }>();
    const { activeEsmaId, sessions, setActiveEsma, increment, resetActive } = useZikirStore();
    const { user } = useAuthStore();
    const [selectedStone, setSelectedStone] = useState(STONES[0]);
    const [vibrationOn, setVibrationOn]     = useState(true);
    const [showModal, setShowModal]          = useState(false);

    // Initial load from params
    useEffect(() => {
        if (params.esma) {
            const normalize = (s: string) => s.toLowerCase()
                .replace(/i̇/g, 'i')
                .replace(/ı/g, 'i')
                .replace(/ö/g, 'o')
                .replace(/ü/g, 'u')
                .replace(/ç/g, 'c')
                .replace(/ş/g, 's')
                .replace(/ğ/g, 'g')
                .replace(/[îâû]/g, (match) => ({'î':'i', 'â':'a', 'û':'u'}[match as 'î'|'â'|'û'] || match));

            const target = normalize(params.esma);
            const found = ESMA_LIST.find(e => 
                normalize(e.tr) === target || 
                normalize(e.id) === target
            );
            if (found) setActiveEsma(found.id);
        }
    }, [params.esma]);

    const activeEsma = ESMA_LIST.find(e => e.id === activeEsmaId) ?? ESMA_LIST[0];
    const currentSession = sessions[activeEsmaId];
    const count    = currentSession?.count ?? 0;
    const progress = count / activeEsma.target;
    const pct      = Math.round(Math.min(progress, 1) * 100);

    const handleBeadPress = useCallback(() => {
        if (vibrationOn) Vibration.vibrate(25);
        increment(user?.id);
        const next = count + 1;
        if (next === activeEsma.target) {
            Alert.alert(`🎉 Tamamlandı!`, `${activeEsma.tr} hedefine ulaştınız: ${activeEsma.target.toLocaleString('tr-TR')}`, [
                { text: 'Devam Et' },
                { text: 'Sıfırla', onPress: resetActive },
            ]);
        }
    }, [vibrationOn, increment, count, activeEsma, resetActive]);

    const handleReset = () => {
        Alert.alert('Sıfırla', 'Bu esmanın sayacını sıfırlamak istediğinize emin misiniz?', [
            { text: 'İptal', style: 'cancel' },
            { text: 'Sıfırla', style: 'destructive', onPress: resetActive },
        ]);
    };

    const handleSelectEsma = (esma: Esma) => {
        setActiveEsma(esma.id);
        setShowModal(false);
    };

    // Group esmas by category for SectionList
    const sections = ESMA_LIST.reduce<{ title: string; data: Esma[] }[]>((acc, esma) => {
        const existing = acc.find(s => s.title === esma.category);
        if (existing) { existing.data.push(esma); }
        else { acc.push({ title: esma.category, data: [esma] }); }
        return acc;
    }, []);

    const lastUpdated = currentSession?.lastUpdated
        ? new Date(currentSession.lastUpdated).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        : null;

    return (
        <SafeAreaView style={styles.container}>
            {/* Ambient blobs */}
            <View style={styles.blob1} /><View style={styles.blob2} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.iconBtn} />
                <Text style={styles.headerTitle}>PERA ZİKİRMATİK</Text>
                <TouchableOpacity style={styles.iconBtn} onPress={() => setShowModal(true)}>
                    <MaterialIcons name="more-vert" size={20} color="#94a3b8" />
                </TouchableOpacity>
            </View>

            {/* Esma Display */}
            <TouchableOpacity style={{ alignItems: 'center', marginTop: 4, marginBottom: 6 }} onPress={() => setShowModal(true)}>
                <Text style={styles.arabicText}>{activeEsma.ar}</Text>
                <Text style={styles.esmaName}>{activeEsma.tr}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Text style={styles.esmaCategory}>{activeEsma.category.toUpperCase()}</Text>
                    <MaterialIcons name="expand-more" size={14} color="#94a3b8" />
                </View>
            </TouchableOpacity>

            {/* Counter */}
            <View style={{ alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.countText}>{count.toLocaleString('tr-TR')}</Text>
                <View style={styles.targetBadge}>
                    <Text style={styles.targetText}>HEDEF: {activeEsma.target.toLocaleString('tr-TR')}</Text>
                </View>
                {lastUpdated && (
                    <Text style={styles.savedLabel}>🕐 {lastUpdated} kaydedildi</Text>
                )}
            </View>

            {/* Bead + Ring Area */}
            <View style={styles.ringArea}>
                <View style={styles.ringWrapper}>
                    <ProgressRing progress={progress} />
                    <View style={styles.pctWrapper}>
                        <Text style={styles.pctText}>{pct}%</Text>
                    </View>
                </View>
                <View style={styles.string} />
                <View style={styles.beadsRow}>
                    <View style={{ opacity: 0.38 }}><StoneBead stone={selectedStone} size={78} /></View>
                    <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                        <StoneBead stone={selectedStone} size={172} onPress={handleBeadPress} />
                        <View style={styles.fpOverlay} pointerEvents="none">
                            <MaterialIcons name="fingerprint" size={52} color="rgba(255,255,255,0.22)" />
                        </View>
                    </View>
                    <View style={{ opacity: 0.38 }}><StoneBead stone={selectedStone} size={78} /></View>
                </View>
                {/* Action buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.actionBtn} onPress={handleReset}>
                        <MaterialIcons name="refresh" size={18} color="#94a3b8" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn}>
                        <MaterialIcons name="volume-up" size={18} color="#94a3b8" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, vibrationOn && { borderColor: '#C5A059', backgroundColor: '#fdf6e3' }]}
                        onPress={() => setVibrationOn(v => !v)}
                    >
                        <MaterialIcons name="vibration" size={18} color={vibrationOn ? '#C5A059' : '#94a3b8'} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Stone Selection */}
            <View style={{ marginBottom: 6 }}>
                <View style={styles.stoneHeader}>
                    <Text style={styles.stoneSectionTitle}>DOĞAL TAŞ SEÇİMİ</Text>
                    <Text style={styles.stoneCollectionLink}>Koleksiyon</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 20, gap: 22 }}>
                    {STONES.map(stone => (
                        <TouchableOpacity key={stone.id} style={{ alignItems: 'center', gap: 6 }}
                            onPress={() => setSelectedStone(stone)}>
                            <View style={[styles.stoneSelector, selectedStone.id === stone.id && styles.stoneSelectorActive]}>
                                <StoneBead stone={stone} size={50} />
                            </View>
                            <Text style={[styles.stoneName, selectedStone.id === stone.id && { color: '#1e293b', fontWeight: '700' }]}>
                                {stone.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Esma Picker Modal */}
            {showModal && (
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowModal(false)} />
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>Zikir / Esma Seç</Text>
                        <SectionList
                            sections={sections}
                            keyExtractor={item => item.id}
                            showsVerticalScrollIndicator={false}
                            renderSectionHeader={({ section }) => (
                                <Text style={styles.sectionHeader}>{section.title}</Text>
                            )}
                            renderItem={({ item }) => {
                                const sessionCount = sessions[item.id]?.count ?? 0;
                                const isActive = item.id === activeEsmaId;
                                return (
                                    <TouchableOpacity style={[styles.esmaRow, isActive && styles.esmaRowActive]}
                                        onPress={() => handleSelectEsma(item)}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.esmaRowAr}>{item.ar}</Text>
                                            <Text style={styles.esmaRowTr}>{item.tr}</Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end', gap: 2 }}>
                                            <Text style={styles.esmaRowTarget}>{item.target}×</Text>
                                            {sessionCount > 0 && (
                                                <Text style={styles.esmaRowSaved}>{sessionCount.toLocaleString('tr-TR')} çekildi</Text>
                                            )}
                                        </View>
                                        {isActive && <MaterialIcons name="check-circle" size={18} color="#C5A059" style={{ marginLeft: 8 }} />}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAF9' },
    blob1: {
        position: 'absolute', top: '-5%', right: '-10%',
        width: SCREEN_WIDTH * 0.6, height: SCREEN_WIDTH * 0.4,
        borderRadius: 999, backgroundColor: 'rgba(197,160,89,0.06)',
    },
    blob2: {
        position: 'absolute', bottom: '20%', left: '-15%',
        width: SCREEN_WIDTH * 0.5, height: SCREEN_WIDTH * 0.5,
        borderRadius: 999, backgroundColor: 'rgba(197,160,89,0.04)',
    },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4,
    },
    iconBtn: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
        borderWidth: 1, borderColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },
    headerTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 3, color: '#C5A059' },
    arabicText:  { fontSize: 54, fontWeight: '700', color: '#1e293b', fontFamily: 'serif', lineHeight: 76 },
    esmaName:    { fontSize: 21, fontWeight: '700', color: '#0f172a', letterSpacing: -0.5 },
    esmaCategory:{ fontSize: 10, fontWeight: '600', color: '#94a3b8', letterSpacing: 3 },
    countText:   { fontSize: 64, fontWeight: '800', color: '#0f172a', letterSpacing: -2 },
    targetBadge: {
        paddingHorizontal: 16, paddingVertical: 4, borderRadius: 999,
        backgroundColor: 'rgba(197,160,89,0.12)', borderWidth: 1, borderColor: 'rgba(197,160,89,0.25)', marginTop: 4,
    },
    targetText:  { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: '#C5A059' },
    savedLabel:  { fontSize: 11, color: '#94a3b8', marginTop: 4 },
    ringArea:    { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 230 },
    ringWrapper: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
    pctWrapper:  { position: 'absolute', top: 14, alignItems: 'center' },
    pctText:     { fontSize: 12, fontWeight: '700', color: '#C5A059', letterSpacing: 1.5 },
    string:      { position: 'absolute', height: 3, width: '160%', backgroundColor: '#C5A059', opacity: 0.18, zIndex: 0 },
    beadsRow:    { flexDirection: 'row', alignItems: 'center', gap: 18, zIndex: 10 },
    fpOverlay:   { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
    actionButtons: { position: 'absolute', bottom: 0, flexDirection: 'row', gap: 24 },
    actionBtn: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
        borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },
    stoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
    stoneSectionTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 2.5, color: '#94a3b8' },
    stoneCollectionLink: { fontSize: 10, fontWeight: '700', color: '#C5A059' },
    stoneSelector: { padding: 3, borderRadius: 999, borderWidth: 2, borderColor: 'transparent' },
    stoneSelectorActive: { borderColor: '#C5A059' },
    stoneName: { fontSize: 10, fontWeight: '600', color: '#94a3b8' },
    // Modal
    modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', zIndex: 100 },
    modalSheet: {
        backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
        paddingTop: 12, paddingBottom: 40, paddingHorizontal: 20, maxHeight: '80%',
    },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0', alignSelf: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
    sectionHeader: {
        fontSize: 10, fontWeight: '700', letterSpacing: 2, color: '#94a3b8',
        paddingVertical: 10, backgroundColor: '#fff',
    },
    esmaRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    },
    esmaRowActive: { backgroundColor: 'rgba(197,160,89,0.06)', borderRadius: 12, paddingHorizontal: 8, marginHorizontal: -8 },
    esmaRowAr:    { fontSize: 20, fontFamily: 'serif', color: '#1e293b' },
    esmaRowTr:    { fontSize: 13, color: '#64748b', marginTop: 2 },
    esmaRowTarget: { fontSize: 13, fontWeight: '700', color: '#C5A059' },
    esmaRowSaved: { fontSize: 10, color: '#94a3b8' },
});
