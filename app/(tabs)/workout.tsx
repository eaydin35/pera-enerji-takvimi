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
    ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/useAuthStore';

const { width: W, height: H } = Dimensions.get('window');

// ─── Exercise Data ────────────────────────────────────────────────────────────
const STEPS = [
    { id: 1,  emoji: '🧘',  title: 'Hazırlık',                instruction: 'Rahat bir duruş al, omuzlarını geri çek ve derin bir nefes al.',           duration: 5,  color: '#d1fae5', accent: '#059669' },
    { id: 2,  emoji: '↩️',  title: 'Boyun - Sağa Eğme',       instruction: 'Başını yavaşça sağa doğru eğ, kulağın omuza yaklaşsın.', duration: 10, color: '#dbeafe', accent: '#2563eb' },
    { id: 3,  emoji: '↪️',  title: 'Boyun - Sola Eğme',       instruction: 'Başını yavaşça sola doğru eğ, kulağın omuza yaklaşsın.', duration: 10, color: '#ede9fe', accent: '#7c3aed' },
    { id: 4,  emoji: '⬇️',  title: 'Boyun - Öne Eğme',        instruction: 'Çeneni göğsüne doğru indir, enseni hisset. Yavaşça geri dön.',              duration: 10,  color: '#fce7f3', accent: '#db2777' },
    { id: 5,  emoji: '⬆️',  title: 'Boyun - Arkaya Uzanma',   instruction: 'Başını hafifçe geriye yatır, gökyüzüne bak.',         duration: 10,  color: '#fef3c7', accent: '#d97706' },
    { id: 6,  emoji: '🔄',  title: 'Omuz Dönüşü',             instruction: 'Omuzlarını yavaşça geriye doğru döndür, daireler çiz.',    duration: 12, color: '#ecfdf5', accent: '#10b981' },
    { id: 7,  emoji: '🙆',  title: 'Yan Gövde Esnetme',       instruction: 'Sağ kolunu yukarı kaldır, sola doğru eğil.',  duration: 15, color: '#eff6ff', accent: '#3b82f6' },
    { id: 8,  emoji: '🤸',  title: 'Kol - Çapraz Esnetme',    instruction: 'Bir kolunu göğsünün önünde uzat, diğeriyle hafifçe çek.',    duration: 10, color: '#f5f3ff', accent: '#8b5cf6' },
    { id: 9,  emoji: '🙏',  title: 'El Bileği Esnetme',       instruction: 'Avuç içlerini birbirine bastır, bileklerini hareket ettir.',    duration: 10, color: '#fdf2f8', accent: '#ec4899' },
    { id: 10, emoji: '🌬️', title: 'Derin Nefes & Bitiş', instruction: 'Gözlerini kapat. Derin nefes al ve yavaşça ver.',    duration: 15, color: '#f0fdf4', accent: '#22c55e' },
];

const TOTAL_DURATION = STEPS.reduce((s, st) => s + st.duration, 0);

