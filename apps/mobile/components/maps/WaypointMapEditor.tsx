import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, MapPressEvent } from 'react-native-maps';
import { CalambaMap } from './CalambaMap';
import { PlaceSearchInput } from '../ui/PlaceSearchInput';
import { routingApi, RouteOption } from '../../lib/api/routing.api';
import { Trash2, Star, Route as RouteIcon, Info, MapPin } from 'lucide-react-native';

export interface Waypoint {
  _tempId: string;
  sequence: number;
  lat: number;
  lng: number;
  label?: string;
  is_key_stop: boolean;
  waypoint_id?: string;
  address?: string;
}

interface SegmentRoute {
  options: RouteOption[];
  selectedIndex: number;
}

interface WaypointMapEditorProps {
  waypoints: Waypoint[];
  onWaypointsChange: (waypoints: Waypoint[]) => void;
  onPolylineChange: (polyline: string) => void;
  initialPolyline?: string | null;
}

export function WaypointMapEditor({ 
  waypoints, 
  onWaypointsChange, 
  onPolylineChange,
  initialPolyline 
}: WaypointMapEditorProps) {
  const mapRef = useRef<MapView>(null);
  
  // State for segment-based routes: segmentRoutes[i] is the route between waypoints[i] and waypoints[i+1]
  const [segmentRoutes, setSegmentRoutes] = useState<SegmentRoute[]>([]);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [isRouting, setIsRouting] = useState(false);

  // Fetch routes for each segment when waypoints change
  useEffect(() => {
    const fetchAllSegments = async () => {
      if (waypoints.length < 2) {
        setSegmentRoutes([]);
        // Don't clear polyline if we have an initial one but no waypoints yet (e.g. loading)
        if (waypoints.length === 0 && !initialPolyline) {
           onPolylineChange('');
        }
        return;
      }

      setIsRouting(true);
      const newSegments: SegmentRoute[] = [];
      
      for (let i = 0; i < waypoints.length - 1; i++) {
        // Find existing selection if we are just adding a new point at the end
        const existing = segmentRoutes[i];
        
        // Only fetch if points changed or segment doesn't exist
        const p1 = waypoints[i];
        const p2 = waypoints[i+1];
        
        const options = await routingApi.getRouteOptions([p1, p2]);
        newSegments.push({
          options,
          selectedIndex: existing && existing.options[existing.selectedIndex] ? existing.selectedIndex : 0
        });
      }
      
      setSegmentRoutes(newSegments);
      if (activeSegmentIndex >= newSegments.length && newSegments.length > 0) {
        setActiveSegmentIndex(newSegments.length - 1);
      }
      
      // Assemble and notify parent of the full polyline
      assembleAndNotify(newSegments);
      setIsRouting(false);
    };

    fetchAllSegments();
  }, [waypoints.map(w => `${w.lat},${w.lng}`).join('|')]);

  const assembleAndNotify = (segments: SegmentRoute[]) => {
    if (segments.length === 0) return;
    
    // Concatenate all selected geometries
    const fullCoordinates: [number, number][] = [];
    segments.forEach((seg, i) => {
      const selected = seg.options[seg.selectedIndex];
      if (selected) {
        // Avoid duplicate points at segment joins
        const coords = selected.geometry.coordinates;
        if (i === 0) {
          fullCoordinates.push(...coords);
        } else {
          fullCoordinates.push(...coords.slice(1));
        }
      }
    });
    
    onPolylineChange(JSON.stringify(fullCoordinates));
  };

  const selectAlternative = (segmentIdx: number, altIdx: number) => {
    const updated = [...segmentRoutes];
    updated[segmentIdx] = { ...updated[segmentIdx], selectedIndex: altIdx };
    setSegmentRoutes(updated);
    assembleAndNotify(updated);
  };

  const handleAddStopAtEnd = (place: { name: string; lat: number; lng: number; address: string }) => {
    const newWaypoint: Waypoint = {
      _tempId: `${Date.now()}-${waypoints.length}`,
      sequence: waypoints.length + 1,
      lat: place.lat,
      lng: place.lng,
      label: place.name,
      address: place.address,
      is_key_stop: false,
    };
    
    onWaypointsChange([...waypoints, newWaypoint]);
    setActiveSegmentIndex(waypoints.length > 0 ? waypoints.length - 1 : 0);
  };

  const handleMapPress = async (e: MapPressEvent) => {
    const coords = e.nativeEvent.coordinate;
    
    // If we have an active segment, insert the point between the segment's endpoints
    // Otherwise append to the end
    const insertIdx = waypoints.length < 2 ? waypoints.length : (activeSegmentIndex + 1);
    
    const label = await routingApi.reverseGeocode(coords.latitude, coords.longitude);
    
    const newWaypoint: Waypoint = {
      _tempId: `${Date.now()}-via`,
      sequence: 0, // Will be fixed below
      lat: coords.latitude,
      lng: coords.longitude,
      label: label,
      is_key_stop: false,
    };

    const updated = [...waypoints];
    updated.splice(insertIdx, 0, newWaypoint);
    
    // Re-sequence
    const resequenced = updated.map((w, i) => ({ ...w, sequence: i + 1 }));
    onWaypointsChange(resequenced);
    
    // Auto-focus the first half of the split segment
    if (waypoints.length >= 2) {
       setActiveSegmentIndex(insertIdx - 1);
    }
  };

  const removeStop = (index: number) => {
    const updated = waypoints
      .filter((_, i) => i !== index)
      .map((w, i) => ({ ...w, sequence: i + 1 }));
    onWaypointsChange(updated);
  };

  const toggleKeyStop = (index: number) => {
    const updated = waypoints.map((w, i) => 
      i === index ? { ...w, is_key_stop: !w.is_key_stop } : w
    );
    onWaypointsChange(updated);
  };

  return (
    <View className="flex-1 bg-background">
      {/* Top Panel */}
      <View className="z-20 px-6 pt-24 pb-4 bg-surface-2 border-b border-border-subtle shadow-lg">
        <PlaceSearchInput onSelect={handleAddStopAtEnd} placeholder="Search for a stop..." />
        
        <View className="flex-row items-center justify-between mt-4 mb-2">
          <Text className="font-display font-bold text-[14px] text-text-primary">Stops & Segments</Text>
          {isRouting && <ActivityIndicator size="small" color="#0AADA8" />}
        </View>

        <ScrollView 
          className="max-h-32" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 10 }}
        >
          {waypoints.length === 0 ? (
            <View className="py-2 items-center">
              <Text className="font-body text-text-tertiary text-[11px] text-center">Add stops by searching or tapping the map to define the route path.</Text>
            </View>
          ) : (
            <View className="gap-y-1.5">
              {waypoints.map((w, index) => (
                <View key={w._tempId}>
                  <View className="flex-row items-center bg-surface-1 p-2 rounded-xl border border-border-default">
                    <View className="w-5 h-5 rounded-full bg-accent items-center justify-center mr-2">
                      <Text className="text-white font-mono text-[9px] font-bold">{w.sequence}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-body font-medium text-text-primary text-[11px]" numberOfLines={1}>{w.label}</Text>
                    </View>
                    <View className="flex-row gap-x-1.5">
                      <TouchableOpacity onPress={() => toggleKeyStop(index)} className={`p-1 rounded-lg ${w.is_key_stop ? 'bg-warning-surface' : 'bg-surface-2'}`}>
                        <Star size={10} color={w.is_key_stop ? '#F59E0B' : '#94A3B8'} fill={w.is_key_stop ? '#F59E0B' : 'transparent'} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => removeStop(index)} className="p-1 bg-error-surface rounded-lg">
                        <Trash2 size={10} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Segment connector UI */}
                  {index < waypoints.length - 1 && (
                    <TouchableOpacity 
                      onPress={() => setActiveSegmentIndex(index)}
                      className={`ml-6 py-1 px-3 border-l-2 my-1 flex-row items-center justify-between ${activeSegmentIndex === index ? 'border-accent bg-accent/5' : 'border-border-default'}`}
                    >
                      <Text className={`text-[10px] font-bold uppercase tracking-tighter ${activeSegmentIndex === index ? 'text-accent' : 'text-text-tertiary'}`}>
                        {activeSegmentIndex === index ? 'Currently Pulling Segment' : `Leg ${index + 1}`}
                      </Text>
                      {activeSegmentIndex === index && <View className="w-1.5 h-1.5 rounded-full bg-accent" />}
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Segment Alternative Switcher */}
        {segmentRoutes[activeSegmentIndex] && segmentRoutes[activeSegmentIndex].options.length > 1 && (
          <View className="mt-2 pt-3 border-t border-border-subtle">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-x-2">
                <RouteIcon size={12} color="#0AADA8" />
                <Text className="font-display font-bold text-[11px] text-text-primary uppercase tracking-wider">
                  Select Path for Leg {activeSegmentIndex + 1}
                </Text>
              </View>
              <Text className="text-[10px] text-text-tertiary font-mono">
                {waypoints[activeSegmentIndex].label?.split(' ')[0]} → {waypoints[activeSegmentIndex+1].label?.split(' ')[0]}
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-x-2">
              {segmentRoutes[activeSegmentIndex].options.map((opt, i) => (
                <TouchableOpacity 
                  key={i}
                  onPress={() => selectAlternative(activeSegmentIndex, i)}
                  className={`px-3 py-1.5 rounded-full border ${segmentRoutes[activeSegmentIndex].selectedIndex === i ? 'bg-accent/10 border-accent' : 'bg-surface-1 border-border-default'}`}
                >
                  <Text className={`font-body text-[10px] font-medium ${segmentRoutes[activeSegmentIndex].selectedIndex === i ? 'text-accent' : 'text-text-secondary'}`}>
                    Alt {i + 1} ({Math.round(opt.distance / 1000)}km)
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        
        {/* Info Tip when segment is active */}
        {waypoints.length >= 2 && (
           <View className="mt-2 flex-row items-center bg-info-surface/50 p-2 rounded-lg">
             <MapPin size={10} color="#0AADA8" className="mr-2" />
             <Text className="text-[9px] text-text-primary italic">Tip: Tap map to add a point and reroute this leg.</Text>
           </View>
        )}
      </View>

      <View className="flex-1">
        <CalambaMap 
          ref={mapRef}
          onPress={handleMapPress}
        >
          {/* Loop through segments and render their polylines */}
          {segmentRoutes.map((seg, sIdx) => {
            return (
              <React.Fragment key={`segment-${sIdx}`}>
                {/* Alternatives for ACTIVE segment (faint grey) */}
                {sIdx === activeSegmentIndex && seg.options.map((opt, i) => {
                  if (i === seg.selectedIndex) return null;
                  return (
                    <Polyline
                      key={`alt-${sIdx}-${i}`}
                      coordinates={opt.geometry.coordinates.map(c => ({
                        longitude: c[0],
                        latitude: c[1]
                      }))}
                      strokeColor="#CBD5E1"
                      strokeWidth={3}
                      lineDashPattern={[10, 10]}
                      tappable={true}
                      onPress={() => selectAlternative(sIdx, i)}
                    />
                  );
                })}

                {/* Selected path for this segment */}
                {seg.options[seg.selectedIndex] && (
                  <Polyline
                    key={`main-${sIdx}`}
                    coordinates={seg.options[seg.selectedIndex].geometry.coordinates.map(c => ({
                      longitude: c[0],
                      latitude: c[1]
                    }))}
                    strokeColor={sIdx === activeSegmentIndex ? '#0AADA8' : '#2C666E'}
                    strokeWidth={sIdx === activeSegmentIndex ? 5 : 4}
                    tappable={true}
                    onPress={() => setActiveSegmentIndex(sIdx)}
                  />
                )}
              </React.Fragment>
            );
          })}

          {/* Markers */}
          {waypoints.map((w) => (
            <Marker
              key={w._tempId}
              coordinate={{ latitude: w.lat, longitude: w.lng }}
              title={w.label}
            >
              <View style={[
                styles.markerBubble,
                w.is_key_stop ? styles.keyStopBubble : styles.turnBubble,
              ]}>
                <Text style={styles.markerText}>{w.sequence}</Text>
              </View>
            </Marker>
          ))}
        </CalambaMap>
      </View>

      {/* Floating Info */}
      {segmentRoutes.length > 0 && (
        <View className="absolute bottom-10 left-6 right-6 bg-surface-2 p-3 rounded-2xl border border-border-default shadow-xl flex-row items-center gap-x-3">
          <View className="w-10 h-10 rounded-full bg-accent/20 items-center justify-center">
            <Info size={20} color="#0AADA8" />
          </View>
          <View className="flex-1">
            <Text className="font-body text-[9px] text-text-tertiary uppercase font-bold tracking-widest">Total Route Estimates</Text>
            <View className="flex-row gap-x-3">
               <Text className="font-display font-bold text-text-primary text-[14px]">
                {Math.round(segmentRoutes.reduce((acc, s) => acc + (s.options[s.selectedIndex]?.duration || 0), 0) / 60)} min
              </Text>
              <Text className="font-display font-bold text-text-tertiary text-[14px]">•</Text>
              <Text className="font-display font-bold text-text-primary text-[14px]">
                {(segmentRoutes.reduce((acc, s) => acc + (s.options[s.selectedIndex]?.distance || 0), 0) / 1000).toFixed(1)} km
              </Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-[9px] font-bold text-accent uppercase">{waypoints.length} Stops</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  markerBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  turnBubble: {
    backgroundColor: '#0AADA8',
  },
  keyStopBubble: {
    backgroundColor: '#F59E0B',
  },
  markerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
});
