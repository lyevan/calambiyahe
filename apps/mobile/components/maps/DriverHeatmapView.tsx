import { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, ActivityIndicator, Image } from "react-native";
import MapView from "react-native-maps";
import * as Location from "expo-location";
import { CalambaMap } from "./CalambaMap";
import { HeatmapLayer } from "./HeatmapLayer";
import { BottomSheet, SnapPoint } from "../ui/BottomSheet";
import { useRouteStore } from "../../stores/route.store";
import { useHeatmap } from "../../hooks/api/use-heatmap";
import { useDriverRouteSession } from "../../hooks/api/use-gps";
import { Button } from "../ui/Button";
import { useRoutes } from "../../hooks/api/use-routes";
import { useHazards } from "../../hooks/api/use-hazards";
import { routingApi } from "../../lib/api/routing.api";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { Play, X, Lightbulb, CornerUpRight, Sparkles, MapPin, Navigation, ArrowUp, Volume2 } from 'lucide-react-native';
import { useTTS } from "../../hooks/use-tts";
import { RoutePath } from "./RoutePath";
import { useSharedPublicMapState, PublicMapMarkers, PublicMapUI } from "./SharedPublicMapOverlay";

type NavMode = "idle" | "planning" | "active";

interface DriverHeatmapViewProps {
  initialLocation?: { latitude: number; longitude: number };
}

