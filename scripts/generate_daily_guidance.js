/**
 * 2026 Daily Astrological Guidance Generator
 * 
 * Uses astronomy-engine for precise Moon position calculations.
 * Applies astrological rules to generate daily guidance for:
 * - Activities
 * - Health & Beauty (hair cut, hair color, doctor visits)
 * - Colors
 * - Natural Stones (Gemstones)
 * 
 * Output: data/daily_guidance_2026.json
 */

const Astronomy = require('astronomy-engine');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════
// CONSTANTS & MAPPINGS
// ═══════════════════════════════════════════════

const ZODIAC_SIGNS = [
  { name: 'Koç', element: 'fire', quality: 'cardinal', ruler: 'Mars', bodyPart: 'Baş, yüz, beyin' },
  { name: 'Boğa', element: 'earth', quality: 'fixed', ruler: 'Venus', bodyPart: 'Boğaz, boyun, tiroid' },
  { name: 'İkizler', element: 'air', quality: 'mutable', ruler: 'Mercury', bodyPart: 'Kollar, eller, akciğerler' },
  { name: 'Yengeç', element: 'water', quality: 'cardinal', ruler: 'Moon', bodyPart: 'Göğüs, mide, sindirim' },
  { name: 'Aslan', element: 'fire', quality: 'fixed', ruler: 'Sun', bodyPart: 'Kalp, sırt, omurga' },
  { name: 'Başak', element: 'earth', quality: 'mutable', ruler: 'Mercury', bodyPart: 'Bağırsaklar, sindirim detayları' },
  { name: 'Terazi', element: 'air', quality: 'cardinal', ruler: 'Venus', bodyPart: 'Böbrekler, bel, cilt' },
  { name: 'Akrep', element: 'water', quality: 'fixed', ruler: 'Pluto', bodyPart: 'Üreme organları, kolon' },
  { name: 'Yay', element: 'fire', quality: 'mutable', ruler: 'Jupiter', bodyPart: 'Kalça, uyluk, karaciğer' },
  { name: 'Oğlak', element: 'earth', quality: 'cardinal', ruler: 'Saturn', bodyPart: 'Kemikler, dizler, eklemler' },
  { name: 'Kova', element: 'air', quality: 'fixed', ruler: 'Uranus', bodyPart: 'Bilek, baldır, dolaşım sistemi' },
  { name: 'Balık', element: 'water', quality: 'mutable', ruler: 'Neptune', bodyPart: 'Ayaklar, lenf sistemi' }
];

const DAY_NAMES_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const DAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DAY_PLANET_MAP = {
  0: { planet: 'Sun', tr: 'Güneş', stone: 'Sitrin', color: 'Altın/Turuncu', colorHex: '#FFA500', esma: 'En-Nûr' },
  1: { planet: 'Moon', tr: 'Ay', stone: 'Aytaşı', color: 'Gümüş/Beyaz', colorHex: '#C0C0C0', esma: 'El-Kadîr' },
  2: { planet: 'Mars', tr: 'Mars', stone: 'Garnet', color: 'Kırmızı', colorHex: '#DC143C', esma: 'El-Kavî' },
  3: { planet: 'Mercury', tr: 'Merkür', stone: 'Zümrüt', color: 'Yeşil/Turkuaz', colorHex: '#00CED1', esma: 'El-Alîm' },
  4: { planet: 'Jupiter', tr: 'Jüpiter', stone: 'Ametist', color: 'Mor/Lacivert', colorHex: '#4B0082', esma: 'El-Fettâh' },
  5: { planet: 'Venus', tr: 'Venüs', stone: 'Gül Kuvarsı', color: 'Pembe/Yeşil', colorHex: '#FF69B4', esma: 'El-Vedûd' },
  6: { planet: 'Saturn', tr: 'Satürn', stone: 'Obsidyen', color: 'Siyah/Koyu Gri', colorHex: '#2F4F4F', esma: 'Es-Sabûr' }
};

const ELEMENT_COLORS = {
  fire: { primary: { name: 'Kırmızı', hex: '#DC143C' }, secondary: { name: 'Turuncu', hex: '#FF6347' }, accent: { name: 'Altın', hex: '#FFD700' }, avoid: { name: 'Mavi', hex: '#4169E1' } },
  earth: { primary: { name: 'Yeşil', hex: '#2E8B57' }, secondary: { name: 'Kahverengi', hex: '#8B5A2B' }, accent: { name: 'Bej', hex: '#D2B48C' }, avoid: { name: 'Eflatun', hex: '#9370DB' } },
  air: { primary: { name: 'Mavi', hex: '#4682B4' }, secondary: { name: 'Turkuaz', hex: '#40E0D0' }, accent: { name: 'Lila', hex: '#C8A2C8' }, avoid: { name: 'Kahverengi', hex: '#8B4513' } },
  water: { primary: { name: 'Gümüş', hex: '#C0C0C0' }, secondary: { name: 'Deniz Mavisi', hex: '#20B2AA' }, accent: { name: 'Beyaz', hex: '#F5F5F5' }, avoid: { name: 'Koyu Kırmızı', hex: '#8B0000' } }
};

