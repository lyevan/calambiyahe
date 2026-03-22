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
import { Role } from "../../stores/role.store";
import { ChevronLeft } from "lucide-react-native";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role] = useState<Role>("commuter");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError("");
    if (!username || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await apiClient.post("/auth/register", { username, password, role });
      router.replace("/(auth)/login");
    } catch (err: any) {
      setError(err.message || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
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
                  Create Account
                </Text>
                <Text className="font-body text-[16px] text-text-secondary text-center mt-1">
                  Join our live data network today
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
                  placeholder="Choose a username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
                <Input
                  label="Password"
                  placeholder="Create a secure password"
                  value={password}
                  onChangeText={setPassword}
                  isPassword
                />
                <Input
                  label="Confirm Password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  isPassword
                />

                <Button
                  label="Create account"
                  className="mt-4"
                  loading={loading}
                  onPress={handleRegister}
                />
              </View>

              <View className="flex-row justify-center items-center mt-8">
                <Text className="font-body text-text-secondary">
                  Already have an account?{" "}
                </Text>
                <Pressable onPress={() => router.push("/(auth)/login")}>
                  <Text className="font-body font-bold text-accent">
                    Sign in
                  </Text>
                </Pressable>
              </View>

              <View className="mt-12">
                <Text className="text-[12px] font-body text-text-tertiary text-center leading-5 px-4">
                  By creating an account, you contribute to making public
                  transport in Calamba more efficient for everyone.
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
