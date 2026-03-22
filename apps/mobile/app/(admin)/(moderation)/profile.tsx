import React, { useRef, useEffect } from "react";
import { View, Text, Image, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Card } from "../../../components/ui/Card";
import { useAuthStore } from "../../../stores/auth.store";
import { LogOut } from "lucide-react-native";

export default function AdminProfileTab() {
  const router = useRouter();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await clearSession();
          if (isMounted.current) {
            router.replace("/(auth)/login");
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-surface-1 flex flex-col justify-between px-6 py-6">
      {/* Profile Header */}
      <View>
        <View className="items-center mb-10">
          <View className="w-24 h-24 rounded-full border-4 border-accent overflow-hidden mb-4 shadow-xl">
            <Image
              source={{
                uri: `https://ui-avatars.com/api/?name=${user?.username || "Admin"}&background=2C666E&color=fff&size=128`,
              }}
              className="w-full h-full"
            />
          </View>
          <Text className="text-2xl font-display font-bold text-text-primary">
            {user?.username}
          </Text>
          <View className="bg-primary-500/10 px-4 py-1.5 rounded-lg mt-2 border border-accent">
            <Text className="text-accent font-body font-bold text-xs uppercase tracking-widest">
              ADMINISTRATOR
            </Text>
          </View>
        </View>

        <Card className="bg-surface-2 overflow-hidden p-0 mb-8">
          <Pressable
            className="flex-row items-center p-4"
            onPress={handleLogout}
          >
            <View className="w-10 h-10 rounded-full bg-danger-surface items-center justify-center mr-4">
              <LogOut size={20} color="#EF4444" />
            </View>
            <View className="flex-1">
              <Text className="font-body font-bold text-text-primary">
                Log Out
              </Text>
              <Text className="font-body text-[12px] text-text-tertiary">
                Exit your admin session
              </Text>
            </View>
          </Pressable>
        </Card>
      </View>

      <Text className="text-center text-text-tertiary text-[10px] font-body opacity-50">
        CalamBiyahe Admin Dashboard v1.0.0
      </Text>
    </View>
  );
}
