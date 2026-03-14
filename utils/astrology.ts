// Moshier's Ephemeris port for JavaScript
// Validates coordinates and dates, outputs planetary longitudes, aspects, and elements.
import ephemeris from 'ephemeris';

export type PlanetPosition = {
    name: string;
    key: string;
    longitude: number; // 0-360 degrees
    sign: string;
    degreeInSign: number; // 0-30 degrees
    isRetrograde: boolean;
};

export type Aspect = {
    planet1: string;
    planet2: string;
    type: string; // "Kavuşum", "Üçgen", "Kare", "Karşıt", "Sekstil"
    angle: number;
    orb: number;
    nature: "UYUMLU" | "GERİLİMLİ" | "GÜÇLÜ";
};

export type Elements = {
    fire: number;
    earth: number;
    air: number;
    water: number;
};

export type ChartData = {
    positions: PlanetPosition[];
    aspects: Aspect[];
    elements: Elements;
    ascendant: number;  // longitude of ascendant
    houses: number[];   // 12 house cusps (longitudes)
};

const ZODIAC_SIGNS = [
    "Koç", "Boğa", "İkizler", "Yengeç",
    "Aslan", "Başak", "Terazi", "Akrep",
    "Yay", "Oğlak", "Kova", "Balık"
];

const SIGN_ELEMENTS: Record<string, 'fire' | 'earth' | 'air' | 'water'> = {
    "Koç": "fire", "Aslan": "fire", "Yay": "fire",
    "Boğa": "earth", "Başak": "earth", "Oğlak": "earth",
    "İkizler": "air", "Terazi": "air", "Kova": "air",
    "Yengeç": "water", "Akrep": "water", "Balık": "water"
};

// Map ephemeris object keys to human-readable names
const PLANET_NAMES: Record<string, string> = {
    sun: "Güneş",
    moon: "Ay",
    mercury: "Merkür",
    venus: "Venüs",
    mars: "Mars",
    jupiter: "Jüpiter",
    saturn: "Satürn",
    uranus: "Uranüs",
    neptune: "Neptün",
    pluto: "Plüton"
};

/**
 * Parses a "DD.MM.YYYY HH:MM" localized string and converts to UTC Date
 */
export function parseDateLocal(dateStr: string, timeStr: string, timezoneOffset: number = 3): Date {
    const [day, month, year] = dateStr.split('.').map(Number);
    const [hour, minute] = timeStr.split(':').map(Number);
    return new Date(Date.UTC(year, month - 1, day, hour - timezoneOffset, minute));
}

function getZodiacSign(longitude: number): { sign: string; degree: number } {
    const norm = longitude % 360;
    const signIndex = Math.floor(norm / 30);
    const degree = norm % 30;
    return {
        sign: ZODIAC_SIGNS[signIndex],
        degree: parseFloat(degree.toFixed(2))
    };
}

/**
 * Calculates aspects between planets
 */
function calculateAspects(positions: PlanetPosition[]): Aspect[] {
    const aspects: Aspect[] = [];
    const definedAspects = [
        { type: "Kavuşum", angle: 0, orb: 8, nature: "GÜÇLÜ" },
        { type: "Sekstil", angle: 60, orb: 6, nature: "UYUMLU" },
        { type: "Kare", angle: 90, orb: 8, nature: "GERİLİMLİ" },
        { type: "Üçgen", angle: 120, orb: 8, nature: "UYUMLU" },
        { type: "Karşıt", angle: 180, orb: 8, nature: "GERİLİMLİ" }
    ];

    for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
            const p1 = positions[i];
            const p2 = positions[j];

            let diff = Math.abs(p1.longitude - p2.longitude);
            if (diff > 180) diff = 360 - diff;

            for (const asp of definedAspects) {
                if (Math.abs(diff - asp.angle) <= asp.orb) {
                    // Filter out minor planet-to-planet aspects to keep list clean, prioritize Sun/Moon
                    const isMajor = ["Güneş", "Ay", "Yükselen"].includes(p1.name) || ["Güneş", "Ay", "Yükselen"].includes(p2.name);

                    if (isMajor || asp.type === "Kavuşum" || asp.type === "Karşıt") {
                        aspects.push({
                            planet1: p1.name,
                            planet2: p2.name,
                            type: asp.type,
                            angle: asp.angle,
                            orb: Math.abs(diff - asp.angle),
                            nature: asp.nature as Aspect['nature']
                        });
                    }
                }
            }
        }
    }

    // Sort aspects by tightest orb
    return aspects.sort((a, b) => a.orb - b.orb).slice(0, 8); // Return max 8 most important
}

/**
 * Calculates planetary positions, aspects, and element balance
 */
export function calculateChart(dateStr: string, timeStr: string, lat: number, lng: number): ChartData {
    const date = parseDateLocal(dateStr, timeStr);
    const ephData = ephemeris.getAllPlanets(date, lng, lat, 0);

    const positions: PlanetPosition[] = [];
    let elementCounts = { fire: 0, earth: 0, air: 0, water: 0 };
    let totalPlanets = 0;

    const targetPlanets = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];

    targetPlanets.forEach(key => {
        const planetData = ephData.observed?.[key] || ephData.position?.[key] || ephData[key];

        if (planetData) {
            const lngGeo = planetData.apparentLongitudeDd || planetData.apparentLongitude || 0;
            const retro = planetData.is_retrograde || false;

            const zodiacInfo = getZodiacSign(lngGeo);

            positions.push({
                name: PLANET_NAMES[key] || key,
                key: key,
                longitude: lngGeo,
                sign: zodiacInfo.sign,
                degreeInSign: zodiacInfo.degree,
                isRetrograde: retro
            });

            // Weight Sun and Moon heavily
            const weight = (key === 'sun' || key === 'moon') ? 2 : 1;
            elementCounts[SIGN_ELEMENTS[zodiacInfo.sign]] += weight;
            totalPlanets += weight;
        }
    });

    const aspects = calculateAspects(positions);

    // Calculate percentages
    const elements = {
        fire: Math.round((elementCounts.fire / totalPlanets) * 100) || 0,
        earth: Math.round((elementCounts.earth / totalPlanets) * 100) || 0,
        air: Math.round((elementCounts.air / totalPlanets) * 100) || 0,
        water: Math.round((elementCounts.water / totalPlanets) * 100) || 0,
    };

    // Ascendant approximation (simplified)
    // Proper Ascendant requires obliquity + local sidereal time
    const obliquity = 23.4393; // Earth's axial tilt
    const jd = date.getTime() / 86400000 + 2440587.5;
    const T = (jd - 2451545.0) / 36525;
    const GMST = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T;
    const LST = (GMST + lng) % 360;
    // Ascendant formula
    const ascRad = Math.atan2(
        Math.cos(LST * Math.PI / 180),
        -(Math.sin(LST * Math.PI / 180) * Math.cos(obliquity * Math.PI / 180)
          + Math.tan(lat * Math.PI / 180) * Math.sin(obliquity * Math.PI / 180))
    );
    let ascendant = (ascRad * 180 / Math.PI + 360) % 360;

    // Equal House system: each house = 30 degrees from Ascendant
    const houses: number[] = [];
    for (let i = 0; i < 12; i++) {
        houses.push((ascendant + i * 30) % 360);
    }

    return { positions, aspects, elements, ascendant, houses };
}