export default function DriverHeatmapView({ initialLocation }: DriverHeatmapViewProps) {
  const [mode, setMode] = useState<NavMode>("idle");
  const selectedRoute = useRouteStore((state) => state.selectedRoute);
  const setSelectedRoute = useRouteStore((state) => state.setSelectedRoute);
  const clearSelectedRoute = useRouteStore((state) => state.clearSelectedRoute);
  const { data: routes, isLoading: routesLoading } = useRoutes();
  const { data: heatmapData } = useHeatmap(selectedRoute?.route_id || '');
  const { endRoute, startRoute } = useDriverRouteSession();
  
  const mapState = useSharedPublicMapState();
  const { data: hazards } = useHazards();
  const mapRef = useRef<MapView>(null);
  
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  
  const [snap, setSnap] = useState<SnapPoint>('minimized');
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [search, setSearch] = useState('');
  const [selectionSnap, setSelectionSnap] = useState<SnapPoint>('expanded');
  const [planningSnap, setPlanningSnap] = useState<SnapPoint>('expanded');

  // AI States
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [tipsData, setTipsData] = useState<any>(null);
  const [showReroute, setShowReroute] = useState(false);
  const [rerouteData, setRerouteData] = useState<any>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const { speak, isSpeaking, stop } = useTTS();

  useEffect(() => {
    if (initialLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...initialLocation,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
      
      if (mode === "idle") {
        setSelectionSnap('expanded');
      } else if (mode === "planning") {
        setPlanningSnap('expanded');
      } else {
        setSnap('expanded');
      }
    }
  }, [initialLocation, mode]);

  // Initial user location fetch
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      });
    })();
  }, []);

  const handleSelectRoute = async (route: any) => {
    setSelectedRoute({ route_id: route.route_id, name: route.name, code: route.code });
    setMode("planning");
    
    // Fetch initial AI advice for this route
    setIsAiLoading(true);
    try {
      const res = await routingApi.getTravelTips(
        userLocation || { lat: 14.21, lng: 121.17 },
        route.name,
        "driver"
      );
      if (res && res.tips.length > 0) {
        setAiInsight(res.tips[0]);
      }
    } catch (err) {
      console.error("Failed to get initial AI advice:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleStartRoute = async () => {
    if (!selectedRoute) return;
    try {
      await startRoute.mutateAsync(selectedRoute.route_id);
      setMode("active");
    } catch (e) {
      console.error(e);
    }
  };

  const handleEndRoute = async () => {
    try {
      await endRoute.mutateAsync();
      clearSelectedRoute();
      setMode("idle");
      setShowEndConfirm(false);
      setAiInsight(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGetTips = async () => {
    if (!selectedRoute) return;
    setIsAiLoading(true);
    setShowTips(true);
    try {
      const res = await routingApi.getTravelTips(
        { lat: 14.21, lng: 121.17 },
        selectedRoute.name,
        "driver"
      );
      setTipsData(res);
    } catch (err) {
      console.error("AI Tips failed:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleGetReroute = async () => {
    if (!selectedRoute) return;
    setIsAiLoading(true);
    setShowReroute(true);
    try {
      const targetHazard = hazards?.find(h => h.status === 'confirmed');
      const res = await routingApi.getRerouteSuggestion(
        targetHazard?.report_id || "00000000-0000-0000-0000-000000000000",
        selectedRoute.route_id,
        userLocation || { lat: 14.21, lng: 121.17 }
      );
      setRerouteData(res);
    } catch (err) {
      console.error("AI Reroute failed:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  if (mode === "idle") {
    const filteredRoutes = routes?.filter(r => 
      r.is_active && (r.name.toLowerCase().includes(search.toLowerCase()) || r.code.toLowerCase().includes(search.toLowerCase()))
    ) || [];

    return (
      <View className="flex-1 bg-background relative">
        <CalambaMap />
        <PublicMapUI state={mapState} bottomOffset={320} />
        <BottomSheet 
          snapPoint={selectionSnap} 
          onSnapPointChange={setSelectionSnap}
        >
          <View className="px-6 py-2">
            <Text className="font-display font-bold text-[20px] text-text-primary mb-1">Start your route</Text>
            <Text className="font-body text-[14px] text-text-secondary mb-4">Select your assigned jeepney route.</Text>
            
            <Input 
              placeholder="Search routes..." 
              value={search}
              onChangeText={setSearch}
              className="mb-6"
            />

            {routesLoading ? (
              <ActivityIndicator color="#0AADA8" className="mt-8" />
            ) : filteredRoutes.length === 0 ? (
              <View className="py-8 items-center bg-warning-surface border-l-[4px] border-warning px-4 mt-4">
                <Text className="text-warning font-body text-center">No active routes available.</Text>
              </View>
            ) : (
              <View className="gap-y-3">
                {filteredRoutes.map((route) => (
                  <Pressable key={route.route_id} onPress={() => handleSelectRoute(route)}>
                    <Card className="min-h-[100px] justify-center py-5 px-6">
                      <View className="flex-row items-center">
                        <View className="bg-surface-3 px-3 py-1.5 rounded-[8px] mr-4 border border-border-subtle">
                          <Text className="font-mono text-[14px] text-accent font-bold uppercase tracking-tighter">{route.code}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="font-display font-bold text-[18px] text-text-primary mb-0.5">{route.name}</Text>
                          <Text className="font-body text-[12px] text-text-tertiary">Tap to select this route</Text>
                        </View>
                        <Play size={22} color="#0AADA8" />
                      </View>
                    </Card>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </BottomSheet>
      </View>
    );
  }

  if (mode === "planning" && selectedRoute) {
    return (
      <View className="flex-1 bg-background relative">
        <CalambaMap>
          <RoutePath routeId={selectedRoute.route_id} />
        </CalambaMap>
        <PublicMapUI state={mapState} bottomOffset={320} />
        <BottomSheet 
          snapPoint={planningSnap} 
          onSnapPointChange={setPlanningSnap}
        >
          <View className="px-6 py-2">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1">
                <View className="bg-surface-3 px-2 py-1 rounded-[6px] self-start mb-2">
                  <Text className="font-mono text-[12px] text-accent font-bold uppercase">{selectedRoute.code}</Text>
                </View>
                <Text className="text-xl font-display font-bold text-text-primary">{selectedRoute.name}</Text>
              </View>
              <Pressable 
                onPress={() => setMode("idle")}
                className="p-2 bg-surface-2 rounded-full border border-border-subtle"
              >
                <X size={16} color="#6B7280" />
              </Pressable>
            </View>

            {isAiLoading ? (
              <ActivityIndicator color="#0AADA8" className="py-4" />
            ) : (
              <View>
                <Card className="bg-accent/5 border-accent/20 mb-6 p-4">
                  <View className="flex-row items-center justify-between gap-2 mb-2">
                    <View className="flex-row items-center gap-2">
                      <Sparkles size={18} color="#0AADA8" />
                      <Text className="text-lg text-accent font-medium">AI Route Advice</Text>
                    </View>
                    {aiInsight && (
                      <Pressable 
                        onPress={() => speak(aiInsight)}
                        className="p-1 rounded-full bg-accent/20"
                      >
                        <Volume2 size={16} color="#0AADA8" />
                      </Pressable>
                    )}
                  </View>
                  <Text className="text-sm text-accent font-medium italic">
                    {aiInsight || "Assessing route conditions..."}
                  </Text>
                </Card>

                <View className="flex-row gap-3">
                  <Pressable 
                    onPress={handleGetTips}
                    className="flex-1 h-12 bg-surface-2 rounded-xl items-center justify-center border border-border-default"
                  >
                    <View className="flex-row items-center gap-2">
                      <Lightbulb size={18} color="#0AADA8" />
                      <Text className="font-display font-bold text-text-secondary">AI Tips</Text>
                    </View>
                  </Pressable>
                  <Button 
                    label="Start Driving" 
                    onPress={handleStartRoute} 
                    className="flex-[2] h-12 rounded-xl"
                    loading={startRoute.isPending}
                  />
                </View>
              </View>
            )}
          </View>
        </BottomSheet>
      </View>
    );
  }

  const totalWaiting = heatmapData?.points?.reduce((acc, p) => acc + p.count, 0) || 0;

  return (
    <View className="flex-1 bg-background relative">
      <CalambaMap>
        {selectedRoute && (
          <>
            <RoutePath routeId={selectedRoute.route_id} />
            <HeatmapLayer routeId={selectedRoute.route_id} />
          </>
        )}
        <PublicMapMarkers state={mapState} />
      </CalambaMap>

      <PublicMapUI state={mapState} bottomOffset={160} />

      {/* Top Navigation Overlay */}
      {selectedRoute && (
        <View className="absolute top-12 left-3 right-3 z-30 pointer-events-box-none">
          <View className="bg-accent p-4 rounded-2xl shadow-2xl flex-row items-center pointer-events-auto border-2 border-white/20">
            <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center mr-4 border border-white/40">
              <ArrowUp size={24} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-[10px] font-bold uppercase tracking-widest opacity-80">
                ACTIVE ON ROUTE
              </Text>
              <Text className="text-white text-lg font-display font-bold" numberOfLines={1}>
                {selectedRoute.code} • {selectedRoute.name}
              </Text>
            </View>
            <Pressable 
              onPress={handleGetReroute}
              className="bg-white/20 p-2 rounded-full border border-white/40 mr-2"
            >
              <CornerUpRight size={20} color="white" />
            </Pressable>
            <View className="bg-white/20 px-3 py-1.5 rounded-full border border-white/40 flex-row items-center">
              <View className="w-1.5 h-1.5 rounded-full bg-white mr-2" />
              <Text className="text-white text-[12px] font-bold">{totalWaiting}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Heatmap Legend */}
      <View className="absolute right-6 top-32 bg-surface-2/85 border border-border-subtle p-2 rounded-[8px] items-center">
        <View className="w-4 h-24 rounded-full mb-1" style={{ backgroundColor: '#E84040' }} /> 
        <Text className="font-body text-[8px] text-text-secondary text-center">High</Text>
        <View className="w-4 h-12 rounded-full mt-1" style={{ backgroundColor: '#F5A623' }} />
        <Text className="font-body text-[8px] text-text-secondary text-center mt-1">Low</Text>
      </View>

      {/* End Route FAB */}
      <Pressable 
        className="absolute bottom-40 right-6 w-11 h-11 bg-danger-surface border border-danger rounded-[12px] items-center justify-center z-20 shadow-lg"
        onPress={() => setShowEndConfirm(true)}
      >
        <X size={24} color="#ef4444" />
      </Pressable>

      <BottomSheet 
        snapPoint={snap} 
        onSnapPointChange={setSnap}
      >
        <View className="px-6 py-2">
          {showEndConfirm ? (
            <View>
              <Text className="font-display font-bold text-[20px] text-text-primary mb-2">End your route session?</Text>
              <Text className="font-body text-[14px] text-text-secondary mb-6">Your passengers will no longer see your activity on the map.</Text>
              <Button variant="destructive" label="End route" onPress={handleEndRoute} loading={endRoute.isPending} className="mb-3" />
              <Button variant="ghost" label="Cancel" onPress={() => setShowEndConfirm(false)} />
            </View>
          ) : (
            <View>
              <View className="flex-row items-baseline justify-between mb-4">
                <Text className="font-body font-bold text-[16px] text-accent">Active Passengers</Text>
                <Text className="font-body text-[12px] text-text-secondary">Density analysis</Text>
              </View>
              <Button 
                variant="ghost" 
                label={snap === 'minimized' ? 'View high density zones' : 'Hide zones'} 
                onPress={() => setSnap(snap === 'minimized' ? 'expanded' : 'minimized')} 
              />
              
              {snap === 'expanded' && (
                <View className="mt-6 gap-y-4">
                  {heatmapData?.points?.slice(0, 3).map((p, i) => (
                    <View key={i} className="flex-row justify-between items-center border-b border-border-subtle pb-3">
                      <View>
                        <Text className="font-body font-bold text-[14px] text-text-primary">Zone {i + 1}</Text>
                        <Text className="font-body text-[12px] text-text-secondary">High waiting count</Text>
                      </View>
                      <Text className="font-display text-[24px] text-warning font-bold">{p.count}</Text>
                    </View>
                  ))}
                  {(!heatmapData?.points || heatmapData.points.length === 0) && (
                    <Text className="text-center text-text-tertiary py-4">No waiting data for this route.</Text>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      </BottomSheet>

      {/* AI OVERLAYS (Tips & Reroute) */}
      {(showTips || showReroute) && (
        <View className="absolute inset-0 z-50 bg-black/40 items-center justify-center p-6">
          <Card className="bg-surface-1 w-full max-w-md p-6 rounded-3xl shadow-2xl">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2">
                {showTips ? (
                  <Lightbulb size={24} color="#0AADA8" />
                ) : (
                  <CornerUpRight size={24} color="#000000" />
                )}
                <Text className="text-xl font-display font-bold text-text-primary">
                  {showTips ? "Jeepney Travel Tips" : "AI Reroute Recommendation"}
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
                      <View key={idx} className="flex-row mb-3 bg-surface-2 p-3 rounded-xl border border-border-subtle items-start">
                        <Sparkles size={14} color="#0AADA8" className="mr-2 mt-1" />
                        <Text className="flex-1 text-sm text-text-secondary leading-5 font-body">
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
                  </View>
                )}

                {showReroute && rerouteData && (
                  <View>
                    <View className="bg-danger/10 p-4 rounded-2xl border border-danger/20 mb-4">
                      <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-danger font-display font-bold text-sm uppercase tracking-widest">
                          Hazard Detected Ahead
                        </Text>
                        <Pressable 
                          onPress={() => speak(rerouteData.message)}
                          className="p-1 rounded-full bg-danger/20"
                        >
                          <Volume2 size={14} color="#EF4444" />
                        </Pressable>
                      </View>
                      <Text className="text-text-primary text-sm italic font-body">
                        "{rerouteData.message}"
                      </Text>
                    </View>
                    <Text className="text-[10px] font-display font-bold text-text-tertiary uppercase tracking-widest mb-3 px-1">
                      Alternative Navigation
                    </Text>
                    {rerouteData.alternativeSteps.map((step: string, idx: number) => (
                      <View key={idx} className="flex-row items-center mb-3 px-1">
                        <View className="w-6 h-6 bg-accent rounded-lg items-center justify-center mr-3">
                          <Text className="text-[10px] font-bold text-white">{idx + 1}</Text>
                        </View>
                        <Text className="flex-1 text-sm text-text-secondary font-body">{step}</Text>
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
              label="Understood"
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
    </View>
  );
}
