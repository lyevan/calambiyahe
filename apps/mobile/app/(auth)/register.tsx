// app/(auth)/register.tsx
import React, { useState } from "react";
import { View, Text, TextInput, SafeAreaView, Alert, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useRegister } from "../../hooks/api/use-auth";
import { Button } from "../../components/ui/Button";
import { useRoleStore } from "../../stores/role.store";

export default function Register() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { mutate: register, isPending } = useRegister();
  const { role } = useRoleStore();

  const handleRegister = () => {
    if (!role) {
      Alert.alert("Error", "Please select a role first");
      return router.replace("/");
    }

    register({ username, password, role: role as any }, {
      onSuccess: () => {
        Alert.alert("Success", "Account created!", [
          { text: "OK", onPress: () => router.replace("/(auth)/login") }
        ]);
      },
      onError: (error: any) => {
        Alert.alert("Registration Failed", error.message);
      }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 justify-center">
        <Text className="text-3xl font-bold mb-8 text-center">Sumali sa CalamBiyahe</Text>
        
        <View className="space-y-4">
          <View>
            <Text className="text-gray-600 mb-2 font-medium">Username</Text>
            <TextInput
              className="p-4 bg-gray-50 rounded-xl border border-gray-200"
              placeholder="Pumili ng username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View>
            <Text className="text-gray-600 mb-2 font-medium">Password</Text>
            <TextInput
              className="p-4 bg-gray-50 rounded-xl border border-gray-200"
              placeholder="Security password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <Text className="text-blue-800">
              Makar-register ka bilang: <Text className="font-bold capitalize">{role || "Unknown"}</Text>
            </Text>
          </View>

          <Button 
            title="Mag-register" 
            onPress={handleRegister} 
            loading={isPending}
            className="mt-6"
          />

          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <Text className="text-blue-600 text-center mt-4 font-medium">
              May account na? Mag-login
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
