import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { AlertTriangle, X } from 'lucide-react-native';
import { useTheme } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const EarthquakeAlert = ({ message, timestamp, onClose }) => {
    const { theme } = useTheme();
    const [visible, setVisible] = useState(false);
    const slideAnim = useRef(new Animated.Value(-300)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (message) {
            setVisible(true);

            // Slide in
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
            }).start();

            // Shake
            Animated.sequence([
                Animated.timing(shakeAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -3, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 3, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
            ]).start();

            // Pulse icon
            const pulseLoop = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
                ])
            );
            pulseLoop.start();

            // Auto dismiss after 8 seconds
            const timer = setTimeout(() => handleClose(), 8000);

            return () => {
                clearTimeout(timer);
                pulseLoop.stop();
            };
        }
    }, [message]);

    const handleClose = () => {
        Animated.timing(slideAnim, {
            toValue: -300,
            duration: 400,
            useNativeDriver: true,
        }).start(() => {
            setVisible(false);
            onClose?.();
        });
    };

    if (!message || !visible) return null;

    return (
        <Animated.View style={[
            styles.container,
            {
                transform: [{ translateY: slideAnim }, { translateX: shakeAnim }],
            },
        ]}>
            <View style={[styles.card, { backgroundColor: theme.glassBg, borderColor: theme.glassBorder, ...theme.shadowLg }]}>
                {/* Icon */}
                <Animated.View style={[styles.icon, { transform: [{ scale: pulseAnim }] }]}>
                    <AlertTriangle size={28} color="#ff3b30" />
                </Animated.View>

                {/* Body */}
                <View style={styles.body}>
                    <Text style={[styles.title, { fontFamily: 'LuckiestGuy_400Regular' }]}>
                        Earthquake Detected!
                    </Text>
                    <Text style={[styles.message, { color: theme.textPrimary, fontFamily: 'NotoSerif_400Regular' }]}>
                        {message}
                    </Text>
                    <Text style={[styles.time, { color: theme.textSecondary, fontFamily: 'NotoSerif_400Regular' }]}>
                        {timestamp}
                    </Text>
                </View>

                {/* Close */}
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                    <X size={16} color={theme.textSecondary} />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 50,
        left: 16,
        right: 16,
        zIndex: 9999,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
    },
    icon: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(255, 59, 48, 0.15)',
        borderWidth: 2,
        borderColor: 'rgba(255, 59, 48, 0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    body: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        color: '#ff3b30',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    message: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 4,
    },
    time: {
        fontSize: 12,
    },
    closeBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default EarthquakeAlert;
