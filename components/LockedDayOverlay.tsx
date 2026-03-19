import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

interface LockedDayOverlayProps {
    requiredTier: 'monthly' | 'yearly';
    ctaText: string;
    blurIntensity?: number;
    onUpgradePress: () => void;
}

export const LockedDayOverlay: React.FC<LockedDayOverlayProps> = ({
    requiredTier,
    ctaText,
    blurIntensity = 10,
    onUpgradePress
}) => {
    return (
        <View style={StyleSheet.absoluteFill}>
            <BlurView intensity={blurIntensity} style={styles.blurContainer} tint="light">
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="lock-closed" size={32} color="#D2B48C" />
                    </View>
                    <Text style={styles.title}>Premium İçerik</Text>
                    <Text style={styles.subtitle}>{ctaText}</Text>
                    
                    <TouchableOpacity 
                        style={styles.ctaButton} 
                        onPress={onUpgradePress}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.ctaText}>Kilidi Aç ({requiredTier === 'monthly' ? 'Aylık' : 'Yıllık'})</Text>
                    </TouchableOpacity>
                </View>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    blurContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 24,
        overflow: 'hidden',
    },
    content: {
        alignItems: 'center',
        padding: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 20,
        width: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFF5E1',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2C3E50',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#7F8C8D',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    ctaButton: {
        backgroundColor: '#E4405F',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 24,
        width: '100%',
        alignItems: 'center',
    },
    ctaText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    }
});
