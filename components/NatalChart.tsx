import React from 'react';
import { View, StyleSheet, Text as RNText } from 'react-native';
import Svg, { Circle, Line, Text, G, Path, Rect } from 'react-native-svg';
import type { PlanetPosition, Aspect } from '../utils/astrology';

// ─── Constants ───────────────────────────────────────────────────────────────

const SIZE          = 340;
const CENTER        = SIZE / 2;
const OUTER_R       = SIZE / 2 - 8;
const ZODIAC_R      = OUTER_R - 26;   // inner edge of zodiac ring
const PLANET_R      = ZODIAC_R - 30;  // planet placement radius
const INNER_R       = ZODIAC_R - 50;  // inner circle (aspect space)
const ASPECT_R      = INNER_R - 8;    // aspect line endpoints

const ZODIAC_SIGNS = [
    { symbol: '\u2648', name: 'Koc',      color: '#ef4444' },
    { symbol: '\u2649', name: 'Boga',     color: '#22c55e' },
    { symbol: '\u264A', name: 'Ikizler',  color: '#eab308' },
    { symbol: '\u264B', name: 'Yengec',   color: '#3b82f6' },
    { symbol: '\u264C', name: 'Aslan',    color: '#f97316' },
    { symbol: '\u264D', name: 'Basak',    color: '#84cc16' },
    { symbol: '\u264E', name: 'Terazi',   color: '#ec4899' },
    { symbol: '\u264F', name: 'Akrep',    color: '#991b1b' },
    { symbol: '\u2650', name: 'Yay',      color: '#a855f7' },
    { symbol: '\u2651', name: 'Oglak',    color: '#6b7280' },
    { symbol: '\u2652', name: 'Kova',     color: '#06b6d4' },
    { symbol: '\u2653', name: 'Balik',    color: '#2563eb' },
];

const PLANET_SYMBOLS: Record<string, string> = {
    'sun':     '\u2609',
    'moon':    '\u263D',
    'mercury': '\u263F',
    'venus':   '\u2640',
    'mars':    '\u2642',
    'jupiter': '\u2643',
    'saturn':  '\u2644',
    'uranus':  '\u2645',
    'neptune': '\u2646',
    'pluto':   '\u2647',
};