const MOON_SIGN_STONES = {
  'Koç': { primary: { name: 'Kırmızı Jasper', color: '#BF4E30' }, secondary: { name: 'Karnelyan', color: '#E25822' } },
  'Boğa': { primary: { name: 'Gül Kuvarsı', color: '#FFB6C1' }, secondary: { name: 'Zümrüt', color: '#50C878' } },
  'İkizler': { primary: { name: 'Akuamarin', color: '#7FDBFF' }, secondary: { name: 'Agat', color: '#B5B5B5' } },
  'Yengeç': { primary: { name: 'Aytaşı', color: '#C4C4C4' }, secondary: { name: 'İnci', color: '#FDEEF4' } },
  'Aslan': { primary: { name: 'Sitrin', color: '#E4A700' }, secondary: { name: 'Kaplan Gözü', color: '#B8860B' } },
  'Başak': { primary: { name: 'Peridot', color: '#9ACD32' }, secondary: { name: 'Yeşim', color: '#00A86B' } },
  'Terazi': { primary: { name: 'Lapis Lazuli', color: '#26619C' }, secondary: { name: 'Opal', color: '#A8C3BC' } },
  'Akrep': { primary: { name: 'Obsidyen', color: '#1C1C1C' }, secondary: { name: 'Garnet', color: '#722F37' } },
  'Yay': { primary: { name: 'Turkuaz', color: '#30D5C8' }, secondary: { name: 'Ametist', color: '#9966CC' } },
  'Oğlak': { primary: { name: 'Oniks', color: '#353839' }, secondary: { name: 'Hematit', color: '#4E4E50' } },
  'Kova': { primary: { name: 'Labradorit', color: '#4B6584' }, secondary: { name: 'Florit', color: '#7B68EE' } },
  'Balık': { primary: { name: 'Ametist', color: '#9966CC' }, secondary: { name: 'Akuamarin', color: '#7FDBFF' } }
};

// ═══════════════════════════════════════════════
// RETROGRADE PERIODS 2026
// ═══════════════════════════════════════════════

const RETROGRADE_PERIODS = {
  mercury: [
    { start: '2026-02-26', end: '2026-03-20', sign: 'Balık' },
    { start: '2026-06-29', end: '2026-07-23', sign: 'Yengeç' },
    { start: '2026-10-24', end: '2026-11-13', sign: 'Akrep' }
  ],
  venus: [
    { start: '2026-10-03', end: '2026-11-13', sign: 'Akrep' }
  ],
  saturn: [
    { start: '2026-07-26', end: '2026-12-10', sign: 'Koç' }
  ],
  jupiter: [
    { start: '2026-12-13', end: '2027-04-10', sign: 'Aslan' }
  ]
};

// Eclipse dates (±3 day buffer for avoidance)
const ECLIPSE_DATES = [
  { date: '2026-02-17', type: 'solar', name: 'Halkalı Güneş Tutulması' },
  { date: '2026-03-03', type: 'lunar', name: 'Tam Ay Tutulması' },
  { date: '2026-08-12', type: 'solar', name: 'Tam Güneş Tutulması' },
  { date: '2026-08-27', type: 'lunar', name: 'Kısmi Ay Tutulması' }  // Aug 27 corrected
];

// ═══════════════════════════════════════════════
// LUNAR CALCULATIONS
// ═══════════════════════════════════════════════

function getMoonSign(date) {
  const astroDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
  const eqj = Astronomy.GeoMoon(Astronomy.MakeTime(astroDate));
  const ecl = Astronomy.Ecliptic(eqj);
  let longitude = ecl.elon;
  if (longitude < 0) longitude += 360;
  const signIndex = Math.floor(longitude / 30);
  return ZODIAC_SIGNS[signIndex];
}

