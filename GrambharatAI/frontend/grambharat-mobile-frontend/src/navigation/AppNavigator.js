import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatScreen from '../screens/ChatScreen';
import SettingsScreen from '../screens/SettingsScreen';
import DrawerContent from '../components/DrawerContent';
import { fetchChats } from '../services/api';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

// Stable screen components to prevent re-creation on every render
const ChatWrapper = React.memo(({ navigation, chatId, selectedModel, setSelectedModel, selectedPersona }) => (
    <ChatScreen
        navigation={navigation}
        chatId={chatId}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        selectedPersona={selectedPersona}
    />
));

const SettingsWrapper = React.memo(({ navigation, selectedModel, setSelectedModel, selectedPersona, setSelectedPersona }) => (
    <SettingsScreen
        navigation={navigation}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        selectedPersona={selectedPersona}
        setSelectedPersona={setSelectedPersona}
    />
));

const AppNavigator = () => {
    const [currentChatId, setCurrentChatId] = useState(null);
    const [chats, setChats] = useState([]);
    const [selectedModel, setSelectedModel] = useState('gpt-oss:20b');
    const [selectedPersona, setSelectedPersona] = useState('');

    const refreshChats = useCallback(async () => {
        try {
            const data = await fetchChats();
            setChats(data);
            if (data.length > 0 && !currentChatId) {
                setCurrentChatId(data[0].id);
            }
        } catch (error) {
            console.error('Error fetching chats:', error);
        }
    }, [currentChatId]);

    useEffect(() => {
        refreshChats();
    }, []);

    const handleSelectChat = useCallback((id) => {
        setCurrentChatId(id);
    }, []);

    const handleSetSelectedModel = useCallback((model) => {
        setSelectedModel(model);
    }, []);

    const handleSetSelectedPersona = useCallback((persona) => {
        setSelectedPersona(persona);
    }, []);

    // Stable drawer content renderer
    const renderDrawerContent = useCallback((props) => (
        <DrawerContent
            {...props}
            currentChatId={currentChatId}
            onSelectChat={handleSelectChat}
            chats={chats}
            onRefreshChats={refreshChats}
        />
    ), [currentChatId, chats, refreshChats, handleSelectChat]);

    // Stable drawer screen options
    const drawerScreenOptions = useMemo(() => ({
        headerShown: false,
        drawerStyle: { width: 300 },
        swipeEnabled: true,
        swipeEdgeWidth: 50,
    }), []);

    const stackScreenOptions = useMemo(() => ({
        headerShown: false,
    }), []);

    const DrawerNavigator = useCallback(() => (
        <Drawer.Navigator
            drawerContent={renderDrawerContent}
            screenOptions={drawerScreenOptions}
        >
            <Drawer.Screen name="Chat">
                {(props) => (
                    <ChatWrapper
                        {...props}
                        chatId={currentChatId}
                        selectedModel={selectedModel}
                        setSelectedModel={handleSetSelectedModel}
                        selectedPersona={selectedPersona}
                    />
                )}
            </Drawer.Screen>
        </Drawer.Navigator>
    ), [currentChatId, selectedModel, selectedPersona, renderDrawerContent, drawerScreenOptions, handleSetSelectedModel]);

    return (
        <Stack.Navigator screenOptions={stackScreenOptions}>
            <Stack.Screen name="Main" component={DrawerNavigator} />
            <Stack.Screen name="Settings">
                {(props) => (
                    <SettingsWrapper
                        {...props}
                        selectedModel={selectedModel}
                        setSelectedModel={handleSetSelectedModel}
                        selectedPersona={selectedPersona}
                        setSelectedPersona={handleSetSelectedPersona}
                    />
                )}
            </Stack.Screen>
        </Stack.Navigator>
    );
};

export default React.memo(AppNavigator);
