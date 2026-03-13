import { View, Text, ScrollView, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';
import { useMemo } from 'react';
import { calculateChart } from '../../utils/astrology';

// Maps aspects to styles
const ASPECT_STYLES = {
    "UYUMLU": {
        bg: "bg-emerald-100 dark:bg-emerald-900/30",
        text: "text-emerald-700 dark:text-emerald-400",
        iconContainer: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600",
        iconStr: "change-history" // using standard icon as placeholder for TRINE
    },
    "GERİLİMLİ": {
        bg: "bg-rose-100 dark:bg-rose-900/30",
        text: "text-rose-700 dark:text-rose-400",
        iconContainer: "bg-rose-50 dark:bg-rose-900/20 text-rose-600",
        iconStr: "crop-square" // for SQUARE
    },
    "GÜÇLÜ": {
        bg: "bg-purple-100 dark:bg-purple-900/30",
        text: "text-purple-700 dark:text-purple-400",
        iconContainer: "bg-purple-50 dark:bg-purple-900/20 text-purple-600",
        iconStr: "radio-button-checked" // for CONJUNCTION
    }
} as Record<string, any>;

const PLANET_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
    "Güneş": "light-mode",
    "Ay": "dark-mode",
    "Merkür": "blur-circular",
    "Venüs": "circle",
    "Mars": "adjust",
    "Jüpiter": "donut-large",
    "Satürn": "language",
    "Uranüs": "flare",
    "Neptün": "water",
    "Plüton": "public"
};

const PLANET_COLORS: Record<string, string> = {
    "Güneş": "text-yellow-700 bg-yellow-100",
    "Ay": "text-slate-700 bg-slate-100",
    "Merkür": "text-teal-700 bg-teal-100",
    "Venüs": "text-indigo-700 bg-indigo-100",
    "Mars": "text-red-700 bg-red-100",
    "Jüpiter": "text-orange-700 bg-orange-100",
    "Satürn": "text-stone-700 bg-stone-100",
    "Uranüs": "text-cyan-700 bg-cyan-100",
    "Neptün": "text-blue-700 bg-blue-100",
    "Plüton": "text-purple-700 bg-purple-100",
};

