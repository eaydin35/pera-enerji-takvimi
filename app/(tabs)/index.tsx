import { View, Text, ScrollView, TouchableOpacity, Image, SafeAreaView, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../../store/useStore';

import { useRouter } from 'expo-router';

import { useMemo } from 'react';
import { calculateChart } from '../../utils/astrology';
import { getDailyRecommendation, getNatalSummary } from '../../utils/recommendation-engine';
import { calculateDailyTransits, getWeeklyEvents } from '../../utils/transit-engine';

import astroEvents2026 from '../../data/astro_events_2026.json';
import staticData from '../../data/staticData.json';



export default function DashboardScreen() {
    const { userProfile } = useStore();
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


    const todayDateStr = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

    if (!dashboardData) return null;

    const { recommendations, transit, weekly } = dashboardData;

    return (
        <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
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
                    
                    {/* User Avatar Circle right under the name */}
                    <TouchableOpacity 
                        onPress={() => router.push('/profile' as any)}
                        className="mt-3 h-20 w-20 rounded-full border-4 border-white dark:border-zinc-800 shadow-xl overflow-hidden bg-primary/10 items-center justify-center"
                    >
                        {userProfile?.avatarUrl ? (
                            <Image
                                source={{ uri: userProfile.avatarUrl }}
                                className="flex-1 w-full"
                            />
                        ) : (
                            <MaterialIcons name="person" size={40} color="#c4b5c9" />
                        )}
                    </TouchableOpacity>

                    <Text className="mt-4 text-sm text-text-secondary-light dark:text-text-secondary-dark font-medium">
                        {todayDateStr}, Ay {transit.moonSign} burcunda
                    </Text>
                </View>



                {/* Daily Energy Theme */}
                <View className="px-4 mb-4">
                    <View className="overflow-hidden rounded-[24px] border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark shadow-sm">
                        <LinearGradient 
                            colors={['#ad92c9', '#f7e1e8']} 
                            start={{ x: 0, y: 0 }} 
                            end={{ x: 1, y: 1 }}
                            style={{ height: 100, width: '100%', opacity: 0.6 }}
                        />

                        <View className="p-5">
                            <Text className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Günün Enerji Teması</Text>
                            <Text className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mt-1">{transit.energyTheme}</Text>
                            <Text className="text-base font-normal leading-normal text-text-secondary-light dark:text-text-secondary-dark mt-2">
                                {transit.energyDescription}
                            </Text>
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



                {/* Alerts */}
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
                {/* Transit Insights */}
                <View className="px-4 mb-6">
                    <Text className="mb-4 text-xl font-bold text-text-primary-light dark:text-text-primary-dark">Günün Öne Çıkan Transitleri</Text>
                    {transit.activeTransits.map((t, idx) => (
                        <View key={idx} className="mb-3 flex-row items-center rounded-[24px] border border-border-light bg-card-light p-4 dark:border-border-dark dark:bg-card-dark shadow-sm">
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
                        </View>
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

                {/* Günlük Egzersiz Card */}
                <View className="px-4 mb-4">
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
