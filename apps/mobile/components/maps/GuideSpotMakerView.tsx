import { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { CalambaMap } from './CalambaMap';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AlertBanner } from '../ui/AlertBanner';
import { apiClient } from '../../lib/api/client';
import { MapLocationSelector } from './MapLocationSelector';
import { Map, Info, X } from 'lucide-react-native';
import { RoutePath } from './RoutePath';
import { useRoutes } from '../../hooks/api/use-routes';
import { useTerminals, useSpots } from '../../hooks/api/use-terminals';
import { Marker } from 'react-native-maps';

interface GuideSpotMakerViewProps {
  initialLocation?: { latitude: number; longitude: number };
}

export default function GuideSpotMakerView({ initialLocation }: GuideSpotMakerViewProps) {
  const mapRef = useRef<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'terminal' | 'spot'>('spot');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data: routes, isLoading: routesLoading } = useRoutes();
  const { data: terminals, isLoading: terminalsLoading } = useTerminals();
  const { data: spots, isLoading: spotsLoading } = useSpots();

  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [selectedTerminalId, setSelectedTerminalId] = useState('');

  useEffect(() => {
    if (initialLocation && !selectedLocation) { // Only if not currently picking a new spot
      // This is tricky because GuideSpotMakerView uses MapLocationSelector when !isSheetVisible
      // We might need to pass the initial location to MapLocationSelector too
    }
  }, [initialLocation]);

  const handleLocationConfirmed = (location: { lat: number; lng: number }) => {
    setSelectedLocation(location);
    setIsSheetVisible(true);
    setSuccess('');
    setError('');
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Please provide a name.');
      return;
    }
    if (!selectedLocation) return;
    
    if (type === 'spot') {
      if (!selectedTerminalId) {
        setError('Please select a terminal.');
        return;
      }
      if (!selectedRouteId) {
        setError('Please select a route.');
        return;
      }
    }
    
    setLoading(true);
    setError('');
    
    try {
      if (type === 'terminal') {
        await apiClient.post('/terminals', {
          name,
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
          address: name,
        });
      } else {
        await apiClient.post(`/terminals/${selectedTerminalId}/spots`, {
          label: name,
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
          route_id: selectedRouteId
        });
      }
      
      setSuccess(`${type === 'terminal' ? 'Terminal' : 'Waiting spot'} added successfully!`);
      setName('');
      setTimeout(() => setIsSheetVisible(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to add location.');
    } finally {
      setLoading(false);
    }
  };

  const existingMarkers = (
    <>
      {terminals?.filter(t => t.status === 'confirmed').map(t => (
        <Marker 
          key={`term-${t.terminal_id}`}
          coordinate={{ latitude: Number(t.lat), longitude: Number(t.lng) }}
          pinColor="#0AADA8"
          title={t.name}
        />
      ))}
      {spots?.filter(s => s.status === 'confirmed').map(s => (
        <Marker 
          key={`spot-${s.spot_id}`}
          coordinate={{ latitude: Number(s.lat), longitude: Number(s.lng) }}
          pinColor="#3B82F6"
          title={s.label}
        />
      ))}
    </>
  );

  return (
    <View className="flex-1 bg-surface-1">
      <View className="absolute top-12 left-6 z-10">
        <View className="bg-surface-3 px-3 py-1.5 rounded-[6px] border border-border-subtle shadow-lg flex-row items-center">
          <Map size={16} color="#D946EF" />
          <Text className="font-mono text-[12px] text-accent font-bold uppercase ml-1">Spot Maker</Text>
        </View>
      </View>

      {!isSheetVisible ? (
        <MapLocationSelector 
          onSelectCallback={handleLocationConfirmed} 
          initialLocation={initialLocation ? { lat: initialLocation.latitude, lng: initialLocation.longitude } : undefined}
        >
          {existingMarkers}
        </MapLocationSelector>
      ) : (
        <CalambaMap 
          initialRegion={{
            latitude: selectedLocation!.lat,
            longitude: selectedLocation!.lng,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005
          }}
          pitchEnabled={false}
          scrollEnabled={false}
          zoomEnabled={false}
        >
          {existingMarkers}
          {selectedRouteId && <RoutePath routeId={selectedRouteId} />}
          <Marker 
            coordinate={{ latitude: selectedLocation!.lat, longitude: selectedLocation!.lng }}
            pinColor="#D946EF"
            title="Your New Stop"
          />
        </CalambaMap>
      )}

      {isSheetVisible && (
        <BottomSheet snapPoint="expanded">
          <View className="flex-row items-center justify-between mb-2 px-4 pt-2">
            <Text className="text-xl font-bold text-text-primary">Add Location</Text>
            <Pressable onPress={() => {
              setIsSheetVisible(false);
              setSelectedLocation(null);
            }} className="p-2">
              <X size={24} color="#a1a1aa" />
            </Pressable>
          </View>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 16 }}>
              {error ? <AlertBanner type="danger" title={error} onDismiss={() => setError('')} /> : null}
              {success ? <AlertBanner type="success" title={success} onDismiss={() => setSuccess('')} /> : null}

              <View className="flex-row gap-4 mb-6 mt-4">
                <Pressable 
                  onPress={() => setType('spot')}
                  className={`flex-1 p-3 rounded-lg border ${type === 'spot' ? 'border-accent bg-accent/10' : 'border-border-default bg-surface-2'}`}
                >
                  <Text className={`text-center font-medium ${type === 'spot' ? 'text-accent' : 'text-text-secondary'}`}>Waiting Spot</Text>
                </Pressable>
                
                <Pressable 
                  onPress={() => setType('terminal')}
                  className={`flex-1 p-3 rounded-lg border ${type === 'terminal' ? 'border-accent bg-accent/10' : 'border-border-default bg-surface-2'}`}
                >
                  <Text className={`text-center font-medium ${type === 'terminal' ? 'text-accent' : 'text-text-secondary'}`}>Terminal</Text>
                </Pressable>
              </View>

              <Input 
                label="Location Name"
                placeholder="e.g. Crossing Terminal or Parian Waiting Area"
                value={name}
                onChangeText={setName}
              />

              {type === 'spot' && (
                <View className="mt-6">
                  <Text className="text-text-secondary font-display font-bold text-xs uppercase tracking-widest mb-3">
                    Select Terminal
                  </Text>
                  {terminalsLoading ? (
                    <ActivityIndicator color="#0AADA8" className="self-start mb-4" />
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-4">
                      {terminals?.map((t) => (
                        <Pressable
                          key={t.terminal_id}
                          onPress={() => setSelectedTerminalId(t.terminal_id)}
                          className={`px-4 py-2 mr-3 rounded-full border ${selectedTerminalId === t.terminal_id ? "border-accent bg-accent/10" : "border-border-default bg-surface-1"}`}
                        >
                          <Text className={`font-body font-medium ${selectedTerminalId === t.terminal_id ? "text-accent" : "text-text-secondary"}`}>
                            {t.name}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  )}

                  <Text className="text-text-secondary font-display font-bold text-xs uppercase tracking-widest mb-3 mt-2">
                    Select Route
                  </Text>
                  {routesLoading ? (
                    <ActivityIndicator color="#0AADA8" className="self-start" />
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                      {routes?.filter(r => r.is_active).map((r) => (
                        <Pressable
                          key={r.route_id}
                          onPress={() => setSelectedRouteId(r.route_id)}
                          className={`px-4 py-2 mr-3 rounded-full border ${selectedRouteId === r.route_id ? "border-accent bg-accent/10" : "border-border-default bg-surface-1"}`}
                        >
                          <Text className={`font-body font-medium ${selectedRouteId === r.route_id ? "text-accent" : "text-text-secondary"}`}>
                            {r.code} - {r.name}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  )}
                </View>
              )}

              <View className="mt-8">
                <Button 
                  label={`Save ${type === 'spot' ? 'Spot' : 'Terminal'}`}
                  onPress={handleSubmit}
                  loading={loading}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </BottomSheet>
      )}
    </View>
  );
}
