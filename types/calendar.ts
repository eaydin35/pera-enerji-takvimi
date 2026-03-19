export type CalendarCategory = 'career' | 'relationship' | 'spiritual' | 'health' | 'financial';

export interface CalendarWarning {
    type: 'void_moon' | 'square_aspect' | 'retrograde' | 'eclipse_shadow';
    startTime: string | null;
    endTime: string | null;
    description: string;
}

export interface CalendarDay {
    date: string;                      // YYYY-MM-DD formati
    energyLevel: number;               // 1-10 arasi
    category: CalendarCategory;
    headline: string;                  // max 6 kelime
    suggestedAction: string;           // max 1 cumle
    stone: { 
        name: string; 
        wearHow: string; 
    };
    color: { 
        name: string; 
        hex: string;
    };
    esma: { 
        arabic: string; 
        turkish: string; 
        count: number; 
        timing: string; 
    };
    opportunityWindow: { 
        exists: boolean;
        timeRange: string | null;      // '14:30-17:00' formati
        planet: string | null;         // 'Venus destekli' gibi
        description: string | null;
    };
    warnings: CalendarWarning[];
    isPersonalPeak: boolean;
    isLocked: boolean;                 // abonelik penceresi disindaysa true yapilir
}