export default function ChartScreen() {
    const { userProfile } = useStore();

    const chartData = useMemo(() => {
        if (!userProfile || !userProfile.birthLat || !userProfile.birthLng) {
            // Default to Istanbul 1990 if incomplete for demo/safety
            return calculateChart("01.01.1990", "12:00", 41.0082, 28.9784);
        }
        return calculateChart(userProfile.birthDate, userProfile.birthTime, userProfile.birthLat, userProfile.birthLng);
    }, [userProfile]);

    return (
        <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
            {/* Header */}
            <View className="flex-row items-center px-4 py-4 border-b border-primary/20 bg-background-light/80 dark:bg-background-dark/80">
                <TouchableOpacity className="p-2 rounded-full hover:bg-primary/20">
                    <MaterialIcons name="arrow-back" size={24} className="text-zinc-900 dark:text-zinc-100" />
                </TouchableOpacity>
                <Text className="flex-1 text-center text-lg font-extrabold tracking-tight text-zinc-900 dark:text-white">
                    Haritam
                </Text>
                <TouchableOpacity className="p-2 rounded-full hover:bg-primary/20">
                    <MaterialIcons name="share" size={24} className="text-zinc-900 dark:text-zinc-100" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                {/* Birth Chart Image Section */}
                <View className="px-4 py-6">
                    <View className="aspect-square w-full rounded-3xl overflow-hidden bg-white dark:bg-zinc-800 shadow-sm border border-primary/10">
                        <Image
                            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AG8M_4m7Z3_8Xf7Wq_zE4-W4U8q8zYmE_o6X6P_f1v0n3H-q0J2I5g4F7L9k0S3G5_5h0v2l1M-W6Q4E3F7R8y9t0U1V2W3X4Y5Z' }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="contain"
                            className="p-4"
                        />
                    </View>
                </View>

                {/* Element Analizi Section */}
                <View className="px-4 pb-8">
                    <View className="bg-white dark:bg-background-dark/50 rounded-3xl p-6 shadow-sm border border-primary/10">
                        <Text className="text-xl font-extrabold tracking-tight mb-6 text-zinc-900 dark:text-white">ELEMENT ANALİZİ</Text>

                        <View className="space-y-6">
                            {/* Fire */}
                            <View className="flex-col gap-2">
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="text-base font-bold text-zinc-900 dark:text-zinc-100">🔥 Ateş (Fire)</Text>
                                    <Text className="text-sm font-semibold opacity-70 text-zinc-900 dark:text-zinc-100">{chartData.elements.fire}%</Text>
                                </View>
                                <View className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <View className="h-full bg-orange-500 rounded-full" style={{ width: `${chartData.elements.fire}%` }} />
                                </View>
                                <Text className="text-xs text-zinc-500 font-medium mt-1">Yüksek enerji, tutku ve inisiyatif.</Text>
                            </View>

                            {/* Earth */}
                            <View className="flex-col gap-2 mt-4">
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="text-base font-bold text-zinc-900 dark:text-zinc-100">⛰️ Toprak (Earth)</Text>
                                    <Text className="text-sm font-semibold opacity-70 text-zinc-900 dark:text-zinc-100">{chartData.elements.earth}%</Text>
                                </View>
                                <View className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <View className="h-full bg-green-500 rounded-full" style={{ width: `${chartData.elements.earth}%` }} />
                                </View>
                                <Text className="text-xs text-zinc-500 font-medium mt-1">Güçlü temel, istikrar ve pratiklik.</Text>
                            </View>

                            {/* Air */}
                            <View className="flex-col gap-2 mt-4">
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="text-base font-bold text-zinc-900 dark:text-zinc-100">💨 Hava (Air)</Text>
                                    <Text className="text-sm font-semibold opacity-70 text-zinc-900 dark:text-zinc-100">{chartData.elements.air}%</Text>
                                </View>
                                <View className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <View className="h-full bg-sky-500 rounded-full" style={{ width: `${chartData.elements.air}%` }} />
                                </View>
                                <Text className="text-xs text-zinc-500 font-medium mt-1">Mükemmel iletişim ve entelektüel odak.</Text>
                            </View>

                            {/* Water */}
                            <View className="flex-col gap-2 mt-4">
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="text-base font-bold text-zinc-900 dark:text-zinc-100">💧 Su (Water)</Text>
                                    <Text className="text-sm font-semibold opacity-70 text-zinc-900 dark:text-zinc-100">{chartData.elements.water}%</Text>
                                </View>
                                <View className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <View className="h-full bg-blue-600 rounded-full" style={{ width: `${chartData.elements.water}%` }} />
                                </View>
                                <Text className="text-xs text-zinc-500 font-medium mt-1">Sezgi ve duygusal derinlik.</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Öne Çıkan Açılar Section */}
                <View className="px-4 pb-8">
                    <Text className="text-lg font-bold mb-4 px-1 uppercase tracking-tight text-zinc-900 dark:text-white">Öne Çıkan Açılar</Text>
                    <View className="space-y-3">
                        {chartData.aspects.map((aspect, idx) => {
                            const styleData = ASPECT_STYLES[aspect.nature] || ASPECT_STYLES["UYUMLU"];

                            return (
                                <View key={idx} className="bg-white dark:bg-background-dark/50 p-4 rounded-2xl border border-primary/10 flex-row items-center justify-between shadow-sm mb-3">
                                    <View className="flex-row items-center gap-4">
                                        <View className={`h-10 w-10 rounded-full flex items-center justify-center ${styleData.iconContainer}`}>
                                            <MaterialIcons name={styleData.iconStr} size={20} />
                                        </View>
                                        <View>
                                            <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                                {aspect.planet1} {aspect.type} {aspect.planet2}
                                            </Text>
                                            <Text className="text-[10px] text-zinc-500 font-medium">Orb: {aspect.orb.toFixed(2)}°</Text>
                                        </View>
                                    </View>
                                    <View className={`px-2 py-1 rounded-full ${styleData.bg}`}>
                                        <Text className={`text-[10px] font-extrabold ${styleData.text}`}>{aspect.nature}</Text>
                                    </View>
                                </View>
                            )
                        })}
                        {chartData.aspects.length === 0 && (
                            <Text className="text-sm text-zinc-500">Önemli/Kesin bir açı bulunamadı.</Text>
                        )}
                    </View>
                </View>

                {/* Planetary Positions */}
                <View className="px-4 pb-8">
                    <Text className="text-lg font-bold mb-4 px-1 text-zinc-900 dark:text-white">Gezegen Konumları</Text>
                    <View className="flex-row flex-wrap justify-between">
                        {chartData.positions.map((pos, idx) => {
                            const iconName = PLANET_ICONS[pos.name] || 'circle';
                            const colors = PLANET_COLORS[pos.name] || 'text-zinc-700 bg-zinc-100';

                            return (
                                <View key={idx} className="w-[48%] bg-white dark:bg-background-dark/50 p-4 rounded-2xl border border-primary/10 flex-row items-center gap-3 shadow-sm mb-3">
                                    <View className={`h-10 w-10 rounded-full flex items-center justify-center ${colors}`}>
                                        <MaterialIcons name={iconName} size={20} />
                                    </View>
                                    <View>
                                        <Text className="text-[10px] uppercase tracking-wider font-bold opacity-50 text-zinc-900 dark:text-zinc-100">{pos.name}</Text>
                                        <Text className="text-sm font-bold text-zinc-900 dark:text-white">{pos.sign} {Math.floor(pos.degreeInSign)}°</Text>
                                    </View>
                                    {pos.isRetrograde && (
                                        <Text className="absolute right-4 top-4 text-xs font-bold text-rose-500">Rx</Text>
                                    )}
                                </View>
                            )
                        })}
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}
