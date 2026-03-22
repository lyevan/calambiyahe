import { Tabs } from 'expo-router';
import { Home, Map as MapIcon, Megaphone, Bell, User } from 'lucide-react-native';
import { View, Platform } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0F1117', // Match background
          borderTopColor: '#1F2330', // Match surface-2
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 12,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#0AADA8',
        tabBarInactiveTintColor: '#a1a1aa',
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'System',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => <MapIcon size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: 'Report',
          tabBarIcon: ({ color }) => (
            <View style={{ 
              backgroundColor: '#0AADA8',
              width: 50,
              height: 50,
              borderRadius: 25,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: Platform.OS === 'ios' ? 0 : 20,
              shadowColor: '#0AADA8',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5
            }}>
              <Megaphone size={28} color="white" />
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