function TimerCircle({ remaining, total, accent }: { remaining: number; total: number; accent: string }) {
    const pct = remaining / total;
    const size = 160;
    const stroke = 10;
    
    return (
        <View style={{ alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
            <View style={{
                position: 'absolute', width: size, height: size,
                borderRadius: size / 2, borderWidth: stroke, borderColor: '#e5e7eb',
            }} />
            <View style={{
                position: 'absolute', width: size - stroke * 2, height: size - stroke * 2,
                borderRadius: (size - stroke * 2) / 2,
                borderWidth: stroke + 4,
                borderColor: accent,
                opacity: 0.8,
            }} />
            <Text style={styles.timerText}>
                00:{remaining < 10 ? `0${remaining}` : remaining}
            </Text>
        </View>
    );
}

export default function WorkoutScreen() {
    const { user } = useAuthStore();
    const [stepIdx, setStepIdx]       = useState(-1); // -1 is intro
    const [remaining, setRemaining]   = useState(0);
    const [isPlaying, setIsPlaying]   = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const goNext = useCallback(() => {
        if (stepIdx < STEPS.length - 1) {
            Animated.sequence([
                Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
                Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();
            
            setStepIdx(i => i + 1);
            setRemaining(STEPS[stepIdx + 1].duration);
            setIsPlaying(true);
        } else {
            Vibration.vibrate([0, 100, 100, 100]);
            setIsFinished(true);
            setIsPlaying(false);
        }
    }, [stepIdx]);

    const goPrev = useCallback(() => {
        if (stepIdx > 0) {
            setStepIdx(i => i - 1);
            setRemaining(STEPS[stepIdx - 1].duration);
        }
    }, [stepIdx]);

    useEffect(() => {
        if (!isPlaying || isFinished || stepIdx === -1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }
        timerRef.current = setInterval(() => {
            setRemaining(r => {
                if (r <= 1) {
                    Vibration.vibrate(80);
                    goNext();
                    return 0;
                }
                return r - 1;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isPlaying, isFinished, stepIdx, goNext]);

    if (isFinished) {
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient colors={['#f0fdf4', '#dcfce7']} style={styles.finishGrad}>
                    <Text style={styles.finishEmoji}>🎉</Text>
                    <Text style={styles.finishTitle}>Harika İş Çıkardın!</Text>
                    <Text style={styles.finishSub}>Esneme programını başarıyla tamamladın.</Text>
                    <TouchableOpacity style={styles.finishBtn} onPress={() => {
                        setIsFinished(false);
                        setStepIdx(-1);
                    }}>
                        <Text style={styles.finishBtnText}>Ana Sayfaya Dön</Text>
                    </TouchableOpacity>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    if (stepIdx === -1) {
        return (
            <SafeAreaView style={styles.container}>
                <View className="px-6 pt-6 pb-4">
                    <Text className="text-3xl font-extrabold text-text-primary-light">Esneme & Safa</Text>
                    <Text className="text-sm text-text-secondary-light mt-1">Güne zinde bir başlangıç için 10 temel adım.</Text>
                </View>
                
                <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20 }}>
                    <View className="bg-primary/5 border border-primary/20 p-8 rounded-[40px] items-center">
                        <View className="h-20 w-20 bg-primary rounded-3xl items-center justify-center mb-6 shadow-lg shadow-primary/30">
                            <MaterialIcons name="bolt" size={48} color="white" />
                        </View>
                        <Text className="text-2xl font-bold text-primary mb-2 text-center">Günlük Isınma</Text>
                        <Text className="text-zinc-500 text-center mb-8 leading-relaxed">
                            10 temel hareket, toplam 1.5 dakika.{"\n"}Hadi, bedenini uyandıralum.
                        </Text>
                        
                        <TouchableOpacity 
                            onPress={() => {
                                setStepIdx(0);
                                setRemaining(STEPS[0].duration);
                                setIsPlaying(true);
                            }}
                            className="bg-primary w-full py-5 rounded-[24px] items-center shadow-lg shadow-primary/20"
                        >
                            <Text className="text-white font-bold text-lg">Hemen Başla 🔥</Text>
                        </TouchableOpacity>
                    </View>

                    <Text className="text-lg font-bold text-zinc-800 mt-10 mb-4">Program Akışı</Text>
                    {STEPS.map((s, i) => (
                        <View key={i} className="flex-row items-center bg-white p-4 rounded-2xl mb-3 border border-zinc-100">
                            <Text className="text-2xl mr-4">{s.emoji}</Text>
                            <View className="flex-1">
                                <Text className="font-bold text-zinc-800">{s.title}</Text>
                                <Text className="text-xs text-zinc-400">{s.duration} saniye</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={20} color="#ddd" />
                        </View>
                    ))}
                </ScrollView>
            </SafeAreaView>
        );
    }

    const currentStep = STEPS[stepIdx];
    const progress = (stepIdx + (1 - remaining / currentStep.duration)) / STEPS.length;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => {
                    setStepIdx(-1);
                    setIsPlaying(false);
                }}>
                    <MaterialIcons name="close" size={28} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{currentStep.title}</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.progressSection}>
                <Text style={styles.stepLabel}>Adım {stepIdx + 1}/{STEPS.length}</Text>
                <View style={styles.progressTrack}>
                    <Animated.View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: currentStep.accent }]} />
                </View>
            </View>

            <Animated.View style={[styles.illustrationCard, { backgroundColor: currentStep.color, opacity: fadeAnim }]}>
                <Text style={styles.illustrationEmoji}>{currentStep.emoji}</Text>
            </Animated.View>

            <View style={{ alignItems: 'center', marginTop: 24 }}>
                <TimerCircle remaining={remaining} total={currentStep.duration} accent={currentStep.accent} />
            </View>

            <View style={{ paddingHorizontal: 40, marginTop: 24 }}>
                <Text style={styles.instruction}>{currentStep.instruction}</Text>
            </View>

            <View style={styles.controls}>
                <TouchableOpacity onPress={goPrev} disabled={stepIdx === 0}>
                    <MaterialIcons name="skip-previous" size={40} color={stepIdx === 0 ? '#d1d5db' : '#374151'} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.playBtn, { backgroundColor: currentStep.accent }]}
                    onPress={() => setIsPlaying(p => !p)}
                >
                    <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={48} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity onPress={goNext} disabled={stepIdx === STEPS.length - 1}>
                    <MaterialIcons name="skip-next" size={40} color={stepIdx === STEPS.length - 1 ? '#d1d5db' : '#374151'} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:  { flex: 1, backgroundColor: '#fcfcfc' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 10,
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    progressSection: { paddingHorizontal: 20, marginVertical: 10 },
    stepLabel: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 8 },
    progressTrack: { height: 6, borderRadius: 3, backgroundColor: '#f3f4f6', overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
    illustrationCard: {
        marginHorizontal: 24, borderRadius: 40, height: H * 0.3,
        alignItems: 'center', justifyContent: 'center', marginTop: 10,
    },
    illustrationEmoji: { fontSize: 100 },
    timerText: { fontSize: 48, fontWeight: '800', color: '#111827' },
    instruction: { fontSize: 18, fontWeight: '600', color: '#374151', textAlign: 'center', lineHeight: 28 },
    controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginTop: 'auto', paddingBottom: 40, paddingHorizontal: 40 },
    playBtn: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    finishGrad: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    finishEmoji: { fontSize: 80, marginBottom: 16 },
    finishTitle: { fontSize: 28, fontWeight: '800', color: '#064e3b', marginBottom: 10 },
    finishSub:   { fontSize: 16, color: '#374151', textAlign: 'center', marginBottom: 40 },
    finishBtn: { backgroundColor: '#22c55e', paddingHorizontal: 40, paddingVertical: 16, borderRadius: 20 },
    finishBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
