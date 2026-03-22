import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../stores/auth.store";

export default function EntryPoint() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);

  useEffect(() => {
    if (!hydrated) return;

    if (!token || !user) {
      router.replace("/(auth)/login");
    } else if (user.is_admin === true || user.role === 'admin') {
      router.replace("/(admin)/(moderation)");
    } else {
      router.replace("/(tabs)");
    }
  }, [token, user, hydrated]);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" color="#0AADA8" />
    </View>
  );
}
