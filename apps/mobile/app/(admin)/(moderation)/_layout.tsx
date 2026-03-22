import React from "react";
import { Tabs } from "expo-router";
import {
  Route,
  Warehouse,
  Signpost,
  TriangleAlert,
  User,
  Map as MapIcon,
} from "lucide-react-native";
import { View, Image, Pressable, Text } from "react-native";
import { useRouter } from "expo-router";
import {
  useAdminTerminals,
  useAdminSpots,
} from "../../../hooks/api/use-admin-terminals";
import { useAdminHazards } from "../../../hooks/api/use-admin-hazards";

export default function AdminTabsLayout() {
  const router = useRouter();

  // Fetch pending counts for badges
  const { data: terminals } = useAdminTerminals();
  const { data: spots } = useAdminSpots();
  const { data: hazards } = useAdminHazards();

  const pendingTerminals =
    terminals?.filter((t) => t.status === "pending").length || 0;
  const pendingSpots = spots?.filter((s) => s.status === "pending").length || 0;
  const pendingHazards =
    hazards?.filter((h) => h.status === "pending").length || 0;

  return (
    <View className="flex-1 bg-background">
      <Tabs
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: "#0F1117",
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: "#1F2330",
          },
          headerTitleStyle: {
            fontFamily: "Outfit_700Bold",
            fontSize: 18,
            color: "#ffffff",
          },
          headerLeft: () => (
            <View className="pl-4">
              <Image
                source={require("../../../assets/calambiyahe-logo.png")}
                className="w-10 h-10 mr-2"
                resizeMode="contain"
              />
            </View>
          ),
          tabBarStyle: {
            backgroundColor: "#0F1117",
            borderTopWidth: 1,
            borderTopColor: "#1F2330",
            height: 75,
            paddingBottom: 10,
            paddingTop: 10,
          },
          tabBarActiveTintColor: "#0AADA8",
          tabBarInactiveTintColor: "#64748b",
          tabBarLabelStyle: {
            fontFamily: "Outfit_600SemiBold",
            fontSize: 11,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Routes",
            tabBarIcon: ({ color, size }) => (
              <Route color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="terminals"
          options={{
            title: "Terminals",
            tabBarIcon: ({ color, size }) => (
              <Warehouse color={color} size={size} />
            ),
            tabBarBadge: pendingTerminals > 0 ? pendingTerminals : undefined,
            tabBarBadgeStyle: { backgroundColor: "#FF8A00" },
          }}
        />
        <Tabs.Screen
          name="spots"
          options={{
            title: "Spots",
            tabBarIcon: ({ color, size }) => (
              <Signpost color={color} size={size} />
            ),
            tabBarBadge: pendingSpots > 0 ? pendingSpots : undefined,
            tabBarBadgeStyle: { backgroundColor: "#FF8A00" },
          }}
        />
        <Tabs.Screen
          name="hazards"
          options={{
            title: "Hazards",
            tabBarIcon: ({ color, size }) => (
              <TriangleAlert color={color} size={size} />
            ),
            tabBarBadge: pendingHazards > 0 ? pendingHazards : undefined,
            tabBarBadgeStyle: { backgroundColor: "#EF4444" },
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />
      </Tabs>

      {/* Persistent Map FAB for Admins */}
      <Pressable
        onPress={() => router.push("/(admin)/map")}
        className="absolute bottom-24 right-6 bg-accent w-16 h-16 rounded-full items-center justify-center shadow-2xl elevation-8"
      >
        <MapIcon color="#FFFFFF" size={28} />
      </Pressable>
    </View>
  );
}
