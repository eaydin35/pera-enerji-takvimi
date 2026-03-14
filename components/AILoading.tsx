import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function AILoading({ message = "Yıldızlar yorumlanıyor..." }) {
    const opacity = useRef(new Animated.Value(0.3)).current;
    const scale   = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1,   duration: 1000, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(scale, { toValue: 1.1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(scale, { toValue: 1,   duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.circle, { opacity, transform: [{ scale }] }]}>
                <MaterialIcons name="auto-awesome" size={40} color="#ad92c9" />
            </Animated.View>
            <Text style={styles.text}>{message}</Text>
            <View style={styles.dotRow}>
                {[0, 1, 2].map((i) => (
                    <BouncingDot key={i} delay={i * 200} />
                ))}
            </View>
        </View>
    );
}

function BouncingDot({ delay }: { delay: number }) {
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(translateY, { toValue: -6, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
                Animated.timing(translateY, { toValue: 0,  duration: 400, easing: Easing.in(Easing.quad),  useNativeDriver: true }),
            ])
        );
        const timer = setTimeout(() => anim.start(), delay);
        return () => { clearTimeout(timer); anim.stop(); };
    }, []);

    return <Animated.View style={[styles.dot, { transform: [{ translateY }] }]} />;
}

const styles = StyleSheet.create({
    container: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#f7e1e8',
    },
    circle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fdf2f8',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    text: {
        fontSize: 14,
        fontWeight: '600',
        color: '#71717a',
        textAlign: 'center',
    },
    dotRow: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#ad92c9',
    },
});
