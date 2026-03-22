import React, { useState, useMemo } from "react";
import { View, Text, Pressable, Image, ActivityIndicator } from "react-native";
import { Marker } from "react-native-maps";
import {
  Warehouse,
  Milestone,
  TriangleAlert,
  X,
  Info,
  Sparkles,
  Volume2,
} from "lucide-react-native";
import { useTTS } from "../../hooks/use-tts";
import { useTerminals, useSpots } from "../../hooks/api/use-terminals";
import { useHazards } from "../../hooks/api/use-hazards";
import { hazardsApi, HazardAnalysis } from "../../lib/api/hazards.api";
import { Card } from "../ui/Card";
import { ENV } from "../../lib/api/client";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

const PulsingMarkerIcon = ({
  color,
  type,
}: {
  color: string;
  type: string;
}) => {
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true, // Reverse so it breathes 1 -> 0.6 -> 1
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

/**
 * HOOK: Manages the shared state for public map layers
 */
export function useSharedPublicMapState() {
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [showTerminals, setShowTerminals] = useState(true);
  const [showSpots, setShowSpots] = useState(true);
  const [showHazards, setShowHazards] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<HazardAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Clear analysis when marker changes
  const handleSetSelectedMarker = (m: any) => {
    setSelectedMarker(m);
    setAiAnalysis(null);
  };

  return {
    selectedMarker,
    setSelectedMarker: handleSetSelectedMarker,
    showTerminals,
    setShowTerminals,
    showSpots,
    setShowSpots,
    showHazards,
    setShowHazards,
    aiAnalysis,
    setAiAnalysis,
    isAnalyzing,
    setIsAnalyzing,
  };
}

export type PublicMapState = ReturnType<typeof useSharedPublicMapState>;

/**
 * COMPONENT: Renders ONLY the markers (SAFE for MapView children)
 */
export function PublicMapMarkers({
  state,
  filterByRouteId,
}: {
  state: PublicMapState;
  filterByRouteId?: string;
}) {
  const { data: terminals } = useTerminals();
  const { data: spots } = useSpots();
  const { data: hazards } = useHazards();

  const markers = useMemo(() => {
    const list: any[] = [];

    if (state.showTerminals && terminals) {
      terminals
        .filter((t) => t.status === "confirmed")
        .forEach((t) =>
          list.push({ ...t, type: "terminal", id: t.terminal_id }),
        );
    }

    if (state.showSpots && spots) {
      spots
        .filter((s) => {
          const matchesStatus = s.status === "confirmed";
          const matchesRoute = filterByRouteId
            ? s.route_id === filterByRouteId
            : true;
          return matchesStatus && matchesRoute;
        })
        .forEach((s) => list.push({ ...s, type: "spot", id: s.spot_id }));
    }

    if (state.showHazards && hazards) {
      hazards
        .filter((h) => h.status === "confirmed")
        .forEach((h) => list.push({ ...h, type: "hazard", id: h.report_id }));
    }

    return list;
  }, [
    terminals,
    spots,
    hazards,
    state.showTerminals,
    state.showSpots,
    state.showHazards,
    filterByRouteId,
  ]);

  return (
    <>
      {markers.map((m) => (
        <Marker
          key={`${m.type}-${m.id}`}
          coordinate={{ latitude: Number(m.lat), longitude: Number(m.lng) }}
          onPress={(e) => {
            e.stopPropagation();
            state.setSelectedMarker(m);
          }}
          anchor={{ x: 0.5, y: 0.5 }} // Center anchor for pulse symmetry
        >
          <PulsingMarkerIcon
            type={m.type}
            color={
              m.type === "hazard"
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
    </>
  );
}

/**
 * COMPONENT: Renders the UI Overlays (Filters + Detail Card)
 * This MUST be a sibling of the map, NOT a child.
 */
export function PublicMapUI({
  state,
  bottomOffset = 100,
}: {
  state: PublicMapState;
  bottomOffset?: number;
}) {
  const {
    selectedMarker,
    setSelectedMarker,
    showTerminals,
    setShowTerminals,
    showSpots,
    setShowSpots,
    showHazards,
    setShowHazards,
    aiAnalysis,
    setAiAnalysis,
    isAnalyzing,
    setIsAnalyzing,
  } = state;

  const { speak } = useTTS();

  const handleAiAnalysis = async () => {
    if (!selectedMarker || selectedMarker.type !== "hazard") return;
    setIsAnalyzing(true);
    try {
      const res = await hazardsApi.analyze(
        "", // imageBase64 empty since we use reportId
        "image/jpeg",
        { lat: Number(selectedMarker.lat), lng: Number(selectedMarker.lng) },
        "",
        selectedMarker.report_id || selectedMarker.id,
      );
      setAiAnalysis(res);
    } catch (err) {
      console.error("AI Analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      {/* Floating Filter Controls */}
      <View className="absolute top-36 left-6 z-10">
        <View className="bg-surface-1 rounded-full p-1 shadow-lg border border-border-subtle flex-row">
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
        <View
          className="absolute left-6 right-6 z-20"
          style={{ bottom: bottomOffset }}
        >
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
              </View>
            )}

            <View className="p-4">
              <View className="flex-row items-start justify-between mb-2">
                <View className="flex-1">
                  <View className="flex-row items-center mb-1">
                    <Text className="text-[10px] font-bold text-accent uppercase tracking-widest mr-2">
                      {selectedMarker.type}
                    </Text>
                    {selectedMarker.type === "hazard" && (
                      <View
                        className={`px-2 py-0.5 rounded-full ${selectedMarker.severity === "severe" ? "bg-red-100" : selectedMarker.severity === "medium" ? "bg-amber-100" : "bg-yellow-100"}`}
                      >
                        <Text
                          className={`text-[8px] font-bold uppercase ${selectedMarker.severity === "severe" ? "text-red-600" : selectedMarker.severity === "medium" ? "text-amber-600" : "text-yellow-600"}`}
                        >
                          {selectedMarker.severity}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-xl font-display font-bold text-text-primary">
                    {selectedMarker.name ||
                      selectedMarker.label ||
                      selectedMarker.type}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setSelectedMarker(null)}
                  className="p-2 bg-surface-2 rounded-full"
                >
                  <X size={16} color="#6B7280" />
                </Pressable>
              </View>

              {selectedMarker.description && (
                <View className="flex-row bg-surface-2 p-3 rounded-xl mb-4">
                  <Info size={14} color="#6B7280" className="mr-2 mt-0.5" />
                  <Text className="flex-1 text-xs text-text-secondary leading-4 font-body">
                    {selectedMarker.description}
                  </Text>
                </View>
              )}

              {selectedMarker.type === "hazard" && (
                <View className="mb-4">
                  {!aiAnalysis ? (
                    <Pressable
                      className="bg-accent/10 h-11 rounded-xl items-center justify-center flex-row border border-accent/20"
                      onPress={handleAiAnalysis}
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <ActivityIndicator size="small" color="#0AADA8" />
                      ) : (
                        <>
                          <Sparkles size={16} color="#0AADA8" className="mr-2" />
                          <Text className="text-accent font-bold text-sm">
                            Analyze with AI
                          </Text>
                        </>
                      )}
                    </Pressable>
                  ) : (
                    <View className="bg-surface-2 p-3 rounded-xl border border-border-default">
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center">
                          <Sparkles size={14} color="#0AADA8" className="mr-2" />
                          <Text className="text-xs font-bold text-accent uppercase tracking-wider">
                            AI Insights
                          </Text>
                        </View>
                        <Pressable 
                          onPress={() => speak(`${aiAnalysis.hazardType}. ${aiAnalysis.description}. ${aiAnalysis.recommendedAction}`)}
                          className="p-1 rounded-full bg-accent/20"
                        >
                          <Volume2 size={14} color="#0AADA8" />
                        </Pressable>
                      </View>
                      <Text className="text-sm font-bold text-text-primary mb-1">
                        {aiAnalysis.hazardType} ({(aiAnalysis.confidence * 100).toFixed(0)}% Match)
                      </Text>
                      <Text className="text-xs text-text-secondary mb-2 italic">
                        "{aiAnalysis.description}"
                      </Text>
                      <View className="flex-row items-center bg-accent/5 p-2 rounded-lg">
                        <Info size={12} color="#0AADA8" className="mr-2" />
                        <Text className="flex-1 text-[10px] text-accent font-medium">
                          {aiAnalysis.recommendedAction}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              <Pressable
                className="bg-primary-500 h-11 rounded-xl items-center justify-center"
                onPress={() => setSelectedMarker(null)}
              >
                <Text className="text-white font-bold text-sm">Dismiss</Text>
              </Pressable>
            </View>
          </Card>
        </View>
      )}
    </>
  );
}
