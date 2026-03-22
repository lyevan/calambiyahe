import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Image,
} from "react-native";
import {
  AlertTriangle,
  Info,
  Users,
  Layers,
  MapPin,
  Sparkles,
  ShieldCheck,
  X,
  Globe,
  Award,
} from "lucide-react-native";
import { BlurView } from "expo-blur";

const { width, height } = Dimensions.get("window");

export const HackathonDisclaimer = () => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {Platform.OS === "ios" ? (
          <BlurView
            intensity={20}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "rgba(0,0,0,0.2)" },
            ]}
          />
        )}

        <View className="bg-background w-[90%] h-[80%] rounded-[32px] overflow-hidden">
          {/* Header */}
          <View className="bg-accent px-6 pt-4 pb-5 flex-row justify-between items-center">
            <View className="flex-row items-center">
              <Award size={24} color="#FFFFFF" />
              <Text className="text-white font-display font-bold text-lg ml-2">
                Project Information
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setVisible(false)}
              className="bg-white/20 p-2 rounded-full"
            >
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="flex-1 px-6 pt-6"
            showsVerticalScrollIndicator={false}
          >
            {/* Critical Performance Warning */}
            <View className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-6 flex-row items-start">
              <AlertTriangle size={20} color="#D97706" className="mt-0.5" />
              <View className="ml-3 flex-1">
                <Text className="text-amber-900 font-display font-bold text-sm">
                  Performance Notice
                </Text>
                <Text className="text-amber-800 font-body text-[12px] leading-4 mt-1">
                  Expect delays and cold starts. This API and database are
                  hosted on a free tier for this prototype and do not represent
                  the final production version.
                </Text>
              </View>
            </View>

            {/* Project Title */}
            <View className="items-center mb-6">
              <Image
                source={require("../../assets/calambiyahe-logo.png")}
                className="w-24 h-24 mb-4"
              />
              <Text className="text-accent font-display font-bold text-3xl">
                CalamBiyahe
              </Text>
              <Text className="text-text-secondary font-body text-sm text-center mt-1 italic">
                Smarter streets for every Calambeno.
              </Text>
            </View>

            {/* Hackathon Context */}
            <View className="mb-8 p-4 bg-surface-2 rounded-2xl border border-border-default">
              <View className="flex-row items-center mb-3">
                <Globe size={18} color="#0AADA8" />
                <Text className="text-text-primary font-display font-bold ml-2">
                  Hackathon Context
                </Text>
              </View>
              <View className="gap-y-2">
                <View className="flex-row justify-between">
                  <Text className="text-text-tertiary text-xs font-body">
                    Event
                  </Text>
                  <Text className="text-text-primary text-xs font-bold font-body">
                    InterCICSkwela 2026
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-text-tertiary text-xs font-body">
                    Challenge
                  </Text>
                  <Text className="text-text-primary text-xs font-bold font-body text-right flex-1 ml-4">
                    #1 — Smart Mobility & Transport
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-text-tertiary text-xs font-body">
                    Duration
                  </Text>
                  <Text className="text-text-primary text-xs font-bold font-body">
                    March 16–22, 2025
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-text-tertiary text-xs font-body">
                    Scope
                  </Text>
                  <Text className="text-text-primary text-xs font-bold font-body">
                    Calamba City, Laguna
                  </Text>
                </View>
                <View className="flex-row items-center mt-2 pt-2 border-t border-border-subtle gap-x-3">
                  <View className="bg-accent/10 px-2 py-1 rounded-md">
                    <Text className="text-accent text-[10px] font-bold">
                      SDG 9
                    </Text>
                  </View>
                  <View className="bg-accent/10 px-2 py-1 rounded-md">
                    <Text className="text-accent text-[10px] font-bold">
                      SDG 11
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* About */}
            <View className="mb-8">
              <View className="flex-row items-center mb-3">
                <Info size={18} color="#0AADA8" />
                <Text className="text-text-primary font-display font-bold ml-2">
                  About CalamBiyahe
                </Text>
              </View>
              <Text className="text-text-secondary font-body text-sm leading-5">
                A role-based smart mobility application built exclusively for
                Calamba City. It turns every resident into an active participant
                in a real-time mobility network, addressing digital
                infrastructure gaps through GPS broadcasting, passenger
                heatmaps, and hazard mapping.
              </Text>
            </View>

            {/* Core Modules Grid */}
            <View className="mb-8">
              <View className="flex-row items-center mb-4">
                <Layers size={18} color="#0AADA8" />
                <Text className="text-text-primary font-display font-bold ml-2">
                  Core Modules
                </Text>
              </View>

              <View className="gap-y-4">
                {[
                  {
                    icon: <Globe size={14} color="#0AADA8" />,
                    title: "GPS Broadcast",
                    desc: "Real-time commuter tracking for route optimization.",
                  },
                  {
                    icon: <MapPin size={14} color="#0AADA8" />,
                    title: "Passenger Heatmap",
                    desc: "Route-scoped density maps for jeepney drivers.",
                  },
                  {
                    icon: <AlertTriangle size={14} color="#0AADA8" />,
                    title: "Hazard Reporting",
                    desc: "Photo & GPS tagging for road issues like flooding.",
                  },
                  {
                    icon: <Sparkles size={14} color="#0AADA8" />,
                    title: "AI Rerouting",
                    desc: "Gemini-powered alternate road suggestions.",
                  },
                  {
                    icon: <Layers size={14} color="#0AADA8" />,
                    title: "Route Builder",
                    desc: "Interactive map-based route & waypoint management.",
                  },
                ].map((item, idx) => (
                  <View key={idx} className="flex-row items-start">
                    <View className="bg-accent/10 p-2 rounded-lg mt-0.5">
                      {item.icon}
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-text-primary font-display font-bold text-xs">
                        {item.title}
                      </Text>
                      <Text className="text-text-tertiary font-body text-[11px] leading-4">
                        {item.desc}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Roles Section */}
            <View className="mb-8">
              <View className="flex-row items-center mb-3">
                <Users size={18} color="#0AADA8" />
                <Text className="text-text-primary font-display font-bold ml-2">
                  Six Roles, One Network
                </Text>
              </View>
              <View className="bg-surface-2 p-4 rounded-2xl border border-border-default gap-y-3">
                {[
                  {
                    role: "Commuter",
                    action: "Broadcasts location & finds waiting spots",
                  },
                  {
                    role: "Jeepney Driver",
                    action: "Views active route passenger heatmaps",
                  },
                  {
                    role: "Private Driver",
                    action: "Receives AI rerouting & hazard alerts",
                  },
                  {
                    role: "Concerned Citizen",
                    action: "Reports hazards & verifies reports",
                  },
                  {
                    role: "Local Guide",
                    action: "Adds terminals and waiting spots",
                  },
                  {
                    role: "Admin",
                    action: "Manages routes & supervises hazards",
                  },
                ].map((item, idx) => (
                  <View key={idx} className="flex-row">
                    <Text className="text-accent font-bold text-xs w-28">
                      {item.role}
                    </Text>
                    <Text className="text-text-secondary text-xs font-body flex-1">
                      {item.action}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Team Members */}
            <View className="mb-8">
              <View className="flex-col items-center mb-3">
                <View className="flex-row items-center">
                  <Users size={18} color="#0AADA8" />
                  <Text className="text-text-primary font-display font-bold ml-2">
                    Development Team (Team CCC Iskode)
                  </Text>
                </View>
                <Text className="text-accent font-bold mt-2">
                  Advised by: Prof. Jio Arciaga
                </Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {[
                  { name: "Ivan Elmido", role: "Lead Fullstack Developer" },
                  {
                    name: "Kiel Arthur Inigo Navasero",
                    role: "AI/Backend Developer",
                  },
                  { name: "Lebron Catubao", role: "Frontend Developer/UI/UX" },
                  {
                    name: "John Carlo Cacao",
                    role: "Frontend Developer/UI/UX",
                  },
                ].map((member, idx) => (
                  <View
                    key={idx}
                    className="bg-surface-3 h-16 flex-col justify-center px-3 py-2 rounded-xl border border-border-subtle flex-1 min-w-[45%]"
                  >
                    <Text className="text-text-primary font-display font-bold text-[11px]">
                      {member.name}
                    </Text>
                    <Text className="text-text-tertiary font-body text-[10px]">
                      {member.role}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Footer / Credits */}
            <View className="mb-12 items-center border-t border-border-subtle pt-6">
              <ShieldCheck size={24} color="#0AADA8" />
              <Text className="text-text-primary font-body text-xs mt-2 text-center">
                This project is licensed under the MIT License.
              </Text>
              <Text className="text-text-tertiary font-display font-bold text-[10px] mt-4 uppercase tracking-widest">
                Team Iskode — City College of Calamba — 2026
              </Text>
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View className="p-6 bg-surface-2 border-t border-border-subtle">
            <TouchableOpacity
              onPress={() => setVisible(false)}
              className="bg-accent h-14 rounded-2xl items-center justify-center shadow-lg"
              activeOpacity={0.8}
            >
              <Text className="text-white font-display font-bold text-lg">
                Continue to Prototype
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
});
