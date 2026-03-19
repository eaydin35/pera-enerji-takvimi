import { supabase } from './supabase';
import { calculateChart, type ChartData } from './astrology';
import { getCached, setCached, buildCacheKey, type CacheType } from './cache-manager';
import astrologyKB from '../data/astrology_kb.json';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Message {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export interface ChatHistory {
    messages: Message[];
}

export type AITask = 
    | 'natal_analysis'      // gemini-2.0-flash — derin, bir kez
    | 'daily_panel'         // gemini-2.0-flash-lite — hizli, ucuz
    | 'weekly_calendar'     // gemini-2.0-flash-lite
    | 'monthly_calendar'    // gemini-2.0-flash-lite
    | 'notification_batch'  // gemini-2.0-flash-lite
    | 'user_chat';          // gemini-2.0-flash — kullanici sorusu

export const MODEL_MAP: Record<AITask, string> = {
    natal_analysis:     'gemini-2.0-flash',
    daily_panel:        'gemini-2.0-flash-lite',
    weekly_calendar:    'gemini-2.0-flash-lite',
    monthly_calendar:   'gemini-2.0-flash-lite',
    notification_batch: 'gemini-2.0-flash-lite',
    user_chat:          'gemini-2.0-flash',
};

// ─── AI Astrology Service ───────────────────────────────────────────────────

const SYSTEM_PROMPT = `
Sen "Pera", Pera Enerji Takvimi uygulamasının uzman astroloğu ve ruhsal rehberisin.
Görevin, kullanıcıların doğum haritaları ve gökyüzü transitleri üzerinden onlara yol göstermek.

Persona & Stil Kuralları (KRİTİK):
1. Dil: Nazik ama doğrudan. Gereksiz giriş cümlelerinden ("Harika bir soru", "Sana yardımcı olmaktan mutluyum" vb.) ve aşırı nezaket ifadelerinden kaçın.
2. Öz ve Derin: Cevaplarını öz tut ama astrolojik derinliği koru. Doğrudan konuya (gezegen etkisine) gir.
3. Bilgi Kaynağı: Kullanıcının doğum haritası verilerini ve anlık transitleri temel al. 
4. Sınırlar: Tıbbi, hukuki veya kesin gelecek tahmini yapma. "Olasılıklar" ve "enerjiler" üzerinden konuş.
5. Esma ve Ritüel: Önerilerinde esmalar ve niyet ritüellerine yer ver.
6. Hitap: Kullanıcıya her zaman adıyla hitap et.

═══════════════ KULLANICI PROFİLİ ═══════════════
- Ad Soyad: {userName}
- Doğum Tarihi: {birthDate}
- Doğum Saati: {birthTime}
- Doğum Yeri: {birthPlace}

═══════════════ DOĞUM HARİTASI (NATAL) ═══════════════
{natalSummary}

═══════════════ ELEMENT DAĞILIMI ═══════════════
{elementBalance}

═══════════════ BUGÜNKÜ TRANSİTLER ═══════════════
{currentTransits}

═══════════════ GÜNLÜK ÖNERİLER ═══════════════
{dailyRecommendations}
`;

// ─── Helpers ────────────────────────────────────────────────────────────────

const RETRYABLE_STATUS_CODES = [429, 500, 503];
const MAX_RETRIES = 2;

/** Wait for a given number of milliseconds */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** Return a user-friendly Turkish error message based on HTTP status */
const getErrorMessageForStatus = (status: number, errorBody?: any): string => {
    switch (status) {
        case 400:
            return "İsteğimde bir sorun oluştu. Lütfen tekrar dene. 🔄";
        case 401:
        case 403:
            return "API anahtarı geçersiz veya yetkisiz görünüyor. Lütfen .env dosyasındaki EXPO_PUBLIC_GEMINI_API_KEY değerini kontrol et. 🔑";
        case 404:
            return "AI modeli bulunamadı. Lütfen teknik ayarları kontrol et. ⚙️";
        case 429:
            return "Gökyüzü trafiği çok yoğun (API kotası doldu). Lütfen birkaç dakika sonra tekrar dene. ⏳";
        case 500:
        case 502:
        case 503:
            return "Google sunucuları geçici olarak yanıt veremiyor. Birkaç saniye sonra tekrar deneyelim. 🌐";
        default:
            return `Beklenmeyen bir hata oluştu (Kod: ${status}). Lütfen tekrar dene.`;
    }
};

/** Log Gemini API token usage to Supabase */
export const logTokenUsage = async (
    userId: string | undefined,
    featureName: string,
    modelId: string,
    promptTokens: number,
    completionTokens: number,
    totalTokens: number
) => {
    try {
        const { error } = await supabase
            .from('token_usage')
            .insert({
                user_id: userId,
                feature_name: featureName,
                model_id: modelId,
                prompt_tokens: promptTokens,
                completion_tokens: completionTokens,
                total_tokens: totalTokens
            });

        if (error) {
            console.error('[Token Usage] Error logging usage:', error.message);
        } else {
            console.log(`[Token Usage] Logged ${totalTokens} tokens for ${featureName}`);
        }
    } catch (err) {
        console.error('[Token Usage] Unexpected error while logging:', err);
    }
};

// ─── Generic AI Caller (Token Economy implementation) ───────────────────────

export async function callAI<T>(
    userId: string,
    task: AITask,
    prompt: string,
    cacheKey: string,
    options?: { skipCache?: boolean }
): Promise<T | null> {
    // 1. Check Cache first
    if (!options?.skipCache) {
        const cached = await getCached<T>(cacheKey);
        if (cached) {
            console.log(`[Token Economy] Cache HIT for ${task} (Key: ${cacheKey}) - Cost: $0`);
            return cached;
        }
    }

    const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!GEMINI_API_KEY) return null;

    const modelToUse = MODEL_MAP[task];
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${GEMINI_API_KEY}`;
    console.log(`[Token Economy] Cache MISS for ${task}. Routing to cost-effective model: ${modelToUse}`);

    const requestBody = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.7, // Lower temperature for more consistent JSON/logic
            maxOutputTokens: 2048,
        }
    };

    let lastError = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                if (RETRYABLE_STATUS_CODES.includes(response.status) && attempt < MAX_RETRIES) {
                    await sleep(1000 * Math.pow(2, attempt));
                    continue;
                }
                throw new Error(await response.text());
            }

            const aiData = await response.json();
            const textResponse = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
            const usage = aiData.usageMetadata;

            if (textResponse) {
                if (usage) {
                    await logTokenUsage(userId, task, modelToUse, usage.promptTokenCount, usage.candidatesTokenCount, usage.totalTokenCount);
                }

                let parsedPayload: any = textResponse;
                try {
                    // Temizle ve JSON parse etmeye çalış (json output bekleyen task'lar icin)
                    if (textResponse.includes('```json')) {
                        const jsonStr = textResponse.split('```json')[1].split('```')[0].trim();
                        parsedPayload = JSON.parse(jsonStr) as T;
                    } else if (textResponse.trim().startsWith('{') || textResponse.trim().startsWith('[')) {
                        parsedPayload = JSON.parse(textResponse) as T;
                    }
                } catch (e) {
                    // JSON degil, normal text don.
                }

                // 2. Write to cache
                if (task !== 'user_chat') {
                    // Type assertion to ensure task name aligns with allowed cache types loosely
                    await setCached(userId, cacheKey, parsedPayload, task as CacheType);
                }

                return parsedPayload as T;
            }
        } catch (error: any) {
            lastError = error.message;
            if (attempt < MAX_RETRIES) {
                await sleep(1000 * Math.pow(2, attempt));
            }
        }
    }

    console.error(`[AI Caller] Failed after ${MAX_RETRIES} retries:`, lastError);
    return null;
}

