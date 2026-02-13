import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider } from "@/context/AppContext";
import { RevenueCatProvider } from "@/context/RevenueCatContext";
import Colors from "@/constants/colors";
import { Asset } from 'expo-asset';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="about" />
      <Stack.Screen name="spin-wheel" />
      <Stack.Screen name="calendar" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="subscription" />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    const init = async () => {
      try {
        await Promise.race([
          Asset.loadAsync(require('@/assets/images/wink.gif')),
          new Promise(resolve => setTimeout(resolve, 2000)),
        ]);
      } catch (e) {
        console.log('[Layout] GIF preload failed, shimmer fallback will handle it');
      } finally {
        await SplashScreen.hideAsync();
      }
    };
    init();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RevenueCatProvider>
          <AppProvider key="app-context-v2">
            <RootLayoutNav />
          </AppProvider>
        </RevenueCatProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
