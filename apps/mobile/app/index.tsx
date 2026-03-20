// app/index.tsx
import React from "react";
import { View, Text, TouchableOpacity, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../stores/auth.store";
import { useRoleStore } from "../stores/role.store";
import { MapPin, Car, Info } from "lucide-react-native";

export default function RoleSelector() {
  const router = useRouter();
  const { setRole } = useRoleStore();

  const selectRole = (role: any) => {
    setRole(role);
    router.push("/(auth)/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 justify-center">
        <View className="mb-12 items-center">
          <Text className="text-4xl font-bold text-blue-600 mb-2">CalamBiyahe</Text>
          <Text className="text-lg text-gray-600 text-center">
            Ang iyong gabay sa biyahe sa Calamba
          </Text>
        </View>

        <Text className="text-2xl font-semibold mb-8 text-center">Sino ka ngayon?</Text>

        <View className="space-y-4">
          <RoleButton
            title="Commuter"
            description="Naghahanap ng sasakayan"
            icon={<MapPin size={24} color="#2563eb" />}
            onPress={() => selectRole("commuter")}
          />

          <RoleButton
            title="Jeepney Driver"
            description="Naghahanap ng pasahero"
            icon={<Car size={24} color="#2563eb" />}
            onPress={() => selectRole("driver")}
          />

          <RoleButton
            title="Citizen Helper"
            description="Mag-report ng lubak o baha"
            icon={<Info size={24} color="#2563eb" />}
            onPress={() => selectRole("citizen")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function RoleButton({ title, description, icon, onPress }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center p-6 bg-blue-50 rounded-2xl border border-blue-100"
    >
      <View className="mr-4 bg-white p-3 rounded-full shadow-sm">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-xl font-bold text-gray-900">{title}</Text>
        <Text className="text-gray-500">{description}</Text>
      </View>
    </TouchableOpacity>
  );
}
