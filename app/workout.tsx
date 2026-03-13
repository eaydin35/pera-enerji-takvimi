import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Vibration,
    Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width: W, height: H } = Dimensions.get('window');

// ─── Exercise Data ────────────────────────────────────────────────────────────

const STEPS: { id: number; emoji: string; title: string; instruction: string; duration: number; color: string; accent: string }[] = [
    { id: 1,  emoji: '\u{1F9D8}',  title: 'Hazirlik',                instruction: 'Rahat bir durus al, omuzlarini geri cek ve derin bir nefes al.',           duration: 5,  color: '#d1fae5', accent: '#059669' },
    { id: 2,  emoji: '\u21A9\uFE0F',  title: 'Boyun - Saga Egme',       instruction: 'Basini yavascca saga dogru eg, kulagin omuza yaklassin. Bu pozisyonu koru.', duration: 10, color: '#dbeafe', accent: '#2563eb' },
    { id: 3,  emoji: '\u21AA\uFE0F',  title: 'Boyun - Sola Egme',       instruction: 'Basini yavascca sola dogru eg, kulagin omuza yaklassin. Bu pozisyonu koru.', duration: 10, color: '#ede9fe', accent: '#7c3aed' },
    { id: 4,  emoji: '\u2B07\uFE0F',  title: 'Boyun - One Egme',        instruction: 'Ceneni gogsune dogru indir, enseni hisset. Yavascca geri don.',              duration: 8,  color: '#fce7f3', accent: '#db2777' },
    { id: 5,  emoji: '\u2B06\uFE0F',  title: 'Boyun - Arkaya Uzanma',   instruction: 'Basini hafifce geriye yatir, gokyuzune bak. Nefes almaya devam et.',         duration: 8,  color: '#fef3c7', accent: '#d97706' },
    { id: 6,  emoji: '\u{1F504}',  title: 'Omuz Donusu',             instruction: 'Her iki omuzunu ayni anda yavascca geriye dogru dondur, 5 kez tekrarla.',    duration: 12, color: '#ecfdf5', accent: '#10b981' },
    { id: 7,  emoji: '\u{1F646}',  title: 'Yan Govde Esnetme',       instruction: 'Sag kolunu yukari kaldir, sola dogru egil. Her iki taraf icin 5er saniye.',  duration: 15, color: '#eff6ff', accent: '#3b82f6' },
    { id: 8,  emoji: '\u{1F938}',  title: 'Kol - Capraz Esnetme',    instruction: 'Sol kolunu gogsunun onunde uzat, sag kolunla hafifce bask. 5 sn bekle.',    duration: 10, color: '#f5f3ff', accent: '#8b5cf6' },
    { id: 9,  emoji: '\u{1F64F}',  title: 'El Bilegi Esnetme',       instruction: 'Avuc iclerini birbirine bastar, bileklerini asagi-yukari hareket ettir.',    duration: 10, color: '#fdf2f8', accent: '#ec4899' },
    { id: 10, emoji: '\u{1F32C}\uFE0F', title: 'Derin Nefes & Bitis', instruction: 'Gozlerini kapat. 4 say nefes al, 4 say tut, 4 say ver. 3 kez tekrarla.',    duration: 15, color: '#f0fdf4', accent: '#22c55e' },
];


const TOTAL_DURATION = STEPS.reduce((s, st) => s + st.duration, 0); // ~103s ≈ 10 dk kısa set

// ─── Animated Progress Ring ───────────────────────────────────────────────────

