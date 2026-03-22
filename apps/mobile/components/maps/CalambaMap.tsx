import React, { forwardRef } from 'react';
import MapView, { MapViewProps, PROVIDER_GOOGLE } from 'react-native-maps';
import { StyleSheet, View } from 'react-native';
import { CALAMBA_REGION } from '../../lib/calamba.bounds';
import { darkMapStyle } from './map.utils';

interface CalambaMapProps extends MapViewProps {}

export const CalambaMap = forwardRef<MapView, CalambaMapProps>(
  ({ children, style, ...props }, ref) => {
    return (
      <View className="flex-1 bg-background">
        <MapView
          ref={ref}
          provider={PROVIDER_GOOGLE}
          style={[StyleSheet.absoluteFill, style]}
          initialRegion={CALAMBA_REGION}
          minZoomLevel={13}
          maxZoomLevel={18}
          customMapStyle={darkMapStyle}
          showsUserLocation={false}
          showsMyLocationButton={false}
          {...props}
        >
          {children}
        </MapView>
      </View>
    );
  }
);