// ─── Main Chat Function ─────────────────────────────────────────────────────

export const chatWithAI = async (
    userId: string | undefined,
    userMessage: string,
    history: Message[],
    natalChart: ChartData,
    currentTransits: any,
    userProfile?: { firstName?: string; lastName?: string; birthDate?: string; birthTime?: string; birthPlace?: string },
    recommendations?: { stone?: { name: string }; esma?: { name: string; meaning: string }; color?: { name: string }; elementWarning?: { elementTr: string; advice: string } | null }
): Promise<string> => {
    try {
        const natalSummary = natalChart.positions.map(p => `${p.name} ${p.sign} burcunda ${p.degreeInSign.toFixed(1)} derecede`).join('\n');
        const transitSummary = currentTransits?.activeTransits?.map((a: any) => 
            `${a.transitPlanet} ${a.aspectType} ${a.natalPlanet} (${a.transitSign} burcunda, ${a.affectedHouse}. ev, ${a.nature})`
        ).join('\n') || currentTransits?.aspects?.map((a: any) => `${a.planet1} ve ${a.planet2} arasında ${a.type}`).join('\n') || "Genel gökyüzü etkileri";

        const elementBalance = natalChart.elements 
            ? `Ateş: %${natalChart.elements.fire}, Toprak: %${natalChart.elements.earth}, Hava: %${natalChart.elements.air}, Su: %${natalChart.elements.water}`
            : "Element bilgisi hesaplanıyor...";

        const dailyRecs = recommendations 
            ? `Günün Taşı: ${recommendations.stone?.name || '-'}\nGünün Esması: ${recommendations.esma?.name || '-'} (${recommendations.esma?.meaning || ''})\nGünün Rengi: ${recommendations.color?.name || '-'}${recommendations.elementWarning ? `\nElement Uyarısı: ${recommendations.elementWarning.elementTr} elementi zayıf - ${recommendations.elementWarning.advice}` : ''}`
            : "Öneriler hesaplanıyor...";

        const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

        if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
            console.error('[AI Chat] Gemini API Key is missing or default.');
            return "Şu an yıldızlarla olan bağlantım zayıf (API Anahtarı eksik). Ama doğum haritana baktığımda harika bir enerji görüyorum! Lütfen teknik ayarları kontrol et.";
        }

        console.log(`[AI Chat] Using Gemini API Key starting with: ${GEMINI_API_KEY.slice(0, 4)}...`);

        const fullSystemPrompt = SYSTEM_PROMPT
            .replace('{userName}', `${userProfile?.firstName || 'Gezgin'} ${userProfile?.lastName || ''}`.trim())
            .replace('{birthDate}', userProfile?.birthDate || 'Belirtilmemiş')
            .replace('{birthTime}', userProfile?.birthTime || 'Belirtilmemiş')
            .replace('{birthPlace}', userProfile?.birthPlace || 'Belirtilmemiş')
            .replace('{natalSummary}', natalSummary)
            .replace('{elementBalance}', elementBalance)
            .replace('{currentTransits}', transitSummary)
            .replace('{dailyRecommendations}', dailyRecs);

        const contents = [
            { role: 'user', parts: [{ text: fullSystemPrompt }] },
            { role: 'model', parts: [{ text: `Anlaşıldı. Ben Pera, ${userProfile?.firstName || 'sevgili kullanıcı'}'nın doğum haritasına ve güncel transit etkilerine göre kişiselleştirilmiş rehberlik etmeye hazırım. Tüm natal verileri ve günlük önerileri inceledim.` }] },
            ...history,
            { role: 'user', parts: [{ text: userMessage }] }
        ];

        const requestBody = {
            contents,
            generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 2048, // Reduced for stability
                topP: 0.95,
                topK: 40,
            },
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
            ],
        };

        const modelToUse = MODEL_MAP['user_chat'];
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${GEMINI_API_KEY}`;

        // ── Retry loop with exponential backoff ──
        let lastError: string | null = null;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody),
                });

                // ── Check HTTP status BEFORE parsing JSON ──
                if (!response.ok) {
                    const errorBody = await response.text();
                    console.error(`[AI Chat] HTTP ${response.status}:`, errorBody);

                    // Retry on transient errors
                    if (RETRYABLE_STATUS_CODES.includes(response.status) && attempt < MAX_RETRIES) {
                        const delayMs = 1000 * Math.pow(2, attempt); // 1s, 2s
                        console.log(`[AI Chat] Retrying in ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`);
                        await sleep(delayMs);
                        continue;
                    }

                    // Non-retryable or exhausted retries
                    return getErrorMessageForStatus(response.status);
                }

                // ── Parse successful response ──
                const aiData = await response.json();

                // Check for content filter block
                const finishReason = aiData.candidates?.[0]?.finishReason;
                if (finishReason === 'SAFETY') {
                    console.warn('[AI Chat] Response blocked by safety filters');
                    return "Bu konuda yanıt vermem güvenlik filtreleri tarafından engellendi. Lütfen sorunuzu farklı bir şekilde sormayı dene. 🛡️";
                }

                const content = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
                const usage = aiData.usageMetadata;

                if (!content) {
                    console.error('[AI Chat] No content in response:', JSON.stringify(aiData, null, 2));
                    return "Yıldızlardan bir yanıt alamadım. Lütfen sorunuzu tekrar sormayı dene. 🔄";
                }

                // Log token usage asynchronously (don't block the UI)
                if (usage) {
                    logTokenUsage(
                        userId,
                        'chat_with_ai',
                        'gemini-2.0-flash',
                        usage.promptTokenCount || 0,
                        usage.candidatesTokenCount || 0,
                        usage.totalTokenCount || 0
                    ).catch(err => console.error('[AI Chat] Failed to log token usage:', err));
                }

                return content;

            } catch (fetchError: any) {
                // Network error (no internet, DNS failure, timeout, etc.)
                console.error(`[AI Chat] Network error (attempt ${attempt + 1}):`, fetchError.message);
                lastError = fetchError.message;

                if (attempt < MAX_RETRIES) {
                    const delayMs = 1000 * Math.pow(2, attempt);
                    await sleep(delayMs);
                    continue;
                }
            }
        }

        // All retries exhausted with network errors
        return "İnternet bağlantını kontrol et, gökyüzüne ulaşamıyorum. Bağlantın düzeldiğinde tekrar dene. 📡";

    } catch (error: any) {
        console.error('[AI Chat] Unexpected error:', error);
        return "Beklenmeyen bir hata oluştu. Lütfen uygulamayı yeniden başlatıp tekrar dene.";
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

