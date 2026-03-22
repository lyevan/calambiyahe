import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Card } from "../../../components/ui/Card";
import {
  useAdminHazards,
  useUpdateHazardStatus,
  useDeleteHazard,
} from "../../../hooks/api/use-admin-hazards";
import {
  Check,
  X,
  Trash2,
  Sparkles,
  AlertCircle,
  Filter,
} from "lucide-react-native";
import { hazardsApi } from "../../../lib/api/hazards.api";
import { ENV } from "../../../lib/api/client";

export default function AdminHazardsTab() {
  const router = useRouter();
  const isMounted = useRef(true);
  const [showPendingOnly, setShowPendingOnly] = useState(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleNavigateToMap = useCallback(
    (focusType: string, focusId: string) => {
      if (!isMounted.current) return;
      router.push({
        pathname: "/(admin)/map",
        params: { focusType, focusId },
      });
    },
    [router],
  );

  const {
    data: allHazards,
    isLoading,
    refetch,
    isRefetching,
  } = useAdminHazards();

  const updateHazard = useUpdateHazardStatus();
  const deleteHazard = useDeleteHazard();

  // AI Analysis State
  const [aiResults, setAiResults] = useState<Record<string, any>>({});
  const [analyzingIds, setAnalyzingIds] = useState<Record<string, boolean>>({});

  const handleDeleteHazard = (id: string, type: string) => {
    Alert.alert(
      "Delete Hazard Report",
      `Are you sure you want to delete this "${type}" report?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteHazard.mutate(id),
        },
      ],
    );
  };

  const handleAnalyzeHazard = async (id: string, lat: string, lng: string) => {
    setAnalyzingIds((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await hazardsApi.analyze(
        "", // use reportId instead of base64
        "image/jpeg",
        { lat: Number(lat), lng: Number(lng) },
        "",
        id,
      );
      if (isMounted.current) {
        setAiResults((prev) => ({ ...prev, [id]: res }));
      }
    } catch (err) {
      console.error("Admin AI Analysis failed:", err);
      Alert.alert("Error", "Failed to analyze hazard with AI.");
    } finally {
      if (isMounted.current) {
        setAnalyzingIds((prev) => ({ ...prev, [id]: false }));
      }
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-1">
        <ActivityIndicator color="#0AADA8" size="large" />
      </View>
    );
  }

  const hazards = showPendingOnly
    ? allHazards?.filter((h) => h.status === "pending")
    : allHazards;

  return (
    <ScrollView
      className="flex-1 bg-surface-1"
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          colors={["#0AADA8"]}
          tintColor="#0AADA8"
        />
      }
    >
      <View className="p-6">
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-text-secondary font-display font-bold text-xs uppercase tracking-widest">
            {showPendingOnly ? "Pending Reports" : "All Hazard Reports"} ({hazards?.length || 0})
          </Text>
          <Pressable
            onPress={() => setShowPendingOnly(!showPendingOnly)}
            className={`flex-row items-center px-3 py-1.5 rounded-full border ${showPendingOnly ? "bg-accent/10 border-accent" : "bg-surface-2 border-border-subtle"}`}
          >
            <Filter size={12} color={showPendingOnly ? "#0AADA8" : "#64748B"} className="mr-1.5" />
            <Text className={`text-[10px] font-bold uppercase tracking-wider ${showPendingOnly ? "text-accent" : "text-text-tertiary"}`}>
              {showPendingOnly ? "Pending Only" : "Show All"}
            </Text>
          </Pressable>
        </View>
        <View className="gap-y-6">
          {hazards && hazards.length > 0 ? (
            hazards.map((hazard) => (
              <Card
                key={hazard.report_id}
                className="bg-surface-1 border-accent/20 border p-4 rounded-xl"
              >
                <View className="mb-4">
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-1 pr-4">
                      <View className="flex-row items-center mb-1">
                        <Text className="text-[10px] font-bold text-accent uppercase tracking-widest mr-2">
                          {hazard.type}
                        </Text>
                        <View
                          className={`px-2 py-0.5 rounded-full ${hazard.status === "pending" ? "bg-amber-100" : hazard.status === "confirmed" ? "bg-green-100" : "bg-red-100"}`}
                        >
                          <Text
                            className={`text-[9px] font-bold uppercase ${hazard.status === "pending" ? "text-amber-600" : hazard.status === "confirmed" ? "text-green-600" : "text-red-600"}`}
                          >
                            {hazard.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Pressable
                      onPress={() =>
                        handleDeleteHazard(hazard.report_id, hazard.type)
                      }
                      className="p-2 bg-surface-2 rounded-full border border-border-subtle"
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </Pressable>
                  </View>

                  <Pressable
                    onPress={() =>
                      handleNavigateToMap("hazard", hazard.report_id)
                    }
                  >
                    {hazard.image_url && (
                      <View className="w-full h-40 rounded-xl overflow-hidden mb-4 bg-surface-3">
                        <Image
                          source={{
                            uri: hazard.image_url.startsWith("http")
                              ? hazard.image_url
                              : `${ENV.BASE_URL}${hazard.image_url}`,
                          }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      </View>
                    )}
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <View className="flex-row items-center mt-1">
                          <View
                            className={`px-2 py-0.5 rounded-md mr-2 ${
                              hazard.severity === "severe"
                                ? "bg-danger-surface"
                                : hazard.severity === "medium"
                                  ? "bg-warning-surface"
                                  : "bg-info-surface"
                            }`}
                          >
                            <Text
                              className={`text-[10px] font-bold uppercase ${
                                hazard.severity === "severe"
                                  ? "text-danger"
                                  : hazard.severity === "medium"
                                    ? "text-warning"
                                    : "text-info"
                              }`}
                            >
                              {hazard.severity}
                            </Text>
                          </View>
                          <Text className="text-text-tertiary text-[12px] font-mono">
                            {hazard.lat ? hazard.lat.slice(0, 8) : "0"},{" "}
                            {hazard.lng ? hazard.lng.slice(0, 8) : "0"}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {hazard.description ? (
                      <Text className="font-body text-text-secondary text-sm mt-3 bg-surface-2 p-3 rounded-lg border border-border-subtle">
                        "{hazard.description}"
                      </Text>
                    ) : null}
                  </Pressable>
                </View>

                {hazard.status === "pending" && (
                  <View className="gap-y-4 border-t border-border-subtle pt-4">
                    {/* AI Analysis Row */}
                    {!aiResults[hazard.report_id] ? (
                      <Pressable
                        onPress={() =>
                          handleAnalyzeHazard(
                            hazard.report_id,
                            hazard.lat,
                            hazard.lng,
                          )
                        }
                        disabled={analyzingIds[hazard.report_id]}
                        className="bg-primary-500/10 h-10 rounded-xl flex-row items-center justify-center border border-accent"
                      >
                        <Sparkles size={16} color="#0AADA8" />
                        <Text className="text-accent font-bold ml-2 text-xs">
                          {analyzingIds[hazard.report_id]
                            ? "Analyzing..."
                            : "AI Intelligence Assist"}
                        </Text>
                      </Pressable>
                    ) : (
                      <View className="bg-primary-500/5 p-3 rounded-xl border border-primary-500/10">
                        <View className="flex-row items-center mb-1">
                          <Sparkles
                            size={14}
                            color="#0AADA8"
                            className="mr-2"
                          />
                          <Text className="font-display font-bold text-xs text-text-primary">
                            AI Suggestion
                          </Text>
                        </View>
                        <Text className="text-[11px] text-text-secondary leading-4 mb-2">
                          {aiResults[hazard.report_id].description}
                        </Text>
                        <View className="flex-row items-center gap-x-2">
                          <AlertCircle
                            size={10}
                            color="#0AADA8"
                            className="mr-1"
                          />
                          <Text className="text-[10px] font-body text-text-primary">
                            Finding: Type -{" "}
                            {aiResults[hazard.report_id].hazardType} • Severity
                            - {aiResults[hazard.report_id].severity}
                          </Text>
                        </View>
                      </View>
                    )}

                    <View className="flex-row gap-x-4">
                      <Pressable
                        onPress={() =>
                          updateHazard.mutate({
                            id: hazard.report_id,
                            status: "confirmed",
                          })
                        }
                        disabled={updateHazard.isPending}
                        className="flex-1 bg-success-surface h-12 rounded-xl flex-row items-center justify-center border border-success"
                      >
                        <Check size={20} color="#1BBF74" />
                        <Text className="text-success font-bold ml-2">
                          Confirm
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          updateHazard.mutate({
                            id: hazard.report_id,
                            status: "rejected",
                          })
                        }
                        disabled={updateHazard.isPending}
                        className="flex-1 bg-danger-surface h-12 rounded-xl flex-row items-center justify-center border border-danger"
                      >
                        <X size={20} color="#EF4444" />
                        <Text className="text-danger font-bold ml-2">
                          Reject
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </Card>
            ))
          ) : (
            <View className="items-center justify-center py-20 px-10">
              <View className="w-20 h-20 bg-surface-2 rounded-full items-center justify-center mb-4 border border-border-subtle">
                <AlertCircle size={32} color="#94A3B8" />
              </View>
              <Text className="font-display font-bold text-[18px] text-text-primary text-center mb-2">
                {showPendingOnly ? "No Pending Reports" : "No Hazards Reported"}
              </Text>
              <Text className="font-body text-[14px] text-text-tertiary text-center">
                {showPendingOnly
                  ? "Everything looks clear! No pending hazard reports to review."
                  : "Calamba roads are currently reported as safe."}
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

