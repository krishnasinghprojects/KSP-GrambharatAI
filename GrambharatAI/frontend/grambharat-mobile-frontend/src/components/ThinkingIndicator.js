import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Bot, Loader2, Wrench } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '../theme';

const ThinkingIndicator = ({ streamingText, status, toolCalling }) => {
    const { theme } = useTheme();
    const spinAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const cursorAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Spinner rotation
        const spinLoop = Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            })
        );
        spinLoop.start();

        // Avatar pulse
        const pulseLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        );
        pulseLoop.start();

        // Cursor blink
        const cursorLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(cursorAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
                Animated.timing(cursorAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            ])
        );
        cursorLoop.start();

        return () => {
            spinLoop.stop();
            pulseLoop.stop();
            cursorLoop.stop();
        };
    }, []);

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const mdStyles = {
        body: { color: theme.textPrimary, fontFamily: 'NotoSerif_400Regular', fontSize: 15, lineHeight: 24 },
        heading1: { color: theme.accentPrimary, fontFamily: 'LuckiestGuy_400Regular', fontWeight: '400', fontSize: 22, marginTop: 16, marginBottom: 8 },
        heading2: { color: theme.accentPrimary, fontFamily: 'LuckiestGuy_400Regular', fontWeight: '400', fontSize: 19, marginTop: 14, marginBottom: 6 },
        heading3: { color: theme.accentPrimary, fontFamily: 'LuckiestGuy_400Regular', fontWeight: '400', fontSize: 17, marginTop: 12, marginBottom: 6 },
        paragraph: { marginTop: 4, marginBottom: 4 },
        code_inline: { backgroundColor: 'rgba(255, 107, 53, 0.1)', color: theme.accentPrimary, fontFamily: 'Courier', fontSize: 13 },
        code_block: { backgroundColor: theme.bgSecondary, padding: 12, borderRadius: 8, fontFamily: 'Courier', fontSize: 13, color: theme.textPrimary },
        fence: { backgroundColor: theme.bgSecondary, padding: 12, borderRadius: 8, fontFamily: 'Courier', fontSize: 13, color: theme.textPrimary },
        blockquote: { borderLeftWidth: 3, borderLeftColor: theme.accentPrimary, paddingLeft: 12, backgroundColor: 'transparent' },
        link: { color: theme.accentPrimary },
        strong: { fontWeight: 'bold' },
    };

    return (
        <View style={styles.container}>
            {/* Avatar */}
            <Animated.View style={[
                styles.avatar,
                { backgroundColor: theme.accentPrimary, transform: [{ scale: pulseAnim }], ...theme.shadowMd },
            ]}>
                <Bot size={18} color="#fff" />
            </Animated.View>

            {/* Content */}
            <View style={[styles.content, { backgroundColor: theme.glassBg, borderColor: theme.glassBorder, ...theme.shadowMd }]}>
                {streamingText ? (
                    <View style={styles.streamingWrapper}>
                        <Markdown style={mdStyles}>{streamingText}</Markdown>
                        <Animated.Text style={[styles.cursor, { color: theme.accentPrimary, opacity: cursorAnim }]}>
                            ▋
                        </Animated.Text>
                    </View>
                ) : (
                    <>
                        {toolCalling && (
                            <View style={[styles.toolIndicator, { backgroundColor: 'rgba(255, 107, 53, 0.1)' }]}>
                                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                                    <Wrench size={14} color={theme.accentPrimary} />
                                </Animated.View>
                                <Text style={[styles.toolText, { color: theme.accentPrimary, fontFamily: 'NotoSerif_400Regular' }]}>
                                    Running loan eligibility check...
                                </Text>
                            </View>
                        )}
                        <View style={styles.thinkingRow}>
                            <Animated.View style={{ transform: [{ rotate: spin }] }}>
                                <Loader2 size={16} color={theme.accentPrimary} />
                            </Animated.View>
                            <View>
                                <Text style={[styles.thinkingText, { color: theme.accentPrimary, fontFamily: 'NotoSerif_400Regular' }]}>
                                    {toolCalling ? 'Processing...' : 'Thinking...'}
                                </Text>
                                {status ? (
                                    <Text style={[styles.statusText, { color: theme.textSecondary, fontFamily: 'NotoSerif_400Regular' }]}>
                                        {status}
                                    </Text>
                                ) : null}
                            </View>
                        </View>
                    </>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    avatar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    content: {
        flex: 1,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderBottomLeftRadius: 4,
        maxWidth: '80%',
    },
    streamingWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
    },
    cursor: {
        fontSize: 16,
        marginLeft: 2,
    },
    toolIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 8,
        borderRadius: 8,
        marginBottom: 8,
    },
    toolText: {
        fontSize: 13,
        fontWeight: '600',
    },
    thinkingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    thinkingText: {
        fontSize: 14,
        fontWeight: '500',
    },
    statusText: {
        fontSize: 13,
        fontStyle: 'italic',
        marginTop: 2,
    },
});

export default ThinkingIndicator;
