import { View, Text, ActivityIndicator, Pressable, RefreshControl } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRoleStore } from "../../stores/role.store";
import CommuterMapView from "../../components/maps/CommuterMapView";
import DriverHeatmapView from "../../components/maps/DriverHeatmapView";
import PrivateDriverHazardView from "../../components/maps/PrivateDriverHazardView";
import GuideSpotMakerView from "../../components/maps/GuideSpotMakerView";

export default function DynamicMapScreen() {
  const activeRole = useRoleStore((state) => state.activeRole);
  const params = useLocalSearchParams<{ lat?: string; lng?: string }>();

  const initialLocation = params.lat && params.lng 
    ? { latitude: parseFloat(params.lat), longitude: parseFloat(params.lng) }
    : undefined;

  const renderMapView = () => {
    switch (activeRole) {
      case "commuter":
        return <CommuterMapView initialLocation={initialLocation} />;
      case "driver":
        return <DriverHeatmapView initialLocation={initialLocation} />;
      case "private_driver":
        return <PrivateDriverHazardView initialLocation={initialLocation} />;
      case "guide":
        return <GuideSpotMakerView initialLocation={initialLocation} />;
      case "citizen":
        return <PrivateDriverHazardView initialLocation={initialLocation} />; // Default to general hazard view for citizen
      default:
        return (
          <View className="flex-1 items-center justify-center bg-background">
            <ActivityIndicator color="#0AADA8" />
            <Text className="mt-4 text-text-secondary font-body">
              Initializing Map...
            </Text>
          </View>
        );
    }
  };

  return <View className="flex-1">{renderMapView()}</View>;
}
