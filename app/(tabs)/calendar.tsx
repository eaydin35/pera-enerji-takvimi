import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useMemo, useEffect } from 'react';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import astroEvents from '../../data/astro_events_2026.json';
import { useAuthStore } from '../../store/useAuthStore';
import { useProfileStore } from '../../store/profileStore';
import { calculateChart } from '../../utils/astrology';
import { getAstrologyInsight, chatWithAI } from '../../utils/ai-astrology';
import AILoading from '../../components/AILoading';

LocaleConfig.locales['tr'] = {
  monthNames: [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ],
  monthNamesShort: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
  dayNames: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
  dayNamesShort: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
  today: 'Bugün'
};
LocaleConfig.defaultLocale = 'tr';

type AstroEvent = {
  date: string;
  type: string;
  title: string;
  description: string;
  dotColor: string;
};

function CalendarScreen() {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { user } = useAuthStore();
    const { profile: userProfile } = useProfileStore();
    
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    const [currentMonth, setCurrentMonth] = useState(today.substring(0, 7)); // "2026-03"

    // AI Insight State
    const [weeklyInsight, setWeeklyInsight] = useState<string | null>(null);
    const [isAILoading, setIsAILoading] = useState(false);

    // Fetch Weekly AI Insight
    const fetchWeeklyInsight = async () => {
        if (!user) return;
        
        setIsAILoading(true);
        setWeeklyInsight(null);

        // Get user's natal chart for personalization
        const natalChart = calculateChart(
            userProfile?.birthDate || "01.01.1990",
            userProfile?.birthTime || "12:00",
            userProfile?.birthLat || 41.0082,
            userProfile?.birthLng || 28.9784
        );

        const prompt = `Bu hafta (${currentMonth}) ile ilgili öneri, yorum ve astrolojik içgörüleri alabilir miyim? Haftanın gezegen enerjilerini benim haritama göre yorumla. Emek ve niyet ritüelleri ekle.`;
        const insight = await chatWithAI(user.id, prompt, [], natalChart, null, userProfile!);
        setWeeklyInsight(insight);
        setIsAILoading(false);
    };

    // Auto-fetch removed as per user request to encourage manual button press (token usage)
    useEffect(() => {
        setWeeklyInsight(null); 
    }, [currentMonth]);

    // Build marked dates from events data
    const markedDates = useMemo(() => {
        const marks: any = {};
        (astroEvents as AstroEvent[]).forEach(event => {
            const existing = marks[event.date];
            if (existing) {
                // Multiple events on same day – ensure dots is an array
                if (!existing.dots) {
                    existing.dots = [{ key: event.date + '_0', color: existing.dotColor || '#ad92c9' }];
                    delete existing.dotColor;
                }
                existing.dots.push({ key: event.date + '_' + existing.dots.length, color: event.dotColor });
                existing.marked = true;
            } else {
                marks[event.date] = { marked: true, dotColor: event.dotColor };
            }
        });
        // Overlay selected date
        if (marks[selectedDate]) {
            marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: '#f7e1e8', selectedTextColor: '#1f2937' };
        } else {
            marks[selectedDate] = { selected: true, selectedColor: '#f7e1e8', selectedTextColor: '#1f2937' };
        }
        return marks;
    }, [selectedDate]);

    // Events for the current month
    const monthEvents = useMemo(() => {
        return (astroEvents as AstroEvent[]).filter(e => e.date.startsWith(currentMonth));
    }, [currentMonth]);

    const positiveMonthEvents = monthEvents.filter(e => e.type === 'positive');
    const negativeMonthEvents = monthEvents.filter(e => e.type === 'negative');

    // Events for the selected specific day
    const dayEvents = useMemo(() => {
        return (astroEvents as AstroEvent[]).filter(e => e.date === selectedDate);
    }, [selectedDate]);

    const monthYear = useMemo(() => {
        const [y, m] = currentMonth.split('-');
        const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        return `${months[parseInt(m) - 1]} ${y}`;
    }, [currentMonth]);

    return (
        <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
            <View className="px-4 pt-4 pb-2">
                <Text className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">Takvim</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

                {/* Calendar */}
                <View className="px-4 mt-4">
                    <View className="rounded-[24px] overflow-hidden border border-border-light dark:border-border-dark shadow-sm">
                        <Calendar
                            current={today}
                            onDayPress={(day: any) => setSelectedDate(day.dateString)}
                            onMonthChange={(month: any) => setCurrentMonth(`${month.year}-${month.month.toString().padStart(2, '0')}`)}
                            markedDates={markedDates}
                            markingType="dot"
                            enableSwipeMonths={true}
                            theme={{
                                calendarBackground: isDark ? '#261933' : '#ffffff',
                                textSectionTitleColor: isDark ? '#ad92c9' : '#6b7280',
                                selectedDayBackgroundColor: '#f7e1e8',
                                selectedDayTextColor: '#1f2937',
                                todayTextColor: '#ad92c9',
                                dayTextColor: isDark ? '#ffffff' : '#1f2937',
                                textDisabledColor: isDark ? '#4d3267' : '#d1d5db',
                                dotColor: '#ad92c9',
                                selectedDotColor: '#1f2937',
                                arrowColor: isDark ? '#ffffff' : '#1f2937',
                                monthTextColor: isDark ? '#ffffff' : '#1f2937',
                                textDayFontWeight: '500',
                                textMonthFontWeight: 'bold',
                                textDayHeaderFontWeight: '600',
                                textDayHeaderFontSize: 13,
                            } as any}
                        />
                    </View>
                </View>

                {/* Kozmik Rehber AI Section */}
                <View className="px-4 mt-6">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                            Kozmik Rehber
                        </Text>
                        <MaterialIcons name="auto-awesome" size={20} color="#ad92c9" />
                    </View>

                    {isAILoading ? (
                        <AILoading />
                    ) : weeklyInsight ? (
                        <View className="rounded-[24px] bg-white border border-primary/20 p-6 shadow-sm dark:bg-zinc-900 overflow-hidden">
                            <LinearGradient
                                colors={['rgba(173, 146, 201, 0.05)', 'transparent']}
                                className="absolute inset-0"
                            />
                            <Text className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 font-medium">
                                {weeklyInsight}
                            </Text>
                            <View className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex-row items-center justify-between">
                                <Text className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                                    Gemini AI Synthesized
                                </Text>
                                <TouchableOpacity onPress={fetchWeeklyInsight}>
                                    <MaterialIcons name="refresh" size={16} color="#ad92c9" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity 
                            onPress={fetchWeeklyInsight}
                            className="rounded-[20px] bg-primary/10 border border-primary/30 p-5 items-center justify-center flex-row gap-2"
                        >
                            <MaterialIcons name="auto-awesome" size={20} color="#ad92c9" />
                            <Text className="text-sm font-bold text-primary-dark">Bu Haftanın İçgörülerini Al</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Selected Day Events */}
                <View className="px-4 mt-6">
                    <Text className="mb-3 text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                        Seçili Gün
                    </Text>
                    {dayEvents.length === 0 ? (
                        <View className="rounded-[20px] border border-border-light bg-card-light p-5 dark:border-border-dark dark:bg-card-dark">
                            <View className="flex-row items-center gap-2">
                                <MaterialIcons name="check-circle" size={22} color="#22c55e" />
                                <Text className="text-base font-semibold text-text-primary-light dark:text-text-primary-dark">
                                    Sakin bir gün
                                </Text>
                            </View>
                            <Text className="mt-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                Bu tarihte kayıtlı özel bir astrolojik olay yok. Gündelik akışınız sakin geçebilir.
                            </Text>
                        </View>
                    ) : (
                        dayEvents.map((event, i) => (
                            <View
                                key={i}
                                className={`mb-3 flex-row items-start rounded-[20px] p-5 ${
                                    event.type === 'negative'
                                        ? 'border border-orange-400/30 bg-orange-50 dark:bg-orange-500/10'
                                        : 'border border-green-400/30 bg-green-50 dark:bg-green-500/10'
                                }`}
                            >
                                <MaterialIcons
                                    name={event.type === 'negative' ? 'warning-amber' : 'auto-awesome'}
                                    size={22}
                                    color={event.type === 'negative' ? '#f97316' : '#22c55e'}
                                />
                                <View className="ml-3 flex-1">
                                    <Text className="text-base font-bold text-zinc-900 dark:text-white">{event.title}</Text>
                                    <Text className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{event.description}</Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {/* Month Events Summary */}
                <View className="px-4 mt-6">
                    <Text className="mb-3 text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                        {monthYear} – Aylık Özet
                    </Text>

                    {monthEvents.length === 0 ? (
                        <View className="rounded-[20px] border border-border-light bg-card-light p-5 dark:border-border-dark dark:bg-card-dark">
                            <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                Bu ay için kayıtlı özel bir astrolojik olay bulunmuyor.
                            </Text>
                        </View>
                    ) : (
                        <>
                            {positiveMonthEvents.length > 0 && (
                                <View className="mb-3 rounded-[20px] border border-green-400/30 bg-green-50 dark:bg-green-500/10 p-5">
                                    <View className="flex-row items-center mb-2">
                                        <MaterialIcons name="star" size={20} color="#22c55e" />
                                        <Text className="ml-2 text-base font-bold text-zinc-900 dark:text-white">Bu Ayın Fırsatları</Text>
                                    </View>
                                    {positiveMonthEvents.map((event, i) => (
                                        <View key={i} className="mb-2">
                                            <Text className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                                                {event.date.split('-').reverse().join('.')} · {event.title}
                                            </Text>
                                            <Text className="text-sm text-zinc-600 dark:text-zinc-300 mt-0.5 leading-relaxed">
                                                {event.description}
                                            </Text>
                                            {i < positiveMonthEvents.length - 1 && (
                                                <View className="mt-2 border-b border-green-200 dark:border-green-900" />
                                            )}
                                        </View>
                                    ))}
                                </View>
                            )}

                            {negativeMonthEvents.length > 0 && (
                                <View className="rounded-[20px] border border-orange-400/30 bg-orange-50 dark:bg-orange-500/10 p-5">
                                    <View className="flex-row items-center mb-2">
                                        <MaterialIcons name="warning-amber" size={20} color="#f97316" />
                                        <Text className="ml-2 text-base font-bold text-zinc-900 dark:text-white">Bu Ayın Dikkat Noktaları</Text>
                                    </View>
                                    {negativeMonthEvents.map((event, i) => (
                                        <View key={i} className="mb-2">
                                            <Text className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                                                {event.date.split('-').reverse().join('.')} · {event.title}
                                            </Text>
                                            <Text className="text-sm text-zinc-600 dark:text-zinc-300 mt-0.5 leading-relaxed">
                                                {event.description}
                                            </Text>
                                            {i < negativeMonthEvents.length - 1 && (
                                                <View className="mt-2 border-b border-orange-200 dark:border-orange-900" />
                                            )}
                                        </View>
                                    ))}
                                </View>
                            )}
                        </>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

export default CalendarScreen;