function TimerCircle({ remaining, total, accent }: { remaining: number; total: number; accent: string }) {
    const pct = remaining / total;
    const anim = useRef(new Animated.Value(pct)).current;

    useEffect(() => {
        anim.setValue(pct);
    }, [remaining]);

    const size = 160;
    const stroke = 10;
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const dashOffset = circ * (1 - pct);

    return (
        <View style={{ alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
            {/* Background circle */}
            <View style={{
                position: 'absolute', width: size, height: size,
                borderRadius: size / 2, borderWidth: stroke, borderColor: '#e5e7eb',
            }} />
            {/* We approximate the arc with a simple border fill */}
            <View style={{
                position: 'absolute', width: size - stroke * 2, height: size - stroke * 2,
                borderRadius: (size - stroke * 2) / 2,
                borderWidth: stroke + 2,
                borderColor: accent,
                opacity: pct,
            }} />
            <Text style={[styles.timerText, { color: '#111827' }]}>
                {`${Math.floor(remaining / 60).toString().padStart(2, '0')}:${(remaining % 60).toString().padStart(2, '0')}`}
            </Text>
        </View>
    );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function WorkoutScreen() {
    const router = useRouter();
    const [stepIdx, setStepIdx]       = useState(0);
    const [remaining, setRemaining]   = useState(STEPS[0].duration);
    const [isPlaying, setIsPlaying]   = useState(true);
    const [isFinished, setIsFinished] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const step = STEPS[stepIdx];
    const progress = (stepIdx + (1 - remaining / step.duration)) / STEPS.length;

    const goNext = useCallback(() => {
        if (stepIdx < STEPS.length - 1) {
            // Fade transition
            Animated.sequence([
                Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
                Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();
            setTimeout(() => {
                setStepIdx(i => i + 1);
                setRemaining(STEPS[stepIdx + 1].duration);
            }, 200);
        } else {
            Vibration.vibrate([0, 100, 100, 100]);
            setIsFinished(true);
        }
    }, [stepIdx, fadeAnim]);

    const goPrev = useCallback(() => {
        if (stepIdx > 0) {
            setStepIdx(i => i - 1);
            setRemaining(STEPS[stepIdx - 1].duration);
        }
    }, [stepIdx]);

    useEffect(() => {
        if (!isPlaying || isFinished) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }
        timerRef.current = setInterval(() => {
            setRemaining(r => {
                if (r <= 1) {
                    Vibration.vibrate(80);
                    goNext();
                    return STEPS[Math.min(stepIdx + 1, STEPS.length - 1)].duration;
                }
                return r - 1;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isPlaying, isFinished, stepIdx, goNext]);

    // ── Finished Screen ──
    if (isFinished) {
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient colors={['#f0fdf4', '#dcfce7']} style={styles.finishGrad}>
                    <Text style={styles.finishEmoji}>🎉</Text>
                    <Text style={styles.finishTitle}>Harika İş Çıkardın!</Text>
                    <Text style={styles.finishSub}>10 esneme adımını başarıyla tamamladın.</Text>
                    <Text style={styles.finishStat}>
                        Toplam süre: ~{Math.ceil(TOTAL_DURATION / 60)} dakika
                    </Text>
                    <TouchableOpacity style={styles.finishBtn} onPress={() => router.back()}>
                        <Text style={styles.finishBtnText}>Tamamla</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.finishSecBtn} onPress={() => { setStepIdx(0); setRemaining(STEPS[0].duration); setIsFinished(false); setIsPlaying(true); }}>
                        <Text style={styles.finishSecBtnText}>Tekrar Yap</Text>
                    </TouchableOpacity>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    // ── Main Workout Screen ──
    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ width: 44 }} />
                <Text style={styles.headerTitle}>{step.title}</Text>
                <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
                    <MaterialIcons name="close" size={22} color="#374151" />
                </TouchableOpacity>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressSection}>
                <Text style={styles.stepLabel}>Adım {stepIdx + 1}/{STEPS.length}</Text>
                <View style={styles.progressTrack}>
                    <Animated.View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: step.accent }]} />
                </View>
            </View>

            {/* Illustration Card */}
            <Animated.View style={[styles.illustrationCard, { backgroundColor: step.color, opacity: fadeAnim }]}>
                <Text style={styles.illustrationEmoji}>{step.emoji}</Text>
            </Animated.View>

            {/* Timer */}
            <View style={{ alignItems: 'center', marginTop: 16 }}>
                <TimerCircle remaining={remaining} total={step.duration} accent={step.accent} />
            </View>

            {/* Instruction */}
            <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 28, marginTop: 16 }}>
                <Text style={styles.instruction}>{step.instruction}</Text>
            </Animated.View>

            {/* Controls */}
            <View style={styles.controls}>
                <TouchableOpacity
                    style={styles.ctrlBtn}
                    onPress={goPrev}
                    disabled={stepIdx === 0}
                >
                    <MaterialIcons name="skip-previous" size={28} color={stepIdx === 0 ? '#d1d5db' : '#374151'} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.playBtn, { backgroundColor: step.accent, shadowColor: step.accent }]}
                    onPress={() => setIsPlaying(p => !p)}
                >
                    <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={40} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.ctrlBtn} onPress={goNext}>
                    <MaterialIcons name="skip-next" size={28} color="#374151" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container:  { flex: 1, backgroundColor: '#f6f8f6' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4,
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
    closeBtn: {
        width: 44, height: 44, borderRadius: 22,
        alignItems: 'center', justifyContent: 'center',
    },
    // Progress
    progressSection: { paddingHorizontal: 20, paddingBottom: 8 },
    stepLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
    progressTrack: {
        height: 8, borderRadius: 4, backgroundColor: 'rgba(16,196,91,0.15)', overflow: 'hidden',
    },
    progressFill: { height: 8, borderRadius: 4 },
    // Illustration
    illustrationCard: {
        marginHorizontal: 20, borderRadius: 24, height: H * 0.26,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    },
    illustrationEmoji: { fontSize: 96 },
    // Timer
    timerText: { fontSize: 52, fontWeight: '800', letterSpacing: -2, position: 'absolute' },
    // Instruction
    instruction: {
        fontSize: 17, fontWeight: '500', color: '#1f2937',
        textAlign: 'center', lineHeight: 26,
    },
    // Controls
    controls: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 32, marginTop: 'auto', paddingVertical: 24,
    },
    ctrlBtn: { padding: 12 },
    playBtn: {
        width: 80, height: 80, borderRadius: 40,
        alignItems: 'center', justifyContent: 'center',
        shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
    },
    // Finish screen
    finishGrad: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    finishEmoji: { fontSize: 80, marginBottom: 16 },
    finishTitle: { fontSize: 32, fontWeight: '800', color: '#065f46', marginBottom: 8 },
    finishSub:   { fontSize: 16, color: '#374151', textAlign: 'center', marginBottom: 8 },
    finishStat:  { fontSize: 14, color: '#6b7280', marginBottom: 40 },
    finishBtn: {
        width: W - 64, backgroundColor: '#22c55e', borderRadius: 20,
        paddingVertical: 18, alignItems: 'center', marginBottom: 12,
        shadowColor: '#22c55e', shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
    },
    finishBtnText:    { fontSize: 17, fontWeight: '700', color: '#fff' },
    finishSecBtn:     { paddingVertical: 12 },
    finishSecBtnText: { fontSize: 15, fontWeight: '600', color: '#059669' },
});