const PLANET_COLORS: Record<string, string> = {
    'sun':     '#f59e0b',
    'moon':    '#94a3b8',
    'mercury': '#14b8a6',
    'venus':   '#ec4899',
    'mars':    '#ef4444',
    'jupiter': '#f97316',
    'saturn':  '#78716c',
    'uranus':  '#06b6d4',
    'neptune': '#3b82f6',
    'pluto':   '#7c3aed',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toRad(deg: number) { return (deg * Math.PI) / 180; }

function polarToXY(cx: number, cy: number, radius: number, angleDeg: number) {
    // 0° = Aries = left (9 o'clock position), going counter-clockwise
    const rad = toRad(angleDeg);
    return {
        x: cx + radius * Math.cos(rad),
        y: cy - radius * Math.sin(rad),
    };
}

function chartAngle(longitude: number, ascendant: number): number {
    // Ascendant sits at 180° (left / 9 o'clock)
    return 180 + ascendant - longitude;
}

// Spread overlapping planets apart slightly
function spreadPositions(positions: PlanetPosition[], ascendant: number) {
    const mapped = positions.map(p => ({
        ...p,
        angle: chartAngle(p.longitude, ascendant),
    }));
    // Sort by angle
    mapped.sort((a, b) => a.angle - b.angle);
    // Min separation in degrees
    const MIN_SEP = 10;
    for (let i = 1; i < mapped.length; i++) {
        let diff = mapped[i].angle - mapped[i - 1].angle;
        if (diff < MIN_SEP) {
            mapped[i].angle = mapped[i - 1].angle + MIN_SEP;
        }
    }
    return mapped;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface NatalChartProps {
    positions: PlanetPosition[];
    aspects: Aspect[];
    ascendant?: number; // longitude of ascendant
    size?: number;
}

export default function NatalChart({
    positions,
    aspects,
    ascendant = 0,
    size = SIZE,
}: NatalChartProps) {
    const scale = size / SIZE;
    const cx = CENTER;
    const cy = CENTER;

    const spreadPos = spreadPositions(positions, ascendant);

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg width={size} height={size} viewBox={`0 0 ${SIZE} ${SIZE}`}>
                {/* ── Outer ring bg ── */}
                <Circle cx={cx} cy={cy} r={OUTER_R} fill="none" stroke="#e5e7eb" strokeWidth={1} />
                <Circle cx={cx} cy={cy} r={ZODIAC_R} fill="none" stroke="#d1d5db" strokeWidth={0.5} />
                <Circle cx={cx} cy={cy} r={INNER_R} fill="#fafaf9" stroke="#e5e7eb" strokeWidth={0.5} />

                {/* ── Zodiac sign segments (12 × 30°) ── */}
                {ZODIAC_SIGNS.map((sign, i) => {
                    const startAngle = chartAngle(i * 30, ascendant);
                    const midAngle   = startAngle + 15;

                    // Divider line
                    const pOuter = polarToXY(cx, cy, OUTER_R, startAngle);
                    const pInner = polarToXY(cx, cy, ZODIAC_R, startAngle);

                    // Symbol position
                    const pSym = polarToXY(cx, cy, (OUTER_R + ZODIAC_R) / 2, midAngle);

                    return (
                        <G key={sign.name}>
                            <Line
                                x1={pOuter.x} y1={pOuter.y}
                                x2={pInner.x} y2={pInner.y}
                                stroke="#d1d5db" strokeWidth={0.5}
                            />
                            <Text
                                x={pSym.x} y={pSym.y + 5}
                                fontSize={14}
                                fill={sign.color}
                                textAnchor="middle"
                                fontWeight="bold"
                            >
                                {sign.symbol}
                            </Text>
                        </G>
                    );
                })}

                {/* ── Ascendant arrow ── */}
                {(() => {
                    const ascAngle = 180; // always at left
                    const p1 = polarToXY(cx, cy, OUTER_R + 4, ascAngle);
                    const p2 = polarToXY(cx, cy, ZODIAC_R - 2, ascAngle);
                    return (
                        <G>
                            <Line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                                stroke="#ef4444" strokeWidth={2.5} />
                            <Text x={p1.x - 12} y={p1.y + 4}
                                fontSize={9} fill="#ef4444" fontWeight="bold">AC</Text>
                        </G>
                    );
                })()}

                {/* ── Aspect lines ── */}
                {aspects.map((asp, idx) => {
                    const p1Data = spreadPos.find(p => p.name === asp.planet1);
                    const p2Data = spreadPos.find(p => p.name === asp.planet2);
                    if (!p1Data || !p2Data) return null;

                    const pt1 = polarToXY(cx, cy, ASPECT_R, p1Data.angle);
                    const pt2 = polarToXY(cx, cy, ASPECT_R, p2Data.angle);

                    let color = '#a3e635'; // uyumlu (default)
                    let dash  = '';
                    const nature = asp.nature || '';
                    if (nature.includes('GER')) { color = '#f87171'; dash = '4,3'; }
                    else if (nature.includes('G\u00dc\u00c7')) { color = '#a78bfa'; }

                    return (
                        <Line key={idx}
                            x1={pt1.x} y1={pt1.y}
                            x2={pt2.x} y2={pt2.y}
                            stroke={color}
                            strokeWidth={1}
                            strokeDasharray={dash}
                            opacity={0.6}
                        />
                    );
                })}

                {/* ── Planet markers ── */}
                {spreadPos.map((pos) => {
                    const pt = polarToXY(cx, cy, PLANET_R, pos.angle);
                    const col = PLANET_COLORS[pos.key] || '#374151';
                    const sym = PLANET_SYMBOLS[pos.key] || '?';

                    return (
                        <G key={pos.key}>
                            <Circle cx={pt.x} cy={pt.y} r={12} fill="#fff" stroke={col} strokeWidth={1.5} />
                            <Text
                                x={pt.x} y={pt.y + 5}
                                fontSize={13}
                                fill={col}
                                textAnchor="middle"
                                fontWeight="bold"
                            >
                                {sym}
                            </Text>
                            {pos.isRetrograde && (
                                <Text
                                    x={pt.x + 10} y={pt.y - 8}
                                    fontSize={7} fill="#ef4444"
                                    fontWeight="bold"
                                >
                                    Rx
                                </Text>
                            )}
                        </G>
                    );
                })}

                {/* ── Center point ── */}
                <Circle cx={cx} cy={cy} r={3} fill="#ad92c9" />
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center' },
});
