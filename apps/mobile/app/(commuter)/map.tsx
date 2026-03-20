// app/(commuter)/map.tsx
import React, { useEffect, useState } from "react";
import { View, Text, SafeAreaView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { CalambaMap } from "../../components/maps/CalambaMap";
import { useRouteStore } from "../../stores/route.store";
import { useBroadcastGps } from "../../hooks/api/use-gps";
import { ArrowLeft, User, ShieldCheck } from "lucide-react-native";
import { isWithinCalamba } from "../../lib/calamba.bounds";
import { Polyline, Marker } from "react-native-maps";
import { useRouteDetails } from "../../hooks/api/use-routes";

export default function CommuterMap() {
  const router = useRouter();
  const { selectedRoute } = useRouteStore();
  const { data: routeDetails } = useRouteDetails(selectedRoute?.route_id || "");
  const { mutate: broadcast } = useBroadcastGps();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    async function startTracking() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Allow location access to broadcast your signal");
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000,
          distanceInterval: 10,
        },
        (newLocation) => {
          setLocation(newLocation);
          const { latitude, longitude } = newLocation.coords;
          
          if (isWithinCalamba(latitude, longitude)) {
            broadcast({ lat: latitude, lng: longitude });
          }
        }
      );
    }

    startTracking();

    return () => {
      subscription?.remove();
    };
  }, []);

  if (!selectedRoute) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Please select a route first</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-blue-600 mt-4">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const waypoints = routeDetails?.data?.waypoints || [];

  return (
    <View className="flex-1 bg-white">
      <CalambaMap>
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="You"
          >
            <View className="bg-blue-600 p-2 rounded-full border-2 border-white shadow-lg">
              <User size={20} color="white" />
            </View>
          </Marker>
        )}

        {waypoints.length > 0 && (
          <>
            <Polyline
              coordinates={waypoints.map((w: any) => ({
                latitude: parseFloat(w.lat),
                longitude: parseFloat(w.lng),
              }))}
              strokeWidth={4}
              strokeColor="#2563eb"
            />
            {waypoints.filter((w: any) => w.is_key_stop).map((w: any) => (
              <Marker
                key={w.waypoint_id}
                coordinate={{
                  latitude: parseFloat(w.lat),
                  longitude: parseFloat(w.lng),
                }}
                title={w.label}
              />
            ))}
          </>
        )}
      </CalambaMap>

      <SafeAreaView className="absolute top-0 left-0 right-0 pointer-events-none">
        <View className="px-6 pt-4 pointer-events-auto">
          <View className="flex-row items-center bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <ArrowLeft size={24} color="#1f2937" />
            </TouchableOpacity>
            <View>
              <Text className="text-sm text-gray-500 font-medium">Aktibong Ruta</Text>
              <Text className="text-lg font-bold text-gray-900">{selectedRoute.name}</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <View className="absolute bottom-10 left-6 right-6 flex-row bg-green-50 p-4 rounded-xl border border-green-100 items-center">
        <View className="bg-green-500 p-2 rounded-full mr-3">
          <ShieldCheck size={16} color="white" />
        </View>
        <Text className="text-green-800 font-medium flex-1">
          Naka-broadcast ang iyong lokasyon para sa mga driver.
        </Text>
      </View>
    </View>
  );
}
