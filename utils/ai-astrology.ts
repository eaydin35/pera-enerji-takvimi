import { supabase } from './supabase';
import { calculateChart, type ChartData } from './astrology';
import astrologyKB from '../data/astrology_kb.json';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AIInsight {
    content: string;
    type: 'daily_transit' | 'natal_analysis';
    date: string;
}

// ─── AI Astrology Service ───────────────────────────────────────────────────

export const getAstrologyInsight = async (
    userId: string,
    date: string, // YYYY-MM-DD
    type: 'daily_transit' | 'natal_analysis',
     natalChart: ChartData
): Promise<string> => {
    try {
        // 1. Check Supabase Cache first
        const { data: cached, error: cacheError } = await supabase
            .from('ai_insights')
            .select('content')
            .eq('user_id', userId)
            .eq('insight_date', date)
            .eq('insight_type', type)
            .single();

        if (cached?.content) {
            console.log('[AI Service] Returning cached insight');
            return cached.content;
        }

        // 2. Synthesize Context from Natal Chart and Knowledge Base
        // For simplicity, we create a specialized summary
        const summary = natalChart.positions.map(p => `${p.name} ${p.sign} burcunda`).join(', ');
        
        // 3. Prepare Local "Safe" Interpretation (Fallback/Augmentation)
        let localIntro = "";
        const sunPos = natalChart.positions.find(p => p.name === 'Gunes' || p.name === 'Sun');
        if (sunPos) {
            const kbMatch = (astrologyKB as any).planets_in_signs?.Sun?.[sunPos.sign];
            if (kbMatch) localIntro = kbMatch;
        }

        // 4. Call AI for Synthesis (Gemini API)
        // If API key is missing, we use a structured local template for now to avoid errors
        const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

        let finalContent = "";

        if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
            console.warn('[AI Service] Gemini API Key missing, using local synthesis');
            finalContent = `${localIntro}\n\nBugun gokyuzundeki enerjiler, senin ${sunPos?.sign || ''} burcundaki dogasiyla uyum icinde. Iletisim konularinda dikkatli olmani ve sezgilerine guvenmeni oneririz. Kozmik enerjiler seni destekliyor.`;
        } else {
            const prompt = `
                Sen uzman bir astrolog ve ruhsal rehbersin. 
                Kullanicinin dogum haritasi ozeti: ${summary}.
                Bugunun tarihi: ${date}.
                Lutfen bu haritaya gore bugunku transitlerin (gunluk etkilesimlerin) bir yorumunu yap.
                Dil: Turkce.
                Stil: Mistik, ilham verici, yol gosterici ve modern.
                Halüsinasyon yapma, sadece verili konumlara gore genel bir enerji okumasi yap.
                Maksimum 3-4 paragraf.
            `;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            const aiData = await response.json();
            finalContent = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "Kozmik veriler su an hazirlaniyor, lutfen az sonra tekrar deneyin.";
        }

        // 5. Store in Supabase Cache
        await supabase.from('ai_insights').upsert({
            user_id: userId,
            insight_date: date,
            insight_type: type,
            content: finalContent
        });

        return finalContent;

    } catch (error) {
        console.error('[AI Service] Error generating insight:', error);
        return "Yildizlar su an biraz sessiz... Baglantini kontrol edip tekrar deneyebilirsin.";
    }
};
