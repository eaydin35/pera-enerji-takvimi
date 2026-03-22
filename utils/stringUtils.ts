/**
 * Normalizes a Turkish string to handle search edge cases like "Izmir" vs "İzmir"
 * @param text The string to normalize
 * @returns A normalized string for search comparisons
 */
export function normalizeTurkishSearch(text: string): string {
    if (!text) return '';
    return text
        .toLocaleLowerCase('tr-TR')
        .replace(/i̇/g, 'i') // Handle special dotted i
        .replace(/ı/g, 'i') // Map dotless ı to i for lenient search
        .replace(/ö/g, 'o')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ğ/g, 'g')
        .replace(/ç/g, 'c')
        .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove accents
}
