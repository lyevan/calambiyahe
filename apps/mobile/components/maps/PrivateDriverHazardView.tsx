import { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, Image, ActivityIndicator } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { CalambaMap } from "./CalambaMap";
import {
  useSharedPublicMapState,
  PublicMapMarkers,
  PublicMapUI,
} from "./SharedPublicMapOverlay";
import { useHazards } from "../../hooks/api/use-hazards";
import { PlaceSearchInput } from "../ui/PlaceSearchInput";
import {
  routingApi,
  RouteOption,
  AiRouteResponse,
} from "../../lib/api/routing.api";
import {
  Navigation,
  X,
  ArrowUp,
  Search,
  MapPin,
  Info,
  Sparkle,
  Sparkles,
  Lightbulb,
  CornerUpRight,
  Volume2,
} from "lucide-react-native";
import { useTTS } from "../../hooks/use-tts";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import React from "react";

type NavMode = "idle" | "planning" | "navigating";

interface PrivateDriverHazardViewProps {
  initialLocation?: { latitude: number; longitude: number };
}

export default function PrivateDriverHazardView({ initialLocation }: PrivateDriverHazardViewProps) {
  const [mode, setMode] = useState<NavMode>("idle");
  const [origin, setOrigin] = useState<{
    lat: number;
    lng: number;
    label: string;
  } | null>(null);
  const [destination, setDestination] = useState<{
    lat: number;
    lng: number;
    label: string;
  } | null>(null);
  const [routeData, setRouteData] = useState<AiRouteResponse | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [tipsData, setTipsData] = useState<any>(null);
  const [showReroute, setShowReroute] = useState(false);
  const [rerouteData, setRerouteData] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const { speak, isSpeaking, stop } = useTTS();

  const mapState = useSharedPublicMapState();
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    if (initialLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...initialLocation,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    }
  }, [initialLocation]);

  // Initial user location fetch
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({});
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      setUserLocation({ lat, lng });

      // Default origin to current location
      try {
        const label = await routingApi.reverseGeocode(lat, lng);
        setOrigin({ lat, lng, label });
      } catch (err) {
        setOrigin({ lat, lng, label: "Current Location" });
      }
    })();
  }, []);

  const handleSelectDestination = async (place: {
    name: string;
    lat: number;
    lng: number;
  }) => {
    const lat = Number(place.lat);
    const lng = Number(place.lng);
    setDestination({ lat, lng, label: place.name });
    setMode("planning");
    if (origin) {
      fetchRoute(origin, { lat, lng });
    }
  };

  const fetchRoute = async (
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
  ) => {
    setLoading(true);
    try {
      const res = await routingApi.getAiRoute(
        { lat: Number(start.lat), lng: Number(start.lng) },
        { lat: Number(end.lat), lng: Number(end.lng) }
      );
      if (res && res.routes.length > 0) {
        setRouteData(res);
        setSelectedRouteIndex(0);
        // Fit map to all routes
        const allCoords = res.routes.flatMap((r) =>
          r.geometry.coordinates.map(([lng, lat]) => ({
            latitude: lat,
            longitude: lng,
          })),
        );
        mapRef.current?.fitToCoordinates(allCoords, {
          edgePadding: { top: 150, right: 50, bottom: 300, left: 50 },
          animated: true,
        });
      }
    } catch (err) {
      console.error("Failed to fetch AI routes:", err);
    } finally {
      setLoading(false);
    }
  };

  const getRouteLabelPosition = (route: any) => {
    const coords = route.geometry.coordinates;
    const midIndex = Math.floor(coords.length / 2);
    return {
      latitude: coords[midIndex][1],
      longitude: coords[midIndex][0],
    };
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.ceil(seconds / 60);
    if (mins < 60) return `${mins} mins`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs} hr ${remainingMins} min`;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const startNavigation = () => {
    setMode("navigating");
    if (userLocation) {
      mapRef.current?.animateToRegion(
        {
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          latitudeDelta: 0.002,
          longitudeDelta: 0.002,
        },
        1000,
      );
    }
  };

  const cancelNavigation = () => {
    setMode("idle");
    setDestination(null);
    setRouteData(null);
    setRerouteData(null);
    setShowReroute(false);
    setShowTips(false);
  };

  const { data: hazards } = useHazards();

  const handleGetTips = async () => {
    if (!origin || !destination) return;
    setIsAiLoading(true);
    setShowTips(true);
    try {
      const res = await routingApi.getTravelTips(
        origin,
        destination.label,
        "private_driver",
      );
      setTipsData(res);
    } catch (err) {
      console.error("AI Tips failed:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleGetReroute = async () => {
    // For demo purposes, we'll just check for reroutes from current location
    // In a real app, this would be triggered by a geofence or hazard detection
    if (!userLocation || !routeData) return;
    setIsAiLoading(true);
    setShowReroute(true);
    try {
      // Find the first confirmed hazard to "reroute around" for demo
      const targetHazard = hazards?.find(h => h.status === 'confirmed');
      
      const res = await routingApi.getRerouteSuggestion(
        targetHazard?.report_id || "00000000-0000-0000-0000-000000000000",
        "00000000-0000-0000-0000-000000000001", // Placeholder route UUID since we don't store route IDs in DB yet
        userLocation,
      );
      setRerouteData(res);
    } catch (err) {
      console.error("AI Reroute failed:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background relative">
      <CalambaMap
        ref={mapRef}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        <PublicMapMarkers state={mapState} />

        {routeData &&
          routeData.routes.map((route, index) => (
            <React.Fragment key={index}>
              <Polyline
                coordinates={route.geometry.coordinates.map(([lng, lat]) => ({
                  latitude: lat,
                  longitude: lng,
                }))}
                strokeWidth={index === selectedRouteIndex ? 6 : 4}
                strokeColor={
                  index === selectedRouteIndex ? "#2C666E" : "#9CA3AF"
                }
                lineDashPattern={
                  index === selectedRouteIndex ? undefined : [5, 5]
                }
                onPress={() => setSelectedRouteIndex(index)}
                tappable={true}
              />
              {/* Duration Label Marker */}
              <Marker
                coordinate={getRouteLabelPosition(route)}
                onPress={() => setSelectedRouteIndex(index)}
                tracksViewChanges={false}
              >
                <View
                  className={`${index === selectedRouteIndex ? "bg-white" : "bg-surface-2"} px-2 py-1 rounded-lg border border-border-default shadow-sm`}
                >
                  <Text
                    className={`text-[10px] font-bold ${index === selectedRouteIndex ? "text-accent" : "text-text-tertiary"}`}
                  >
                    {formatDuration(route.duration)}
                  </Text>
                </View>
              </Marker>
            </React.Fragment>
          ))}

        {routeData && (
          <Marker
            coordinate={{
              latitude: destination!.lat,
              longitude: destination!.lng,
            }}
          >
            <View className="bg-danger p-2 rounded-full border-2 border-white shadow-lg">
              <MapPin size={14} color="white" />
            </View>
          </Marker>
        )}
      </CalambaMap>

      <PublicMapUI state={mapState} bottomOffset={mode === "idle" ? 20 : 320} />

      {/* SEARCH / NAVIGATION OVERLAYS */}
      <View className="absolute top-12 left-3 right-3 z-10 pointer-events-box-none">
        {mode === "idle" && (
          <View className="bg-surface-1 p-2 rounded-2xl shadow-xl border border-border-subtle pointer-events-auto">
            <PlaceSearchInput
              onSelect={handleSelectDestination}
              placeholder="Where to go?"
            />
          </View>
        )}

        {mode === "planning" && (
          <View className="bg-surface-1 p-4 rounded-2xl shadow-xl border border-border-default pointer-events-auto">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1">
                <Text className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1">
                  Destination
                </Text>
                <Text
                  className="text-sm font-display font-bold text-text-primary"
                  numberOfLines={1}
                >
                  {destination?.label}
                </Text>
              </View>
              <Pressable
                onPress={cancelNavigation}
                className="p-2 bg-surface-2 rounded-full border border-border-subtle"
              >
                <X size={16} color="#6B7280" />
              </Pressable>
            </View>
            {loading ? (
              <ActivityIndicator color="#0AADA8" className="py-2" />
            ) : (
              <View>
                <View className="flex-row justify-between items-center bg-surface-2 p-3 rounded-xl border border-border-subtle mb-3">
                  <View>
                    <Text className="text-xl font-display font-bold text-accent">
                      {routeData
                        ? formatDuration(
                            routeData.routes[selectedRouteIndex].duration,
                          )
                        : "--"}
                    </Text>
                    <Text className="text-[10px] text-text-tertiary uppercase font-bold tracking-tighter">
                      {routeData
                        ? formatDistance(
                            routeData.routes[selectedRouteIndex].distance,
                          )
                        : "--"}
                    </Text>
                  </View>
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={handleGetTips}
                      className="w-10 h-10 bg-accent/10 rounded-lg items-center justify-center border border-accent/20"
                    >
                      <Lightbulb size={20} color="#0AADA8" />
                    </Pressable>
                    <Button
                      label="Start Driving"
                      onPress={startNavigation}
                      className="px-6 h-10 rounded-lg"
                    />
                  </View>
                </View>
                {routeData?.routes[selectedRouteIndex]?.message && (
                  <View className="bg-accent/10 p-3 rounded-xl border border-accent/20">
                    <View className="flex-row items-center justify-between gap-2 mb-2">
                      <View className="flex-row items-center gap-2">
                        <Sparkles size={16} color="#0AADA8" />
                        <Text className="text-lg text-accent font-medium">
                          AI Insights
                        </Text>
                      </View>
                      <Pressable 
                        onPress={() => speak(routeData.routes[selectedRouteIndex].message)}
                        className="p-1 rounded-full bg-accent/20"
                      >
                        <Volume2 size={16} color="#0AADA8" />
                      </Pressable>
                    </View>
                    <Text className="text-xs text-accent font-medium italic">
                      " {routeData.routes[selectedRouteIndex].message} "
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {mode === "navigating" && (
          <View className="bg-accent p-4 rounded-2xl shadow-2xl flex-row items-center pointer-events-auto border-2 border-white/20">
            <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center mr-4 border border-white/40">
              <ArrowUp size={24} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-[10px] font-bold uppercase tracking-widest opacity-80">
                Driving To
              </Text>
              <Text
                className="text-white text-lg font-display font-bold"
                numberOfLines={1}
              >
                {destination?.label?.split(",")[0]}
              </Text>
            </View>
            <Pressable
              onPress={handleGetReroute}
              className="bg-white/20 p-2 rounded-full border border-white/40 mr-2"
            >
              <CornerUpRight size={20} color="white" />
            </Pressable>
            <Pressable
              onPress={cancelNavigation}
              className="bg-white/10 p-2 rounded-full border border-white/20"
            >
              <X size={20} color="white" />
            </Pressable>
          </View>
        )}
      </View>

      {/* AI OVERLAYS (Tips & Reroute) */}
      {(showTips || showReroute) && (
        <View className="absolute inset-0 z-50 bg-black/40 items-center justify-center p-6">
          <Card className="bg-surface-1 w-full max-w-md p-6 rounded-3xl shadow-2xl">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2">
                {showTips ? (
                  <Lightbulb size={24} color="#0AADA8" />
                ) : (
                  <CornerUpRight size={24} color="#0AADA8" />
                )}
                <Text className="text-xl font-display font-bold text-text-primary">
                  {showTips ? "Travel Tips" : "AI Reroute"}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setShowTips(false);
                  setShowReroute(false);
                }}
                className="p-2 bg-surface-2 rounded-full"
              >
                <X size={20} color="#6B7280" />
              </Pressable>
            </View>

            {isAiLoading ? (
              <ActivityIndicator color="#0AADA8" size="large" className="py-10" />
            ) : (
              <View>
                {showTips && tipsData && (
                  <View>
                    {tipsData.tips.map((tip: string, idx: number) => (
                      <View key={idx} className="flex-row mb-3 bg-surface-2 p-3 rounded-xl items-start">
                        <Sparkles size={14} color="#0AADA8" className="mr-2 mt-1" />
                        <Text className="flex-1 text-sm text-text-secondary leading-5">
                          {tip}
                        </Text>
                        <Pressable 
                          onPress={() => speak(tip)}
                          className="p-1 rounded-full bg-surface-3 ml-2"
                        >
                          <Volume2 size={14} color="#0AADA8" />
                        </Pressable>
                      </View>
                    ))}
                    <View className="mt-2 p-3 bg-accent/5 rounded-xl border border-accent/10">
                      <Text className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1">
                        Fare Estimate
                      </Text>
                      <Text className="text-lg font-display font-bold text-text-primary">
                        {tipsData.fareEstimate || "N/A"}
                      </Text>
                    </View>
                  </View>
                )}

                {showReroute && rerouteData && (
                  <View>
                    <View className="bg-danger/10 p-4 rounded-2xl border border-danger/20 mb-4">
                      <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-danger font-bold text-sm">
                          AI Safe Advice
                        </Text>
                        <Pressable 
                          onPress={() => speak(rerouteData.message)}
                          className="p-1 rounded-full bg-danger/20"
                        >
                          <Volume2 size={14} color="#EF4444" />
                        </Pressable>
                      </View>
                      <Text className="text-text-primary text-sm italic">
                        "{rerouteData.message}"
                      </Text>
                    </View>
                    <Text className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2 px-1">
                      Alternative Steps
                    </Text>
                    {rerouteData.alternativeSteps.map((step: string, idx: number) => (
                      <View key={idx} className="flex-row items-center mb-2 px-1">
                        <View className="w-5 h-5 bg-accent/20 rounded-full items-center justify-center mr-3">
                          <Text className="text-[10px] font-bold text-accent">{idx + 1}</Text>
                        </View>
                        <Text className="flex-1 text-xs text-text-secondary">{step}</Text>
                        <Pressable 
                          onPress={() => speak(step)}
                          className="p-1 rounded-full bg-surface-2 ml-2"
                        >
                          <Volume2 size={12} color="#0AADA8" />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            <Button
              label="Got it"
              onPress={() => {
                setShowTips(false);
                setShowReroute(false);
              }}
              variant="primary"
              className="mt-6 rounded-xl h-12"
            />
          </Card>
        </View>
      )}

      {/* BOTTOM NAVIGATION HUB */}
      {mode === "navigating" && (
        <View className="absolute bottom-10 left-6 right-6 bg-surface-1 p-6 rounded-3xl shadow-2xl border border-border-default flex-row justify-between items-center">
          <View>
            <Text className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1">
              Arrival Time
            </Text>
            <Text className="text-2xl font-display font-bold text-text-primary">
              {routeData
                ? new Date(
                    Date.now() +
                      routeData.routes[selectedRouteIndex].duration * 1000,
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "--:--"}
            </Text>
            <Text className="text-accent font-bold text-xs mt-1">
              {routeData
                ? formatDuration(routeData.routes[selectedRouteIndex].duration)
                : "--"}{" "}
              remaining
            </Text>
          </View>
          <Pressable
            onPress={cancelNavigation}
            className="bg-danger-surface px-8 py-3 rounded-xl border border-danger flex-row items-center"
          >
            <Text className="text-danger font-display font-bold uppercase tracking-widest text-xs">
              Exit
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
