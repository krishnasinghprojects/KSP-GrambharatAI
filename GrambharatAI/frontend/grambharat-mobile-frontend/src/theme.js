import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const lightTheme = {
    dark: false,
    bgPrimary: '#fff5e6',
    bgSecondary: '#ffffff',
    bgGradientStart: '#fff5e6',
    bgGradientEnd: '#ffe4cc',
    textPrimary: '#333333',
    textSecondary: '#666666',
    textTertiary: '#999999',
    borderColor: '#ffd4a3',
    accentPrimary: '#ff6b35',
    accentSecondary: '#ff8c42',
    userMsgStart: '#ff6b35',
    userMsgEnd: '#ff8c42',
    shadowSm: { shadowColor: '#ff6b35', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 },
    shadowMd: { shadowColor: '#ff6b35', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4 },
    shadowLg: { shadowColor: '#ff6b35', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 8 },
    glassBg: 'rgba(255, 255, 255, 0.85)',
    glassBorder: 'rgba(255, 255, 255, 0.3)',
    cardBg: 'rgba(255, 255, 255, 0.9)',
    statusBar: 'dark-content',
};

const darkTheme = {
    dark: true,
    bgPrimary: '#1a1a1a',
    bgSecondary: '#2d2d2d',
    bgGradientStart: '#1a1a1a',
    bgGradientEnd: '#2d2d2d',
    textPrimary: '#ffffff',
    textSecondary: '#cccccc',
    textTertiary: '#999999',
    borderColor: '#4a4a4a',
    accentPrimary: '#ff6b35',
    accentSecondary: '#ff8c42',
    userMsgStart: '#ff8c42',
    userMsgEnd: '#ffb366',
    shadowSm: { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 2 },
    shadowMd: { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 4 },
    shadowLg: { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 8 },
    glassBg: 'rgba(45, 45, 45, 0.85)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    cardBg: 'rgba(45, 45, 45, 0.9)',
    statusBar: 'light-content',
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const theme = isDark ? darkTheme : lightTheme;

    useEffect(() => {
        AsyncStorage.getItem('theme').then(value => {
            if (value === 'dark') setIsDark(true);
        });
    }, []);

    const toggleTheme = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);

        // The overlay color is the NEXT theme's background
        const nextIsDark = !isDark;

        // Fade in an overlay with the new theme's bg color
        Animated.timing(overlayOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            // Switch theme while overlay fully covers the screen
            setIsDark(nextIsDark);
            AsyncStorage.setItem('theme', nextIsDark ? 'dark' : 'light');

            // Small delay to let React re-render behind the overlay
            setTimeout(() => {
                // Fade out the overlay to reveal new theme
                Animated.timing(overlayOpacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => {
                    setIsTransitioning(false);
                });
            }, 50);
        });
    };

    // Overlay uses the TARGET theme's bg color
    const overlayColor = isDark ? lightTheme.bgPrimary : darkTheme.bgPrimary;

    return (
        <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
            <View style={styles.container}>
                {children}
                {/* Overlay that covers everything during transition */}
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.overlay,
                        {
                            backgroundColor: overlayColor,
                            opacity: overlayOpacity,
                        },
                    ]}
                />
            </View>
        </ThemeContext.Provider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
    },
});

export const useTheme = () => useContext(ThemeContext);

export { lightTheme, darkTheme };
