import React from "react";
import { Heatmap } from "react-native-maps";
import { useHeatmap } from "../../hooks/api/use-heatmap";

export function HeatmapLayer({ routeId }: { routeId: string }) {
  const { data } = useHeatmap(routeId);

  if (!data?.points || data.points.length === 0) return null;

  return (
    <Heatmap
      points={data.points.map((p) => ({
        latitude: p.lat,
        longitude: p.lng,
        weight: p.intensity,
      }))}
      radius={50}
      opacity={0.8}
      gradient={{
        colors: [
          "#F5A62300", // Transparent Orange (NONE)
          "#F5A623",   // Orange (LOW)
          "#E84040",   // Red (HIGH)
        ],
        startPoints: [0.01, 0.4, 1.0],
        colorMapSize: 256,
      }}
    />
  );
}
