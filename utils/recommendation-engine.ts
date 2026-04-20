/**
 * Recommendation Engine – Non-AI, static recommendations based on natal chart.
 * Provides daily stone, esma, color, and element warnings WITHOUT any API calls.
 */
import type { ChartData, Elements } from './astrology';
import gemstoneKB from '../data/gemstone_kb.json';
import astrologyKB from '../data/astrology_kb.json';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface StoneRecommendation {
  name: string;
  reason: string;
  color: string;
}

export interface EsmaRecommendation {
  id: string;
  name: string;
  meaning: string;
  reason: string;
}

export interface ColorRecommendation {
  name: string;
  hex: string;
  reason: string;
}

export interface ElementWarning {
  element: string;
  elementTr: string;
  percentage: number;
  advice: string;
  stones: { name: string; description: string; color: string }[];
}

export interface DailyRecommendation {
  stone: StoneRecommendation;
  esma: EsmaRecommendation;
  color: ColorRecommendation;
  elementWarning: ElementWarning | null;
  luckyActivity: string;
  dayPlanet: string;
  ascendantStone: string | null;
  supportStone: string | null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const ELEMENT_TR: Record<string, string> = {
  fire: 'Ateş', earth: 'Toprak', air: 'Hava', water: 'Su'
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ZODIAC_SIGNS = [
  "Koç", "Boğa", "İkizler", "Yengeç", "Aslan", "Başak",
  "Terazi", "Akrep", "Yay", "Oğlak", "Kova", "Balık"
];

function getSignFromLongitude(longitude: number): string {
  const idx = Math.floor((longitude % 360) / 30);
  return ZODIAC_SIGNS[idx];
}

function findWeakestElement(elements: Elements): { key: string; value: number } {
  const entries = Object.entries(elements) as [string, number][];
  return entries.reduce((min, [key, value]) =>
    value < min.value ? { key, value } : min
  , { key: entries[0][0], value: entries[0][1] });
}

function findWeakestPlanet(chartData: ChartData): string | null {
  // Planets in detriment or fall positions are "weak"
  // Simplified: planets with dignities check
  const weaknesses: Record<string, string[]> = {
    'Sun': ['Kova', 'Terazi'],     // Detriment: Kova, Fall: Terazi
    'Moon': ['Oğlak', 'Akrep'],    // Detriment: Oğlak, Fall: Akrep
    'Mercury': ['Yay', 'Balık'],   // Detriment: Yay, Fall: Balık
    'Venus': ['Koç', 'Başak'],     // Detriment: Koç/Akrep, Fall: Başak
    'Mars': ['Terazi', 'Yengeç'],  // Detriment: Terazi, Fall: Yengeç
    'Jupiter': ['İkizler', 'Oğlak'], // Detriment: İkizler, Fall: Oğlak
    'Saturn': ['Yengeç', 'Koç'],   // Detriment: Yengeç, Fall: Koç
  };

  // Map Turkish planet names back to English keys
  const trToEn: Record<string, string> = {
    'Güneş': 'Sun', 'Ay': 'Moon', 'Merkür': 'Mercury',
    'Venüs': 'Venus', 'Mars': 'Mars', 'Jüpiter': 'Jupiter',
    'Satürn': 'Saturn', 'Uranüs': 'Uranus', 'Neptün': 'Neptune', 'Plüton': 'Pluto'
  };

  for (const pos of chartData.positions) {
    const enKey = trToEn[pos.name];
    if (enKey && weaknesses[enKey]?.includes(pos.sign)) {
      return enKey;
    }
  }
  return null;
}

// ─── Main Engine ────────────────────────────────────────────────────────────

export function getDailyRecommendation(
  chartData: ChartData,
  date: Date = new Date()
): DailyRecommendation {
  const dayName = DAY_NAMES[date.getDay()];
  const dayData = (gemstoneKB as any).by_day_of_week[dayName];

  // 1. Color – based on day of week
  const color: ColorRecommendation = {
    name: dayData.color_name,
    hex: dayData.color_hex,
    reason: `${dayName === 'Monday' ? 'Pazartesi' :
      dayName === 'Tuesday' ? 'Salı' :
      dayName === 'Wednesday' ? 'Çarşamba' :
      dayName === 'Thursday' ? 'Perşembe' :
      dayName === 'Friday' ? 'Cuma' :
      dayName === 'Saturday' ? 'Cumartesi' : 'Pazar'} günü ${dayData.planet} gezegeninin etkisinde. Bu renk enerjinizi destekler.`
  };

  // 2. Stone – prioritize weak element, fall back to day stone
  const weakElement = findWeakestElement(chartData.elements);
  const weakPlanet = findWeakestPlanet(chartData);

  let stone: StoneRecommendation;
  if (weakElement.value < 15) {
    // Very weak element – recommend element stone
    const elStones = (gemstoneKB as any).by_weak_element[weakElement.key]?.stones;
    const picked = elStones?.[date.getDate() % elStones.length];
    stone = {
      name: picked?.name || dayData.stone,
      reason: `${ELEMENT_TR[weakElement.key]} elementiniz %${weakElement.value} ile düşük. Bu taş dengenizi sağlar.`,
      color: picked?.color || dayData.color_hex
    };
  } else if (weakPlanet) {
    // Weak planet – recommend planet stone
    const planetStones = (gemstoneKB as any).by_weak_planet[weakPlanet]?.stones;
    const picked = planetStones?.[date.getDate() % planetStones.length];
    stone = {
      name: picked || dayData.stone,
      reason: `${weakPlanet} gezegeniniz zayıf konumda. Bu taş o enerjiyi güçlendirir.`,
      color: (gemstoneKB as any).by_weak_planet[weakPlanet]?.color || '#888'
    };
  } else {
    stone = {
      name: dayData.stone,
      reason: `Bugünün gezegeni ${dayData.planet} ile uyumlu. Günlük enerjinizi destekler.`,
      color: dayData.color_hex
    };
  }

  // 3. Esma – based on day + weak planet mix
  const esmaSource = weakPlanet
    ? (gemstoneKB as any).by_weak_planet[weakPlanet]
    : dayData;
  const esma: EsmaRecommendation = {
    id: esmaSource.esma_id,
    name: esmaSource.esma,
    meaning: esmaSource.esma_meaning,
    reason: weakPlanet
      ? `${weakPlanet} gezegeninizi güçlendirmek için bu esma önerilir.`
      : `Bugünün gezegen enerjisiyle uyumlu esma.`
  };

  // 4. Element warning (if any element < 15%)
  let elementWarning: ElementWarning | null = null;
  if (weakElement.value < 15) {
    const elData = (gemstoneKB as any).by_weak_element[weakElement.key];
    const kbAnalysis = (astrologyKB as any).element_analysis?.[`${weakElement.key}_weak`];
    elementWarning = {
      element: weakElement.key,
      elementTr: ELEMENT_TR[weakElement.key],
      percentage: weakElement.value,
      advice: kbAnalysis || elData?.advice || '',
      stones: elData?.stones || []
    };
  }

  // 5. Ascendant stone
  const ascSign = getSignFromLongitude(chartData.ascendant);
  const ascData = (gemstoneKB as any).by_ascendant_sign[ascSign];

  return {
    stone,
    esma,
    color,
    elementWarning,
    luckyActivity: dayData.activity,
    dayPlanet: dayData.planet,
    ascendantStone: ascData?.lifeStone || null,
    supportStone: ascData?.supportStone || null,
  };
}

/**
 * Get a personalized natal summary from the static KB (no AI).
 */
export function getNatalSummary(chartData: ChartData): string[] {
  const summaries: string[] = [];
  const kb = astrologyKB as any;

  // Map Turkish names back to English keys for KB lookup
  const trToEn: Record<string, string> = {
    'Güneş': 'Sun', 'Ay': 'Moon', 'Merkür': 'Mercury',
    'Venüs': 'Venus', 'Mars': 'Mars', 'Jüpiter': 'Jupiter',
    'Satürn': 'Saturn', 'Uranüs': 'Uranus', 'Neptün': 'Neptune', 'Plüton': 'Pluto'
  };

  for (const pos of chartData.positions) {
    const enKey = trToEn[pos.name];
    if (!enKey) continue;

    // Planet in sign
    const signText = kb.planets_in_signs?.[enKey]?.[pos.sign];
    if (signText) summaries.push(signText);

    // Planet in house (determine which house the planet is in)
    if (chartData.houses.length === 12) {
      for (let h = 0; h < 12; h++) {
        const nextH = (h + 1) % 12;
        const cusp = chartData.houses[h];
        const nextCusp = chartData.houses[nextH];

        let isInHouse = false;
        if (nextCusp > cusp) {
          isInHouse = pos.longitude >= cusp && pos.longitude < nextCusp;
        } else {
          // Wraps around 360
          isInHouse = pos.longitude >= cusp || pos.longitude < nextCusp;
        }

        if (isInHouse) {
          const houseText = kb.planets_in_houses?.[enKey]?.[(h + 1).toString()];
          if (houseText) summaries.push(houseText);
          break;
        }
      }
    }
  }

  return summaries;
}
