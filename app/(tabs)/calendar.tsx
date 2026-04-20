import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useState, useMemo, useEffect } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import astroEvents from '../../data/astro_events_2026.json';
import { useAuthStore } from '../../store/useAuthStore';
import { useProfileStore } from '../../store/profileStore';
import { calculateChart } from '../../utils/astrology';
import { chatWithAI } from '../../utils/ai-astrology';
import AILoading from '../../components/AILoading';
import CategoryChips from '../../components/CategoryChips';
import CalendarGrid, { type CalendarEvent } from '../../components/CalendarGrid';
import DayBentoCards from '../../components/DayBentoCards';

type EventGuidance = {
    beauty?: string;
    health?: string;
    finance?: string;
    avoid?: string[];
};

type AstroEvent = {
    date: string;
    type: string;
    title: string;
    description: string;
    dotColor: string;
    category?: string;
    intensity?: number;
    guidance?: EventGuidance;
};

// Map event categories to emoji indicators for calendar cells
const CATEGORY_EMOJI_MAP: Record<string, string> = {
    lunar_phase: '🌙',
    retrograde: '⚠️',
    conjunction: '⭐',
    aspect: '✨',
    planet_ingress: '🪐',
    special_day: '🕌',
    seasonal: '🌿',
    general: '💫',
};

// Map our filter keys to event categories
const FILTER_TO_CATEGORIES: Record<string, string[]> = {
    all: [],
    transit: ['planet_ingress', 'conjunction', 'aspect', 'general'],
    lunar_phase: ['lunar_phase'],
    activity: ['planet_ingress', 'aspect'],
    official: ['special_day'],
    spiritual: ['special_day', 'seasonal'],
    color: [],
    beauty: [], // filters events with guidance.beauty
    health: [], // filters events with guidance.health
};

