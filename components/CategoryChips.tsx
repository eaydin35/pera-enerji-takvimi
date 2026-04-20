import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

export interface CategoryChip {
    key: string;
    label: string;
    emoji: string;
}

const CATEGORIES: CategoryChip[] = [
    { key: 'all', label: 'Tümü', emoji: '🔮' },
    { key: 'transit', label: 'Transit', emoji: '🪐' },
    { key: 'lunar_phase', label: 'Ay Fazı', emoji: '🌙' },
    { key: 'activity', label: 'Aktivite', emoji: '🏃' },
    { key: 'official', label: 'Resmi', emoji: '🏛️' },
    { key: 'spiritual', label: 'Manevi', emoji: '✨' },
    { key: 'color', label: 'Renk', emoji: '🎨' },
    { key: 'beauty', label: 'Güzellik', emoji: '💅' },
    { key: 'health', label: 'Sağlık', emoji: '💊' },
];

interface Props {
    selected: string;
    onSelect: (key: string) => void;
}

export default function CategoryChips({ selected, onSelect }: Props) {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}
        >
            {CATEGORIES.map((cat) => {
                const isActive = selected === cat.key;
                return (
                    <TouchableOpacity
                        key={cat.key}
                        onPress={() => onSelect(cat.key)}
                        style={[
                            styles.chip,
                            isActive && styles.chipActive,
                        ]}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.emoji}>{cat.emoji}</Text>
                        <Text style={[
                            styles.label,
                            isActive && styles.labelActive,
                        ]}>
                            {cat.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );
}

export { CATEGORIES };

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 10,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#f7f2fb',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 16,
    },
    chipActive: {
        backgroundColor: '#f2c6f8',
    },
    emoji: {
        fontSize: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#33313b',
    },
    labelActive: {
        color: '#5e3d66',
        fontWeight: '700',
    },
});
