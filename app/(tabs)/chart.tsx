import React, { useMemo, useEffect, useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, SafeAreaView,
    StyleSheet, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';
import { calculateChart, type ChartData, type PlanetPosition } from '../../utils/astrology';
import { supabase } from '../../utils/supabase';
import NatalChart from '../../components/NatalChart';
import housesKB from '../../data/houses_kb.json';
import astrologyKB from '../../data/astrology_kb.json';


// ─── Planet visual configs ───────────────────────────────────────────────────

const PLANET_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
    "Gunes":  "light-mode",  "Ay":     "dark-mode",
    "Merkur": "blur-circular","Venus":  "circle",
    "Mars":   "adjust",      "Jupiter":"donut-large",
    "Saturn": "language",     "Uranus": "flare",
    "Neptun": "water",       "Pluton": "public",
};

const PLANET_COLORS: Record<string, string> = {
    "Gunes":  "#f59e0b", "Ay":     "#94a3b8",
    "Merkur": "#14b8a6", "Venus":  "#ec4899",
    "Mars":   "#ef4444", "Jupiter":"#f97316",
    "Saturn": "#78716c", "Uranus": "#06b6d4",
    "Neptun": "#3b82f6", "Pluton": "#7c3aed",
};

const ASPECT_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
    "UYUMLU":    { bg: '#d1fae5', text: '#059669', icon: 'change-history' },
    "GER\u0130ML\u0130": { bg: '#ffe4e6', text: '#e11d48', icon: 'crop-square' },
    "G\u00dc\u00c7L\u00dc":     { bg: '#ede9fe', text: '#7c3aed', icon: 'radio-button-checked' },
};

