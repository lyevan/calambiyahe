import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Image,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import { CalambaMap } from "../../components/maps/CalambaMap";
import {
  useAdminTerminals,
  useAdminSpots,
} from "../../hooks/api/use-admin-terminals";
import { useAdminHazards } from "../../hooks/api/use-admin-hazards";
import {
  ArrowLeft,
  MapPin,
  AlertTriangle,
  Layers,
  X,
  Info,
  Calendar,
  User,
  Camera,
  Warehouse,
  Milestone,
  TriangleAlert,
} from "lucide-react-native";
import { Card } from "../../components/ui/Card";
import { ENV } from "../../lib/api/client";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

const AdminMarkerIcon = ({ color, type }: { color: string; type: string }) => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className="items-center justify-center"
    >
      <View
        className="items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-lg"
        style={{ backgroundColor: color }}
      >
        {type === "hazard" ? (
          <TriangleAlert size={12} color="white" />
        ) : type === "terminal" ? (
          <Warehouse size={12} color="white" />
        ) : (
          <Milestone size={12} color="white" />
        )}
      </View>
    </Animated.View>
  );
};

export default function AdminMapView() {
  const { focusType, focusId } = useLocalSearchParams<{
    focusType: string;
    focusId: string;
  }>();
  const mapRef = useRef<MapView>(null);

  const { data: terminals, isLoading: loadingTerminals } = useAdminTerminals();
  const { data: spots, isLoading: loadingSpots } = useAdminSpots();
  const { data: hazards, isLoading: loadingHazards } = useAdminHazards();

  const [showTerminals, setShowTerminals] = useState(true);
  const [showSpots, setShowSpots] = useState(true);
  const [showHazards, setShowHazards] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<any>(null);

  // Auto-focus logic
  useEffect(() => {
    if (
      !focusType ||
      !focusId ||
      loadingTerminals ||
      loadingSpots ||
      loadingHazards
    )
      return;

    let target: any;
    if (focusType === "terminal")
      target = terminals?.find((t) => t.terminal_id === focusId);
    else if (focusType === "spot")
      target = spots?.find((s) => s.spot_id === focusId);
    else if (focusType === "hazard")
      target = hazards?.find((h) => h.report_id === focusId);

    if (target && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: Number(target.lat),
        longitude: Number(target.lng),
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
      setSelectedMarker({ ...target, type: focusType });
    }
  }, [
    focusType,
    focusId,
    terminals,
    spots,
    hazards,
    loadingTerminals,
    loadingSpots,
    loadingHazards,
  ]);

  const markers = useMemo(() => {
    const list: any[] = [];
    if (showTerminals && terminals)
      terminals.forEach((t) =>
        list.push({ ...t, type: "terminal", id: t.terminal_id }),
      );
    if (showSpots && spots)
      spots.forEach((s) => list.push({ ...s, type: "spot", id: s.spot_id }));
    if (showHazards && hazards)
      hazards.forEach((h) =>
        list.push({ ...h, type: "hazard", id: h.report_id }),
      );
    return list;
  }, [terminals, spots, hazards, showTerminals, showSpots, showHazards]);

  if (loadingTerminals || loadingSpots || loadingHazards) {
    return (
      <View className="flex-1 bg-surface-1 items-center justify-center">
        <ActivityIndicator color="#0AADA8" />
      </View>
    );
  }

  const handleMapPress = () => {
    if (selectedMarker) setSelectedMarker(null);
  };

  return (
    <View className="flex-1 bg-background">
      <CalambaMap ref={mapRef} onPress={handleMapPress}>
        {markers.map((m) => (
          <Marker
            key={`${m.type}-${m.id}`}
            coordinate={{ latitude: Number(m.lat), longitude: Number(m.lng) }}
            onPress={(e) => {
              e.stopPropagation();
              setSelectedMarker(m);
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <AdminMarkerIcon
              type={m.type}
              color={
                m.status === "pending"
                  ? "#F59E0B"
                  : m.type === "hazard"
                    ? m.severity === "severe"
                      ? "#EF4444"
                      : m.severity === "medium"
                        ? "#F59E0B"
                        : "#FBBF24"
                    : m.type === "terminal"
                      ? "#0AADA8"
                      : "#3B82F6"
              }
            />
          </Marker>
        ))}
      </CalambaMap>

      {/* Floating Header */}
      <View className="absolute top-12 left-6 right-6 flex-row items-center justify-between pointer-events-box-none">
        <Pressable
          onPress={() => router.back()}
          className="w-12 h-12 bg-surface-1 rounded-full items-center justify-center shadow-lg border border-accent"
        >
          <ArrowLeft size={24} color="#0AADA8" />
        </Pressable>

        <View className="flex-row gap-2 bg-surface-1 rounded-full p-1 shadow-lg border border-border-subtle">
          <Pressable
            onPress={() => setShowTerminals(!showTerminals)}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{
              backgroundColor: showTerminals ? "#0AADA8" : "transparent",
            }}
          >
            <Warehouse size={20} color={showTerminals ? "white" : "#6B7280"} />
          </Pressable>
          <Pressable
            onPress={() => setShowSpots(!showSpots)}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: showSpots ? "#3B82F6" : "transparent" }}
          >
            <Milestone size={20} color={showSpots ? "white" : "#6B7280"} />
          </Pressable>
          <Pressable
            onPress={() => setShowHazards(!showHazards)}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: showHazards ? "#EF4444" : "transparent" }}
          >
            <TriangleAlert
              size={20}
              color={showHazards ? "white" : "#6B7280"}
            />
          </Pressable>
        </View>
      </View>

      {/* Detail Overlay Card */}
      {selectedMarker && (
        <View className="absolute bottom-10 left-6 right-6 z-50">
          <Card className="bg-surface-1 p-0 rounded-3xl overflow-hidden shadow-2xl border border-border-default">
            {selectedMarker.type === "hazard" && selectedMarker.image_url && (
              <View className="h-40 w-full relative">
                <Image
                  source={{
                    uri: selectedMarker.image_url.startsWith("http")
                      ? selectedMarker.image_url
                      : `${ENV.BASE_URL}${selectedMarker.image_url}`,
                  }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
                <View className="absolute top-3 left-3 bg-red-500 px-3 py-1 rounded-full">
                  <Text className="text-white text-[10px] font-bold uppercase tracking-widest">
                    Hazard Image
                  </Text>
                </View>
              </View>
            )}

            <View className="p-4">
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1">
                  <View className="flex-row items-center mb-1">
                    <Text className="text-[10px] font-bold text-accent uppercase tracking-widest mr-2">
                      {selectedMarker.type}
                    </Text>
                    <View
                      className={`px-2 py-0.5 rounded-full ${selectedMarker.status === "pending" ? "bg-amber-100" : "bg-green-100"}`}
                    >
                      <Text
                        className={`text-[9px] font-bold uppercase ${selectedMarker.status === "pending" ? "text-amber-600" : "text-green-600"}`}
                      >
                        {selectedMarker.status}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-xl font-display font-bold text-text-primary">
                    {selectedMarker.name ||
                      selectedMarker.label ||
                      selectedMarker.type}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setSelectedMarker(null)}
                  className="p-2 bg-surface-2 rounded-full border border-border-subtle"
                >
                  <X size={16} color="#6B7280" />
                </Pressable>
              </View>

              {selectedMarker.description && (
                <View className="mb-4 flex-row bg-surface-2 p-3 rounded-xl">
                  <Info size={14} color="#6B7280" className="mr-2 mt-0.5" />
                  <Text className="flex-1 text-xs text-text-secondary font-body leading-4">
                    {selectedMarker.description}
                  </Text>
                </View>
              )}

              <View className="flex-row items-center gap-x-4">
                <View className="flex-row items-center">
                  <Calendar size={12} color="#94A3B8" className="mr-1.5" />
                  <Text className="text-[10px] text-text-tertiary">
                    {selectedMarker.reported_at
                      ? new Date(
                          selectedMarker.reported_at,
                        ).toLocaleDateString()
                      : "Active"}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <User size={12} color="#94A3B8" className="mr-1.5" />
                  <Text className="text-[10px] text-text-tertiary">
                    UID: {selectedMarker.id?.slice(0, 8)}
                  </Text>
                </View>
              </View>

              <View className="mt-4 pt-4 border-t border-border-subtle flex-row gap-x-2">
                <Pressable
                  className="flex-1 bg-primary-500 h-11 rounded-xl items-center justify-center flex-row"
                  onPress={() => setSelectedMarker(null)}
                >
                  <Text className="text-white font-bold text-sm">Dismiss</Text>
                </Pressable>
                {selectedMarker.type === "hazard" && (
                  <Pressable className="w-11 h-11 bg-surface-2 border border-border-subtle rounded-xl items-center justify-center">
                    <Camera size={20} color="#6B7280" />
                  </Pressable>
                )}
              </View>
            </View>
          </Card>
        </View>
      )}

      {/* Focus Indicator Toast (if no marker selected) */}
      {focusType && !selectedMarker && (
        <View className="absolute bottom-10 left-6 right-6 flex-row justify-center items-center pointer-events-none">
          <View className="bg-surface-2 px-6 py-3 rounded-2xl shadow-xl border border-primary-500 flex-row items-center">
            <Layers size={16} color="#0AADA8" className="mr-2" />
            <Text className="font-body font-bold text-text-primary capitalize">
              Viewing {focusType}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