function getMoonPhase(date) {
  const astroDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
  const phase = Astronomy.MoonPhase(Astronomy.MakeTime(astroDate));
  
  if (phase < 1 || phase > 359) return { phase: 'new_moon', label: 'Yeni Ay', waxing: true, illumination: 'minimal' };
  if (phase < 89) return { phase: 'waxing_crescent', label: 'Hilal (Büyüyen)', waxing: true, illumination: 'low' };
  if (phase < 91) return { phase: 'first_quarter', label: 'İlk Dördün', waxing: true, illumination: 'half' };
  if (phase < 179) return { phase: 'waxing_gibbous', label: 'Şişkin Ay (Büyüyen)', waxing: true, illumination: 'high' };
  if (phase < 181) return { phase: 'full_moon', label: 'Dolunay', waxing: false, illumination: 'full' };
  if (phase < 269) return { phase: 'waning_gibbous', label: 'Şişkin Ay (Küçülen)', waxing: false, illumination: 'high' };
  if (phase < 271) return { phase: 'last_quarter', label: 'Son Dördün', waxing: false, illumination: 'half' };
  return { phase: 'waning_crescent', label: 'Hilal (Küçülen)', waxing: false, illumination: 'low' };
}

function getSunSign(date) {
  const sunIngresses = [
    { month: 1, day: 20, sign: 'Kova' },
    { month: 2, day: 19, sign: 'Balık' },
    { month: 3, day: 20, sign: 'Koç' },
    { month: 4, day: 20, sign: 'Boğa' },
    { month: 5, day: 21, sign: 'İkizler' },
    { month: 6, day: 21, sign: 'Yengeç' },
    { month: 7, day: 22, sign: 'Aslan' },
    { month: 8, day: 23, sign: 'Başak' },
    { month: 9, day: 23, sign: 'Terazi' },
    { month: 10, day: 23, sign: 'Akrep' },
    { month: 11, day: 22, sign: 'Yay' },
    { month: 12, day: 22, sign: 'Oğlak' }
  ];
  
  const m = date.getMonth() + 1;
  const d = date.getDate();
  
  for (let i = sunIngresses.length - 1; i >= 0; i--) {
    if (m > sunIngresses[i].month || (m === sunIngresses[i].month && d >= sunIngresses[i].day)) {
      return sunIngresses[i].sign;
    }
  }
  return 'Oğlak'; // Jan 1-19
}

// ═══════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════

function dateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isInRetrograde(dateString, planet) {
  const periods = RETROGRADE_PERIODS[planet] || [];
  return periods.some(p => dateString >= p.start && dateString <= p.end);
}

function isNearEclipse(dateString, bufferDays = 3) {
  for (const eclipse of ECLIPSE_DATES) {
    const eclDate = new Date(eclipse.date);
    const checkDate = new Date(dateString);
    const diff = Math.abs((eclDate - checkDate) / (1000 * 60 * 60 * 24));
    if (diff <= bufferDays) return { near: true, eclipse };
  }
  return { near: false };
}

function isEclipseDay(dateString) {
  return ECLIPSE_DATES.some(e => e.date === dateString);
}

