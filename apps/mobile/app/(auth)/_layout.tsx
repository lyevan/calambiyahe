import { Stack } from "expo-router";
import { View } from "react-native";

export default function AuthLayout() {
  return (
    <View className="flex-1 bg-background">
      <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack>
    </View>
  );
}