function getZodiacEmoji(sign: string): string {
    const map: Record<string, string> = {
        'Koc': '\u2648', 'Boga': '\u2649', 'Ikizler': '\u264A', 'Yengec': '\u264B',
        'Aslan': '\u264C', 'Basak': '\u264D', 'Terazi': '\u264E', 'Akrep': '\u264F',
        'Yay': '\u2650', 'Oglak': '\u2651', 'Kova': '\u2652', 'Balik': '\u2653',
    };
    // Normalize Turkish chars for lookup
    const norm = sign.replace(/\u015f/g,'s').replace(/\u00e7/g,'c').replace(/\u00fc/g,'u')
                     .replace(/\u00f6/g,'o').replace(/\u0131/g,'i').replace(/\u011f/g,'g')
                     .replace(/\u0130/g,'I').replace(/\u00dc/g,'U').replace(/\u00d6/g,'O')
                     .replace(/\u015e/g,'S').replace(/\u00c7/g,'C').replace(/\u011e/g,'G');
    return map[norm] || '\u2B50';
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ChartScreen() {
    const { userProfile } = useStore();
    const { user } = useAuthStore();
    const [saving, setSaving] = useState(false);
    const [calcError, setCalcError] = useState<string | null>(null);

    const chartData = useMemo(() => {
        try {
            if (!userProfile || !userProfile.birthLat || !userProfile.birthLng) {
                return calculateChart("01.01.1990", "12:00", 41.0082, 28.9784);
            }
            return calculateChart(
                userProfile.birthDate,
                userProfile.birthTime,
                userProfile.birthLat,
                userProfile.birthLng
            );
        } catch (e: any) {
            setCalcError(e?.message || 'Harita hesaplama hatasi');
            // Return a safe empty chart
            return {
                positions: [],
                aspects: [],
                elements: { fire: 25, earth: 25, air: 25, water: 25 },
                ascendant: 0,
                houses: Array.from({ length: 12 }, (_, i) => i * 30),
            };
        }
    }, [userProfile]);

    // Save chart to Supabase once
    useEffect(() => {
        if (!user || !chartData || saving) return;
        setSaving(true);
        supabase.from('birth_charts').upsert({
            user_id: user.id,
            profile_type: 'self',
            birth_date: userProfile?.birthDate || '',
            birth_time: userProfile?.birthTime || '',
            birth_place: userProfile?.birthPlace || '',
            birth_lat: userProfile?.birthLat || 0,
            birth_lng: userProfile?.birthLng || 0,
            chart_data: chartData,
        }, { onConflict: 'user_id,profile_type' }).then(() => setSaving(false));
    }, [user, chartData]);

    // Zodiac signs for ascendant display
    const ascSign = chartData.positions.length > 0
        ? (() => {
            const norm = chartData.ascendant % 360;
            const signs = ["Ko\u00e7","Bo\u011fa","\u0130kizler","Yenge\u00e7","Aslan","Ba\u015fak","Terazi","Akrep","Yay","O\u011flak","Kova","Bal\u0131k"];
            return signs[Math.floor(norm / 30)];
        })()
        : '';

    // Calculate house signs
    const ZODIAC_SIGNS_TR = ["Ko\u00e7","Bo\u011fa","\u0130kizler","Yenge\u00e7","Aslan","Ba\u015fak","Terazi","Akrep","Yay","O\u011flak","Kova","Bal\u0131k"];
    const houseSignData = chartData.houses.map((cusp, idx) => {
        const signIdx = Math.floor((cusp % 360) / 30);
        const sign = ZODIAC_SIGNS_TR[signIdx];
        const houseNum = (idx + 1).toString();
        const houseKB = (housesKB as any)[houseNum];
        const meaning = houseKB?.[sign] || '';
        const houseName = houseKB?.name || `${houseNum}. Ev`;
        return { num: idx + 1, sign, meaning, houseName };
    });

    // Planet name mapping for aspect KB lookup
    const PLANET_TR_TO_EN: Record<string, string> = {
        'G\u00fcne\u015f': 'Sun', 'Ay': 'Moon', 'Merk\u00fcr': 'Mercury',
        'Ven\u00fcs': 'Venus', 'Mars': 'Mars', 'J\u00fcpiter': 'Jupiter',
        'Sat\u00fcrn': 'Saturn'
    };
    const ASPECT_TYPE_MAP: Record<string, string> = {
        'Kavusum': 'Kavu\u015fum', 'Ucgen': '\u00dc\u00e7gen', 'Kare': 'Kare', 
        'Karsit': 'Kar\u015f\u0131t', 'Sekstil': 'Sekstil',
        'Kavu\u015fum': 'Kavu\u015fum', '\u00dc\u00e7gen': '\u00dc\u00e7gen', 'Kar\u015f\u0131t': 'Kar\u015f\u0131t'
    };

    function getAspectComment(p1: string, p2: string, aspectType: string): string {
        const en1 = PLANET_TR_TO_EN[p1];
        const en2 = PLANET_TR_TO_EN[p2];
        if (!en1 || !en2) return '';
        const key = `${en1}-${en2}`;
        const reverseKey = `${en2}-${en1}`;
        const typeTR = ASPECT_TYPE_MAP[aspectType] || aspectType;
        const aspects = (astrologyKB as any).aspects;
        const entry = aspects?.[key] || aspects?.[reverseKey];
        return entry?.[typeTR] || '';
    }


    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ width: 44 }} />
                <Text style={styles.headerTitle}>Dogum Haritam</Text>
                <TouchableOpacity style={styles.headerBtn}>
                    <MaterialIcons name="share" size={22} color="#374151" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

                {/* ── SVG Natal Chart ── */}
                <View style={styles.chartSection}>
                    <View style={styles.chartCard}>
                        <NatalChart
                            positions={chartData.positions}
                            aspects={chartData.aspects}
                            ascendant={chartData.ascendant}
                            size={320}
                        />
                    </View>
                    {/* Ascendant badge */}
                    <View style={styles.ascBadge}>
                        <Text style={styles.ascLabel}>Yukselen</Text>
                        <Text style={styles.ascValue}>{getZodiacEmoji(ascSign)} {ascSign}</Text>
                        <Text style={styles.ascDeg}>{(chartData.ascendant % 30).toFixed(1)}\u00b0</Text>
                    </View>
                </View>

                {/* ── Element Analysis ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ELEMENT ANALIZI</Text>
                    <View style={styles.elemCard}>
                        {[
                            { emoji: '\uD83D\uDD25', name: 'Ates', pct: chartData.elements.fire,  color: '#f97316' },
                            { emoji: '\u26F0\uFE0F', name: 'Toprak', pct: chartData.elements.earth, color: '#22c55e' },
                            { emoji: '\uD83D\uDCA8', name: 'Hava',   pct: chartData.elements.air,   color: '#0ea5e9' },
                            { emoji: '\uD83D\uDCA7', name: 'Su',     pct: chartData.elements.water, color: '#3b82f6' },
                        ].map(e => (
                            <View key={e.name} style={styles.elemRow}>
                                <View style={styles.elemHeader}>
                                    <Text style={styles.elemName}>{e.emoji} {e.name}</Text>
                                    <Text style={styles.elemPct}>{e.pct}%</Text>
                                </View>
                                <View style={styles.elemTrack}>
                                    <View style={[styles.elemFill, { width: `${e.pct}%`, backgroundColor: e.color }]} />
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* ── House Positions ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>EV KONUMLARI</Text>
                    <View style={{ gap: 6 }}>
                        {houseSignData.map(h => (
                            <View key={h.num} style={styles.houseRow}>
                                <View style={styles.houseNumBadge}>
                                    <Text style={styles.houseNumText}>{h.num}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.houseSign}>{getZodiacEmoji(h.sign)} {h.sign}</Text>
                                    <Text style={styles.houseMeaning} numberOfLines={2}>{h.meaning}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>



                {/* ── Aspects ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ONE CIKAN ACILAR</Text>
                    {chartData.aspects.map((asp, idx) => {
                        const nature = asp.nature || 'UYUMLU';
                        const styleKey = Object.keys(ASPECT_STYLES).find(k => nature.includes(k.substring(0, 3))) || 'UYUMLU';
                        const s = ASPECT_STYLES[styleKey] || ASPECT_STYLES['UYUMLU'];
                        const comment = getAspectComment(asp.planet1, asp.planet2, asp.type);

                        return (
                            <View key={idx} style={styles.aspectRow}>
                                <View style={[styles.aspectIcon, { backgroundColor: s.bg }]}>
                                    <MaterialIcons name={s.icon as any} size={18} color={s.text} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.aspectText}>{asp.planet1} {asp.type} {asp.planet2}</Text>
                                    {comment ? (
                                        <Text style={styles.aspectComment} numberOfLines={2}>{comment}</Text>
                                    ) : (
                                        <Text style={styles.aspectOrb}>Orb: {asp.orb.toFixed(2)}\u00b0</Text>
                                    )}
                                </View>
                                <View style={[styles.natureBadge, { backgroundColor: s.bg }]}>
                                    <Text style={[styles.natureText, { color: s.text }]}>{nature}</Text>
                                </View>
                            </View>
                        );
                    })}

                    {chartData.aspects.length === 0 && (
                        <Text style={styles.emptyText}>Onemli aci bulunamadi.</Text>
                    )}
                </View>

                {/* ── Planet Positions Grid ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>GEZEGEN KONUMLARI</Text>
                    <View style={styles.planetGrid}>
                        {chartData.positions.map((pos, idx) => {
                            const normName = pos.name.replace(/\u00fc/g,'u').replace(/\u00f6/g,'o')
                                .replace(/\u00e7/g,'c').replace(/\u015f/g,'s')
                                .replace(/\u0131/g,'i').replace(/\u011f/g,'g')
                                .replace(/\u00dc/g,'U').replace(/\u00d6/g,'O')
                                .replace(/\u00c7/g,'C').replace(/\u015e/g,'S')
                                .replace(/\u0130/g,'I').replace(/\u011e/g,'G');
                            const iconName = PLANET_ICONS[normName] || 'circle';
                            const col = PLANET_COLORS[normName] || '#6b7280';

                            return (
                                <View key={idx} style={styles.planetCard}>
                                    <View style={[styles.planetIcon, { backgroundColor: col + '20' }]}>
                                        <MaterialIcons name={iconName} size={20} color={col} />
                                    </View>
                                    <View>
                                        <Text style={styles.planetName}>{pos.name}</Text>
                                        <Text style={styles.planetSign}>
                                            {getZodiacEmoji(pos.sign)} {pos.sign} {Math.floor(pos.degreeInSign)}\u00b0
                                        </Text>
                                    </View>
                                    {pos.isRetrograde && (
                                        <Text style={styles.retroBadge}>Rx</Text>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container:   { flex: 1, backgroundColor: '#f8f6f7' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: 'rgba(247,225,232,0.4)',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    headerBtn:   { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

    // Chart
    chartSection: { alignItems: 'center', paddingVertical: 16 },
    chartCard: {
        backgroundColor: '#fff', borderRadius: 28, padding: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
        borderWidth: 1, borderColor: 'rgba(247,225,232,0.3)',
    },
    ascBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        marginTop: 12, backgroundColor: '#fdf2f8',
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    },
    ascLabel: { fontSize: 12, fontWeight: '600', color: '#9ca3af' },
    ascValue: { fontSize: 14, fontWeight: '700', color: '#1f1317' },
    ascDeg:   { fontSize: 12, color: '#6b7280' },

    // Sections
    section:      { paddingHorizontal: 16, marginTop: 20 },
    sectionTitle: { fontSize: 14, fontWeight: '800', color: '#374151', letterSpacing: 1, marginBottom: 12 },

    // Elements
    elemCard: {
        backgroundColor: '#fff', borderRadius: 20, padding: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    },
    elemRow:    { marginBottom: 14 },
    elemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    elemName:   { fontSize: 14, fontWeight: '600', color: '#111827' },
    elemPct:    { fontSize: 13, fontWeight: '700', color: '#6b7280' },
    elemTrack: {
        height: 8, borderRadius: 4, backgroundColor: '#f1f5f9', overflow: 'hidden',
    },
    elemFill: { height: 8, borderRadius: 4 },

    // Aspects
    aspectRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#fff', borderRadius: 16, padding: 14,
        marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
    },
    aspectIcon:  { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    aspectText:  { fontSize: 13, fontWeight: '600', color: '#111827' },
    aspectOrb:   { fontSize: 10, color: '#9ca3af', marginTop: 2 },
    natureBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    natureText:  { fontSize: 9, fontWeight: '800' },
    emptyText:   { fontSize: 13, color: '#9ca3af' },

    // Houses
    houseRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#fff', borderRadius: 14, padding: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03, shadowRadius: 3, elevation: 1,
    },
    houseNumBadge: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: '#fdf2f8', alignItems: 'center', justifyContent: 'center',
    },
    houseNumText: { fontSize: 13, fontWeight: '800', color: '#c4b5c9' },
    houseSign:    { fontSize: 13, fontWeight: '600', color: '#111827' },
    houseMeaning: { fontSize: 11, color: '#6b7280', marginTop: 2 },
    aspectComment: { fontSize: 11, color: '#6b7280', marginTop: 2, lineHeight: 15 },



    // Planets
    planetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    planetCard: {
        width: '48%' as any, flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#fff', borderRadius: 16, padding: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    planetIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    planetName: { fontSize: 10, fontWeight: '700', color: '#6b7280', letterSpacing: 0.5, textTransform: 'uppercase' },
    planetSign: { fontSize: 13, fontWeight: '600', color: '#111827', marginTop: 1 },
    retroBadge: { position: 'absolute', right: 8, top: 8, fontSize: 10, fontWeight: '800', color: '#ef4444' },
});
