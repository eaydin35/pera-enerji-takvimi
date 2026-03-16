import { supabase } from './supabase';
import { calculateChart, type ChartData } from './astrology';
import astrologyKB from '../data/astrology_kb.json';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Message {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export interface ChatHistory {
    messages: Message[];
}

// ─── AI Astrology Service ───────────────────────────────────────────────────

const SYSTEM_PROMPT = `
Sen "Pera", Pera Enerji Takvimi uygulamasının uzman astroloğu ve ruhsal rehberisin.
Görevin, kullanıcıların doğum haritaları ve gökyüzü transitleri üzerinden onlara yol göstermek.

Persona Kuralları:
1. İsim: Pera. Her zaman nazik, bilge ve empatik bir dille konuş.

2. Bilgi Kaynağı: Kullanıcının doğum haritası verilerini ve anlık transitleri temel al. 
3. Stil: Modern, mistik ama ayakları yere basan bir dil kullan. Gereksiz terimlerden kaçın, etkileri günlük hayata uyarla.
4. Sınırlar: Tıbbi, hukuki veya kesin gelecek tahmini (fal) yapma. "Olasılıklar" ve "enerjiler" üzerinden konuş.
5. Esma ve Ritüel: Önerilerinde esmalar, doğal taşlar ve niyet ritüellerine (uygulamadaki KB'ye uygun olarak) yer ver.

Kullanıcı Bilgileri:
- Doğum Haritası Özeti: {natalSummary}
- Aktif Transitler: {currentTransits}
`;

export const chatWithAI = async (
    userId: string | undefined,
    userMessage: string,
    history: Message[],
    natalChart: ChartData,
    currentTransits: any
): Promise<string> => {
    try {
        const natalSummary = natalChart.positions.map(p => `${p.name} ${p.sign} burcunda ${p.degreeInSign.toFixed(1)} derecede`).join(', ');
        const transitSummary = currentTransits?.aspects?.map((a: any) => `${a.planet1} ve ${a.planet2} arasında ${a.type}`).join(', ') || "Genel gökyüzü etkileri";

        const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

        if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
            return "Şu an yıldızlarla olan bağlantım zayıf (API Anahtarı eksik). Ama doğum haritana baktığımda harika bir enerji görüyorum! Lütfen teknik ayarları kontrol et.";
        }

        const fullSystemPrompt = SYSTEM_PROMPT
            .replace('{natalSummary}', natalSummary)
            .replace('{currentTransits}', transitSummary);

        const contents = [
            { role: 'user', parts: [{ text: fullSystemPrompt }] },
            { role: 'model', parts: [{ text: "Anlaşıldı. Ben Pera, kullanıcının doğum haritasına ve gökyüzü etkilerine göre rehberlik etmeye hazırım." }] },

            ...history,
            { role: 'user', parts: [{ text: userMessage }] }
        ];

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents })
        });

        const aiData = await response.json();
        const content = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!content) {
            console.error('Gemini API Error:', aiData);
            throw new Error('No content from AI');
        }

        return content;

    } catch (error) {
        console.error('[AI Chat] Error:', error);
        return "Gökyüzü şu an biraz bulutlu, mesajını tam alamadım. Tekrar sormak ister misin?";
    }
};

/**
 * Generates 3 proactive question suggestions based on today's energies
 */
export const getProactiveQuestions = (chart: ChartData, transit: any): string[] => {
    const questions = [
        "Bugünkü enerjimle hangi işlere odaklanmalıyım?",
        "Doğum haritamdaki Venüs konumu ilişkilerimi nasıl etkiliyor?",
        "Bu haftaki Merkür gerilemesi beni nasıl etkiler?"
    ];

    // Try to personalize if transit exists
    if (transit?.aspects?.length > 0) {
        const majorAspect = transit.aspects[0];
        questions.push(`${majorAspect.planet1} ${majorAspect.type} etkisi altında ne yapmalıyım?`);
    }

    return questions.slice(-3); // Return last 3
};

export const getAstrologyInsight = async (
    userId: string,
    date: string,
    type: 'daily_transit' | 'natal_analysis',
    natalChart: ChartData
): Promise<string> => {
    // Keep internal logic but redirect or simplify if needed
    // For now, let's keep it as is or use chatWithAI logic for consistency
    return chatWithAI(userId, type === 'daily_transit' ? "Bugünkü gökyüzü etkilerimi özetler misin?" : "Doğum haritama göre genel bir analiz yapar mısın?", [], natalChart, null);
};

