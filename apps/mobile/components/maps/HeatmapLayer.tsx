// components/maps/HeatmapLayer.tsx
import React from "react";
import { Heatmap } from "react-native-maps";
import { useHeatmap } from "../../hooks/api/use-heatmap";

export const HeatmapLayer = ({ routeId }: { routeId: string }) => {
  const { data } = useHeatmap(routeId);
  
  if (!data?.data?.points?.length) return null;

  return (
    <Heatmap
      points={data.data.points.map((p: any) => ({
        latitude: p.lat,
        longitude: p.lng,
        weight: p.intensity,
      }))}
      radius={40}
      opacity={0.75}
      gradient={{
        colors: ["#2563eb", "#10b981", "#fbbf24", "#ef4444"],
        startPoints: [0.01, 0.25, 0.5, 0.75],
        colorMapSize: 256,
      }}
    />
  );
};
