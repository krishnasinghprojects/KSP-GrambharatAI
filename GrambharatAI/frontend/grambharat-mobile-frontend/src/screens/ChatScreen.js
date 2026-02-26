import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, FlatList,
    StyleSheet, KeyboardAvoidingView, Platform, Image,
    Keyboard, StatusBar, Alert,
} from 'react-native';
import { Send, Menu, Sun, Moon, ImageIcon, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { fetchMessages, sendMessageStream, regenerateStream } from '../services/api';
import MessageBubble from '../components/MessageBubble';
import ThinkingIndicator from '../components/ThinkingIndicator';

const MemoizedMessageBubble = React.memo(MessageBubble);
const MemoizedThinkingIndicator = React.memo(ThinkingIndicator);

const AVAILABLE_MODELS = [
    { id: 'gpt-oss:20b', name: 'GPT-OSS 20B' },
    { id: 'gemma2:latest', name: 'Gemma 2' },
    { id: 'llama3.1:8b', name: 'Llama 3.1' },
];

const ChatScreen = ({ navigation, chatId, selectedModel, setSelectedModel, selectedPersona }) => {
    const { theme, isDark, toggleTheme } = useTheme();
    const insets = useSafeAreaInsets();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [streamingMessage, setStreamingMessage] = useState('');
    const [thinkingStatus, setThinkingStatus] = useState('');
    const [toolCalling, setToolCalling] = useState(false);
    const [showModelPicker, setShowModelPicker] = useState(false);
    const [memorySaved, setMemorySaved] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const flatListRef = useRef(null);

    useEffect(() => {
        // Reset state when chat changes
        setMessages([]);
        setInput('');
        setIsThinking(false);
        setStreamingMessage('');
        setThinkingStatus('');
        setToolCalling(false);
        setMemorySaved(false);
        setSelectedImage(null);
        
        if (chatId) {
            loadMessages();
        }
    }, [chatId]);

    const loadMessages = async () => {
        try {
            const data = await fetchMessages(chatId);
            setMessages(data);
            setTimeout(scrollToBottom, 100);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const scrollToBottom = () => {
        flatListRef.current?.scrollToEnd({ animated: true });
    };

    useEffect(() => {
        if (messages.length > 0 || isThinking) {
            setTimeout(scrollToBottom, 100);
        }
    }, [messages, isThinking]);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled && result.assets[0]) {
            setSelectedImage(result.assets[0]);
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
    };

    const uploadImage = async (imageAsset) => {
        const formData = new FormData();
        formData.append('image', {
            uri: imageAsset.uri,
            type: 'image/jpeg',
            name: 'upload.jpg',
        });

        const response = await fetch('http://localhost:3000/api/upload-image', {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to upload image');
        }

        return response.json();
    };

    const sendMessage = async () => {
        if ((!input.trim() && !selectedImage) || !chatId || isThinking) return;

        let imageData = null;

        // Upload image if selected
        if (selectedImage) {
            try {
                setThinkingStatus('Uploading image...');
                imageData = await uploadImage(selectedImage);
                console.log('📸 Image uploaded:', imageData.filename);
            } catch (error) {
                console.error('Error uploading image:', error);
                Alert.alert('Upload Failed', 'Failed to upload image');
                setThinkingStatus('');
                return;
            }
        }

        const userMessage = {
            role: 'user',
            content: input || '(Image)',
            timestamp: new Date().toISOString(),
        };

        if (imageData) {
            userMessage.image = imageData.url;
        }

        setMessages(prev => [...prev, userMessage]);
        const messageText = input || 'What do you see in this image?';
        setInput('');
        removeImage();
        setIsThinking(true);
        setStreamingMessage('');
        setThinkingStatus('');
        setToolCalling(false);
        setMemorySaved(false);
        Keyboard.dismiss();

        await sendMessageStream(chatId, messageText, selectedModel, selectedPersona, imageData, {
            onToken: (text) => {
                setStreamingMessage(text);
                setThinkingStatus('');
                setToolCalling(false);
            },
            onStatus: (status) => {
                setThinkingStatus(status);
                // Check if memory was saved
                if (status.includes('Saved to memory')) {
                    setMemorySaved(true);
                    setTimeout(() => setMemorySaved(false), 3000);
                }
            },
            onToolCalling: () => setToolCalling(true),
            onDone: async () => {
                setIsThinking(false);
                setStreamingMessage('');
                setThinkingStatus('');
                setToolCalling(false);
                await loadMessages();
            },
            onError: (error) => {
                console.error('Stream error:', error);
                setIsThinking(false);
                setStreamingMessage('');
                setThinkingStatus('');
                setToolCalling(false);
            },
        });
    };

    const regenerateResponse = async () => {
        if (messages.length < 2 || isThinking) return;

        const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
        if (!lastUserMessage) return;

        setMessages(prev => prev.slice(0, -1));
        setIsThinking(true);
        setStreamingMessage('');
        setThinkingStatus('');
        setToolCalling(false);
        setMemorySaved(false);

        await regenerateStream(chatId, lastUserMessage.content, selectedModel, selectedPersona, {
            onToken: (text) => {
                setStreamingMessage(text);
                setThinkingStatus('');
                setToolCalling(false);
            },
            onStatus: (status) => setThinkingStatus(status),
            onToolCalling: () => setToolCalling(true),
            onDone: async () => {
                setIsThinking(false);
                setStreamingMessage('');
                setThinkingStatus('');
                setToolCalling(false);
                await loadMessages();
            },
            onError: (error) => {
                console.error('Regenerate error:', error);
                setIsThinking(false);
                setStreamingMessage('');
            },
        });
    };

    const lastAIIndex = useMemo(() => {
        return messages.length > 0 && messages[messages.length - 1]?.role === 'assistant'
            ? messages.length - 1 : -1;
    }, [messages]);

    const renderItem = useCallback(({ item, index }) => {
        return (
            <MemoizedMessageBubble
                message={item}
                onRegenerate={index === lastAIIndex ? regenerateResponse : null}
                isLastAI={index === lastAIIndex}
            />
        );
    }, [lastAIIndex]);

    const currentModelName = AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name || 'GPT-OSS 20B';

    // Empty state
    if (!chatId) {
        return (
            <View style={[styles.emptyContainer, { backgroundColor: theme.bgPrimary }]}>
                <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bgPrimary} />
                <View style={[styles.emptyHeader, { paddingTop: insets.top + 10 }]}>
                    <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuBtn}>
                        <Menu size={24} color={theme.accentPrimary} />
                    </TouchableOpacity>
                </View>
                <View style={styles.emptyContent}>
                    <Image
                        source={require('../../assets/grambharatlogo.png')}
                        style={styles.emptyLogo}
                        resizeMode="contain"
                    />
                    <Text style={[styles.emptyTitle, { fontFamily: 'LuckiestGuy_400Regular' }]}>
                        Welcome to GramBharat AI
                    </Text>
                    <Text style={[styles.emptySubtitle, { color: theme.accentSecondary, fontFamily: 'NotoSerif_400Regular' }]}>
                        Start a new conversation to begin
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.bgPrimary }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
        >
            <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bgPrimary} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: theme.glassBg, borderBottomColor: theme.glassBorder }]}>
                <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuBtn}>
                    <Menu size={22} color={theme.accentPrimary} />
                </TouchableOpacity>

                {/* Model Selector */}
                <TouchableOpacity
                    onPress={() => setShowModelPicker(!showModelPicker)}
                    style={[styles.modelSelector, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder, ...theme.shadowSm }]}
                >
                    <Text style={[styles.modelText, { color: theme.textPrimary, fontFamily: 'NotoSerif_400Regular' }]}>
                        {currentModelName}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleTheme} style={[styles.themeBtn, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder, ...theme.shadowSm }]}>
                    {isDark ? <Sun size={18} color={theme.accentPrimary} /> : <Moon size={18} color={theme.accentPrimary} />}
                </TouchableOpacity>
            </View>

            {/* Model Picker Dropdown */}
            {showModelPicker && (
                <View style={[styles.modelDropdown, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder, ...theme.shadowLg }]}>
                    {AVAILABLE_MODELS.map((model) => (
                        <TouchableOpacity
                            key={model.id}
                            onPress={() => {
                                setSelectedModel(model.id);
                                setShowModelPicker(false);
                            }}
                            style={[
                                styles.modelOption,
                                selectedModel === model.id && { backgroundColor: 'rgba(255, 107, 53, 0.15)' },
                            ]}
                        >
                            <Text style={[
                                styles.modelOptionText,
                                { color: selectedModel === model.id ? theme.accentPrimary : theme.textPrimary, fontFamily: 'NotoSerif_400Regular' },
                            ]}>
                                {model.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                contentContainerStyle={styles.messagesList}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={scrollToBottom}
                removeClippedSubviews={false}
                ListFooterComponent={
                    isThinking ? (
                        <MemoizedThinkingIndicator
                            streamingText={streamingMessage}
                            status={thinkingStatus}
                            toolCalling={toolCalling}
                        />
                    ) : null
                }
            />

            {/* Input Area */}
            <View style={[styles.inputArea, {
                backgroundColor: theme.glassBg,
                borderTopColor: theme.glassBorder,
                paddingBottom: Math.max(insets.bottom, 12),
            }]}>
                {/* Memory Saved Indicator */}
                {memorySaved && (
                    <View style={[styles.memorySavedBanner, { backgroundColor: '#4caf50' }]}>
                        <Text style={[styles.memorySavedText, { fontFamily: 'NotoSerif_400Regular' }]}>
                            ✓ Saved to memory
                        </Text>
                    </View>
                )}
                
                {/* Image Preview */}
                {selectedImage && (
                    <View style={styles.imagePreviewContainer}>
                        <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} />
                        <TouchableOpacity style={styles.removeImageBtn} onPress={removeImage}>
                            <X size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                )}
                
                <View style={styles.inputRow}>
                    <TouchableOpacity
                        onPress={pickImage}
                        disabled={isThinking}
                        style={[
                            styles.imageBtn,
                            { 
                                backgroundColor: theme.bgSecondary,
                                borderColor: theme.borderColor,
                                opacity: isThinking ? 0.5 : 1
                            },
                        ]}
                        activeOpacity={0.7}
                    >
                        <ImageIcon size={20} color={theme.accentPrimary} />
                    </TouchableOpacity>
                    <TextInput
                        value={input}
                        onChangeText={setInput}
                        placeholder="Message GramBharat AI..."
                        placeholderTextColor={theme.accentSecondary + 'B3'}
                        multiline
                        maxLength={5000}
                        style={[styles.textInput, {
                            backgroundColor: theme.bgSecondary,
                            color: theme.accentPrimary,
                            borderColor: theme.borderColor,
                            fontFamily: 'NotoSerif_400Regular',
                        }]}
                        onSubmitEditing={sendMessage}
                    />
                    <TouchableOpacity
                        onPress={sendMessage}
                        disabled={(!input.trim() && !selectedImage) || isThinking}
                        style={[
                            styles.sendBtn,
                            { opacity: ((!input.trim() && !selectedImage) || isThinking) ? 0.5 : 1, ...theme.shadowMd },
                        ]}
                        activeOpacity={0.8}
                    >
                        <Send size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
    },
    emptyHeader: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    emptyContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emptyLogo: {
        width: 180,
        height: 180,
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 26,
        color: '#ff6b35',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: 1,
    },
    emptySubtitle: {
        fontSize: 15,
        textAlign: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        gap: 10,
    },
    menuBtn: {
        padding: 8,
    },
    modelSelector: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 24,
        borderWidth: 1,
        alignItems: 'center',
    },
    modelText: {
        fontSize: 14,
    },
    themeBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modelDropdown: {
        position: 'absolute',
        top: 110,
        left: 60,
        right: 60,
        zIndex: 999,
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    modelOption: {
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    modelOptionText: {
        fontSize: 14,
        textAlign: 'center',
    },
    messagesList: {
        paddingTop: 16,
        paddingBottom: 8,
    },
    inputArea: {
        paddingHorizontal: 16,
        paddingTop: 12,
        borderTopWidth: 1,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
    },
    imageBtn: {
        width: 48,
        height: 48,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    imagePreviewContainer: {
        position: 'relative',
        marginBottom: 12,
        alignSelf: 'flex-start',
    },
    imagePreview: {
        width: 150,
        height: 150,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#ddd',
    },
    removeImageBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    textInput: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderWidth: 2,
        borderRadius: 12,
        fontSize: 15,
        maxHeight: 120,
        lineHeight: 22,
    },
    sendBtn: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#ff6b35',
        alignItems: 'center',
        justifyContent: 'center',
    },
    memorySavedBanner: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 8,
        alignItems: 'center',
    },
    memorySavedText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
});

const keyExtractor = (item, index) => index.toString();

export default React.memo(ChatScreen);
