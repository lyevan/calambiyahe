import { Stack, Redirect } from "expo-router";
import { View } from "react-native";
import { useAuthStore } from "../../stores/auth.store";

export default function AdminLayout() {
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);

  // Wait until session is loaded before deciding
  if (!hydrated) return null;

  // Synchronous guard — fires before any frame is drawn
  if (user && user.is_admin !== true && user.role !== "admin") {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View className="flex-1 bg-background">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(moderation)" />
        <Stack.Screen name="map" />
      </Stack>
    </View>
  );
}

