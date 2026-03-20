import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';

type Role = 'Driver' | 'Commuter';

type FeatureCardProps = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
};

const profileUri = 'https://placehold.co/100x100/png';
const mapPreviewUri = 'https://placehold.co/800x400/png';
const potholeUri = 'https://placehold.co/240x140/png';

function FeatureCard({ title, subtitle, icon }: FeatureCardProps) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.featureCard}>
      <View style={styles.featureIconWrap}>{icon}</View>
      <View style={styles.featureTextWrap}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureSubtitle}>{subtitle}</Text>
      </View>
      <Feather name="chevron-right" size={20} color="#94A3B8" />
    </TouchableOpacity>
  );
}

export default function App() {
  const [role, setRole] = useState<Role>('Driver');
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const heatmapCard = useMemo(() => {
    if (role === 'Driver') {
      return {
        title: 'Passenger Heatmap',
        subtitle: 'See crowded areas',
        icon: <MaterialCommunityIcons name="google-maps" size={28} color="#2563EB" />,
      };
    }

    return {
      title: 'Send Signal',
      subtitle: 'Share your waiting area',
      icon: <MaterialCommunityIcons name="map-marker-radius" size={28} color="#2563EB" />,
    };
  }, [role]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F5F9" />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoBadge}>
              <MaterialCommunityIcons name="jeepney" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.logoText}>
              <Text style={styles.logoBlue}>CALAMBI</Text>
              <Text style={styles.logoYellow}>YAHE</Text>
            </Text>
          </View>

          <Image source={{ uri: profileUri }} style={styles.avatar} />
        </View>

        <View style={styles.roleRow}>
          <Text style={styles.roleLabel}>Mode:</Text>
          <View>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.roleButton}
              onPress={() => setShowRoleMenu((prev) => !prev)}
            >
              <View style={styles.roleButtonLeft}>
                <MaterialCommunityIcons
                  name={role === 'Driver' ? 'steering' : 'walk'}
                  size={18}
                  color="#2563EB"
                />
                <Text style={styles.roleButtonText}>{role}</Text>
              </View>
              <Feather name={showRoleMenu ? 'chevron-up' : 'chevron-down'} size={18} color="#64748B" />
            </TouchableOpacity>

            {showRoleMenu && (
              <View style={styles.dropdown}>
                {(['Driver', 'Commuter'] as Role[]).map((item) => {
                  const selected = item === role;
                  return (
                    <TouchableOpacity
                      key={item}
                      activeOpacity={0.85}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setRole(item);
                        setShowRoleMenu(false);
                      }}
                    >
                      <View style={styles.dropdownLeft}>
                        <MaterialCommunityIcons
                          name={item === 'Driver' ? 'steering' : 'walk'}
                          size={18}
                          color={selected ? '#2563EB' : '#64748B'}
                        />
                        <Text style={[styles.dropdownText, selected && styles.dropdownTextSelected]}>{item}</Text>
                      </View>
                      {selected && <Ionicons name="checkmark" size={18} color="#2563EB" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        <View style={styles.greetingBlock}>
          <Text style={styles.greeting}>Hello, Carlo 👋</Text>
          <Text style={styles.subtitle}>Smart Travel Dashboard</Text>
        </View>

        <View style={styles.grid}>
          <FeatureCard
            title={heatmapCard.title}
            subtitle={heatmapCard.subtitle}
            icon={heatmapCard.icon}
          />

          <FeatureCard
            title="Find Routes"
            subtitle="Plan your trip"
            icon={<Ionicons name="paper-plane-outline" size={28} color="#2563EB" />}
          />

          <FeatureCard
            title="Report Issue"
            subtitle="Road problems & hazards"
            icon={<MaterialCommunityIcons name="alert-circle-outline" size={28} color="#F59E0B" />}
          />

          <FeatureCard
            title="Local Guide"
            subtitle="Terminals & commute tips"
            icon={<Feather name="map-pin" size={26} color="#2563EB" />}
          />
        </View>

        <View style={styles.alertCard}>
          <View style={styles.alertTitleRow}>
            <MaterialCommunityIcons name="alert-outline" size={22} color="#F59E0B" />
            <Text style={styles.alertTitle}>Nearby Alert</Text>
          </View>

          <Text style={styles.alertHeadline}>Pothole detected near Crossing Calamba</Text>

          <View style={styles.mapCard}>
            <Image source={{ uri: mapPreviewUri }} style={styles.mapImage} />
            <View style={styles.mapDangerBadge}>
              <MaterialCommunityIcons name="alert" size={18} color="#FFFFFF" />
            </View>
            <Image source={{ uri: potholeUri }} style={styles.issueThumb} />
          </View>

          <View style={styles.alertFooter}>
            <View style={styles.trafficRow}>
              <View style={styles.trafficIndicator} />
              <Text style={styles.trafficText}>Moderate Traffic</Text>
            </View>

            <TouchableOpacity activeOpacity={0.85} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>View Alerts</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Updates</Text>
          <TouchableOpacity activeOpacity={0.85}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.updatesRow}>
          <TouchableOpacity activeOpacity={0.85} style={styles.updateCard}>
            <View style={styles.updateIconBoxRed}>
              <MaterialCommunityIcons name="road-variant" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.updateTitle}>Road Closed</Text>
            <Text style={styles.updateLocation}>J.P. Rizal St, Sta. Rosa</Text>
            <Text style={styles.updateTime}>Reported 2 hrs ago</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.85} style={styles.updateCard}>
            <View style={styles.updateIconBoxBlue}>
              <MaterialCommunityIcons name="waves" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.updateTitle}>Flood Warning</Text>
            <Text style={styles.updateLocation}>San Juan Bridge</Text>
            <Text style={styles.updateTime}>45 mins ago</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.85}>
          <Feather name="home" size={24} color="#2563EB" />
          <Text style={styles.navTextActive}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} activeOpacity={0.85}>
          <Feather name="map" size={24} color="#64748B" />
          <Text style={styles.navText}>Map</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.fabWrap} activeOpacity={0.85}>
          <View style={styles.fabOuter}>
            <View style={styles.fabInner}>
              <Ionicons name="add" size={34} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.navTextActive}>Report</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} activeOpacity={0.85}>
          <View>
            <Ionicons name="notifications-outline" size={24} color="#64748B" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </View>
          <Text style={styles.navText}>Alerts</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} activeOpacity={0.85}>
          <Feather name="user" size={24} color="#64748B" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F5F9',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 130,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  logoBlue: {
    color: '#2563EB',
  },
  logoYellow: {
    color: '#F4B400',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E5E7EB',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
    zIndex: 5,
  },
  roleLabel: {
    fontSize: 18,
    color: '#475569',
    marginTop: 12,
    fontWeight: '500',
  },
  roleButton: {
    minWidth: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  roleButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  dropdown: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 6,
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropdownText: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
  },
  dropdownTextSelected: {
    color: '#2563EB',
    fontWeight: '700',
  },
  greetingBlock: {
    marginBottom: 18,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#64748B',
  },
  grid: {
    gap: 14,
    marginBottom: 18,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  featureIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 20,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#0F172A',
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  alertHeadline: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 14,
  },
  mapCard: {
    position: 'relative',
    marginBottom: 14,
  },
  mapImage: {
    width: '100%',
    height: 170,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
  },
  mapDangerBadge: {
    position: 'absolute',
    top: 14,
    left: '48%',
    marginLeft: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  issueThumb: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 102,
    height: 64,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#CBD5E1',
  },
  alertFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  trafficRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  trafficIndicator: {
    width: 32,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#FACC15',
    marginRight: 8,
  },
  trafficText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#334155',
  },
  primaryButton: {
    backgroundColor: '#2483FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  viewAll: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2483FF',
  },
  updatesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  updateCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  updateIconBoxRed: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  updateIconBoxBlue: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
  },
  updateLocation: {
    fontSize: 15,
    color: '#475569',
    marginBottom: 8,
    lineHeight: 20,
  },
  updateTime: {
    fontSize: 14,
    color: '#64748B',
  },
  bottomNav: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 14,
    height: 86,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 58,
  },
  navText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  navTextActive: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '700',
  },
  fabWrap: {
    alignItems: 'center',
    marginTop: -34,
  },
  fabOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#DDEEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  fabInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#2483FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
