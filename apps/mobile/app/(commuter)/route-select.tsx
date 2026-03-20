// app/(commuter)/route-select.tsx
import React from "react";
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useRoutes } from "../../hooks/api/use-routes";
import { useRouteStore } from "../../stores/route.store";
import { ChevronRight, Map } from "lucide-react-native";

export default function RouteSelect() {
  const router = useRouter();
  const { data, isLoading, error } = useRoutes();
  const { setSelectedRoute } = useRouteStore();

  const handleSelect = (route: any) => {
    setSelectedRoute(route);
    router.push("/(commuter)/map");
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
        <Text className="text-2xl font-bold text-gray-900">Saan tayo pupunta?</Text>
        <Text className="text-gray-500">Piliin ang iyong ruta sa Calamba</Text>
      </View>

      <FlatList
        data={data?.data || []}
        keyExtractor={(item) => item.route_id}
        contentContainerClassName="p-6"
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleSelect(item)}
            className="flex-row items-center p-4 bg-gray-50 rounded-2xl mb-4 border border-gray-100"
          >
            <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
              <Map size={24} color="#2563eb" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900">{item.code}</Text>
              <Text className="text-gray-500">{item.name}</Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
