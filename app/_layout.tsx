import { Stack } from 'expo-router'
import React, { useEffect, useState, useCallback } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import * as SplashScreenNative from 'expo-splash-screen';
import { useCallListener } from '../hooks/call/useCallListener';
import '../global.css'

import { CallProvider } from '../context/CallContext';
import { AuthProvider } from '../context/AuthContext';
import { useAuth } from '../hooks/auth/useAuth';
import { useRouter, useSegments } from 'expo-router';
import GlobalCallOverlay from '../components/GlobalCallOverlay';
import GlobalActiveCallOverlay from '../components/GlobalActiveCallOverlay';
import SplashScreenCustom from '../components/SplashScreen';

// Keep the splash screen visible while we fetch resources
SplashScreenNative.preventAutoHideAsync();

function AppContent({ appIsReady, onAuthReady }: { appIsReady: boolean, onAuthReady: (ready: boolean) => void }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    onAuthReady(!loading);
  }, [loading, onAuthReady]);

  useEffect(() => {
    if (loading) return;

    const inTabsGroup = segments[0] === '(tabs)';

    if (user && !inTabsGroup) {
      console.log('[ROOT_LAYOUT] User detected, redirecting to (tabs)');
      router.replace('/(tabs)/keypad');
    } else if (!user && inTabsGroup) {
      console.log('[ROOT_LAYOUT] No user detected, redirecting to login');
      router.replace('/');
    }
  }, [user, loading, segments]);

  useCallListener();

  if (loading) {
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <GlobalCallOverlay />
      <GlobalActiveCallOverlay />
    </>
  );
}

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [authIsReady, setAuthIsReady] = useState(false);
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  const handleAuthReady = useCallback((ready: boolean) => {
    setAuthIsReady(ready);
  }, []);

  useEffect(() => {
    async function prepare() {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: true,
        });
        console.log('[ROOT_LAYOUT] Audio mode configured');
        // Pre-load any other assets here
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        // Hide the native splash immediately so our custom one shows
        await SplashScreenNative.hideAsync();
      }
    }

    prepare();
  }, []);

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <AuthProvider>
        <CallProvider>
          <AppContent appIsReady={appIsReady} onAuthReady={handleAuthReady} />
        </CallProvider>
      </AuthProvider>
      {showCustomSplash && (
        <SplashScreenCustom
          ready={appIsReady && authIsReady}
          onAnimationComplete={() => setShowCustomSplash(false)}
        />
      )}
    </SafeAreaProvider>
  )
}

