// components/maps/CalambaMap.tsx
import React from "react";
import MapView, { PROVIDER_GOOGLE, MapViewProps } from "react-native-maps";
import { CALAMBA_REGION } from "../../lib/calamba.bounds";

interface CalambaMapProps extends MapViewProps {
  children?: React.ReactNode;
}

export const CalambaMap: React.FC<CalambaMapProps> = ({ children, ...props }) => (
  <MapView
    provider={PROVIDER_GOOGLE}
    initialRegion={CALAMBA_REGION}
    minZoomLevel={13}
    maxZoomLevel={18}
    style={{ flex: 1 }}
    {...props}
  >
    {children}
  </MapView>
);
