import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker, Polyline } from 'react-native-maps';
import { useRouteDetail } from '../../hooks/api/use-routes';

interface RoutePathProps {
  routeId: string;
  showStops?: boolean;
  color?: string;
  weight?: number;
}

export function RoutePath({ 
  routeId, 
  showStops = true, 
  color = '#0AADA8', 
  weight = 5 
}: RoutePathProps) {
  const { data: route, isLoading } = useRouteDetail(routeId);

  const coordinates = useMemo(() => {
    if (!route?.polyline) return [];
    try {
      // The polyline is stored as a JSON string of [lng, lat][]
      const coords: [number, number][] = JSON.parse(route.polyline);
      return coords.map(([lng, lat]) => ({
        latitude: lat,
        longitude: lng,
      }));
    } catch (e) {
      console.error('Failed to parse route polyline:', e);
      return [];
    }
  }, [route?.polyline]);

  if (isLoading || coordinates.length === 0) return null;

  return (
    <>
      <Polyline
        coordinates={coordinates}
        strokeColor={color}
        strokeWidth={weight}
      />
      
      {showStops && route?.waypoints?.map((w) => (
        <Marker
          key={w.waypoint_id}
          coordinate={{ latitude: parseFloat(w.lat), longitude: parseFloat(w.lng) }}
          title={w.label || undefined}
        >
          <View style={[
            styles.markerBubble,
            w.is_key_stop ? styles.keyStopBubble : styles.turnBubble,
          ]}>
            <Text style={styles.markerText}>{w.sequence}</Text>
          </View>
        </Marker>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  markerBubble: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  turnBubble: {
    backgroundColor: '#0AADA8',
  },
  keyStopBubble: {
    backgroundColor: '#F59E0B',
  },
  markerText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
});
