import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TouchableOpacity, Switch,
    StyleSheet, TextInput, ScrollView, StatusBar, Animated,
} from 'react-native';
import { ArrowLeft, Monitor, Palette, Server, Wifi, WifiOff, User, MapPin, Brain } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { setBaseUrl, getCurrentBaseUrl, checkConnection, fetchPersonas, fetchContext, updateContext, fetchMemories } from '../services/api';

const AVAILABLE_MODELS = [
    { id: 'gpt-oss:20b', name: 'GPT-OSS 20B', description: 'Most capable, slower' },
    { id: 'gemma2:latest', name: 'Gemma 2 Latest', description: 'Balanced performance' },
    { id: 'llama3.1:8b', name: 'Llama 3.1 8B', description: 'Fastest, lightweight' },
];

const SEASONS = ['Summer', 'Monsoon', 'Winter', 'Spring'];

const SettingsScreen = ({ navigation, selectedModel, setSelectedModel, selectedPersona, setSelectedPersona }) => {
    const { theme, isDark, toggleTheme } = useTheme();
    const insets = useSafeAreaInsets();
    const [serverUrl, setServerUrl] = useState(getCurrentBaseUrl());
    const [isConnected, setIsConnected] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Personas
    const [personas, setPersonas] = useState([]);
    
    // Context
    const [context, setContext] = useState({
        season: 'Summer',
        location: '',
        cropCycle: '',
        festival: ''
    });
    
    // Memories
    const [memories, setMemories] = useState([]);
    const [showMemories, setShowMemories] = useState(false);

    // Pulse animation
    useEffect(() => {
        if (isChecking) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 0.3, duration: 500, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isChecking]);

    // Load data on mount
    useEffect(() => {
        testConnection(serverUrl);
        loadPersonas();
        loadContext();
        loadMemories();
    }, []);

    const loadPersonas = async () => {
        try {
            const data = await fetchPersonas();
            setPersonas(data);
        } catch (error) {
            console.error('Error loading personas:', error);
        }
    };

    const loadContext = async () => {
        try {
            const data = await fetchContext();
            setContext(data);
        } catch (error) {
            console.error('Error loading context:', error);
        }
    };

    const loadMemories = async () => {
        try {
            const data = await fetchMemories();
            setMemories(data.memories || []);
        } catch (error) {
            console.error('Error loading memories:', error);
        }
    };

    const testConnection = async (url) => {
        setIsChecking(true);
        setIsConnected(null);
        setBaseUrl(url.trim());
        const connected = await checkConnection();
        setIsConnected(connected);
        setIsChecking(false);
    };

    const handleSaveServer = () => {
        if (serverUrl.trim()) {
            testConnection(serverUrl);
        }
    };

    const handleSaveContext = async () => {
        try {
            await updateContext(context);
            console.log('Context saved successfully');
        } catch (error) {
            console.error('Error saving context:', error);
        }
    };

    const getStatusColor = () => {
        if (isChecking || isConnected === null) return '#f0ad4e';
        return isConnected ? '#4caf50' : '#f44336';
    };

    const getStatusText = () => {
        if (isChecking || isConnected === null) return 'Checking...';
        return isConnected ? 'Connected' : 'Disconnected';
    };

    const getCategoryColor = (category) => {
        const colors = {
            personal: '#2196F3',
            agricultural: '#4CAF50',
            financial: '#FF9800',
            family: '#E91E63',
            preferences: '#9C27B0',
            other: '#607D8B'
        };
        return colors[category] || colors.other;
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
            <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bgPrimary} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: theme.glassBg, borderBottomColor: theme.glassBorder }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={22} color={theme.accentPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { fontFamily: 'LuckiestGuy_400Regular' }]}>
                    Settings
                </Text>
                <View style={{ width: 38 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Theme Section */}
                <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder, ...theme.shadowSm }]}>
                    <View style={styles.sectionHeader}>
                        <Palette size={20} color={theme.accentPrimary} />
                        <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontFamily: 'LuckiestGuy_400Regular' }]}>
                            Appearance
                        </Text>
                    </View>
                    <View style={styles.settingRow}>
                        <View>
                            <Text style={[styles.settingLabel, { color: theme.textPrimary, fontFamily: 'NotoSerif_400Regular' }]}>
                                Dark Mode
                            </Text>
                            <Text style={[styles.settingDesc, { color: theme.textTertiary, fontFamily: 'NotoSerif_400Regular' }]}>
                                Switch between light and dark themes
                            </Text>
                        </View>
                        <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            trackColor={{ false: theme.borderColor, true: '#ff8c42' }}
                            thumbColor={isDark ? '#ff6b35' : '#ffffff'}
                        />
                    </View>
                </View>

                {/* Persona Selection */}
                <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder, ...theme.shadowSm }]}>
                    <View style={styles.sectionHeader}>
                        <User size={20} color={theme.accentPrimary} />
                        <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontFamily: 'LuckiestGuy_400Regular' }]}>
                            AI Personality
                        </Text>
                    </View>
                    <Text style={[styles.sectionDesc, { color: theme.textTertiary, fontFamily: 'NotoSerif_400Regular' }]}>
                        Choose how the AI should respond to you
                    </Text>
                    
                    {/* Default Option */}
                    <TouchableOpacity
                        onPress={() => setSelectedPersona('')}
                        style={[
                            styles.personaOption,
                            selectedPersona === '' && {
                                backgroundColor: 'rgba(255, 107, 53, 0.15)',
                                borderColor: theme.accentPrimary,
                                borderWidth: 1.5,
                            },
                        ]}
                        activeOpacity={0.7}
                    >
                        <View style={styles.personaInfo}>
                            <Text style={[
                                styles.personaName,
                                { color: selectedPersona === '' ? theme.accentPrimary : theme.textPrimary, fontFamily: 'NotoSerif_400Regular' },
                            ]}>
                                Default
                            </Text>
                            <Text style={[styles.personaDesc, { color: theme.textTertiary, fontFamily: 'NotoSerif_400Regular' }]}>
                                Standard helpful assistant
                            </Text>
                        </View>
                        {selectedPersona === '' && (
                            <View style={styles.selectedDot} />
                        )}
                    </TouchableOpacity>

                    {personas.map((persona) => (
                        <TouchableOpacity
                            key={persona.id}
                            onPress={() => setSelectedPersona(persona.description)}
                            style={[
                                styles.personaOption,
                                selectedPersona === persona.description && {
                                    backgroundColor: 'rgba(255, 107, 53, 0.15)',
                                    borderColor: theme.accentPrimary,
                                    borderWidth: 1.5,
                                },
                            ]}
                            activeOpacity={0.7}
                        >
                            <View style={styles.personaInfo}>
                                <Text style={[
                                    styles.personaName,
                                    { color: selectedPersona === persona.description ? theme.accentPrimary : theme.textPrimary, fontFamily: 'NotoSerif_400Regular' },
                                ]}>
                                    {persona.name}
                                </Text>
                                <Text style={[styles.personaDesc, { color: theme.textTertiary, fontFamily: 'NotoSerif_400Regular' }]} numberOfLines={2}>
                                    {persona.description.substring(0, 80)}...
                                </Text>
                            </View>
                            {selectedPersona === persona.description && (
                                <View style={styles.selectedDot} />
                            )}
                        </TouchableOpacity>
                    ))}

                    {/* Custom Persona */}
                    <View style={styles.contextField}>
                        <Text style={[styles.fieldLabel, { color: theme.textPrimary, fontFamily: 'NotoSerif_400Regular' }]}>
                            Custom Personality
                        </Text>
                        <Text style={[styles.sectionDesc, { color: theme.textTertiary, fontFamily: 'NotoSerif_400Regular', marginTop: 4 }]}>
                            Write your own custom instructions for the AI
                        </Text>
                        <TextInput
                            value={selectedPersona && !personas.find(p => p.description === selectedPersona) ? selectedPersona : ''}
                            onChangeText={(text) => setSelectedPersona(text)}
                            placeholder="e.g., You are a helpful assistant who speaks in simple Hindi and English..."
                            placeholderTextColor={theme.textTertiary}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            style={[styles.customPersonaInput, {
                                backgroundColor: theme.bgSecondary,
                                color: theme.textPrimary,
                                borderColor: theme.borderColor,
                                fontFamily: 'NotoSerif_400Regular',
                            }]}
                        />
                    </View>
                </View>

                {/* Local Context */}
                <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder, ...theme.shadowSm }]}>
                    <View style={styles.sectionHeader}>
                        <MapPin size={20} color={theme.accentPrimary} />
                        <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontFamily: 'LuckiestGuy_400Regular' }]}>
                            Local Context
                        </Text>
                    </View>
                    <Text style={[styles.sectionDesc, { color: theme.textTertiary, fontFamily: 'NotoSerif_400Regular' }]}>
                        Help AI understand your local environment
                    </Text>

                    {/* Season */}
                    <View style={styles.contextField}>
                        <Text style={[styles.fieldLabel, { color: theme.textPrimary, fontFamily: 'NotoSerif_400Regular' }]}>
                            Current Season
                        </Text>
                        <View style={styles.seasonButtons}>
                            {SEASONS.map((season) => (
                                <TouchableOpacity
                                    key={season}
                                    onPress={() => setContext({ ...context, season })}
                                    style={[
                                        styles.seasonBtn,
                                        { borderColor: theme.borderColor },
                                        context.season === season && { backgroundColor: '#ff6b35', borderColor: '#ff6b35' }
                                    ]}
                                >
                                    <Text style={[
                                        styles.seasonText,
                                        { color: context.season === season ? '#fff' : theme.textPrimary, fontFamily: 'NotoSerif_400Regular' }
                                    ]}>
                                        {season}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Location */}
                    <View style={styles.contextField}>
                        <Text style={[styles.fieldLabel, { color: theme.textPrimary, fontFamily: 'NotoSerif_400Regular' }]}>
                            Village/Location
                        </Text>
                        <TextInput
                            value={context.location}
                            onChangeText={(text) => setContext({ ...context, location: text })}
                            placeholder="e.g., Sultanpur, UP"
                            placeholderTextColor={theme.textTertiary}
                            style={[styles.contextInput, {
                                backgroundColor: theme.bgSecondary,
                                color: theme.textPrimary,
                                borderColor: theme.borderColor,
                                fontFamily: 'NotoSerif_400Regular',
                            }]}
                        />
                    </View>

                    {/* Crop Cycle */}
                    <View style={styles.contextField}>
                        <Text style={[styles.fieldLabel, { color: theme.textPrimary, fontFamily: 'NotoSerif_400Regular' }]}>
                            Current Crop Cycle
                        </Text>
                        <TextInput
                            value={context.cropCycle}
                            onChangeText={(text) => setContext({ ...context, cropCycle: text })}
                            placeholder="e.g., Wheat sowing season"
                            placeholderTextColor={theme.textTertiary}
                            style={[styles.contextInput, {
                                backgroundColor: theme.bgSecondary,
                                color: theme.textPrimary,
                                borderColor: theme.borderColor,
                                fontFamily: 'NotoSerif_400Regular',
                            }]}
                        />
                    </View>

                    {/* Festival/Event */}
                    <View style={styles.contextField}>
                        <Text style={[styles.fieldLabel, { color: theme.textPrimary, fontFamily: 'NotoSerif_400Regular' }]}>
                            Current Festival/Event
                        </Text>
                        <TextInput
                            value={context.festival}
                            onChangeText={(text) => setContext({ ...context, festival: text })}
                            placeholder="e.g., Diwali, Holi, Market Day"
                            placeholderTextColor={theme.textTertiary}
                            style={[styles.contextInput, {
                                backgroundColor: theme.bgSecondary,
                                color: theme.textPrimary,
                                borderColor: theme.borderColor,
                                fontFamily: 'NotoSerif_400Regular',
                            }]}
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleSaveContext}
                        style={[styles.saveContextBtn, { ...theme.shadowSm }]}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.saveContextBtnText, { fontFamily: 'NotoSerif_400Regular' }]}>
                            Save Context
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* User Memories */}
                <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder, ...theme.shadowSm }]}>
                    <View style={styles.sectionHeader}>
                        <Brain size={20} color={theme.accentPrimary} />
                        <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontFamily: 'LuckiestGuy_400Regular' }]}>
                            Saved Memories
                        </Text>
                    </View>
                    <Text style={[styles.sectionDesc, { color: theme.textTertiary, fontFamily: 'NotoSerif_400Regular' }]}>
                        Information the AI remembers about you ({memories.length} items)
                    </Text>

                    <TouchableOpacity
                        onPress={() => setShowMemories(!showMemories)}
                        style={[styles.toggleMemoriesBtn, { borderColor: theme.borderColor }]}
                    >
                        <Text style={[styles.toggleMemoriesText, { color: theme.accentPrimary, fontFamily: 'NotoSerif_400Regular' }]}>
                            {showMemories ? 'Hide Memories' : 'View Memories'}
                        </Text>
                    </TouchableOpacity>

                    {showMemories && (
                        <View style={styles.memoriesContainer}>
                            {memories.length === 0 ? (
                                <Text style={[styles.noMemoriesText, { color: theme.textTertiary, fontFamily: 'NotoSerif_400Regular' }]}>
                                    No memories saved yet. Ask the AI to remember something!
                                </Text>
                            ) : (
                                memories.map((memory) => (
                                    <View key={memory.id} style={[styles.memoryCard, { backgroundColor: theme.bgSecondary, borderColor: theme.borderColor }]}>
                                        <View style={styles.memoryHeader}>
                                            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(memory.category) }]}>
                                                <Text style={[styles.categoryText, { fontFamily: 'NotoSerif_400Regular' }]}>
                                                    {memory.category}
                                                </Text>
                                            </View>
                                            <Text style={[styles.memoryDate, { color: theme.textTertiary, fontFamily: 'NotoSerif_400Regular' }]}>
                                                {memory.createdAt}
                                            </Text>
                                        </View>
                                        <Text style={[styles.memoryContent, { color: theme.textPrimary, fontFamily: 'NotoSerif_400Regular' }]}>
                                            {memory.content}
                                        </Text>
                                    </View>
                                ))
                            )}
                        </View>
                    )}
                </View>

                {/* Model Selection */}
                <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder, ...theme.shadowSm }]}>
                    <View style={styles.sectionHeader}>
                        <Monitor size={20} color={theme.accentPrimary} />
                        <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontFamily: 'LuckiestGuy_400Regular' }]}>
                            AI Model
                        </Text>
                    </View>
                    {AVAILABLE_MODELS.map((model) => (
                        <TouchableOpacity
                            key={model.id}
                            onPress={() => setSelectedModel(model.id)}
                            style={[
                                styles.modelOption,
                                selectedModel === model.id && {
                                    backgroundColor: 'rgba(255, 107, 53, 0.15)',
                                    borderColor: theme.accentPrimary,
                                    borderWidth: 1.5,
                                },
                            ]}
                            activeOpacity={0.7}
                        >
                            <View style={styles.modelInfo}>
                                <Text style={[
                                    styles.modelName,
                                    { color: selectedModel === model.id ? theme.accentPrimary : theme.textPrimary, fontFamily: 'NotoSerif_400Regular' },
                                ]}>
                                    {model.name}
                                </Text>
                                <Text style={[styles.modelDesc, { color: theme.textTertiary, fontFamily: 'NotoSerif_400Regular' }]}>
                                    {model.description}
                                </Text>
                            </View>
                            {selectedModel === model.id && (
                                <View style={styles.selectedDot} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Server Configuration */}
                <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder, ...theme.shadowSm }]}>
                    <View style={styles.sectionHeader}>
                        <Server size={20} color={theme.accentPrimary} />
                        <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontFamily: 'LuckiestGuy_400Regular' }]}>
                            Server
                        </Text>
                    </View>

                    <View style={styles.connectionRow}>
                        <Animated.View style={[
                            styles.statusDot,
                            { backgroundColor: getStatusColor(), opacity: pulseAnim },
                        ]} />
                        {isConnected ? (
                            <Wifi size={16} color={getStatusColor()} />
                        ) : (
                            <WifiOff size={16} color={getStatusColor()} />
                        )}
                        <Text style={[styles.statusText, { color: getStatusColor(), fontFamily: 'NotoSerif_400Regular' }]}>
                            {getStatusText()}
                        </Text>
                    </View>

                    <View style={styles.serverRow}>
                        <TextInput
                            value={serverUrl}
                            onChangeText={setServerUrl}
                            placeholder="http://192.168.x.x:3000"
                            placeholderTextColor={theme.textTertiary}
                            style={[styles.serverInput, {
                                backgroundColor: theme.bgSecondary,
                                color: theme.textPrimary,
                                borderColor: isConnected ? '#4caf50' : theme.borderColor,
                                fontFamily: 'NotoSerif_400Regular',
                            }]}
                            autoCapitalize="none"
                            autoCorrect={false}
                            onSubmitEditing={handleSaveServer}
                        />
                        <TouchableOpacity
                            onPress={handleSaveServer}
                            style={[styles.saveBtn, { ...theme.shadowSm }]}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.saveBtnText, { fontFamily: 'NotoSerif_400Regular' }]}>
                                {isChecking ? '...' : 'Connect'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.serverHint, { color: theme.textTertiary, fontFamily: 'NotoSerif_400Regular' }]}>
                        Enter your machine's LAN IP (e.g. http://192.168.1.5:3000)
                    </Text>
                </View>

                {/* About */}
                <View style={[styles.section, { backgroundColor: theme.cardBg, borderColor: theme.glassBorder, ...theme.shadowSm }]}>
                    <Text style={[styles.aboutText, { color: theme.textSecondary, fontFamily: 'NotoSerif_400Regular' }]}>
                        Built for Rural India
                    </Text>
                    <Text style={[styles.aboutSmall, { color: theme.textTertiary, fontFamily: 'NotoSerif_400Regular' }]}>
                        Empowering villages through AI-powered financial inclusion
                    </Text>
                    <Text style={[styles.version, { color: theme.textTertiary, fontFamily: 'NotoSerif_400Regular' }]}>
                        GramBharat AI Mobile v1.0.0
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 14,
        borderBottomWidth: 1,
    },
    backBtn: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        color: '#ff6b35',
        letterSpacing: 0.5,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        gap: 16,
        paddingBottom: 40,
    },
    section: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 20,
        gap: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 4,
    },
    sectionTitle: {
        fontSize: 16,
        letterSpacing: 0.3,
    },
    sectionDesc: {
        fontSize: 13,
        marginTop: -8,
        marginBottom: 4,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    settingLabel: {
        fontSize: 15,
    },
    settingDesc: {
        fontSize: 12,
        marginTop: 2,
    },
    personaOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 10,
    },
    personaInfo: {
        flex: 1,
    },
    personaName: {
        fontSize: 15,
        fontWeight: '500',
    },
    personaDesc: {
        fontSize: 12,
        marginTop: 2,
    },
    contextField: {
        gap: 8,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    contextInput: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderWidth: 1.5,
        borderRadius: 10,
        fontSize: 14,
    },
    seasonButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    seasonBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    seasonText: {
        fontSize: 13,
    },
    customPersonaInput: {
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderWidth: 1.5,
        borderRadius: 10,
        fontSize: 14,
        minHeight: 100,
        marginTop: 8,
    },
    saveContextBtn: {
        backgroundColor: '#ff6b35',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 4,
    },
    saveContextBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
    toggleMemoriesBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1.5,
        alignItems: 'center',
    },
    toggleMemoriesText: {
        fontSize: 14,
        fontWeight: '500',
    },
    memoriesContainer: {
        gap: 12,
        marginTop: 4,
    },
    noMemoriesText: {
        fontSize: 13,
        textAlign: 'center',
        fontStyle: 'italic',
        paddingVertical: 20,
    },
    memoryCard: {
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        gap: 8,
    },
    memoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    categoryBadge: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
    },
    categoryText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    memoryDate: {
        fontSize: 11,
    },
    memoryContent: {
        fontSize: 13,
        lineHeight: 20,
    },
    modelOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 10,
    },
    modelInfo: {
        flex: 1,
    },
    modelName: {
        fontSize: 15,
        fontWeight: '500',
    },
    modelDesc: {
        fontSize: 12,
        marginTop: 2,
    },
    selectedDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#ff6b35',
    },
    connectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
    },
    serverRow: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    serverInput: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderWidth: 1.5,
        borderRadius: 10,
        fontSize: 14,
    },
    saveBtn: {
        backgroundColor: '#ff6b35',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    serverHint: {
        fontSize: 12,
        marginTop: -8,
    },
    aboutText: {
        fontSize: 15,
        textAlign: 'center',
    },
    aboutSmall: {
        fontSize: 13,
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: -8,
    },
    version: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: -4,
    },
});

export default SettingsScreen;
