import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import {
  Bus,
  Footprints,
  Car,
  Shield,
  Map as MapIcon,
  MapPin,
  Compass,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Play,
  CheckCircle,
  PlusCircle,
  UserCircle as UserCircleIcon,
  LucideIcon,
} from "lucide-react-native";
import { useAuthStore } from "../../stores/auth.store";
import { useRoleStore, Role } from "../../stores/role.store";
import { Card } from "../../components/ui/Card";
import { apiClient } from "../../lib/api/client";
import { useHazards } from "../../hooks/api/use-hazards";
import { router } from "expo-router";

const ROLE_OPTIONS: Array<{ label: string; value: Role; icon: LucideIcon; description: string }> = [
  { 
    label: "Commuter", 
    value: "commuter", 
    icon: Footprints,
    description: "Plan your trip and share your waiting area for faster pickups."
  },
  { 
    label: "Jeepney Driver", 
    value: "driver", 
    icon: Bus,
    description: "View passenger deinsity and optimize your route in real-time."
  },
  { 
    label: "Private Driver", 
    value: "private_driver", 
    icon: Car,
    description: "Get real-time hazard alerts and AI-powered rerouting suggestions."
  },
  { 
    label: "Concerned Citizen", 
    value: "citizen", 
    icon: Shield,
    description: "Report road hazards and help keep your community safe."
  },
  { 
    label: "Local Guide", 
    value: "guide", 
    icon: MapIcon,
    description: "Improve city mapping by reporting terminals and waypoints."
  },
];

