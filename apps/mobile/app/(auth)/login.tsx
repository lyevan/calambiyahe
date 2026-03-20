// app/(auth)/login.tsx
import React, { useState } from "react";
import { View, Text, TextInput, SafeAreaView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useLogin } from "../../hooks/api/use-auth";
import { Button } from "../../components/ui/Button";
import { useRoleStore } from "../../stores/role.store";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { mutate: login, isPending } = useLogin();
  const { role } = useRoleStore();

  const handleLogin = () => {
    login({ username, password }, {
      onSuccess: () => {
        // Redirect based on role
        if (role === "driver") router.replace("/(driver)/route-select");
        else if (role === "commuter") router.replace("/(commuter)/route-select");
        else router.replace("/(citizen)/report");
      },
      onError: (error: any) => {
        Alert.alert("Login Failed", error.message);
      }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 justify-center">
        <Text className="text-3xl font-bold mb-8 text-center">Maligayang Pagbabalik!</Text>
        
        <View className="space-y-4">
          <View>
            <Text className="text-gray-700 mb-2 font-medium">Username</Text>
            <TextInput
              className="p-4 bg-gray-50 rounded-xl border border-gray-200"
              placeholder="Enter your username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View>
            <Text className="text-gray-700 mb-2 font-medium">Password</Text>
            <TextInput
              className="p-4 bg-gray-50 rounded-xl border border-gray-200"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <Button 
            title="Mag-login" 
            onPress={handleLogin} 
            loading={isPending}
            className="mt-6"
          />

          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <Text className="text-blue-600 text-center mt-4 font-medium">
              Wala pang account? Mag-register
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

import { TouchableOpacity } from "react-native";
