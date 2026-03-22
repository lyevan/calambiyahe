import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  RefreshControl,
  Alert,
} from "react-native";
import { useAuthStore } from "../../stores/auth.store";
import { useRoleStore } from "../../stores/role.store";
import { router } from "expo-router";
import {
  User,
  Bell,
  Lock,
  HelpCircle,
  Info,
  LogOut,
  ChevronRight,
} from "lucide-react-native";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

export default function ProfileTab() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const activeRole = useRoleStore((state) => state.activeRole);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleLogout = async () => {
    await clearSession();
    router.replace("/(auth)/login");
  };

  const handleComingSoon = (feature: string) => {
    Alert.alert("Coming Soon", `${feature} is not available yet. We are working on it!`);
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 120 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={["#0AADA8"]}
          tintColor="#0AADA8"
        />
      }
    >
      {/* branding header */}
      <View className="flex-row items-center px-6 pt-14 pb-4 bg-surface-2 border-b border-border-subtle">
        <Image 
          source={require("../../assets/calambiyahe-logo.png")}
          style={{ width: 32, height: 32, marginRight: 10 }}
          resizeMode="contain"
        />
        <Text className="text-xl font-display font-extrabold text-text-primary">
          CALAMBI<Text className="text-accent">YAHE</Text>
        </Text>
      </View>

      {/* Profile Header */}
      <View className="pt-10 pb-10 px-6 items-center bg-surface-2">
        <View className="w-24 h-24 rounded-full border-4 border-accent overflow-hidden mb-4 shadow-xl">
          <Image
            source={{
              uri: `https://ui-avatars.com/api/?name=${user?.username || "User"}&background=2C666E&color=fff&size=128`,
            }}
            className="w-full h-full"
          />
        </View>
        <Text className="text-2xl font-display font-bold text-text-primary">
          {user?.username}
        </Text>
        <View className="bg-accent/10 px-4 py-1.5 rounded-full mt-2 border border-accent/20">
          <Text className="text-accent font-body font-bold text-xs uppercase tracking-widest">
            {activeRole}
          </Text>
        </View>
      </View>

      <View className="px-6 mt-8">
        <Text className="text-xs font-display font-bold text-text-tertiary uppercase tracking-widest mb-4">
          Account Settings
        </Text>

        <Card className="bg-surface-1 p-0 overflow-hidden mb-8">
          <Pressable 
            onPress={() => handleComingSoon("Edit Profile")}
            className="flex-row items-center p-4 border-b border-border-default active:bg-surface-2"
          >
            <User size={22} color="#0AADA8" />
            <Text className="flex-1 font-body text-text-primary ml-3">
              Edit Profile
            </Text>
            <ChevronRight size={18} color="#a1a1aa" />
          </Pressable>

          <Pressable 
            onPress={() => handleComingSoon("Notification Preferences")}
            className="flex-row items-center p-4 border-b border-border-default active:bg-surface-2"
          >
            <Bell size={22} color="#0AADA8" />
            <Text className="flex-1 font-body text-text-primary ml-3">
              Notification Preferences
            </Text>
            <ChevronRight size={18} color="#a1a1aa" />
          </Pressable>

          <Pressable 
            onPress={() => handleComingSoon("Privacy & Security")}
            className="flex-row items-center p-4 active:bg-surface-2"
          >
            <Lock size={22} color="#0AADA8" />
            <Text className="flex-1 font-body text-text-primary ml-3">
              Privacy & Security
            </Text>
            <ChevronRight size={18} color="#a1a1aa" />
          </Pressable>
        </Card>

        <Text className="text-xs font-display font-bold text-text-tertiary uppercase tracking-widest mb-4">
          Community
        </Text>

        <Card className="bg-surface-1 p-0 overflow-hidden mb-10">
          <Pressable 
            onPress={() => handleComingSoon("Help & Support")}
            className="flex-row items-center p-4 border-b border-border-default active:bg-surface-2"
          >
            <HelpCircle size={22} color="#a1a1aa" />
            <Text className="flex-1 font-body text-text-primary ml-3">
              Help & Support
            </Text>
            <ChevronRight size={18} color="#a1a1aa" />
          </Pressable>

          <Pressable 
            onPress={() => handleComingSoon("About CalamBiyahe")}
            className="flex-row items-center p-4 active:bg-surface-2"
          >
            <Info size={22} color="#a1a1aa" />
            <Text className="flex-1 font-body text-text-primary ml-3">
              About CalamBiyahe
            </Text>
            <ChevronRight size={18} color="#a1a1aa" />
          </Pressable>
        </Card>

        <Button
          variant="destructive"
          label="Log Out"
          onPress={handleLogout}
          icon={LogOut}
        />

        <Text className="text-center text-text-tertiary text-[10px] mt-8 font-body">
          CalamBiyahe v1.0.0 (Expo v54)
        </Text>
      </View>
    </ScrollView>
  );
}
