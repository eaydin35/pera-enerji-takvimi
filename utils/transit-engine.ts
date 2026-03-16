/**
 * Transit Engine – Calculates current sky positions vs natal chart.
 * Fully local, zero API cost. Uses the same ephemeris library.
 */
import ephemeris from 'ephemeris';
import type { ChartData, PlanetPosition, Aspect } from './astrology';
import astrologyKB from '../data/astrology_kb.json';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TransitAspect {
  transitPlanet: string;
  transitSign: string;
  natalPlanet: string;
  natalSign: string;
  aspectType: string;
  orb: number;
  nature: 'UYUMLU' | 'GERİLİMLİ' | 'GÜÇLÜ';
  interpretation: string;
  affectedHouse: number;
}

export interface DailyTransit {
  moonSign: string;
  moonDegree: number;
  moonPhase: string;
  sunSign: string;
  activeTransits: TransitAspect[];
  energyTheme: string;
  energyDescription: string;
  currentPositions: PlanetPosition[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

const ZODIAC_SIGNS = [
  'Koç', 'Boğa', 'İkizler', 'Yengeç', 'Aslan', 'Başak',
  'Terazi', 'Akrep', 'Yay', 'Oğlak', 'Kova', 'Balık'
];

const PLANET_NAMES: Record<string, string> = {
  sun: 'Güneş', moon: 'Ay', mercury: 'Merkür', venus: 'Venüs',
  mars: 'Mars', jupiter: 'Jüpiter', saturn: 'Satürn',
  uranus: 'Uranüs', neptune: 'Neptün', pluto: 'Plüton'
};

const TR_TO_EN: Record<string, string> = {
  'Güneş': 'Sun', 'Ay': 'Moon', 'Merkür': 'Mercury',
  'Venüs': 'Venus', 'Mars': 'Mars', 'Jüpiter': 'Jupiter',
  'Satürn': 'Saturn', 'Uranüs': 'Uranus', 'Neptün': 'Neptune', 'Plüton': 'Pluto'
};

const ASPECT_DEFS = [
  { type: 'Kavuşum', angle: 0, orb: 6, nature: 'GÜÇLÜ' as const },
  { type: 'Sekstil', angle: 60, orb: 4, nature: 'UYUMLU' as const },
  { type: 'Kare', angle: 90, orb: 6, nature: 'GERİLİMLİ' as const },
  { type: 'Üçgen', angle: 120, orb: 6, nature: 'UYUMLU' as const },
  { type: 'Karşıt', angle: 180, orb: 6, nature: 'GERİLİMLİ' as const },
];

const MOON_THEMES: Record<string, { theme: string; desc: string }> = {
  'Koç':     { theme: 'Aksiyon Günü', desc: 'Ay Koç burcunda: Enerji yüksek, cesaret gereken adımlar için ideal. Yeni başlangıçlar destekleniyor.' },
  'Boğa':    { theme: 'Konfor Günü', desc: 'Ay Boğa burcunda: Maddi konular ve güzellik ön planda. Yavaş ama kalıcı adımlar atmak için güçlü.' },
  'İkizler': { theme: 'İletişim Günü', desc: 'Ay İkizler burcunda: Fikirlerini cesurca ifade etmek için harika bir gün. Zihnin berrak, sosyal enerji yüksek.' },
  'Yengeç':  { theme: 'Duygusal Gün', desc: 'Ay Yengeç burcunda: Aile ve yuva temaları öne çıkıyor. Sezgilerinize güvenin, ev ortamınızı güzelleştirin.' },
  'Aslan':   { theme: 'Yaratıcılık Günü', desc: 'Ay Aslan burcunda: Yaratıcı enerjiniz zirvede. Sahne almak, dikkat çekmek ve kendinizi ifade etmek için ideal.' },
  'Başak':   { theme: 'Düzen Günü', desc: 'Ay Başak burcunda: Organizasyon ve sağlık rutinleri için güçlü. Detaylara dikkat ederek verimli çalışabilirsiniz.' },
  'Terazi':  { theme: 'Uyum Günü', desc: 'Ay Terazi burcunda: İlişkiler ve denge ön planda. Diplomasi ve estetik konularda güçlü enerji.' },
  'Akrep':   { theme: 'Dönüşüm Günü', desc: 'Ay Akrep burcunda: Derin duygular ve dönüşüm enerjisi güçlü. İç gözlem ve şifa çalışmaları destekleniyor.' },
  'Yay':     { theme: 'Keşif Günü', desc: 'Ay Yay burcunda: Macera ve özgürlük enerjisi yüksek. Yeni bilgiler edinmek ve ufuk genişletmek için harika.' },
  'Oğlak':   { theme: 'Kariyer Günü', desc: 'Ay Oğlak burcunda: İş ve kariyer odaklı enerji. Disiplinli çalışma ve uzun vadeli planlar yapılmalı.' },
  'Kova':    { theme: 'Yenilik Günü', desc: 'Ay Kova burcunda: Yenilikçi fikirler ve toplumsal konular ön planda. Alışılmadık çözümler için ideal.' },
  'Balık':   { theme: 'Maneviyat Günü', desc: 'Ay Balık burcunda: Sezgisel enerji zirvede. Meditasyon, sanat ve ruhani çalışmalar için güçlü gün.' },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function getSign(longitude: number): string {
  return ZODIAC_SIGNS[Math.floor((longitude % 360) / 30)];
}

function getMoonPhase(sunLng: number, moonLng: number): string {
  let diff = (moonLng - sunLng + 360) % 360;
  if (diff < 22.5) return 'Yeni Ay';
  if (diff < 67.5) return 'Hilal (Büyüyen)';
  if (diff < 112.5) return 'İlk Dördün';
  if (diff < 157.5) return 'Şişkin Ay';
  if (diff < 202.5) return 'Dolunay';
  if (diff < 247.5) return 'Şişkin Ay (Küçülen)';
  if (diff < 292.5) return 'Son Dördün';
  if (diff < 337.5) return 'Hilal (Küçülen)';
  return 'Yeni Ay';
}

function findHouseForLongitude(lng: number, houses: number[]): number {
  if (houses.length !== 12) return 1;
  for (let h = 0; h < 12; h++) {
    const cusp = houses[h];
    const nextCusp = houses[(h + 1) % 12];
    if (nextCusp > cusp) {
      if (lng >= cusp && lng < nextCusp) return h + 1;
    } else {
      if (lng >= cusp || lng < nextCusp) return h + 1;
    }
  }
  return 1;
}

function getInterpretation(transitKey: string, natalKey: string, aspectType: string): string {
  const kb = astrologyKB as any;
  const pairKey = `${transitKey}-${natalKey}`;
  const reversePairKey = `${natalKey}-${transitKey}`;

  const text = kb.aspects?.[pairKey]?.[aspectType]
    || kb.aspects?.[reversePairKey]?.[aspectType];

  if (text) return text;

  const trNames: Record<string, string> = {
    Sun: 'Güneş', Moon: 'Ay', Mercury: 'Merkür', Venus: 'Venüs',
    Mars: 'Mars', Jupiter: 'Jüpiter', Saturn: 'Satürn',
    Uranus: 'Uranüs', Neptune: 'Neptün', Pluto: 'Plüton'
  };

  return `Transit ${trNames[transitKey] || transitKey} natal ${trNames[natalKey] || natalKey} ile ${aspectType} açısında. Bu etki hayatınızda önemli bir enerji akışı yaratıyor.`;
}

// ─── Main Function ──────────────────────────────────────────────────────────

export function calculateDailyTransits(
  natalChart: ChartData,
  targetDate: Date = new Date()
): DailyTransit {
  // Get current sky positions
  const ephData = ephemeris.getAllPlanets(targetDate, 29, 41, 0); // Istanbul coords as default

  const currentPositions: PlanetPosition[] = [];
  const targetPlanets = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];

  targetPlanets.forEach(key => {
    const planetData = ephData.observed?.[key] || ephData.position?.[key] || ephData[key];
    if (planetData) {
      const lng = planetData.apparentLongitudeDd || planetData.apparentLongitude || 0;
      const sign = getSign(lng);
      currentPositions.push({
        name: PLANET_NAMES[key] || key,
        key,
        longitude: lng,
        sign,
        degreeInSign: parseFloat((lng % 30).toFixed(2)),
        isRetrograde: planetData.is_retrograde || false,
      });
    }
  });

  // Calculate aspects between transit planets and natal planets
  const activeTransits: TransitAspect[] = [];

  // Only use major transit planets (slow movers are more significant)
  const significantTransit = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];

  for (const transitPos of currentPositions) {
    if (!significantTransit.includes(transitPos.key)) continue;

    for (const natalPos of natalChart.positions) {
      let diff = Math.abs(transitPos.longitude - natalPos.longitude);
      if (diff > 180) diff = 360 - diff;

      for (const asp of ASPECT_DEFS) {
        if (Math.abs(diff - asp.angle) <= asp.orb) {
          const transitKey = TR_TO_EN[transitPos.name] || transitPos.name;
          const natalKey = TR_TO_EN[natalPos.name] || natalPos.name;

          // Skip same planet transiting itself with kavuşum (not very meaningful for fast planets)
          if (transitKey === natalKey && asp.type === 'Kavuşum' && ['Mercury', 'Venus', 'Sun'].includes(transitKey)) continue;

          const affectedHouse = findHouseForLongitude(transitPos.longitude, natalChart.houses);

          activeTransits.push({
            transitPlanet: transitPos.name,
            transitSign: transitPos.sign,
            natalPlanet: natalPos.name,
            natalSign: natalPos.sign,
            aspectType: asp.type,
            orb: parseFloat(Math.abs(diff - asp.angle).toFixed(2)),
            nature: asp.nature,
            interpretation: getInterpretation(transitKey, natalKey, asp.type),
            affectedHouse: affectedHouse,
          });
        }
      }
    }
  }

  // Sort by significance: tighter orb first, slow planets first
  activeTransits.sort((a, b) => a.orb - b.orb);

  // Get Moon info for theme
  const moonPos = currentPositions.find(p => p.key === 'moon');
  const sunPos = currentPositions.find(p => p.key === 'sun');
  const moonSign = moonPos?.sign || 'Koç';
  const moonTheme = MOON_THEMES[moonSign] || MOON_THEMES['Koç'];

  return {
    moonSign,
    moonDegree: moonPos?.degreeInSign || 0,
    moonPhase: getMoonPhase(sunPos?.longitude || 0, moonPos?.longitude || 0),
    sunSign: sunPos?.sign || 'Koç',
    activeTransits: activeTransits.slice(0, 8), // Top 8 most significant
    energyTheme: moonTheme.theme,
    energyDescription: moonTheme.desc,
    currentPositions,
  };
}

/**
 * Get weekly highlights from astro events
 */
export function getWeeklyEvents(events: any[], targetDate: Date = new Date()): any[] {
  const weekStart = new Date(targetDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const startStr = weekStart.toISOString().split('T')[0];
  const endStr = weekEnd.toISOString().split('T')[0];

  return events.filter(e => e.date >= startStr && e.date <= endStr);
}
