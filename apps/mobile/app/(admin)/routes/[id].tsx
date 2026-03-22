import { useState, useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import {
  WaypointMapEditor,
  Waypoint,
} from "../../../components/maps/WaypointMapEditor";
import {
  useRouteDetail,
  useUpdateRoute,
  useBulkUpdateWaypoints,
} from "../../../hooks/api/use-routes";

export default function AdminRouteEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: route, isLoading } = useRouteDetail(id);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [polyline, setPolyline] = useState<string>("");

  const updateRoute = useUpdateRoute();
  const bulkUpdate = useBulkUpdateWaypoints();

  const isSaving = updateRoute.isPending || bulkUpdate.isPending;

  useEffect(() => {
    if (route) {
      setName(route.name);
      setCode(route.code);
      setPolyline(route.polyline || "");
      if (route.waypoints) {
        setWaypoints(
          route.waypoints.map((w) => ({
            _tempId: w.waypoint_id,
            waypoint_id: w.waypoint_id,
            sequence: w.sequence,
            lat: parseFloat(w.lat),
            lng: parseFloat(w.lng),
            label: w.label ?? undefined,
            is_key_stop: w.is_key_stop,
          })),
        );
      }
    }
  }, [route]);

  const handleUpdate = async () => {
    try {
      // Step 1: Update metadata + Polyline
      await updateRoute.mutateAsync({ 
        id, 
        data: { name, polyline } 
      });

      // Step 2: Update stops
      await bulkUpdate.mutateAsync({
        routeId: id,
        waypoints: waypoints.map((w) => ({
          sequence: w.sequence,
          lat: w.lat,
          lng: w.lng,
          label: w.label,
          is_key_stop: w.is_key_stop,
        })),
      });

      router.back();
    } catch (err: any) {
      Alert.alert("Update failed", err.message ?? "Something went wrong.");
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#0AADA8" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background relative">
      <WaypointMapEditor
        waypoints={waypoints}
        onWaypointsChange={setWaypoints}
        onPolylineChange={setPolyline}
        initialPolyline={route?.polyline}
      />

      <View className="absolute h-full flex-col justify-between py-10 top-0 bottom-0 left-6 right-6 z-30 gap-y-4 pointer-events-box-none">
        <View className="flex-row justify-between items-center pointer-events-auto">
          <Pressable
            onPress={() => router.back()}
            className="bg-surface-2 w-10 h-10 rounded-full items-center justify-center border border-border-default shadow-xl"
          >
            <Text className="text-text-primary text-[20px]">‹</Text>
          </Pressable>
          <Text className="font-display font-bold text-[20px] text-text-primary bg-surface-2/80 px-4 py-1.5 rounded-full border border-border-subtle">
            Edit {route?.code}
          </Text>
          <Button
            label={isSaving ? "Saving…" : "Update"}
            className="h-10 px-5 shadow-xl"
            disabled={!name || isSaving}
            onPress={handleUpdate}
          />
        </View>

        <View className="bg-surface-2 border border-border-default p-4 rounded-2xl shadow-xl pointer-events-auto">
          <View className="flex-row gap-x-4">
            <View className="flex-[0.4]">
              <Input
                placeholder="Code"
                value={code}
                onChangeText={setCode}
                className="h-10 text-[12px]"
                editable={false}
              />
            </View>
            <View className="flex-[0.6]">
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
