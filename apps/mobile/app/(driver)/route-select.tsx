// app/(driver)/route-select.tsx
import React from "react";
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useRoutes } from "../../hooks/api/use-routes";
import { useRouteStore } from "../../stores/route.store";
import { ChevronRight, Stepper } from "lucide-react-native";

export default function DriverRouteSelect() {
  const router = useRouter();
  const { data, isLoading } = useRoutes();
  const { setSelectedRoute } = useRouteStore();

  const handleSelect = (route: any) => {
    setSelectedRoute(route);
    router.push("/(driver)/heatmap");
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="p-6 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">Bumiyahe Na!</Text>
        <Text className="text-gray-500">Piliin ang ruta ng iyong biyahe ngayon</Text>
      </View>

      <FlatList
        data={data?.data || []}
        keyExtractor={(item) => item.route_id}
        contentContainerClassName="p-6"
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleSelect(item)}
            className="flex-row items-center p-4 bg-blue-50 rounded-2xl mb-4 border border-blue-100"
          >
            <View className="w-12 h-12 bg-white rounded-full items-center justify-center mr-4 shadow-sm">
              <Text className="text-blue-600 font-bold">JE</Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900">{item.code}</Text>
              <Text className="text-gray-500">{item.name}</Text>
            </View>
            <ChevronRight size={20} color="#3b82f6" />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
