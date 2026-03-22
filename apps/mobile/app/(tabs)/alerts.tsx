import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useHazards } from '../../hooks/api/use-hazards';
import { Card } from '../../components/ui/Card';
import { MapPin, BellOff, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function AlertsTab() {
  const { data: hazards, isLoading, refetch } = useHazards();
  const router = useRouter();

  const getSeverityColor = (severity?: string | null) => {
    if (!severity) return '#3B82F6';
    switch (severity.toLowerCase()) {
      case 'severe': return '#ef4444';
      case 'medium': return '#F5A623';
      default: return '#3B82F6';
    }
  };

  const handleAlertPress = (h: any) => {
    router.push({
      pathname: '/(tabs)/map',
      params: { lat: h.lat, lng: h.lng }
    });
  };

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-16 pb-6 border-b border-border-default bg-surface-2">
        <Text className="font-display font-bold text-3xl text-text-primary">Alerts</Text>
        <Text className="font-body text-text-secondary mt-1">Real-time local hazards & road info</Text>
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#0AADA8" />}
      >
        {hazards && hazards.length > 0 ? (
          hazards.map((h) => (
            <Pressable key={h.report_id} onPress={() => handleAlertPress(h)}>
              <Card className="mb-4 bg-surface-1 border-l-4 overflow-hidden border-border-subtle" style={{ borderLeftColor: getSeverityColor(h.severity) }}>
                <View className="p-4 flex-row items-center">
                  <View className="flex-1">
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="bg-surface-3 px-3 py-1 rounded-full border border-border-subtle">
                        <Text className="text-[10px] font-bold uppercase text-text-secondary tracking-wider">{h.type}</Text>
                      </View>
                    </View>
                    <Text className="font-display font-bold text-lg text-text-primary mb-1">{h.description || `Reported ${h.type}`}</Text>
                    <View className="flex-row items-center mt-2">
                      <MapPin size={14} color="#a1a1aa" />
                      <Text className="text-xs text-text-tertiary ml-1">Calamba City Area</Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#a1a1aa" />
                </View>
              </Card>
            </Pressable>
          ))
        ) : (
          <View className="flex-1 items-center justify-center py-20">
            <View className="w-20 h-20 bg-surface-2 rounded-full items-center justify-center mb-6">
              <BellOff size={40} color="#3f3f46" />
            </View>
            <Text className="font-display font-bold text-xl text-text-primary mb-2">No active alerts</Text>
            <Text className="font-body text-text-secondary text-center px-10">
              When someone reports a hazard near you, it will appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
