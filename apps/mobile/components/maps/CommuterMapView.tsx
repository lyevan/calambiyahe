import { useEffect, useState, useRef } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import * as Location from "expo-location";
import MapView from "react-native-maps";
import { CalambaMap } from "./CalambaMap";
import { useRouteStore } from "../../stores/route.store";
import { useBroadcastGps } from "../../hooks/api/use-gps";
import { isWithinCalamba } from "../../lib/calamba.bounds";
import { AlertBanner } from "../ui/AlertBanner";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { useRoutes } from "../../hooks/api/use-routes";
import { 
  ChevronRight, 
  X, 
  Footprints 
} from 'lucide-react-native';
import { RoutePath } from "./RoutePath";
import { SnapPoint, BottomSheet } from "../ui/BottomSheet";
import { useSharedPublicMapState, PublicMapMarkers, PublicMapUI } from "./SharedPublicMapOverlay";

interface CommuterMapViewProps {
  initialLocation?: { latitude: number; longitude: number };
}

export default function CommuterMapView({ initialLocation }: CommuterMapViewProps) {
  const selectedRoute = useRouteStore((state) => state.selectedRoute);
  const setSelectedRoute = useRouteStore((state) => state.setSelectedRoute);
  const clearSelectedRoute = useRouteStore((state) => state.clearSelectedRoute);
  const { data: routes, isLoading: routesLoading } = useRoutes();
  
  const broadcastMutation = useBroadcastGps();

  useEffect(() => {
    if (initialLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...initialLocation,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
      
      if (!selectedRoute) {
        setSelectionSnap('expanded');
      } else {
        setActiveSnap('expanded');
      }
    }
  }, [initialLocation]);

  const mapState = useSharedPublicMapState();
  
  const mapRef = useRef<MapView>(null);
  const [hasZoomed, setHasZoomed] = useState(false);
  const [errorDesc, setErrorDesc] = useState('');
  const [search, setSearch] = useState('');
  const [selectionSnap, setSelectionSnap] = useState<SnapPoint>('expanded');
  const [activeSnap, setActiveSnap] = useState<SnapPoint>('minimized');

  // ... (rest of effect remains same)
  useEffect(() => {
    setHasZoomed(false);
  }, [selectedRoute]);

  useEffect(() => {
    if (!selectedRoute) return;
    let timer: ReturnType<typeof setTimeout>;
    let mounted = true;
    const tick = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!mounted) return;
        if (!isWithinCalamba(loc.coords.latitude, loc.coords.longitude)) {
          setErrorDesc('Your location appears to be outside Calamba City.');
          return;
        }
        setErrorDesc('');
        broadcastMutation.mutate({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        if (!hasZoomed && mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          });
          setHasZoomed(true);
        }
      } catch (err: any) {
        if (err.message.includes('429')) setErrorDesc('Broadcasting too frequently. Slowing down automatically.');
      }
    };
    tick();
    timer = setInterval(tick, 10_000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [selectedRoute, hasZoomed]); // Added hasZoomed for safety

  // ... (rest remains same)
  if (!selectedRoute) {
    const filteredRoutes = routes?.filter(r => 
      r.is_active && (r.name.toLowerCase().includes(search.toLowerCase()) || r.code.toLowerCase().includes(search.toLowerCase()))
    ) || [];

    return (
      <View className="flex-1 bg-background relative">
        <CalambaMap />
        <BottomSheet 
          snapPoint={selectionSnap} 
          onSnapPointChange={setSelectionSnap}
        >
          <View className="px-6 py-2">
            <Text className="font-display font-bold text-[20px] text-text-primary mb-1">Select your route</Text>
            <Text className="font-body text-[14px] text-text-secondary mb-4">Your GPS signal will be tagged to this route.</Text>
            
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
                  <Pressable key={route.route_id} onPress={() => setSelectedRoute({ route_id: route.route_id, name: route.name, code: route.code })}>
                    <Card className="min-h-[100px] justify-center py-5 px-6">
                      <View className="flex-row items-center">
                        <View className="bg-surface-3 px-3 py-1.5 rounded-[8px] mr-4 border border-border-subtle">
                          <Text className="font-mono text-[14px] text-accent font-bold uppercase tracking-tighter">{route.code}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="font-display font-bold text-[18px] text-text-primary mb-0.5">{route.name}</Text>
                          <Text className="font-body text-[12px] text-text-tertiary">Tap to select this route</Text>
                        </View>
                        <ChevronRight size={22} color="#0AADA8" />
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

  return (
    <View className="flex-1 bg-background relative">
      <CalambaMap ref={mapRef} showsUserLocation={true} showsMyLocationButton={true}>
        <RoutePath routeId={selectedRoute.route_id} />
        <PublicMapMarkers state={mapState} filterByRouteId={selectedRoute.route_id} />
      </CalambaMap>

      <PublicMapUI state={mapState} bottomOffset={160} />

      {/* Top Floating Badge */}
      <View className="absolute top-12 left-6 right-6 flex-row justify-between items-start z-10 pointer-events-box-none">
        <View className="bg-surface-3 px-3 py-1.5 rounded-[6px] border border-border-subtle shadow-lg flex-row items-center">
          <View className="w-2 h-2 rounded-full bg-accent mr-2 animate-pulse" />
          <Text className="font-mono text-[12px] text-accent font-bold uppercase">{selectedRoute.code} Live</Text>
        </View>
        <Pressable 
          className="bg-surface-2 w-10 h-10 rounded-[10px] border border-border-subtle items-center justify-center shadow-md shadow-danger/20"
          onPress={() => clearSelectedRoute()}
        >
          <X size={20} color="#ef4444" />
        </Pressable>
      </View>

      {errorDesc ? (
        <View className="absolute top-24 left-6 right-6 z-20">
          <AlertBanner type="danger" title={errorDesc} onDismiss={() => setErrorDesc('')} />
        </View>
      ) : null}

      <BottomSheet 
        snapPoint={activeSnap} 
        onSnapPointChange={setActiveSnap}
      >
        <View className="px-6 py-2">
          <View className="flex-row items-center justify-between mb-2 mt-2">
            <View className="flex-1 mr-4">
              <Text className="font-display font-bold text-[18px] text-text-primary">
                Broadcasting to {selectedRoute.name}
              </Text>
              <Text className="font-body text-[12px] text-text-secondary">
                Wait at blue pins for the best experience.
              </Text>
            </View>
            <Button 
              variant="destructive" 
              label="Stop" 
              className="px-6 h-10"
              onPress={() => clearSelectedRoute()} 
            />
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}
