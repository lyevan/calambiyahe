import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { CalambaMap } from "./CalambaMap";
import { MapPin } from "lucide-react-native";
import { Button } from "../ui/Button";

interface MapLocationSelectorProps {
  onSelectCallback: (location: { lat: number; lng: number }) => void;
  onCancel?: () => void;
  initialLocation?: { lat: number; lng: number } | null;
  children?: React.ReactNode;
}

export function MapLocationSelector({
  onSelectCallback,
  onCancel,
  initialLocation,
  children,
}: MapLocationSelectorProps) {
  const [region, setRegion] = useState<{
    latitude: number;
    longitude: number;
  } | null>(
    initialLocation
      ? { latitude: initialLocation.lat, longitude: initialLocation.lng }
      : null,
  );

  const handleRegionChangeComplete = (newRegion: {
    latitude: number;
    longitude: number;
  }) => {
    setRegion({ latitude: newRegion.latitude, longitude: newRegion.longitude });
  };

  const handConfirm = () => {
    if (region) {
      onSelectCallback({ lat: region.latitude, lng: region.longitude });
    }
  };

  return (
    <View className="flex-1 w-full bg-background relative">
      <CalambaMap
        onRegionChangeComplete={handleRegionChangeComplete}
        {...(initialLocation
          ? {
              initialRegion: {
                latitude: initialLocation.lat,
                longitude: initialLocation.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              },
            }
          : {})}
      >
        {children}
      </CalambaMap>

      {/* Fixed Center Pin */}
      <View style={styles.centerPinContainer} pointerEvents="none">
        <View className="w-20 h-20 flex justify-center items-center">
          <MapPin
            size={30}
            color="#0AADA8"
            fill="#0AADA8"
            style={styles.pinIcon}
          />
        </View>
      </View>

      {/* Overlay Actions */}
      <View className="absolute bottom-10 left-6 right-6 gap-y-3">
        <View className="bg-surface-1 px-4 py-3 rounded-xl shadow-lg border border-border-default mb-2">
          <Text className="font-body text-text-primary text-center">
            Drag the map to place the pin
          </Text>
        </View>
        <Button
          label="Confirm Location"
          onPress={handConfirm}
          disabled={!region}
        />
        {onCancel && (
          <Button label="Cancel" variant="ghost" onPress={onCancel} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerPinContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",

    backgroundColor: "transparent",
  },
  pinIcon: {
    // Offset by half the height so the bottom tip is exactly at center
    transform: [{ translateY: 0 }],
    borderWidth: 1,
    borderColor: "#0AADA8",
  },
});
