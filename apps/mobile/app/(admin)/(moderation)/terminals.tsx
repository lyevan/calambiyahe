import React, { useCallback, useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Card } from "../../../components/ui/Card";
import {
  useAdminTerminals,
  useUpdateTerminalStatus,
  useDeleteTerminal,
} from "../../../hooks/api/use-admin-terminals";
import { Check, X, Trash2, Filter } from "lucide-react-native";

export default function AdminTerminalsTab() {
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
    data: allTerminals,
    isLoading,
    refetch,
    isRefetching,
  } = useAdminTerminals();

  const updateTerminal = useUpdateTerminalStatus();
  const deleteTerminal = useDeleteTerminal();

  const handleDeleteTerminal = (id: string, name: string) => {
    Alert.alert(
      "Delete Terminal",
      `Are you sure you want to delete "${name}"? This will also remove associated waiting spots.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteTerminal.mutate(id),
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-1">
        <ActivityIndicator color="#0AADA8" size="large" />
      </View>
    );
  }

  const terminals = showPendingOnly
    ? allTerminals?.filter((t) => t.status === "pending")
    : allTerminals;

  const pendingCount = allTerminals?.filter((t) => t.status === "pending").length || 0;

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
            {showPendingOnly ? "Pending Terminals" : "All Terminals"} ({terminals?.length || 0})
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
        <View className="gap-y-4">
          {terminals && terminals.length > 0 ? (
            terminals.map((terminal) => (
              <Card key={terminal.terminal_id} className="p-0 overflow-hidden">
                <View className="flex-row items-center">
                  <Pressable
                    className="flex-1 p-4 pr-0"
                    onPress={() =>
                      handleNavigateToMap("terminal", terminal.terminal_id)
                    }
                  >
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="font-body font-bold text-[16px] text-text-primary flex-1 mr-2">
                        {terminal.name}
                      </Text>
                      <View
                        className={`px-2 py-0.5 rounded-full ${terminal.status === "pending" ? "bg-amber-100" : terminal.status === "confirmed" ? "bg-green-100" : "bg-red-100"}`}
                      >
                        <Text
                          className={`text-[9px] font-bold uppercase ${terminal.status === "pending" ? "text-amber-600" : terminal.status === "confirmed" ? "text-green-600" : "text-red-600"}`}
                        >
                          {terminal.status}
                        </Text>
                      </View>
                    </View>
                    <Text className="font-body text-[12px] text-text-secondary">
                      {terminal.address}
                    </Text>
                  </Pressable>

                  <View className="flex-row items-center px-2">
                    {terminal.status === "pending" && (
                      <View className="flex-row gap-x-2 mr-2">
                        <Pressable
                          onPress={() =>
                            updateTerminal.mutate({
                              id: terminal.terminal_id,
                              status: "confirmed",
                            })
                          }
                          className="w-8 h-8 bg-success-surface rounded-full items-center justify-center border border-success"
                        >
                          <Check size={16} color="#1BBF74" />
                        </Pressable>
                        <Pressable
                          onPress={() =>
                            updateTerminal.mutate({
                              id: terminal.terminal_id,
                              status: "rejected",
                            })
                          }
                          className="w-8 h-8 bg-danger-surface rounded-full items-center justify-center border border-danger"
                        >
                          <X size={16} color="#EF4444" />
                        </Pressable>
                      </View>
                    )}
                    <Pressable
                      onPress={() =>
                        handleDeleteTerminal(
                          terminal.terminal_id,
                          terminal.name,
                        )
                      }
                      className="p-3"
                    >
                      <Trash2 size={18} color="#EF4444" />
                    </Pressable>
                  </View>
                </View>
              </Card>
            ))
          ) : (
            <View className="items-center justify-center py-20 px-10">
              <View className="w-20 h-20 bg-surface-2 rounded-full items-center justify-center mb-4 border border-border-subtle">
                <Filter size={32} color="#94A3B8" />
              </View>
              <Text className="font-display font-bold text-[18px] text-text-primary text-center mb-2">
                {showPendingOnly ? "No Pending Terminals" : "No Terminals Found"}
              </Text>
              <Text className="font-body text-[14px] text-text-tertiary text-center">
                {showPendingOnly
                  ? "Good job! All terminal submissions have been reviewed."
                  : "Try checking your connection or refresh to try again."}
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

