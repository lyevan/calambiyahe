import { Marker } from 'react-native-maps';
import { useHazards } from '../../hooks/api/use-hazards';

export function HazardMarkers({ onSelectHazard }: { onSelectHazard: (hazard: any) => void }) {
  const { data: hazards } = useHazards();

  if (!hazards) return null;

  return (
    <>
      {hazards.map((h) => {
        let color = '#5B8DEF'; // info blue
        if (h.severity === 'medium') color = '#F5A623'; // warning amber
        if (h.severity === 'severe') color = '#E84040'; // danger red

        return (
          <Marker
            key={h.report_id}
            coordinate={{ latitude: Number(h.lat), longitude: Number(h.lng) }}
            pinColor={color}
            onPress={() => onSelectHazard(h)}
          />
        );
      })}
    </>
  );
}
