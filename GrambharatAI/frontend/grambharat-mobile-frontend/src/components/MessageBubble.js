import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { User, Bot, Copy, RotateCcw, Check } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '../theme';
import { getCurrentBaseUrl } from '../services/api';

const MessageBubble = ({ message, onRegenerate, isLastAI }) => {
    const { theme } = useTheme();
    const isUser = message.role === 'user';
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await Clipboard.setStringAsync(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const mdStyles = {
        body: { color: theme.textPrimary, fontFamily: 'NotoSerif_400Regular', fontSize: 15, lineHeight: 24 },
        heading1: { color: theme.accentPrimary, fontFamily: 'LuckiestGuy_400Regular', fontWeight: '400', fontSize: 22, marginTop: 16, marginBottom: 8, letterSpacing: 0.5 },
        heading2: { color: theme.accentPrimary, fontFamily: 'LuckiestGuy_400Regular', fontWeight: '400', fontSize: 19, marginTop: 14, marginBottom: 6, letterSpacing: 0.5 },
        heading3: { color: theme.accentPrimary, fontFamily: 'LuckiestGuy_400Regular', fontWeight: '400', fontSize: 17, marginTop: 12, marginBottom: 6, letterSpacing: 0.5 },
        paragraph: { marginTop: 4, marginBottom: 4 },
        code_inline: { backgroundColor: 'rgba(255, 107, 53, 0.1)', color: theme.accentPrimary, fontFamily: 'Courier', fontSize: 13, paddingHorizontal: 4, borderRadius: 4 },
        code_block: { backgroundColor: theme.bgSecondary, padding: 12, borderRadius: 8, fontFamily: 'Courier', fontSize: 13, color: theme.textPrimary },
        fence: { backgroundColor: theme.bgSecondary, padding: 12, borderRadius: 8, fontFamily: 'Courier', fontSize: 13, color: theme.textPrimary },
        blockquote: { borderLeftWidth: 3, borderLeftColor: theme.accentPrimary, paddingLeft: 12, marginVertical: 8, backgroundColor: 'transparent' },
        table: { borderWidth: 1, borderColor: theme.borderColor },
        th: { backgroundColor: 'rgba(255, 107, 53, 0.1)', padding: 8, borderWidth: 1, borderColor: theme.borderColor },
        td: { padding: 8, borderWidth: 1, borderColor: theme.borderColor },
        bullet_list: { marginVertical: 4 },
        ordered_list: { marginVertical: 4 },
        list_item: { marginVertical: 2 },
        link: { color: theme.accentPrimary },
        strong: { fontWeight: 'bold' },
        em: { fontStyle: 'italic' },
        hr: { backgroundColor: theme.borderColor, height: 1, marginVertical: 12 },
    };

    return (
        <View style={[styles.messageRow, isUser && styles.userMessageRow]}>
            {/* Avatar */}
            <View style={[
                styles.avatar,
                isUser
                    ? { backgroundColor: theme.userMsgStart, ...theme.shadowSm }
                    : { backgroundColor: theme.accentPrimary, ...theme.shadowMd },
            ]}>
                {isUser ? <User size={18} color="#fff" /> : <Bot size={18} color="#fff" />}
            </View>

            {/* Content */}
            <View style={[styles.contentWrapper, isUser && styles.userContentWrapper]}>
                <View style={[
                    styles.bubble,
                    isUser
                        ? { backgroundColor: theme.userMsgStart, borderBottomRightRadius: 4 }
                        : { backgroundColor: theme.glassBg, borderColor: theme.glassBorder, borderWidth: 1, borderBottomLeftRadius: 4, ...theme.shadowMd },
                ]}>
                    {message.image && (
                        <Image
                            source={{ uri: `${getCurrentBaseUrl()}${message.image}` }}
                            style={styles.messageImage}
                            resizeMode="cover"
                        />
                    )}
                    {isUser ? (
                        <Text style={[styles.userText, { fontFamily: 'NotoSerif_400Regular' }]}>{message.content}</Text>
                    ) : (
                        <Markdown style={mdStyles}>{message.content}</Markdown>
                    )}
                </View>

                {/* Footer */}
                <View style={[styles.footer, isUser && styles.userFooter]}>
                    <Text style={[styles.time, { color: theme.textTertiary, fontFamily: 'NotoSerif_400Regular' }]}>
                        {formatTime(message.timestamp)}
                    </Text>
                    <View style={styles.actions}>
                        <TouchableOpacity
                            onPress={handleCopy}
                            style={[styles.actionBtn, { backgroundColor: copied ? '#10b981' : theme.glassBg, borderColor: theme.glassBorder }]}
                        >
                            {copied ? <Check size={14} color="#fff" /> : <Copy size={14} color={theme.textSecondary} />}
                        </TouchableOpacity>
                        {!isUser && isLastAI && onRegenerate && (
                            <TouchableOpacity
                                onPress={onRegenerate}
                                style={[styles.actionBtn, { backgroundColor: theme.glassBg, borderColor: theme.glassBorder }]}
                            >
                                <RotateCcw size={14} color={theme.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    messageRow: {
        flexDirection: 'row',
        marginBottom: 16,
        paddingHorizontal: 16,
        gap: 10,
    },
    userMessageRow: {
        flexDirection: 'row-reverse',
    },
    avatar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    contentWrapper: {
        flex: 1,
        maxWidth: '80%',
    },
    userContentWrapper: {
        alignItems: 'flex-end',
    },
    bubble: {
        padding: 14,
        borderRadius: 16,
    },
    messageImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginBottom: 8,
    },
    userText: {
        color: '#ffffff',
        fontSize: 15,
        lineHeight: 22,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
        paddingHorizontal: 4,
    },
    userFooter: {
        flexDirection: 'row-reverse',
    },
    time: {
        fontSize: 11,
    },
    actions: {
        flexDirection: 'row',
        gap: 4,
    },
    actionBtn: {
        padding: 6,
        borderRadius: 6,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default MessageBubble;
