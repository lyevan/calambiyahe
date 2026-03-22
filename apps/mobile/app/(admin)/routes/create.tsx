import { useState } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import {
  WaypointMapEditor,
  Waypoint,
} from "../../../components/maps/WaypointMapEditor";
import {
  useCreateRoute,
  useBulkUpdateWaypoints,
  useDeleteRoute,
} from "../../../hooks/api/use-routes";

export default function AdminRouteCreateScreen() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [polyline, setPolyline] = useState<string>("");

  const createRoute = useCreateRoute();
  const deleteRoute = useDeleteRoute();
  const [pendingRouteId, setPendingRouteId] = useState<string | null>(null);
  const bulkUpdate = useBulkUpdateWaypoints();

  const isSaving = createRoute.isPending || bulkUpdate.isPending;

  const handleSave = async () => {
    if (!name || !code || waypoints.length < 2) {
      Alert.alert(
        "Incomplete",
        "Please provide a name, code, and at least 2 stops.",
      );
      return;
    }

    try {
      // Step 1: Create Route meta + Polyline
      const route = await createRoute.mutateAsync({ name, code, polyline });

      try {
        // Step 2: Save stops
        await bulkUpdate.mutateAsync({
          routeId: route.route_id,
          waypoints: waypoints.map((w) => ({
            sequence: w.sequence,
            lat: w.lat,
            lng: w.lng,
            label: w.label,
            is_key_stop: w.is_key_stop,
          })),
        });
      } catch (bulkErr) {
        // Compensating rollback
        await deleteRoute.mutateAsync(route.route_id).catch(e => console.error("Rollback failed", e));
        throw bulkErr;
      }

      setPendingRouteId(route.route_id);
      router.back();
    } catch (err: any) {
      Alert.alert("Save failed", err.message ?? "Something went wrong.");
    }
  };

  return (
    <View className="flex-1 relative">
      <WaypointMapEditor
        waypoints={waypoints}
        onWaypointsChange={setWaypoints}
        onPolylineChange={setPolyline}
      />

      <View className="absolute h-full flex-col justify-between py-10 top-0 bottom-0 left-6 right-6 z-30 gap-y-4 pointer-events-box-none">
        <View className="flex-row justify-between items-center pointer-events-auto">
          <Pressable
            onPress={() => router.back()}
            className="bg-surface-2 w-10 h-10 rounded-full items-center justify-center border border-border-default shadow-xl"
          >
            <Text className="text-text-primary text-[20px]">‹</Text>
          </Pressable>
          <Text className="font-display font-bold text-[20px] text-text-primary bg-surface-2/80 px-4 py-1.5 rounded-full">
            New Route
          </Text>
          <Button
            label={isSaving ? "Saving…" : "Save"}
            className="h-10 px-5 shadow-xl"
            disabled={!name || !code || waypoints.length < 2 || isSaving}
            onPress={handleSave}
          />
        </View>

        <View className="bg-surface-2 p-4 rounded-2xl shadow-xl pointer-events-auto">
          <View className="flex-row gap-x-4">
            <View className="flex-[0.35]">
              <Input
                placeholder="Code"
                value={code}
                onChangeText={setCode}
                className="h-10 text-[12px]"
              />
            </View>
            <View className="flex-[0.65]">
              <Input
                placeholder="Route Name"
                value={name}
                onChangeText={setName}
                className="h-10 text-[12px]"
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
