import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { AlertBanner } from "../../components/ui/AlertBanner";
import { apiClient } from "../../lib/api/client";
import { useAuthStore } from "../../stores/auth.store";
import { HackathonDisclaimer } from "../../components/modals/HackathonDisclaimer";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);

  const handleLogin = async () => {
    setError("");
    if (!username || !password) {
      setError("Username and password are required");
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.post("/auth/login", {
        username,
        password,
      });
      await setSession(response.data.token, response.data.user);
      router.replace("/");
    } catch (err: any) {
      setError(err.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <HackathonDisclaimer />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 px-6 pt-16 pb-12">
            <View className="items-center mb-8">
              <Image
                source={require("../../assets/calambiyahe-logo.png")}
                className="w-20 h-20 mb-4"
                resizeMode="contain"
              />
              <Text className="font-display font-bold text-[32px] text-text-primary text-center">
                Welcome Back
              </Text>
              <Text className="font-body text-[16px] text-text-secondary text-center mt-1">
                Sign in to continue your journey
              </Text>
            </View>

            {error ? (
              <View className="mb-6">
                <AlertBanner
                  type="danger"
                  title={error}
                  onDismiss={() => setError("")}
                />
              </View>
            ) : null}

            <View className="gap-y-5">
              <Input
                label="Username"
                placeholder="Enter your username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                isPassword
              />

              <View className="mt-4 gap-y-4">
                <Button
                  label="Sign in"
                  loading={loading}
                  onPress={handleLogin}
                />

                <View className="flex-row items-center my-2">
                  <View className="flex-1 h-[1px] bg-border-subtle" />
                  <Text className="mx-4 font-body text-text-tertiary">or</Text>
                  <View className="flex-1 h-[1px] bg-border-subtle" />
                </View>

                <Button
                  variant="ghost"
                  label="Create new account"
                  onPress={() => router.push("/(auth)/register")}
                />
              </View>
            </View>

            <View className="mt-12">
              <Text className="text-[12px] font-body text-text-tertiary text-center leading-5 px-4">
                By signing in, you agree that your device will contribute to
                CalamBiyahe's real-time transit data network.
              </Text>
            </View>
          </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
