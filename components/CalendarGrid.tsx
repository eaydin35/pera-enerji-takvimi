import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CALENDAR_PADDING = 24; // px-4 = 16, but inside container with p-5 = 20+4
const CELL_GAP = 4;
const COLS = 7;
const CELL_SIZE = (SCREEN_WIDTH - 32 - 40 - (COLS - 1) * CELL_GAP) / COLS; // px-4 outer + p-5 inner

const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export interface CalendarEvent {
    date: string;
    emoji?: string;
    dotColor?: string;
    type?: string;
}

interface Props {
    year: number;
    month: number; // 1-indexed
    selectedDate: string;
    events: CalendarEvent[];
    onSelectDate: (date: string) => void;
    onPrevMonth: () => void;
    onNextMonth: () => void;
}

function getMonthData(year: number, month: number) {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();

    // Monday-based (0=Mon, 6=Sun)
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    // Previous month's trailing days
    const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
    const prevDays: number[] = [];
    for (let i = startDow - 1; i >= 0; i--) {
        prevDays.push(prevMonthLastDay - i);
    }

    // Current month days
    const currentDays: number[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
        currentDays.push(i);
    }

    // Next month leading days to fill 6 rows (or at least complete the last row)
    const totalCells = prevDays.length + currentDays.length;
    const rows = Math.ceil(totalCells / 7);
    const nextDaysCount = rows * 7 - totalCells;
    const nextDays: number[] = [];
    for (let i = 1; i <= nextDaysCount; i++) {
        nextDays.push(i);
    }

    return { prevDays, currentDays, nextDays, startDow };
}

const MONTH_NAMES = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export default function CalendarGrid({ year, month, selectedDate, events, onSelectDate, onPrevMonth, onNextMonth }: Props) {
    const { prevDays, currentDays, nextDays } = useMemo(
        () => getMonthData(year, month), [year, month]
    );

    const eventMap = useMemo(() => {
        const map: Record<string, CalendarEvent[]> = {};
        events.forEach(ev => {
            if (!map[ev.date]) map[ev.date] = [];
            map[ev.date].push(ev);
        });
        return map;
    }, [events]);

    const today = new Date().toISOString().split('T')[0];

    const renderCell = (day: number, type: 'prev' | 'current' | 'next') => {
        let dateStr = '';
        if (type === 'current') {
            dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        }
        const isSelected = dateStr === selectedDate;
        const isToday = dateStr === today;
        const dayEvents = dateStr ? eventMap[dateStr] || [] : [];
        const topEmoji = dayEvents.find(e => e.emoji)?.emoji;
        const dotColor = dayEvents.find(e => e.dotColor)?.dotColor;

        return (
            <TouchableOpacity
                key={`${type}-${day}`}
                style={[
                    styles.cell,
                    isSelected && styles.cellSelected,
                ]}
                onPress={() => {
                    if (type === 'current') onSelectDate(dateStr);
                }}
                activeOpacity={type === 'current' ? 0.6 : 1}
                disabled={type !== 'current'}
            >
                {topEmoji && (
                    <Text style={styles.cellEmoji}>{topEmoji}</Text>
                )}
                <Text style={[
                    styles.cellText,
                    type !== 'current' && styles.cellTextMuted,
                    isSelected && styles.cellTextSelected,
                    isToday && !isSelected && styles.cellTextToday,
                ]}>
                    {day}
                </Text>
                {dotColor && (
                    <View style={[styles.cellDot, { backgroundColor: dotColor }]} />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.wrapper}>
            {/* Month Navigation */}
            <View style={styles.monthNav}>
                <Text style={styles.monthTitle}>{MONTH_NAMES[month - 1]} {year}</Text>
                <View style={styles.monthArrows}>
                    <TouchableOpacity onPress={onPrevMonth} style={styles.arrowBtn} activeOpacity={0.6}>
                        <MaterialIcons name="chevron-left" size={24} color="#76527d" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onNextMonth} style={styles.arrowBtn} activeOpacity={0.6}>
                        <MaterialIcons name="chevron-right" size={24} color="#76527d" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Calendar Container */}
            <View style={styles.container}>
                {/* Day Headers */}
                <View style={styles.headerRow}>
                    {DAY_NAMES.map(d => (
                        <View key={d} style={styles.headerCell}>
                            <Text style={styles.headerText}>{d}</Text>
                        </View>
                    ))}
                </View>

                {/* Grid */}
                <View style={styles.grid}>
                    {prevDays.map(d => renderCell(d, 'prev'))}
                    {currentDays.map(d => renderCell(d, 'current'))}
                    {nextDays.map(d => renderCell(d, 'next'))}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        paddingHorizontal: 16,
        marginTop: 4,
    },
    monthNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    monthTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#33313b',
        letterSpacing: -0.5,
    },
    monthArrows: {
        flexDirection: 'row',
        gap: 6,
    },
    arrowBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f7f2fb',
        alignItems: 'center',
        justifyContent: 'center',
    },
    container: {
        backgroundColor: '#f7f2fb',
        borderRadius: 32,
        padding: 20,
    },
    headerRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    headerCell: {
        flex: 1,
        alignItems: 'center',
    },
    headerText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#7c7984',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    cell: {
        width: `${100 / 7}%` as any,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        position: 'relative',
        marginVertical: 2,
    },
    cellSelected: {
        backgroundColor: '#ffffff',
        borderWidth: 2,
        borderColor: '#76527d',
        shadowColor: '#76527d',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 3,
    },
    cellText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#33313b',
    },
    cellTextMuted: {
        opacity: 0.25,
        color: '#7c7984',
    },
    cellTextSelected: {
        fontWeight: '700',
        color: '#76527d',
    },
    cellTextToday: {
        color: '#76527d',
        fontWeight: '800',
    },
    cellEmoji: {
        position: 'absolute',
        top: 1,
        right: 2,
        fontSize: 9,
    },
    cellDot: {
        position: 'absolute',
        bottom: 3,
        width: 4,
        height: 4,
        borderRadius: 2,
    },
});