// Load existing astro_events for cross-reference
function loadAstroEvents() {
  const filePath = path.join(__dirname, '..', 'data', 'astro_events_2026.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const map = {};
  data.forEach(event => {
    if (!map[event.date]) map[event.date] = [];
    map[event.date].push(event);
  });
  return map;
}

// ═══════════════════════════════════════════════
// GUIDANCE GENERATORS
// ═══════════════════════════════════════════════

function generateHairCutGuidance(moonSign, moonPhaseData, dateString) {
  const element = moonSign.element;
  const isWaxing = moonPhaseData.waxing;
  const mercuryRetro = isInRetrograde(dateString, 'mercury');
  const venusRetro = isInRetrograde(dateString, 'venus');
  const eclipse = isEclipseDay(dateString);
  const nearEcl = isNearEclipse(dateString);

  if (eclipse) return { suitable: false, score: 0, reason: 'Tutulma günü – kesinlikle saç kestirmeyin!' };
  if (venusRetro) return { suitable: false, score: 1, reason: 'Venüs retrosunda saç kestirmek estetik pişmanlık yaratabilir' };
  if (mercuryRetro) return { suitable: false, score: 2, reason: 'Merkür retrosunda kuaförle iletişim sorunları ve yanlış model riski' };
  if (nearEcl.near) return { suitable: false, score: 1, reason: `Tutulma etkisi altında (${nearEcl.eclipse.name}) – saç kestirmekten kaçının` };

  if (element === 'fire') {
    return { suitable: true, score: isWaxing ? 5 : 4, reason: `Ay Ateş burcunda (${moonSign.name}) – saça hacim ve güç verir${isWaxing ? ', büyüyen Ay ile hızlı uzar' : ''}` };
  }
  if (element === 'air') {
    return { suitable: true, score: isWaxing ? 4 : 3, reason: `Ay Hava burcunda (${moonSign.name}) – saça parlaklık ve hafiflik${isWaxing ? ', büyüyen Ay dönemi' : ''}` };
  }
  if (element === 'earth') {
    return { suitable: true, score: isWaxing ? 3 : 3, reason: `Ay Toprak burcunda (${moonSign.name}) – saçı kalınlaştırır ve güçlendirir` };
  }
  // water
  return { suitable: false, score: 2, reason: `Ay Su burcunda (${moonSign.name}) – saç cansız ve mat kalabilir` };
}

function generateHairColorGuidance(moonSign, moonPhaseData, dateString) {
  const element = moonSign.element;
  const isWaxing = moonPhaseData.waxing;
  const mercuryRetro = isInRetrograde(dateString, 'mercury');
  const venusRetro = isInRetrograde(dateString, 'venus');
  const eclipse = isEclipseDay(dateString);

  if (eclipse) return { suitable: false, score: 0, reason: 'Tutulma günü – saç boyatmayın!' };
  if (venusRetro) return { suitable: false, score: 1, reason: 'Venüs retrosunda boya rengi beğenmeme riski yüksek' };
  if (mercuryRetro) return { suitable: false, score: 2, reason: 'Merkür retrosunda istenmeyen renk sonuçları olabilir' };

  if (element === 'earth') {
    return { suitable: true, score: isWaxing ? 5 : 4, reason: `Ay Toprak burcunda (${moonSign.name}) – boya en uzun süre tutar` };
  }
  if (element === 'fire') {
    return { suitable: true, score: isWaxing ? 4 : 3, reason: `Ay Ateş burcunda (${moonSign.name}) – renk canlı ve parlak kalır` };
  }
  if (element === 'air') {
    return { suitable: true, score: isWaxing ? 4 : 3, reason: `Ay Hava burcunda (${moonSign.name}) – iyi tutuş sağlar` };
  }
  // water
  return { suitable: false, score: 2, reason: `Ay Su burcunda (${moonSign.name}) – renk çabuk solar` };
}

function generateDoctorGuidance(moonSign, moonPhaseData, dateString) {
  const isWaxing = moonPhaseData.waxing;
  const eclipse = isEclipseDay(dateString);
  const nearEcl = isNearEclipse(dateString);
  const phase = moonPhaseData.phase;

  if (eclipse) return {
    generalVisit: { suitable: false, reason: 'Tutulma günü – sağlık randevularını erteleyin' },
    surgery: { suitable: false, reason: 'Tutulma günü – kesinlikle ameliyat olmayın!' },
    focusArea: moonSign.bodyPart
  };

  if (nearEcl.near) return {
    generalVisit: { suitable: false, reason: 'Tutulma etkisi altında – rutin kontrolleri erteleyin' },
    surgery: { suitable: false, reason: 'Tutulma dönemi – ameliyat riskli' },
    focusArea: moonSign.bodyPart
  };

  const surgeryOk = !isWaxing && phase !== 'full_moon' && phase !== 'new_moon';
  const surgeryReason = surgeryOk
    ? 'Küçülen Ay döneminde ameliyat iyileşmeyi destekler'
    : isWaxing
      ? 'Büyüyen Ay döneminde kanama riski artabilir'
      : phase === 'full_moon'
        ? 'Dolunay günü ameliyat önerilmez'
        : 'Yeni Ay enerji düşüklüğü getirir, iyileşme yavaşlayabilir';

  return {
    generalVisit: { suitable: true, reason: 'Genel kontrol ve muayene için uygun' },
    surgery: { suitable: surgeryOk, reason: surgeryReason },
    focusArea: moonSign.bodyPart,
    avoidArea: `${moonSign.name} Ay'ı etkisinde ${moonSign.bodyPart} bölgesinden ameliyat önerilmez`
  };
}

function generateActivities(moonSign, moonPhaseData, dateString, dayOfWeek, sunSign) {
  const element = moonSign.element;
  const isWaxing = moonPhaseData.waxing;
  const phase = moonPhaseData.phase;
  const mercuryRetro = isInRetrograde(dateString, 'mercury');
  const venusRetro = isInRetrograde(dateString, 'venus');
  const dayPlanet = DAY_PLANET_MAP[dayOfWeek];

  const best = [];
  const good = [];
  const avoid = [];
  let tip = '';

  // Phase-based activities
  if (phase === 'new_moon') {
    best.push('Niyet belirleme', 'Yeni planlar yapma', 'Meditasyon');
    avoid.push('Büyük kararlar', 'Sözleşme imzalama');
    tip = 'Yeni Ay enerjisi yeni başlangıçlar için ideal ama aksiyon almak için birkaç gün bekleyin.';
  } else if (phase === 'full_moon') {
    best.push('Kutlama', 'Tamamlama', 'Şükür ritüeli');
    avoid.push('Yeni projelere başlama', 'Dürtüsel kararlar');
    tip = 'Dolunay enerjisi duyguları yoğunlaştırır. Başlattıklarınızı tamamlayın, yeni iş başlatmayın.';
  } else if (isWaxing) {
    best.push('Projeleri geliştirme', 'Yeni girişimler', 'Sosyalleşme');
    tip = 'Büyüyen Ay döneminde aksiyona geçin, inşa edin ve büyütün.';
  } else {
    best.push('Gözden geçirme', 'Temizlik', 'Meditasyon', 'Eski projeleri tamamlama');
    tip = 'Küçülen Ay döneminde bırakın, azaltın ve arının.';
  }

  // Element-based activities
  if (element === 'fire') {
    good.push('Spor ve egzersiz', 'Liderlik çalışmaları', 'Cesaret gerektiren adımlar');
  } else if (element === 'earth') {
    good.push('Bahçe işleri', 'Finansal planlama', 'Yemek yapma', 'Ev düzeni');
  } else if (element === 'air') {
    good.push('Okuma ve yazma', 'Sosyal etkinlikler', 'Öğrenme', 'İletişim');
  } else {
    good.push('Sanat ve müzik', 'Meditasyon', 'Su kenarı aktiviteleri', 'Ruhani çalışmalar');
  }

  // Day-based
  if (dayOfWeek === 5) good.push('Güzellik bakımı', 'Romantik etkinlikler'); // Friday/Venus
  if (dayOfWeek === 2) good.push('Fiziksel aktivite', 'Rekabetçi sporlar'); // Tuesday/Mars
  if (dayOfWeek === 4) good.push('Dua ve şükür', 'Eğitim'); // Thursday/Jupiter

  // Retro-based avoidances
  if (mercuryRetro) {
    avoid.push('Sözleşme imzalama', 'Yeni teknoloji satın alma', 'Yeni iş başvurusu');
    tip += ' Merkür retrosunda eski işleri gözden geçirin, yeni başlangıçlardan kaçının.';
  }
  if (venusRetro) {
    avoid.push('Yeni ilişki başlatma', 'Lüks alışveriş', 'Estetik operasyonlar');
    tip += ' Venüs retrosunda estetik kararlardan ve yeni ilişkilerden kaçının.';
  }

  return { best, good, avoid, tip: tip.trim() };
}

function generateColors(moonSign, dayOfWeek, dateString) {
  const element = moonSign.element;
  const elemColors = ELEMENT_COLORS[element];
  const dayPlanet = DAY_PLANET_MAP[dayOfWeek];

  return {
    primary: { name: elemColors.primary.name, hex: elemColors.primary.hex, reason: `Ay ${moonSign.name} burcunda – ${element === 'fire' ? 'Ateş' : element === 'earth' ? 'Toprak' : element === 'air' ? 'Hava' : 'Su'} elementi` },
    secondary: { name: dayPlanet.color, hex: dayPlanet.colorHex, reason: `${DAY_NAMES_TR[dayOfWeek]} – ${dayPlanet.tr} günü` },
    accent: { name: elemColors.accent.name, hex: elemColors.accent.hex, reason: 'Tamamlayıcı enerji' },
    avoid: { name: elemColors.avoid.name, hex: elemColors.avoid.hex, reason: `${moonSign.name} Ay'ı ile uyumsuz enerji` },
    tip: generateColorTip(moonSign, dayOfWeek)
  };
}

function generateColorTip(moonSign, dayOfWeek) {
  const tips = {
    fire: 'Sıcak ve cesur renkler giyinin – kırmızı, turuncu ve altın tonları enerjinizi yükseltir.',
    earth: 'Doğal tonlar tercih edin – yeşil, kahve ve bej topraklanmanızı destekler.',
    air: 'Açık ve ferah renkler seçin – mavi, turkuaz ve lila zihinsel berraklık verir.',
    water: 'Sakin ve akışkan renkler giyinin – gümüş, deniz mavisi ve beyaz duygusal dengenizi korur.'
  };
  return tips[moonSign.element];
}

function generateGemstones(moonSign, dayOfWeek, dateString, moonPhaseData) {
  const moonStones = MOON_SIGN_STONES[moonSign.name];
  const dayPlanet = DAY_PLANET_MAP[dayOfWeek];
  
  const primary = { name: moonStones.primary.name, reason: `Ay ${moonSign.name} burcunda – ${moonSign.element === 'fire' ? 'ateş' : moonSign.element === 'earth' ? 'toprak' : moonSign.element === 'air' ? 'hava' : 'su'} enerjisini dengeler`, color: moonStones.primary.color };
  const secondary = { name: dayPlanet.stone, reason: `${DAY_NAMES_TR[dayOfWeek]} – ${dayPlanet.tr} enerjisini güçlendirir`, color: DAY_PLANET_MAP[dayOfWeek].colorHex };
  const optional = { name: moonStones.secondary.name, reason: `${moonSign.name} Ay'ına destek – ek harmoni`, color: moonStones.secondary.color };

  // Special tips based on moon phase
  let tip = '';
  if (moonPhaseData.phase === 'full_moon') {
    tip = 'Dolunay enerjisini dengelemek için Ametist veya Aytaşı özellikle etkilidir.';
  } else if (moonPhaseData.phase === 'new_moon') {
    tip = 'Yeni Ay niyetlerinizi güçlendirmek için Sitrin veya Kuvars kristali taşıyın.';
  } else if (moonPhaseData.waxing) {
    tip = `Büyüyen Ay döneminde ${primary.name} takmak ${moonSign.element === 'fire' ? 'motivasyonunuzu' : moonSign.element === 'earth' ? 'istikrarınızı' : moonSign.element === 'air' ? 'iletişiminizi' : 'sezgilerinizi'} güçlendirir.`;
  } else {
    tip = `Küçülen Ay döneminde ${primary.name} arınma ve bırakma sürecinizi destekler.`;
  }

  return { primary, secondary, optional, tip };
}

function generateHealthGuidance(moonSign, moonPhaseData, dateString, dayOfWeek) {
  const doctor = generateDoctorGuidance(moonSign, moonPhaseData, dateString);
  
  let exerciseType = '';
  let exerciseSuitable = true;
  const element = moonSign.element;

  if (element === 'fire') exerciseType = 'Kardio, HIIT, dans, koşu';
  else if (element === 'earth') exerciseType = 'Yoga, yürüyüş, pilates, ağırlık';
  else if (element === 'air') exerciseType = 'Bisiklet, yüzme, grup sporu';
  else exerciseType = 'Yüzme, meditasyonlu hareket, tai chi';

  if (isEclipseDay(dateString)) {
    exerciseSuitable = false;
    exerciseType = 'Dinlenme ve hafif stretching önerilir';
  }

  let detoxOk = !moonPhaseData.waxing; // Detox is better in waning moon
  
  return {
    doctorVisit: doctor.generalVisit,
    surgery: doctor.surgery,
    detox: { suitable: detoxOk, reason: detoxOk ? 'Küçülen Ay döneminde vücut toksinleri daha kolay atar' : 'Büyüyen Ay döneminde vücut biriktirme modunda – detokstan kaçının' },
    exercise: { suitable: exerciseSuitable, type: exerciseType },
    focusArea: moonSign.bodyPart,
    tip: `${moonSign.name} Ay'ı ${moonSign.bodyPart} bölgesini hassaslaştırır. Bu bölgeye özel dikkat gösterin.`
  };
}

function generateBeautyGuidance(moonSign, moonPhaseData, dateString) {
  const hairCut = generateHairCutGuidance(moonSign, moonPhaseData, dateString);
  const hairColor = generateHairColorGuidance(moonSign, moonPhaseData, dateString);
  
  let skinCare = { suitable: true, tip: '' };
  let nailCare = { suitable: true, tip: '' };
  
  const element = moonSign.element;
  const isWaxing = moonPhaseData.waxing;

  if (element === 'water') {
    skinCare.tip = 'Nemlendirici maskeler ve serum çok etkili – cilt emiciliği yüksek';
  } else if (element === 'earth') {
    skinCare.tip = 'Arındırıcı kil maskesi ve peeling için ideal – derin temizlik';
  } else if (element === 'fire') {
    skinCare.tip = 'Canlandırıcı ve enerji veren bakımlar – C vitamini serumu';
  } else {
    skinCare.tip = 'Hafif ve ferah bakımlar – nemlendirici ve tonlayıcı';
  }

  nailCare.tip = isWaxing 
    ? 'Büyüyen Ay döneminde kesilen tırnaklar daha hızlı uzar' 
    : 'Küçülen Ay döneminde tırnak bakımı daha kalıcı olur';

  // Overall tip
  let overallTip = '';
  if (isEclipseDay(dateString)) {
    overallTip = 'Tutulma günü – hiçbir estetik işlem yapmayın!';
  } else if (isInRetrograde(dateString, 'venus')) {
    overallTip = 'Venüs retrosunda radikal güzellik değişikliklerinden kaçının.';
  } else if (isInRetrograde(dateString, 'mercury')) {
    overallTip = 'Merkür retrosunda yeni kuaföre gitmeyin, mevcut rutininizi sürdürün.';
  } else {
    overallTip = `Ay ${moonSign.name} burcunda – ${element === 'fire' ? 'cesur ve enerjik bakımlar için uygun' : element === 'earth' ? 'kalıcı ve doğal bakımlar ideal' : element === 'air' ? 'hafif ve ferah bakımlar önerilir' : 'nemlendirici ve besleyici bakımlar etkili'}.`;
  }

  return { hairCut, hairColor, skinCare, nailCare, tip: overallTip };
}

function calculateEnergyScore(moonSign, moonPhaseData, dateString, dayOfWeek, astroEvents) {
  let score = 3; // Base neutral score

  // Moon phase influence
  if (moonPhaseData.phase === 'new_moon') score += 0.5;
  if (moonPhaseData.phase === 'full_moon') score += 0.5;
  if (moonPhaseData.phase === 'first_quarter') score += 0.5;

  // Element harmony with day planet
  const dayPlanet = DAY_PLANET_MAP[dayOfWeek];
  const fireAirHarmony = ['fire', 'air'];
  const earthWaterHarmony = ['earth', 'water'];
  if ((fireAirHarmony.includes(moonSign.element) && ['Sun', 'Mars', 'Jupiter'].includes(dayPlanet.planet)) ||
      (earthWaterHarmony.includes(moonSign.element) && ['Moon', 'Venus', 'Saturn'].includes(dayPlanet.planet))) {
    score += 0.5;
  }

  // Retro penalties
  if (isInRetrograde(dateString, 'mercury')) score -= 0.5;
  if (isInRetrograde(dateString, 'venus')) score -= 0.5;

  // Eclipse penalty
  if (isEclipseDay(dateString)) score -= 1.5;
  else if (isNearEclipse(dateString).near) score -= 0.5;

  // Astro event bonuses
  if (astroEvents) {
    astroEvents.forEach(event => {
      if (event.type === 'positive') score += 0.5;
      if (event.type === 'negative') score -= 0.5;
      if (event.intensity >= 5) score += (event.type === 'positive' ? 0.5 : -0.5);
    });
  }

  return Math.max(1, Math.min(5, Math.round(score)));
}

const ENERGY_LABELS = {
  1: 'Çok Zorlu',
  2: 'Dikkatli Olun',
  3: 'Nötr / Normal',
  4: 'Olumlu',
  5: 'Çok Olumlu'
};

// ═══════════════════════════════════════════════
// MAIN GENERATOR
// ═══════════════════════════════════════════════

function generateDailyGuidance() {
  console.log('📅 2026 Günlük Astrolojik Rehber oluşturuluyor...\n');
  
  const astroEventsMap = loadAstroEvents();
  const result = {};
  
  const startDate = new Date(2026, 0, 1); // Jan 1, 2026
  const endDate = new Date(2026, 11, 31); // Dec 31, 2026
  
  let currentDate = new Date(startDate);
  let dayCount = 0;
  
  while (currentDate <= endDate) {
    const ds = dateStr(currentDate);
    const dayOfWeek = currentDate.getDay();
    const moonSign = getMoonSign(currentDate);
    const moonPhaseData = getMoonPhase(currentDate);
    const sunSign = getSunSign(currentDate);
    const dayEvents = astroEventsMap[ds] || null;
    const dayEventTitles = dayEvents ? dayEvents.map(e => e.title) : [];

    const energyScore = calculateEnergyScore(moonSign, moonPhaseData, ds, dayOfWeek, dayEvents);

    result[ds] = {
      dayOfWeek: DAY_NAMES_TR[dayOfWeek],
      sunSign: sunSign,
      moonSign: moonSign.name,
      moonElement: moonSign.element,
      moonPhase: moonPhaseData.phase,
      moonPhaseLabel: moonPhaseData.label,
      isWaxingMoon: moonPhaseData.waxing,
      planetaryDay: DAY_PLANET_MAP[dayOfWeek].tr,
      energyScore: energyScore,
      energyLabel: ENERGY_LABELS[energyScore],
      
      retrogrades: {
        mercury: isInRetrograde(ds, 'mercury'),
        venus: isInRetrograde(ds, 'venus'),
        saturn: isInRetrograde(ds, 'saturn'),
        jupiter: isInRetrograde(ds, 'jupiter')
      },
      
      isEclipse: isEclipseDay(ds),
      nearEclipse: isNearEclipse(ds).near,

      activities: generateActivities(moonSign, moonPhaseData, ds, dayOfWeek, sunSign),
      beauty: generateBeautyGuidance(moonSign, moonPhaseData, ds),
      health: generateHealthGuidance(moonSign, moonPhaseData, ds, dayOfWeek),
      colors: generateColors(moonSign, dayOfWeek, ds),
      gemstones: generateGemstones(moonSign, dayOfWeek, ds, moonPhaseData),

      astroEvents: dayEventTitles
    };

    dayCount++;
    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log(`✅ ${dayCount} gün başarıyla oluşturuldu!\n`);
  
  // Validate
  console.log('🔍 Doğrulama yapılıyor...');
  validateData(result);
  
  // Write output
  const outputPath = path.join(__dirname, '..', 'data', 'daily_guidance_2026.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`\n📁 Dosya kaydedildi: ${outputPath}`);
  console.log(`📊 Dosya boyutu: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);
  
  // Print some stats
  printStats(result);
}

function validateData(data) {
  const keys = Object.keys(data);
  
  // Check 365 days
  if (keys.length !== 365) {
    console.error(`❌ Gün sayısı hatalı: ${keys.length} (beklenen: 365)`);
  } else {
    console.log(`✅ 365 gün tamamlandı`);
  }
  
  // Check no missing required fields
  let missingFields = 0;
  keys.forEach(date => {
    const d = data[date];
    const required = ['dayOfWeek', 'moonSign', 'moonPhase', 'activities', 'beauty', 'health', 'colors', 'gemstones'];
    required.forEach(field => {
      if (!d[field]) {
        console.error(`❌ Eksik alan: ${date} -> ${field}`);
        missingFields++;
      }
    });
  });
  if (missingFields === 0) console.log('✅ Tüm zorunlu alanlar mevcut');
  
  // Check eclipse days have restrictions
  ECLIPSE_DATES.forEach(ecl => {
    const d = data[ecl.date];
    if (d && d.beauty.hairCut.suitable) {
      console.error(`❌ Tutulma günü saç kesimi izinli: ${ecl.date}`);
    } else if (d) {
      console.log(`✅ Tutulma günü kısıtlamaları doğru: ${ecl.date}`);
    }
  });
  
  // Check retro periods
  const mercRetro1 = data['2026-03-01'];
  if (mercRetro1 && mercRetro1.retrogrades.mercury) {
    console.log('✅ Merkür retrosu doğru tespiti: 2026-03-01');
  }
}

function printStats(data) {
  const keys = Object.keys(data);
  
  // Count hair cut suitable days
  const hairCutOk = keys.filter(k => data[k].beauty.hairCut.suitable).length;
  const hairCutBest = keys.filter(k => data[k].beauty.hairCut.score >= 4).length;
  const hairColorOk = keys.filter(k => data[k].beauty.hairColor.suitable).length;
  
  const moonSignDist = {};
  keys.forEach(k => {
    const sign = data[k].moonSign;
    moonSignDist[sign] = (moonSignDist[sign] || 0) + 1;
  });
  
  const energyDist = {};
  keys.forEach(k => {
    const score = data[k].energyScore;
    energyDist[score] = (energyDist[score] || 0) + 1;
  });

  console.log('\n═══════════════════════════════════\n');
  console.log('📊 İSTATİSTİKLER:\n');
  console.log(`💇 Saç Kesimi Uygun Gün: ${hairCutOk} / 365`);
  console.log(`💇 Saç Kesimi En İyi Gün: ${hairCutBest} / 365`);
  console.log(`🎨 Saç Boyama Uygun Gün: ${hairColorOk} / 365`);
  
  console.log('\n🌙 Ay Burcu Dağılımı:');
  Object.entries(moonSignDist).sort((a, b) => b[1] - a[1]).forEach(([sign, count]) => {
    console.log(`   ${sign}: ${count} gün`);
  });
  
  console.log('\n⚡ Enerji Skor Dağılımı:');
  Object.entries(energyDist).sort((a, b) => a[0] - b[0]).forEach(([score, count]) => {
    console.log(`   ${ENERGY_LABELS[score]} (${score}): ${count} gün`);
  });
}

// Run
generateDailyGuidance();
