import React, { useCallback, useRef, useEffect } from "react";
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
  useAdminRoutes,
  useUpdateRoute,
  useDeleteRoute,
} from "../../../hooks/api/use-routes";
import { Plus, Power, Trash2 } from "lucide-react-native";

export default function AdminRoutesTab() {
  const router = useRouter();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handlePushRoute = useCallback(
    (pathname: string) => {
      if (!isMounted.current) return;
      router.push(pathname as any);
    },
    [router],
  );

  const { data: routes, isLoading, refetch, isRefetching } = useAdminRoutes();

  const updateRoute = useUpdateRoute();
  const deleteRoute = useDeleteRoute();

  const handleToggleRouteStatus = (id: string, currentStatus: boolean) => {
    updateRoute.mutate({
      id,
      data: { is_active: !currentStatus },
    });
  };

  const handleDeleteRoute = (id: string, name: string) => {
    Alert.alert(
      "Delete Route",
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteRoute.mutate(id),
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
            Commute Routes ({routes?.length || 0})
          </Text>
          <Pressable
            onPress={() => handlePushRoute("/(admin)/routes/create")}
            className="bg-accent/10 px-4 py-2 rounded-xl flex-row items-center border border-accent/20"
          >
            <Plus size={16} color="#0AADA8" className="mr-1.5" />
            <Text className="text-accent font-bold text-xs uppercase tracking-wider">
              New Route
            </Text>
          </Pressable>
        </View>
        <View className="gap-y-4">
          {routes?.map((route) => (
            <Card
              key={route.route_id}
              className="p-0 overflow-hidden rounded-xl border border-border-subtle bg-surface-1"
            >
              <View className="flex-row min-h-[80px]">
                <Pressable
                  onPress={() =>
                    handlePushRoute(`/(admin)/routes/${route.route_id}`)
                  }
                  className="flex-1 p-4 flex-row justify-between items-center"
                >
                  <View className="flex-1 pr-4">
                    <Text className="font-display font-bold text-[17px] text-text-primary mb-1">
                      {route.name}
                    </Text>
                    <View className="flex-row items-center">
                      <View className="bg-surface-2 px-2 py-0.5 rounded mr-2">
                        <Text className="font-mono text-[10px] text-text-tertiary uppercase">
                          {route.code}
                        </Text>
                      </View>
                      <View
                        className={`px-2 py-0.5 rounded-full ${route.is_active ? "bg-success-surface" : "bg-surface-3"}`}
                      >
                        <Text
                          className={`text-[9px] font-bold uppercase tracking-tight ${route.is_active ? "text-success" : "text-text-tertiary"}`}
                        >
                          {route.is_active ? "Active" : "Inactive"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>

                <View className="flex-row items-stretch ">
                  <Pressable
                    onPress={() =>
                      handleToggleRouteStatus(route.route_id, route.is_active)
                    }
                    className="px-4 items-center justify-center"
                  >
                    <Power
                      size={20}
                      color={route.is_active ? "#1BBF74" : "#94A3B8"}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      handleDeleteRoute(route.route_id, route.name)
                    }
                    className="px-4 items-center justify-center"
                  >
                    <Trash2 size={20} color="#EF4444" />
                  </Pressable>
                </View>
              </View>
            </Card>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
