import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { useAuthStore } from "../stores/auth.store";
import "../global.css";
import { View } from "react-native";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  const hydrateSession = useAuthStore((state) => state.hydrateSession);
  const hydrated = useAuthStore((state) => state.hydrated);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    void hydrateSession().finally(() => setBootstrapped(true));
  }, [hydrateSession]);

  useEffect(() => {
    if (bootstrapped && hydrated) {
      SplashScreen.hideAsync();
    }
  }, [bootstrapped, hydrated]);

  return (
    <QueryClientProvider client={queryClient}>
      <View className="flex-1 bg-background">
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(admin)" />
        </Stack>
      </View>
    </QueryClientProvider>
  );
}

