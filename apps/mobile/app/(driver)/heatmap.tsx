// app/(driver)/heatmap.tsx
import React from "react";
import { View, Text, SafeAreaView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { CalambaMap } from "../../components/maps/CalambaMap";
import { HeatmapLayer } from "../../components/maps/HeatmapLayer";
import { useRouteStore } from "../../stores/route.store";
import { ArrowLeft, Users, Zap } from "lucide-react-native";
import { useRouteDetails } from "../../hooks/api/use-routes";
import { Polyline } from "react-native-maps";

export default function DriverHeatmap() {
  const router = useRouter();
  const { selectedRoute } = useRouteStore();
  const { data: routeDetails } = useRouteDetails(selectedRoute?.route_id || "");

  if (!selectedRoute) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Ruta muna bago biyahe!</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-blue-600 mt-4">Pumili ng Ruta</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const waypoints = routeDetails?.data?.waypoints || [];

  return (
    <View className="flex-1 bg-white">
      <CalambaMap>
        <HeatmapLayer routeId={selectedRoute.route_id} />
        
        {waypoints.length > 0 && (
          <Polyline
            coordinates={waypoints.map((w: any) => ({
              latitude: parseFloat(w.lat),
              longitude: parseFloat(w.lng),
            }))}
            strokeWidth={4}
            strokeColor="#2563eb"
            lineDashPattern={[5, 5]}
          />
        )}
      </CalambaMap>

      <SafeAreaView className="absolute top-0 left-0 right-0 pointer-events-none">
        <View className="px-6 pt-4 pointer-events-auto">
          <View className="flex-row items-center bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <ArrowLeft size={24} color="#1f2937" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                Driver Mode: {selectedRoute.code}
              </Text>
              <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>
                {selectedRoute.name}
              </Text>
            </View>
            <View className="bg-red-100 px-3 py-1 rounded-full">
              <Text className="text-red-600 font-bold text-xs">LIVE</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <View className="absolute bottom-12 left-6 right-6">
        <View className="bg-white p-6 rounded-3xl shadow-2xl border border-gray-100">
          <View className="flex-row items-center mb-4">
            <View className="bg-blue-100 p-2 rounded-lg mr-3">
              <Users size={20} color="#2563eb" />
            </View>
            <Text className="text-xl font-bold text-gray-900">Passenger Density</Text>
          </View>
          
          <Text className="text-gray-600 mb-6">
            Ang mga <Text className="text-red-500 font-bold">pulang zone</Text> ay may pinakamaraming pasahero sa iyong ruta.
          </Text>

          <TouchableOpacity 
            className="bg-blue-600 p-4 rounded-xl flex-row justify-center items-center"
            onPress={() => Alert.alert("AI Suggest", "Otimizing your route path...")}
          >
            <Zap size={20} color="white" className="mr-2" />
            <Text className="text-white font-bold text-lg">AI Smart Path</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

import { Alert } from "react-native";
