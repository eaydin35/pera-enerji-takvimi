import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface EventGuidance {
    beauty?: string;
    health?: string;
    finance?: string;
    avoid?: string[];
}

interface AstroEvent {
    date: string;
    type: string;
    title: string;
    description: string;
    dotColor: string;
    category?: string;
    intensity?: number;
    guidance?: EventGuidance;
}

interface Props {
    selectedDate: string;
    events: AstroEvent[];
    energyLevel?: number;
}

const MONTH_NAMES = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export default function DayBentoCards({ selectedDate, events, energyLevel }: Props) {
    const dateParts = selectedDate.split('-');
    const day = parseInt(dateParts[2]);
    const month = MONTH_NAMES[parseInt(dateParts[1]) - 1];
    const dateLabel = `${day} ${month}`;

    const primaryEvent = events[0];
    const isPositive = !primaryEvent || primaryEvent.type === 'positive';
    const energyTag = !primaryEvent
        ? 'Sakin Enerji'
        : (primaryEvent.intensity || 3) >= 4
            ? 'Yüksek Enerji'
            : 'Normal Enerji';

    // Collect guidance from all events for this day
    const dayGuidance = events.reduce<EventGuidance>((acc, e) => {
        if (e.guidance) {
            if (e.guidance.beauty && !acc.beauty) acc.beauty = e.guidance.beauty;
            if (e.guidance.health && !acc.health) acc.health = e.guidance.health;
            if (e.guidance.finance && !acc.finance) acc.finance = e.guidance.finance;
            if (e.guidance.avoid?.length) {
                acc.avoid = [...(acc.avoid || []), ...e.guidance.avoid];
            }
        }
        return acc;
    }, {});

    // Remove duplicate avoid items
    if (dayGuidance.avoid) {
        dayGuidance.avoid = [...new Set(dayGuidance.avoid)];
    }

    return (
        <View style={styles.wrapper}>
            {/* Header */}
            <View style={styles.headerRow}>
                <Text style={styles.dateTitle}>Bugün: {dateLabel}</Text>
                <View style={[
                    styles.energyBadge,
                    isPositive ? styles.energyBadgePositive : styles.energyBadgeWarning
                ]}>
                    <Text style={[
                        styles.energyText,
                        isPositive ? styles.energyTextPositive : styles.energyTextWarning
                    ]}>{energyTag}</Text>
                </View>
            </View>

            {/* Bento Grid */}
            <View style={styles.bentoGrid}>
                {/* Hero Card */}
                <View style={styles.heroCard}>
                    <LinearGradient
                        colors={isPositive 
                            ? ['#e8d5f5', '#c9a5d8', '#a87db8']
                            : ['#fde7c6', '#f5c78e', '#e8a85c']
                        }
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.45)']}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.heroOverlay}>
                        <View style={styles.heroTagRow}>
                            <MaterialIcons name="auto-awesome" size={14} color="#f2c6f8" />
                            <Text style={styles.heroTagText}>Günün Etkisi</Text>
                        </View>
                        <Text style={styles.heroTitle}>
                            {primaryEvent ? primaryEvent.title : 'Özel bir astrolojik etki yok'}
                        </Text>
                        {primaryEvent && (
                            <Text style={styles.heroDesc} numberOfLines={2}>
                                {primaryEvent.description}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Bottom Two Cards */}
                <View style={styles.bottomRow}>
                    <View style={styles.smallCard}>
                        <View style={[styles.iconCircle, { backgroundColor: 'rgba(236,72,153,0.1)' }]}>
                            <MaterialIcons name="spa" size={20} color="#ec4899" />
                        </View>
                        <Text style={styles.smallTitle}>Güzellik</Text>
                        <Text style={styles.smallDesc}>
                            {dayGuidance.beauty || 'Dengeli bir gün, rutininize devam edin.'}
                        </Text>
                    </View>
                    <View style={styles.smallCard}>
                        <View style={[styles.iconCircle, { backgroundColor: 'rgba(34,197,94,0.1)' }]}>
                            <MaterialIcons name="favorite" size={20} color="#22c55e" />
                        </View>
                        <Text style={styles.smallTitle}>Sağlık</Text>
                        <Text style={styles.smallDesc}>
                            {dayGuidance.health || 'Sakin ve dengeli bir gün sizi bekliyor.'}
                        </Text>
                    </View>
                </View>

                {/* Finance Card */}
                {dayGuidance.finance && (
                    <View style={[styles.smallCard, { marginTop: 0 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <View style={[styles.iconCircle, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
                                <MaterialIcons name="account-balance" size={20} color="#f59e0b" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.smallTitle}>Finans & İş</Text>
                                <Text style={styles.smallDesc}>{dayGuidance.finance}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Avoid Card */}
                {dayGuidance.avoid && dayGuidance.avoid.length > 0 && (
                    <View style={styles.avoidCard}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <MaterialIcons name="block" size={18} color="#dc2626" />
                            <Text style={styles.avoidTitle}>Bugün Kaçınılması Gerekenler</Text>
                        </View>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                            {dayGuidance.avoid.map((item, idx) => (
                                <View key={idx} style={styles.avoidChip}>
                                    <Text style={styles.avoidChipText}>✕ {item}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        paddingHorizontal: 16,
        marginTop: 24,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    dateTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#33313b',
    },
    energyBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    energyBadgePositive: {
        backgroundColor: '#b8f47a',
    },
    energyBadgeWarning: {
        backgroundColor: '#fde7c6',
    },
    energyText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: -0.3,
    },
    energyTextPositive: {
        color: '#335c00',
    },
    energyTextWarning: {
        color: '#8b5e00',
    },
    bentoGrid: {
        gap: 12,
    },
    heroCard: {
        height: 180,
        borderRadius: 28,
        overflow: 'hidden',
        position: 'relative',
    },
    heroOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
    },
    heroTagRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    heroTagText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#f2c6f8',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    heroTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#ffffff',
        lineHeight: 22,
    },
    heroDesc: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
        lineHeight: 16,
    },
    bottomRow: {
        flexDirection: 'row',
        gap: 12,
    },
    smallCard: {
        flex: 1,
        backgroundColor: '#f1ecf6',
        borderRadius: 28,
        padding: 16,
        gap: 8,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    smallTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#33313b',
    },
    smallDesc: {
        fontSize: 11,
        color: '#605d68',
        lineHeight: 16,
    },
    avoidCard: {
        backgroundColor: '#fef2f2',
        borderRadius: 28,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(220,38,38,0.15)',
    },
    avoidTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#dc2626',
    },
    avoidChip: {
        backgroundColor: 'rgba(220,38,38,0.08)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    avoidChipText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#991b1b',
    },
});
