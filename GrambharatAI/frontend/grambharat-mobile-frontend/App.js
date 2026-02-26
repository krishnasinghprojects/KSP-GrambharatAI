import React, { useState, useEffect, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, NotoSerif_400Regular, NotoSerif_700Bold } from '@expo-google-fonts/noto-serif';
import { LuckiestGuy_400Regular } from '@expo-google-fonts/luckiest-guy';
import * as SplashScreen from 'expo-splash-screen';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { ThemeProvider, useTheme } from './src/theme';
import AppNavigator from './src/navigation/AppNavigator';
import EarthquakeAlert from './src/components/EarthquakeAlert';
import { initSocket, disconnectSocket } from './src/services/socket';

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

const AppContent = () => {
  const { theme } = useTheme();
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const socket = initSocket();

    socket.on('earthquake', (data) => {
      setNotification({
        message: data.message,
        timestamp: data.timestamp,
      });
    });

    return () => disconnectSocket();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
      <NavigationContainer
        theme={{
          dark: theme.dark,
          colors: {
            primary: theme.accentPrimary,
            background: theme.bgPrimary,
            card: theme.glassBg,
            text: theme.textPrimary,
            border: theme.borderColor,
            notification: theme.accentPrimary,
          },
        }}
      >
        <AppNavigator />
      </NavigationContainer>

      {/* Earthquake Alert Overlay */}
      {notification && (
        <EarthquakeAlert
          message={notification.message}
          timestamp={notification.timestamp}
          onClose={() => setNotification(null)}
        />
      )}
    </View>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    NotoSerif_400Regular,
    NotoSerif_700Bold,
    LuckiestGuy_400Regular,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#ff6b35" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff5e6',
  },
});
