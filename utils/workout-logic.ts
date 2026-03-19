import { supabase } from './supabase';

export interface Exercise {
    name: string;
    duration: string; // e.g. "30"
    instructions: string;
    target_area: string;
    image_key: string; 
}

export interface Workout {
    title: string;
    description: string;
    exercises: Exercise[];
}

export async function generateWorkout(userId: string): Promise<Workout | null> {
    const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!GEMINI_API_KEY) return null;

    const prompt = `
        Sen profesyonel bir yoga ve esneme eğitmenisin. 
        Kullanıcı için 10 adımdan oluşan, şık, bohem ve sofistike bir esneme rutini hazırla.
        Her adımın bir adı, süresi (saniye cinsinden, sayı olarak "30" gibi), kısa talimatı ve hedef bölgesi olsun.
        Yanıtı sadece aşağıdaki JSON formatında ver, başka metin ekleme:
        {
            "title": "Günün Esneme Seremonisi",
            "description": "Ruhunu ve bedenini dengeleyen, hafifletici bir akış.",
            "exercises": [
                {
                    "name": "Egzersiz Adı",
                    "duration": "30", 
                    "instructions": "Yapılış tarifi...",
                    "target_area": "Hedef Bölge",
                    "image_key": "fitness"
                }
            ]
        }
    `;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
                })
            }
        );

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        const cleanedText = text.replace(/```json|```/g, '').trim();
        const workout: Workout = JSON.parse(cleanedText);

        // Save to Supabase
        const { error } = await supabase.from('workouts').insert({
            user_id: userId,
            title: workout.title,
            description: workout.description,
            exercises: workout.exercises
        });

        if (error) console.error('[Workout] Save error:', error);
        
        return workout;
    } catch (error) {
        console.error('[Workout] Generation error:', error);
        return null;
    }
}