function CalendarScreen() {
    const { user } = useAuthStore();
    const { profile: userProfile } = useProfileStore();
    
    const today = new Date().toISOString().split('T')[0];
    const todayParts = today.split('-');
    const [currentYear, setCurrentYear] = useState(parseInt(todayParts[0]));
    const [currentMonth, setCurrentMonth] = useState(parseInt(todayParts[1]));
    const [selectedDate, setSelectedDate] = useState(today);
    const [selectedCategory, setSelectedCategory] = useState('all');

    // AI Insight State
    const [weeklyInsight, setWeeklyInsight] = useState<string | null>(null);
    const [isAILoading, setIsAILoading] = useState(false);

    const monthStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;

    // Fetch Weekly AI Insight
    const fetchWeeklyInsight = async () => {
        if (!user) return;
        
        setIsAILoading(true);
        setWeeklyInsight(null);

        const natalChart = calculateChart(
            userProfile?.birthDate || "01.01.1990",
            userProfile?.birthTime || "12:00",
            userProfile?.birthLat || 41.0082,
            userProfile?.birthLng || 28.9784
        );

        const prompt = `Bu hafta (${monthStr}) ile ilgili öneri, yorum ve astrolojik içgörüleri alabilir miyim? Haftanın gezegen enerjilerini benim haritama göre yorumla. Emek ve niyet ritüelleri ekle.`;
        const insight = await chatWithAI(user.id, prompt, [], natalChart, null, userProfile!);
        setWeeklyInsight(insight);
        setIsAILoading(false);
    };

    // Reset insight when month changes
    useEffect(() => {
        setWeeklyInsight(null); 
    }, [monthStr]);

    // Filter events based on selected category
    const filteredEvents = useMemo(() => {
        const allEvents = astroEvents as AstroEvent[];
        if (selectedCategory === 'all') return allEvents;
        
        // Special filters that check guidance field
        if (selectedCategory === 'beauty') {
            return allEvents.filter(e => e.guidance?.beauty || e.guidance?.avoid?.length);
        }
        if (selectedCategory === 'health') {
            return allEvents.filter(e => e.guidance?.health);
        }
        
        const allowedCategories = FILTER_TO_CATEGORIES[selectedCategory] || [];
        if (allowedCategories.length === 0) return allEvents;
        
        return allEvents.filter(e => allowedCategories.includes(e.category || ''));
    }, [selectedCategory]);

    // Calendar events for the grid
    const calendarEvents: CalendarEvent[] = useMemo(() => {
        return filteredEvents
            .filter(e => e.date.startsWith(monthStr))
            .map(e => ({
                date: e.date,
                emoji: CATEGORY_EMOJI_MAP[e.category || 'general'] || '💫',
                dotColor: e.dotColor,
                type: e.type,
            }));
    }, [filteredEvents, monthStr]);

    // Events for the selected specific day (from full data)
    const dayEvents = useMemo(() => {
        return (astroEvents as AstroEvent[]).filter(e => e.date === selectedDate);
    }, [selectedDate]);

    // Month events summary
    const monthEvents = useMemo(() => {
        return filteredEvents.filter(e => e.date.startsWith(monthStr));
    }, [filteredEvents, monthStr]);

    const positiveMonthEvents = monthEvents.filter(e => e.type === 'positive');
    const negativeMonthEvents = monthEvents.filter(e => e.type === 'negative');

    const handlePrevMonth = () => {
        if (currentMonth === 1) {
            setCurrentMonth(12);
            setCurrentYear(y => y - 1);
        } else {
            setCurrentMonth(m => m - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 12) {
            setCurrentMonth(1);
            setCurrentYear(y => y + 1);
        } else {
            setCurrentMonth(m => m + 1);
        }
    };

    const MONTH_NAMES = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const monthYear = `${MONTH_NAMES[currentMonth - 1]} ${currentYear}`;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fdf8ff' }}>
            {/* Header */}
            <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
                <Text style={{ fontSize: 24, fontWeight: '800', color: '#33313b', letterSpacing: -0.5 }}>
                    Takvim
                </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
                {/* Category Chips */}
                <CategoryChips selected={selectedCategory} onSelect={setSelectedCategory} />

                {/* Custom Calendar Grid */}
                <CalendarGrid
                    year={currentYear}
                    month={currentMonth}
                    selectedDate={selectedDate}
                    events={calendarEvents}
                    onSelectDate={setSelectedDate}
                    onPrevMonth={handlePrevMonth}
                    onNextMonth={handleNextMonth}
                />

                {/* Selected Day Bento Cards */}
                <DayBentoCards
                    selectedDate={selectedDate}
                    events={dayEvents}
                />

                {/* Kozmik Rehber AI Section */}
                <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <Text style={{ fontSize: 20, fontWeight: '800', color: '#33313b' }}>
                            Kozmik Rehber
                        </Text>
                        <MaterialIcons name="auto-awesome" size={20} color="#76527d" />
                    </View>

                    {isAILoading ? (
                        <AILoading />
                    ) : weeklyInsight ? (
                        <View style={{
                            borderRadius: 24,
                            backgroundColor: '#ffffff',
                            borderWidth: 1,
                            borderColor: 'rgba(118,82,125,0.2)',
                            padding: 20,
                            shadowColor: '#76527d',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.04,
                            shadowRadius: 12,
                            elevation: 2,
                        }}>
                            <Text style={{ fontSize: 13, lineHeight: 20, color: '#605d68', fontWeight: '500' }}>
                                {weeklyInsight}
                            </Text>
                            <View style={{
                                marginTop: 16, paddingTop: 16,
                                borderTopWidth: 1, borderTopColor: '#f1ecf6',
                                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                            }}>
                                <Text style={{ fontSize: 10, color: '#b4b0bc', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                                    Gemini AI Synthesized
                                </Text>
                                <TouchableOpacity onPress={fetchWeeklyInsight}>
                                    <MaterialIcons name="refresh" size={16} color="#76527d" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity 
                            onPress={fetchWeeklyInsight}
                            style={{
                                borderRadius: 20,
                                backgroundColor: 'rgba(118,82,125,0.08)',
                                borderWidth: 1,
                                borderColor: 'rgba(118,82,125,0.2)',
                                padding: 20,
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'row',
                                gap: 8,
                            }}
                        >
                            <MaterialIcons name="auto-awesome" size={20} color="#76527d" />
                            <Text style={{ fontSize: 14, fontWeight: '700', color: '#5e3d66' }}>
                                Bu Haftanın İçgörülerini Al
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Manevi Rehber / Day Detail */}
                {dayEvents.length > 0 && (
                    <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
                        <Text style={{ fontSize: 20, fontWeight: '800', color: '#33313b', marginBottom: 12 }}>
                            Manevi Rehber
                        </Text>
                        {dayEvents.map((event, i) => (
                            <View key={i} style={{
                                backgroundColor: '#ffffff',
                                padding: 16,
                                borderRadius: 24,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 12,
                                marginBottom: 8,
                                shadowColor: 'rgba(118,82,125,0.04)',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 1,
                                shadowRadius: 20,
                                elevation: 1,
                            }}>
                                <View style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 14,
                                    backgroundColor: event.type === 'positive' ? '#f0fdf4' : '#fef3c7',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <MaterialIcons 
                                        name={event.type === 'positive' ? 'auto-awesome' : 'warning-amber'} 
                                        size={20} 
                                        color={event.type === 'positive' ? '#22c55e' : '#f59e0b'} 
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#33313b' }}>
                                        {event.title}
                                    </Text>
                                    <Text style={{ fontSize: 12, color: '#7c7984', marginTop: 2, fontStyle: 'italic' }} numberOfLines={2}>
                                        {event.description}
                                    </Text>
                                </View>
                                <MaterialIcons name="chevron-right" size={20} color="#b4b0bc" />
                            </View>
                        ))}
                    </View>
                )}

                {/* Month Events Summary */}
                <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: '#33313b', marginBottom: 12 }}>
                        {monthYear} – Aylık Özet
                    </Text>

                    {monthEvents.length === 0 ? (
                        <View style={{
                            borderRadius: 20, borderWidth: 1, borderColor: '#e6e0ed',
                            backgroundColor: '#ffffff', padding: 20,
                        }}>
                            <Text style={{ fontSize: 13, color: '#7c7984' }}>
                                Bu ay için kayıtlı özel bir astrolojik olay bulunmuyor.
                            </Text>
                        </View>
                    ) : (
                        <>
                            {positiveMonthEvents.length > 0 && (
                                <View style={{
                                    marginBottom: 12, borderRadius: 24,
                                    borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)',
                                    backgroundColor: '#f0fdf4', padding: 20,
                                }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 }}>
                                        <MaterialIcons name="star" size={20} color="#22c55e" />
                                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#33313b' }}>Bu Ayın Fırsatları</Text>
                                    </View>
                                    {positiveMonthEvents.map((event, i) => (
                                        <View key={i} style={{ marginBottom: 8 }}>
                                            <Text style={{ fontSize: 13, fontWeight: '600', color: '#33313b' }}>
                                                {event.date.split('-').reverse().join('.')} · {event.title}
                                            </Text>
                                            <Text style={{ fontSize: 12, color: '#605d68', marginTop: 2, lineHeight: 16 }}>
                                                {event.description}
                                            </Text>
                                            {i < positiveMonthEvents.length - 1 && (
                                                <View style={{ marginTop: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(34,197,94,0.15)' }} />
                                            )}
                                        </View>
                                    ))}
                                </View>
                            )}

                            {negativeMonthEvents.length > 0 && (
                                <View style={{
                                    borderRadius: 24,
                                    borderWidth: 1, borderColor: 'rgba(249,115,22,0.2)',
                                    backgroundColor: '#fff7ed', padding: 20,
                                }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 }}>
                                        <MaterialIcons name="warning-amber" size={20} color="#f97316" />
                                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#33313b' }}>Bu Ayın Dikkat Noktaları</Text>
                                    </View>
                                    {negativeMonthEvents.map((event, i) => (
                                        <View key={i} style={{ marginBottom: 8 }}>
                                            <Text style={{ fontSize: 13, fontWeight: '600', color: '#33313b' }}>
                                                {event.date.split('-').reverse().join('.')} · {event.title}
                                            </Text>
                                            <Text style={{ fontSize: 12, color: '#605d68', marginTop: 2, lineHeight: 16 }}>
                                                {event.description}
                                            </Text>
                                            {i < negativeMonthEvents.length - 1 && (
                                                <View style={{ marginTop: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(249,115,22,0.15)' }} />
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
