import React, { useState, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, FlatList,
    StyleSheet, Image, Alert,
} from 'react-native';
import { Plus, Search, MessageSquare, Trash2, Settings } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme';
import { fetchChats, createChat, deleteChat } from '../services/api';

const DrawerContent = ({ navigation, currentChatId, onSelectChat, chats, onRefreshChats }) => {
    const { theme } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredChats = chats.filter(chat =>
        chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleNewChat = async () => {
        try {
            const newChat = await createChat();
            onRefreshChats();
            onSelectChat(newChat.id);
            navigation.closeDrawer();
        } catch (error) {
            Alert.alert('Error', 'Failed to create chat');
        }
    };

    const handleDeleteChat = async (chatId) => {
        Alert.alert(
            'Delete Chat',
            'Are you sure you want to delete this chat?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteChat(chatId);
                            onRefreshChats();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete chat');
                        }
                    },
                },
            ]
        );
    };

    const handleSelectChat = (chatId) => {
        onSelectChat(chatId);
        navigation.closeDrawer();
    };

    const renderChatItem = ({ item }) => {
        const isActive = currentChatId === item.id;
        return (
            <TouchableOpacity
                onPress={() => handleSelectChat(item.id)}
                style={[
                    styles.chatItem,
                    {
                        backgroundColor: isActive
                            ? 'rgba(255, 107, 53, 0.15)'
                            : 'transparent',
                        borderColor: isActive ? theme.accentPrimary : 'transparent',
                        borderWidth: isActive ? 1.5 : 0,
                    },
                ]}
                activeOpacity={0.7}
            >
                <View style={styles.chatItemContent}>
                    <MessageSquare size={16} color={theme.accentPrimary} />
                    <Text
                        numberOfLines={1}
                        style={[styles.chatTitle, { color: theme.textPrimary, fontFamily: 'NotoSerif_400Regular' }]}
                    >
                        {item.title}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => handleDeleteChat(item.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.deleteBtn}
                >
                    <Trash2 size={14} color={theme.accentPrimary} />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.glassBg }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.borderColor }]}>
                <View style={styles.logoRow}>
                    <Image
                        source={require('../../assets/grambharatlogo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={[styles.logoText, { fontFamily: 'LuckiestGuy_400Regular' }]}>
                        GramBharat AI
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={handleNewChat}
                    style={[styles.newChatBtn, { ...theme.shadowMd }]}
                    activeOpacity={0.8}
                >
                    <Plus size={18} color="#fff" />
                    <Text style={[styles.newChatLabel, { fontFamily: 'NotoSerif_400Regular' }]}>New Chat</Text>
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={[styles.searchContainer, { borderBottomColor: theme.borderColor }]}>
                <View style={styles.searchRow}>
                    <Search size={16} color={theme.accentSecondary} />
                    <TextInput
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search conversations..."
                        placeholderTextColor={theme.textTertiary}
                        style={[styles.searchInput, {
                            backgroundColor: theme.bgSecondary,
                            color: theme.textPrimary,
                            borderColor: theme.borderColor,
                            fontFamily: 'NotoSerif_400Regular',
                        }]}
                    />
                </View>
            </View>

            {/* Chat List */}
            <FlatList
                data={filteredChats}
                keyExtractor={(item) => item.id}
                renderItem={renderChatItem}
                style={styles.chatList}
                contentContainerStyle={styles.chatListContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <Text style={[styles.emptyText, { color: theme.textTertiary, fontFamily: 'NotoSerif_400Regular' }]}>
                        No conversations yet
                    </Text>
                }
            />

            {/* Settings Button */}
            <TouchableOpacity
                onPress={() => {
                    navigation.closeDrawer();
                    navigation.navigate('Settings');
                }}
                style={[styles.settingsBtn, { borderTopColor: theme.borderColor }]}
                activeOpacity={0.7}
            >
                <Settings size={18} color={theme.accentPrimary} />
                <Text style={[styles.settingsBtnText, { color: theme.textPrimary, fontFamily: 'NotoSerif_400Regular' }]}>
                    Settings
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    logo: {
        width: 50,
        height: 50,
    },
    logoText: {
        fontSize: 18,
        color: '#ff6b35',
        letterSpacing: 1,
    },
    newChatBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#ff6b35',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
    },
    newChatLabel: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        fontSize: 14,
    },
    chatList: {
        flex: 1,
    },
    chatListContent: {
        padding: 8,
    },
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 8,
        marginBottom: 4,
    },
    chatItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
        overflow: 'hidden',
    },
    chatTitle: {
        fontSize: 14,
        flex: 1,
    },
    deleteBtn: {
        padding: 4,
        opacity: 0.6,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 14,
    },
    settingsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderTopWidth: 1,
    },
    settingsBtnText: {
        fontSize: 15,
    },
});

export default DrawerContent;