export default function DashboardScreen() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const updateToken = useAuthStore((state) => state.updateToken);
  const activeRole = useRoleStore((state) => state.activeRole);
  const setActiveRole = useRoleStore((state) => state.setActiveRole);

  const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh for now, or add real API calls later
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleRoleChange = async (newRole: Role) => {
    if (newRole === activeRole) {
      setIsRoleModalVisible(false);
      return;
    }

    setIsUpdatingRole(true);
    try {
      const response = await apiClient.patch("/users/me/role", {
        role: newRole,
      });

      // Safely check for data
      const payload = response.data;
      if (!payload) {
        throw new Error("Invalid response format from server");
      }

      const { user: updatedUser, token: newToken } = payload;

      if (updatedUser) await updateUser(updatedUser);
      if (newToken) await updateToken(newToken);

      setActiveRole(newRole);
      setIsRoleModalVisible(false);
    } catch (error: any) {
      console.error("Failed to update role:", error);
      // Maybe show an alert to user
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const getRoleLabel = (roleValue: Role | null) => {
    return ROLE_OPTIONS.find((r) => r.value === roleValue)?.label || roleValue;
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={["#0AADA8"]}
          tintColor="#0AADA8"
        />
      }
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-14 pb-4 bg-surface-2 border-b border-border-subtle">
        <View className="flex-row items-center">
          <Image 
            source={require("../../assets/calambiyahe-logo.png")}
            style={{ width: 40, height: 40, marginRight: 12 }}
            resizeMode="contain"
          />
          <Text className="text-2xl font-display font-extrabold text-text-primary">
            CALAMBI<Text className="text-accent">YAHE</Text>
          </Text>
        </View>
        <Pressable onPress={() => router.push("/(tabs)/profile")}>
          <View className="w-10 h-10 rounded-full bg-surface-1 border border-border-default overflow-hidden ring-2 ring-accent/20">
            <Image
              source={{
                uri: `https://ui-avatars.com/api/?name=${user?.username || "User"}&background=2C666E&color=fff`,
              }}
              className="w-full h-full"
            />
          </View>
        </Pressable>
      </View>

      {/* Role Selector Trigger */}
      <View className="px-6 flex-row items-center justify-between mt-2">
        <Text className="font-body text-text-secondary">Mode:</Text>
        <Pressable
          onPress={() => setIsRoleModalVisible(true)}
          className="flex-row items-center bg-surface-1 px-4 py-2 rounded-full border border-border-default shadow-sm"
        >
          {(() => {
            const IconComp =
              ROLE_OPTIONS.find((r) => r.value === activeRole)?.icon ||
              UserCircleIcon;
            return <IconComp size={18} color="#2C666E" />;
          })()}
          <Text className="font-body font-semibold text-text-primary mx-2">
            {getRoleLabel(activeRole)}
          </Text>
          <ChevronDown size={16} color="#a1a1aa" />
        </Pressable>
      </View>

      {/* Welcome Section */}
      <View className="px-6 mt-8">
        <Text className="text-3xl font-display font-bold text-text-primary">
          Hello, {user?.username || "Traveler"} 👋
        </Text>
        <Text className="font-body text-text-secondary mt-2 leading-5">
          {activeRole === 'commuter' && "Plan your trip and see real-time jeepney locations."}
          {activeRole === 'driver' && "Maximize your earnings with passenger density maps."}
          {activeRole === 'guide' && "As a Local Guide, you help improve our map by reporting terminals and waypoints."}
          {activeRole === 'private_driver' && "Drive safer with real-time hazard alerts and AI routing."}
          {activeRole === 'citizen' && "Help your community by reporting road hazards and issues."}
        </Text>
      </View>

      {/* Dynamic Action Cards based on Role */}
      <View className="px-6 mt-8 gap-y-4">
        {activeRole === "commuter" && (
          <>
            <Pressable onPress={() => router.push("/(tabs)/map")}>
              <Card className="flex-row items-center justify-between p-4 bg-surface-1 border border-border-subtle">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-xl bg-accent/10 items-center justify-center mr-4">
                    <MapPin size={24} color="#0AADA8" />
                  </View>
                  <View>
                    <Text className="font-display font-bold text-lg text-text-primary">
                      Send Signal
                    </Text>
                    <Text className="font-body text-sm text-text-secondary">
                      Share your waiting area quickly
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#a1a1aa" />
              </Card>
            </Pressable>

            <Pressable onPress={() => router.push("/(tabs)/map")}>
              <Card className="flex-row items-center justify-between p-4 bg-surface-1">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-xl bg-accent-500/10 items-center justify-center mr-4">
                    <Compass size={24} color="#FFBF3F" />
                  </View>
                  <View>
                    <Text className="font-display font-bold text-lg text-text-primary">
                      Find Routes
                    </Text>
                    <Text className="font-body text-sm text-text-secondary">
                      Plan your trip with jeepney stops
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#a1a1aa" />
              </Card>
            </Pressable>
          </>
        )}

        {activeRole === "driver" && (
          <>
            <Pressable onPress={() => router.push("/(tabs)/map")}>
              <Card className="flex-row items-center justify-between p-4 bg-surface-1 border border-accent/20">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-xl bg-accent/10 items-center justify-center mr-4">
                    <Play size={24} color="#0AADA8" />
                  </View>
                  <View>
                    <Text className="font-display font-bold text-lg text-text-primary">
                      Pumasada Na
                    </Text>
                    <Text className="font-body text-sm text-text-secondary">
                      Monitor passenger heatmap
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#0AADA8" />
              </Card>
            </Pressable>
          </>
        )}

        {activeRole === "guide" && (
          <>
            <Pressable onPress={() => router.push("/(tabs)/map")}>
              <Card className="flex-row items-center justify-between p-6 bg-surface-1 border border-accent/20">
                <View className="flex-row items-center">
                  <View className="w-14 h-14 rounded-2xl bg-accent/10 items-center justify-center mr-4 border border-accent/20">
                    <PlusCircle size={28} color="#0AADA8" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-display font-bold text-xl text-text-primary">
                      Add New Spot
                    </Text>
                    <Text className="font-body text-sm text-text-secondary">
                      Mark a terminal or waiting point
                    </Text>
                  </View>
                </View>
                <ChevronRight size={24} color="#0AADA8" />
              </Card>
            </Pressable>
          </>
        )}

        {activeRole === "private_driver" && (
          <>
            <Pressable onPress={() => router.push("/(tabs)/map")}>
              <Card className="flex-row items-center justify-between p-6 bg-surface-1 border border-accent/20 mb-4">
                <View className="flex-row items-center">
                  <View className="w-14 h-14 rounded-2xl bg-accent/10 items-center justify-center mr-4 border border-accent/20">
                    <Play size={28} color="#0AADA8" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-display font-bold text-xl text-text-primary">
                      Start Driving
                    </Text>
                    <Text className="font-body text-sm text-text-secondary">
                      Hazard alerts & AI navigation
                    </Text>
                  </View>
                </View>
                <ChevronRight size={24} color="#0AADA8" />
              </Card>
            </Pressable>

            <Pressable onPress={() => router.push("/(tabs)/report")}>
              <Card className="flex-row items-center justify-between p-4 bg-surface-1 border border-border-subtle">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-xl bg-danger/10 items-center justify-center mr-4">
                    <AlertTriangle size={24} color="#ef4444" />
                  </View>
                  <View>
                    <Text className="font-display font-bold text-lg text-text-primary">
                      Report Issue
                    </Text>
                    <Text className="font-body text-sm text-text-secondary">
                      Road problems and hazards
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#a1a1aa" />
              </Card>
            </Pressable>
          </>
        )}

        {activeRole === "citizen" && (
          <Pressable onPress={() => router.push("/(tabs)/report")}>
            <Card className="flex-row items-center justify-between p-4 bg-surface-1 border border-border-subtle">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-xl bg-danger/10 items-center justify-center mr-4">
                  <AlertTriangle size={24} color="#ef4444" />
                </View>
                <View>
                  <Text className="font-display font-bold text-lg text-text-primary">
                    Report Issue
                  </Text>
                  <Text className="font-body text-sm text-text-secondary">
                    Road problems and hazards
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#a1a1aa" />
            </Card>
          </Pressable>
        )}
      </View>

      {/* Latest Hazard Section */}
      {(() => {
        const { data: hazards } = useHazards();
        const latestHazard = hazards
          ?.filter((h) => h.status === "confirmed")
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          )[0];

        if (!latestHazard) return null;

        return (
          <View className="px-6 mt-10">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xs font-display font-bold text-accent uppercase tracking-widest">
                Latest Hazard
              </Text>
              <Pressable onPress={() => router.push("/(tabs)/map")}>
                <Text className="text-accent font-body font-medium text-xs border border-accent/30 px-3 py-1 rounded-full">
                  View Map
                </Text>
              </Pressable>
            </View>

            <Pressable onPress={() => router.push("/(tabs)/map")}>
              <Card 
                className={`flex-row items-center p-4 bg-surface-2 border-l-4 shadow-xl ${
                  latestHazard.severity === 'high' || latestHazard.severity === 'critical' ? 'border-l-danger-500' : 
                  latestHazard.severity === 'medium' ? 'border-l-amber-500' : 'border-l-accent-500'
                }`}
                accentBarColor={
                  latestHazard.severity === 'high' || latestHazard.severity === 'critical' ? '#EF4444' : 
                  latestHazard.severity === 'medium' ? '#F59E0B' : '#0AADA8'
                }
              >
                <View className="flex-1">
                  <Text className="font-display font-bold text-lg text-text-primary capitalize">
                    {latestHazard.type} reported
                  </Text>
                  <View className="flex-row items-center mt-2">
                    <AlertTriangle 
                      size={14} 
                      color={
                        latestHazard.severity === 'high' || latestHazard.severity === 'critical' ? '#EF4444' : 
                        latestHazard.severity === 'medium' ? '#F59E0B' : '#0AADA8'
                      } 
                      className="mr-2" 
                    />
                    <Text className="text-xs font-body text-text-secondary pr-4 capitalize" numberOfLines={1}>
                      {latestHazard.severity} Severity • {latestHazard.description || "Caution advised"}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#a1a1aa" />
              </Card>
            </Pressable>
          </View>
        );
      })()}

      {/* Role Selection Modal */}
      <Modal
        visible={isRoleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRoleModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center p-6">
          <View className="w-full bg-surface-1 rounded-3xl overflow-hidden">
            <View className="p-6 border-b border-border-default">
              <Text className="text-xl font-display font-bold text-text-primary">
                Switch Mode
              </Text>
              <Text className="text-sm font-body text-text-secondary mt-1">
                Select your current activity
              </Text>
            </View>

            <View className="p-4 gap-y-2">
              {ROLE_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => handleRoleChange(opt.value)}
                  disabled={isUpdatingRole}
                  className={`flex-row items-center p-4 rounded-2xl mb-2 border ${activeRole === opt.value ? "bg-accent/5 border-accent shadow-sm" : "bg-surface-2 border-border-subtle"}`}
                >
                  <View
                    className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${activeRole === opt.value ? "bg-accent" : "bg-surface-3"}`}
                  >
                    <opt.icon
                      size={24}
                      color={activeRole === opt.value ? "white" : "#94a3b8"}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`font-display font-bold text-base ${activeRole === opt.value ? "text-text-primary" : "text-text-secondary"}`}
                    >
                      {opt.label}
                    </Text>
                    <Text className="text-xs font-body text-text-tertiary mt-0.5" numberOfLines={2}>
                      {opt.description}
                    </Text>
                  </View>
                  {activeRole === opt.value && (
                    <CheckCircle size={20} color="#0AADA8" />
                  )}
                  {isUpdatingRole && activeRole !== opt.value && (
                    <ActivityIndicator size="small" color="#0AADA8" />
                  )}
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={() => setIsRoleModalVisible(false)}
              className="p-6 items-center"
            >
              <Text className="font-body font-bold text-text-tertiary">
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
