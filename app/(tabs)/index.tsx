import { View, Text, ScrollView, TouchableOpacity, Image, SafeAreaView, Linking, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useProfileStore } from '../../store/profileStore';
import { supabase } from '../../utils/supabase';

import { useRouter } from 'expo-router';

import { useMemo, useEffect, useState } from 'react';
import { calculateChart } from '../../utils/astrology';
import { chatWithAI } from '../../utils/ai-astrology';
import { getDailyRecommendation, getNatalSummary } from '../../utils/recommendation-engine';
import { calculateDailyTransits, getWeeklyEvents } from '../../utils/transit-engine';

import astroEvents2026 from '../../data/astro_events_2026.json';
import staticData from '../../data/staticData.json';



export default function DashboardScreen() {
    const [weeklyInsight, setWeeklyInsight] = useState<string | null>(null);
    const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
    const { profile: userProfile } = useProfileStore();
    const { user } = useAuthStore();
    const [expandedTransit, setExpandedTransit] = useState<number | null>(null);
    const router = useRouter();

    const dashboardData = useMemo(() => {
        if (!userProfile?.birthDate) return null;

        const chart = calculateChart(
            userProfile.birthDate,
            userProfile.birthTime,
            userProfile.birthLat || 41.0082,
            userProfile.birthLng || 28.9784
        );

        const recommendations = getDailyRecommendation(chart);
        const transit = calculateDailyTransits(chart);
        const weekly = getWeeklyEvents(astroEvents2026);


        return { chart, recommendations, transit, weekly };
    }, [userProfile]);

    // _layout.tsx already handles profile fetching and initialization now.



    const todayDateStr = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

    if (!dashboardData) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center px-8 relative">
                <View className="absolute inset-0 bg-primary/5" />
                <View className="h-32 w-32 rounded-full bg-primary/10 items-center justify-center mb-8 border border-primary/20">
                    <MaterialIcons name="auto-awesome" size={48} color="#ad92c9" />
                </View>
                <Text className="text-3xl font-extrabold text-center text-text-primary-light dark:text-text-primary-dark mb-4 tracking-tight">
                    Haritanı Oluştur
                </Text>
                <Text className="text-base text-center text-text-secondary-light dark:text-text-secondary-dark mb-10 leading-relaxed font-medium">
                    Yıldız haritanı, sana özel günlük enerjileri ve ritüelleri görebilmek için doğum bilgilerini tamamlaman gerekiyor.
                </Text>
                <TouchableOpacity 
                    onPress={() => router.push('/onboarding')}
                    className="w-full flex-row items-center justify-center rounded-[20px] bg-[#ad92c9] py-4 shadow-sm"
                    style={{ shadowColor: '#ad92c9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
                >
                    <MaterialIcons name="auto-awesome" size={22} color="#fff" />
                    <Text className="ml-3 text-lg font-bold text-white tracking-wide">Haritanı Oluştur</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const { recommendations, transit, weekly } = dashboardData;

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
                <View className="flex-row items-center gap-2">
                    <MaterialIcons name="auto-awesome" size={28} color="#ad92c9" />
                    <Text className="text-xl font-extrabold tracking-tight text-text-primary-light dark:text-text-primary-dark">Pera</Text>
                </View>


                <TouchableOpacity className="flex h-10 w-10 items-center justify-center rounded-full bg-card-light dark:bg-card-dark">
                    <MaterialIcons name="notifications-none" size={24} color="#1f2937" className="dark:text-white" />
                </TouchableOpacity>
            </View>
 
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
                <View className="px-4 pb-0 pt-2">
                    <Text className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">
                        Günaydın, {userProfile?.firstName || 'Gezgin'}
                    </Text>
                    
                    {/* Guest Prompt */}
                    {!user && (
                        <TouchableOpacity 
                            onPress={() => router.push('/auth')}
                            className="mt-4 p-4 rounded-3xl bg-primary/10 border border-primary/20 flex-row items-center justify-between"
                        >
                            <View className="flex-1 pr-4">
                                <Text className="text-lg font-bold text-primary mb-1">Daha Fazlasını Keşfet ✨</Text>
                                <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                    Profilini kaydetmek, fotoğrafını senkronize etmek ve sosyal giriş yapmak için oturum aç.
                                </Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color="#ec4899" />
                        </TouchableOpacity>
                    )}

                    {/* User Avatar Circle */}
                    <TouchableOpacity 
                        onPress={() => router.push('/profile' as any)}
                        className="mt-6 h-24 w-24 rounded-full border-4 border-white dark:border-zinc-800 shadow-xl overflow-hidden bg-primary/10 items-center justify-center"
                    >
                        {userProfile?.avatarUrl ? (
                            <Image
                                source={{ uri: userProfile.avatarUrl }}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="cover"
                            />
                        ) : (
                            <View className="items-center justify-center">
                                <MaterialIcons name="account-circle" size={80} color="#c4b5c9" />
                                {!user && <Text style={{ fontSize: 10, color: '#ec4899', fontWeight: 'bold', marginTop: -15 }}>GİRİŞ YAP</Text>}
                            </View>
                        )}
                    </TouchableOpacity>

                    <Text className="mt-4 text-sm text-text-secondary-light dark:text-text-secondary-dark font-medium">
                        {todayDateStr}, Ay {transit.moonSign} burcunda
                    </Text>
                </View>



                {/* Daily Energy Theme */}
                <View className="px-4 mb-4">
                    <View className="overflow-hidden rounded-[24px] border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark shadow-sm">
                        <View style={{ height: 120, width: '100%', position: 'relative' }}>
                            <Image 
                                source={require('../../assets/images/energy-bg.png')} 
                                style={{ width: '100%', height: '100%', position: 'absolute' }}
                                resizeMode="cover"
                            />
                            <LinearGradient 
                                colors={['transparent', 'rgba(0,0,0,0.4)']} 
                                style={{ width: '100%', height: '100%' }}
                            />
                            <View className="absolute bottom-3 left-4">
                                <Text className="text-white text-xs font-bold uppercase tracking-widest">Enerji Teması</Text>
                                <Text className="text-white text-xl font-bold mt-0.5">{transit.energyTheme}</Text>
                            </View>
                        </View>

                        <View className="p-5">
                            <Text className="text-base font-normal leading-normal text-text-secondary-light dark:text-text-secondary-dark">
                                {transit.energyDescription}
                            </Text>

                            <TouchableOpacity 
                                className="mt-4 flex-row items-center justify-center rounded-xl bg-primary/20 py-3 border border-primary/30"
                                onPress={async () => {
                                    if (isGeneratingInsight) return;
                                    setIsGeneratingInsight(true);
                                    try {
                                        const res = await chatWithAI(
                                            user?.id,
                                            "Bu hafta ile ilgili öneri, yorum ve astrolojik içgörüleri alabilir miyim? Haftanın gezegen enerjilerini benim haritama göre yorumla.",
                                            [],
                                            calculateChart(userProfile!.birthDate, userProfile!.birthTime, userProfile!.birthLat!, userProfile!.birthLng!),
                                            transit,
                                            userProfile!,
                                            recommendations
                                        );
                                        setWeeklyInsight(res);
                                    } finally {
                                        setIsGeneratingInsight(false);
                                    }
                                }}
                            >
                                <MaterialIcons name="auto-awesome" size={18} color="#ad92c9" />
                                <Text className="ml-2 text-sm font-bold text-primary">Haftalık İçgörü Al</Text>
                                {isGeneratingInsight && <ActivityIndicator size="small" color="#ad92c9" className="ml-2" />}
                            </TouchableOpacity>

                            {weeklyInsight && (
                                <View className="mt-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
                                    <Text className="text-sm italic leading-relaxed text-zinc-600 dark:text-zinc-400">
                                        {weeklyInsight}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Recommendations Grid */}
                <View className="flex-row px-4 mb-4 gap-4">
                    <View className="flex-1 rounded-[24px] border border-border-light bg-card-light p-5 dark:border-border-dark dark:bg-card-dark shadow-sm">
                        <View className="h-10 w-10 items-center justify-center rounded-full bg-primary mb-2" style={{ backgroundColor: recommendations.color.hex }}>
                            <MaterialIcons name="palette" size={20} color="#fff" />
                        </View>
                        <Text className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mt-auto">{recommendations.color.name}</Text>
                        <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Günün Rengi</Text>
                    </View>
                    <TouchableOpacity 
                        className="flex-1 rounded-[24px] border border-border-light bg-card-light p-5 dark:border-border-dark dark:bg-card-dark shadow-sm"
                        onPress={() => {
                            const stoneName = recommendations.stone.name.toLowerCase()
                                .replace(/ı/g,'i').replace(/ö/g,'o').replace(/ü/g,'u')
                                .replace(/ş/g,'s').replace(/ç/g,'c').replace(/ğ/g,'g');
                            Linking.openURL(`https://stonesofpera.com/?s=${stoneName}&post_type=product`);
                        }}
                    >
                        <View className="h-10 w-10 items-center justify-center rounded-full bg-primary mb-2">
                            <MaterialIcons name="diamond" size={20} color="#1f1317" />
                        </View>
                        <Text className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mt-auto">{recommendations.stone.name}</Text>
                        <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Günün Taşı</Text>
                    </TouchableOpacity>
                </View>


                <TouchableOpacity 
                    className="px-4 mb-4"
                    onPress={() => router.push({ pathname: '/zikirmatik', params: { esma: recommendations.esma.name } } as any)}
                >
                    <View className="rounded-[24px] border border-border-light bg-card-light p-5 dark:border-border-dark dark:bg-card-dark shadow-sm flex-row items-center">
                        <View className="h-12 w-12 items-center justify-center rounded-full bg-primary mr-4">
                            <MaterialIcons name="star" size={24} color="#1f1317" />
                        </View>
                        <View className="flex-1">

                            <Text className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">{recommendations.esma.name}</Text>
                            <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{recommendations.esma.meaning}</Text>
                        </View>
                    </View>
                </TouchableOpacity>



                {/* Alerts & Element Warnings */}
                <View className="px-4 mb-6 gap-4">
                    {recommendations.elementWarning && (
                        <View className="flex-row items-start rounded-[24px] border border-primary/30 bg-primary/5 p-5 shadow-sm">
                            <MaterialIcons name="waves" size={24} color="#ad92c9" />
                            <View className="ml-3 flex-1">
                                <Text className="text-base font-bold text-zinc-900 dark:text-white">{recommendations.elementWarning.elementTr} Elementi Zayıf</Text>
                                <Text className="mt-1 text-sm leading-normal text-zinc-600 dark:text-zinc-300">
                                    {recommendations.elementWarning.advice}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Günlük Egzersiz Card - MOVED UP */}
                    <TouchableOpacity
                        onPress={() => router.push('/workout' as any)}
                        className="overflow-hidden rounded-[24px] shadow-sm"
                        style={{ backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' }}
                    >
                        <View className="flex-row items-center p-5">
                            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                <MaterialIcons name="self-improvement" size={26} color="#fff" />
                            </View>
                            <View className="flex-1">
                                <Text style={{ fontSize: 16, fontWeight: '700', color: '#14532d' }}>Günlük Esneme Rutini</Text>
                                <Text style={{ fontSize: 13, color: '#16a34a', marginTop: 2 }}>10 adım • ~10 dakika</Text>
                            </View>
                            <View style={{ backgroundColor: '#22c55e', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }}>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Başla</Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Weekly Highlights Horizontal Scroll */}
                    <View>
                        <Text className="mb-3 text-lg font-bold text-text-primary-light dark:text-text-primary-dark">Bu Hafta Öne Çıkanlar</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                            {weekly.map((event, idx) => (
                                <View key={idx} className="w-64 rounded-2xl border border-border-light bg-card-light p-4 dark:border-border-dark dark:bg-card-dark">
                                    <View className="flex-row items-center gap-2 mb-2">
                                        <View className="h-2 w-2 rounded-full" style={{ backgroundColor: event.dotColor }} />
                                        <Text className="text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">{new Date(event.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</Text>
                                    </View>
                                    <Text className="text-base font-bold text-text-primary-light dark:text-text-primary-dark mb-1" numberOfLines={1}>{event.title}</Text>
                                    <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark" numberOfLines={2}>{event.description}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Static but relevant alerts */}
                    <View className="flex-row items-start rounded-[24px] border border-yellow-500/30 bg-yellow-50 dark:bg-yellow-500/10 p-5 shadow-sm">
                        <MaterialIcons name="warning-amber" size={24} color="#eab308" />
                        <View className="ml-3 flex-1">
                            <Text className="text-base font-bold text-zinc-900 dark:text-white">Ay Boşlukta Uyarısı</Text>
                            <Text className="mt-1 text-sm leading-normal text-zinc-600 dark:text-zinc-300">
                                Bugün 14:30 - 18:00 arası Ay boşlukta. Önemli kararlarınızı başka bir vakte erteleyin.
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Transit Insights - Limited to 5 with Accordion */}
                <View className="px-4 mb-6">
                    <Text className="mb-4 text-xl font-bold text-text-primary-light dark:text-text-primary-dark">Günün Öne Çıkan Transitleri</Text>
                    {transit.activeTransits.slice(0, 5).map((t, idx) => (
                        <TouchableOpacity 
                            key={idx} 
                            onPress={() => setExpandedTransit(expandedTransit === idx ? null : idx)}
                            activeOpacity={0.8}
                            className="mb-3 rounded-[24px] border border-border-light bg-card-light dark:border-border-dark dark:bg-card-dark shadow-sm overflow-hidden"
                        >
                            <View className="flex-row items-center p-4">
                                <View className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                                    <MaterialIcons 
                                        name={t.nature === 'UYUMLU' ? 'check-circle' : t.nature === 'GERİLİMLİ' ? 'error' : 'flash-on'} 
                                        size={24} 
                                        color="#1f1317" 
                                    />
                                </View>
                                <View className="ml-4 flex-1">
                                    <Text className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">
                                        {t.transitPlanet} {t.aspectType} {t.natalPlanet}
                                    </Text>
                                    <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{t.transitSign} burcunda, {t.affectedHouse}. evinizden geçiyor.</Text>
                                </View>
                                <MaterialIcons name={expandedTransit === idx ? 'expand-less' : 'expand-more'} size={24} color="#9ca3af" />
                            </View>
                            {expandedTransit === idx && (
                                <View className="px-4 pb-4 pt-0 border-t border-border-light dark:border-border-dark">
                                    <Text className="text-sm leading-relaxed text-text-secondary-light dark:text-text-secondary-dark mt-3">
                                        {t.nature === 'UYUMLU' 
                                            ? `Bu uyumlu transit, ${t.transitPlanet} enerjisinin ${t.natalPlanet} ile güzel bir dans içinde olduğunu gösterir. ${t.affectedHouse}. ev konularında akıcı ve destekleyici bir dönemdesiniz.`
                                            : t.nature === 'GERİLİMLİ'
                                            ? `Bu gerilimli transit dikkat gerektirir. ${t.transitPlanet} ve ${t.natalPlanet} arasındaki enerji ${t.affectedHouse}. ev konularında zorluklara işaret edebilir. Sabırlı olun.`
                                            : `${t.transitPlanet} ve ${t.natalPlanet} arasındaki bu transit ${t.affectedHouse}. ev konularında farkındalık getiriyor. Enerjinizi bilinçli kullanın.`
                                        }
                                    </Text>
                                    <View className="flex-row items-center mt-2 gap-2">
                                        <View className="px-3 py-1 rounded-full" style={{ backgroundColor: t.nature === 'UYUMLU' ? '#dcfce7' : t.nature === 'GERİLİMLİ' ? '#fef2f2' : '#fef9c3' }}>
                                            <Text style={{ fontSize: 11, fontWeight: '600', color: t.nature === 'UYUMLU' ? '#16a34a' : t.nature === 'GERİLİMLİ' ? '#dc2626' : '#ca8a04' }}>{t.nature}</Text>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                    
                    <View className="mb-3 flex-row items-center rounded-[24px] border border-border-light bg-card-light p-4 dark:border-border-dark dark:bg-card-dark shadow-sm">
                        <View className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                            <MaterialIcons name="self-improvement" size={24} color="#1f1317" />
                        </View>
                        <View className="ml-4 flex-1">
                            <Text className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">Şanslı Aktivite</Text>
                            <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{recommendations.luckyActivity}</Text>
                        </View>
                    </View>
                </View>


                {/* Important Timings */}
                <View className="px-4 mb-6">
                    <Text className="mb-4 text-xl font-bold text-text-primary-light dark:text-text-primary-dark">Önemli Zamanlamalar</Text>

                    <View className="mb-3 flex-row items-center rounded-[24px] border border-border-light bg-card-light p-4 dark:border-border-dark dark:bg-card-dark shadow-sm">
                        <View className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                            <MaterialIcons name="self-improvement" size={24} color="#1f1317" />
                        </View>
                        <View className="ml-4 flex-1">
                            <Text className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">Dua & Meditasyon</Text>
                            <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">06:00 - 07:30</Text>
                        </View>
                    </View>

                    <View className="mb-3 flex-row items-center rounded-[24px] border border-border-light bg-card-light p-4 dark:border-border-dark dark:bg-card-dark shadow-sm">
                        <View className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                            <MaterialIcons name="record-voice-over" size={24} color="#1f1317" />
                        </View>
                        <View className="ml-4 flex-1">
                            <Text className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">Önemli Konuşma</Text>
                            <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">11:00 - 13:00</Text>
                        </View>
                    </View>

                    <View className="flex-row items-center rounded-[24px] border border-border-light bg-card-light p-4 opacity-60 dark:border-border-dark dark:bg-card-dark shadow-sm">
                        <View className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800">
                            <MaterialIcons name="trending-down" size={24} color="#71717a" />
                        </View>
                        <View className="ml-4 flex-1">
                            <Text className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">Yatırım Kararı</Text>
                            <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Bugün uygun değil</Text>
                        </View>
                    </View>
                </View>

                {/* Personalized Natal Insights - The 15-20 min reading content */}
                <View className="px-4 mt-6 mb-4">
                    <Text className="mb-4 text-xl font-bold text-text-primary-light dark:text-text-primary-dark">Senin İçin... (Hızlı Analiz)</Text>
                    <View className="rounded-[24px] border border-border-light bg-card-light overflow-hidden dark:border-border-dark dark:bg-card-dark shadow-sm">
                        <View className="bg-primary/20 p-4">
                            <Text className="text-sm font-bold text-primary-dark dark:text-primary-light">Bu bilgiler senin doğum haritana özeldir.</Text>
                        </View>
                        <View className="p-4 gap-4">
                            {getNatalSummary(dashboardData.chart).slice(0, 5).map((item, idx) => (
                                <View key={idx} className="flex-row items-start">
                                    <View className="h-6 w-6 rounded-full bg-primary items-center justify-center mt-0.5 mr-3">
                                        <Text className="text-[10px] font-bold text-white">{idx+1}</Text>
                                    </View>
                                    <Text className="flex-1 text-sm leading-relaxed text-text-secondary-light dark:text-text-secondary-dark italic">
                                        "{item}"
                                    </Text>
                                </View>
                            ))}
                            <TouchableOpacity 
                                onPress={() => router.push('/chart' as any)}
                                className="mt-2 items-center"
                            >
                                <Text className="text-sm font-bold text-primary">Tam Analizi Gör →</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Stones of Pera */}
                <View className="px-4 gap-4 mb-8">

                    <TouchableOpacity className="relative flex-row overflow-hidden rounded-[24px] border border-border-light bg-card-light p-5 pt-6 pb-6 dark:border-border-dark dark:bg-card-dark shadow-sm">
                        <View className="flex-1 pr-4 z-10">
                            <Text className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mb-1">Günün Niyeti</Text>
                            <Text className="text-sm font-normal text-text-secondary-light dark:text-text-secondary-dark mb-3">
                                "Bugün sevgi ve bolluğu hayatıma davet ediyorum."
                            </Text>
                            <View className="flex-row items-center">
                                <MaterialIcons name="calendar-month" size={16} color="#ad92c9" />
                                <Text className="text-sm text-[#ad92c9] ml-1 font-medium">Takvime Ekle (Google)</Text>
                            </View>
                        </View>
                        <View className="absolute right-0 top-0 bottom-0 w-24 bg-primary/20 items-center justify-center">
                            <MaterialIcons name="add-task" size={32} color="#f7e1e8" className="opacity-80" />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => Linking.openURL('https://instagram.com')}
                        className="flex-row items-center justify-between rounded-[24px] border border-border-light bg-card-light p-5 dark:border-border-dark dark:bg-card-dark shadow-sm"
                    >
                        <View className="flex-row items-center flex-1 pr-4">
                            <View className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 mr-4">
                                <MaterialIcons name="shopping-bag" size={20} color="#71717a" />
                            </View>
                            <View>
                                <Text className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">Stones of Pera</Text>
                                <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Sana özel taşlar ve takılar</Text>
                            </View>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#71717a" />
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}
