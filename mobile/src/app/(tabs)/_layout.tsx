import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Pressable, Text, View } from 'react-native';
import { useAlerts } from '../../context/AlertsContext';
import { useFriends } from '../../context/FriendsContext';
import { colors } from '../../theme';

function SettingsButton() {
  return (
    <Pressable
      onPress={() => router.push('/settings')}
      hitSlop={10}
      style={{ marginRight: 16 }}
      accessibilityLabel="Profile and settings"
    >
      <Ionicons name="person-circle-outline" size={28} color={colors.text} />
    </Pressable>
  );
}

function HeaderTitle({ title }: { title: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Ionicons name="shield-half" size={22} color={colors.primary} />
      <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>{title}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { dangerAlerts } = useAlerts();
  const { pending } = useFriends();
  const incoming = pending.filter((p) => !p.isRequestor).length;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerRight: () => <SettingsButton />,
        headerStyle: { backgroundColor: colors.card },
        headerTitleAlign: 'left',
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Alerts',
          headerTitle: () => <HeaderTitle title="Oarfin" />,
          tabBarIcon: ({ color, size }) => <Ionicons name="notifications" size={size} color={color as string} />,
          tabBarBadge: dangerAlerts.length ? '!' : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.critical },
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color as string} />,
          tabBarBadge: incoming || undefined,
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: 'Assistant',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color as string} />,
        }}
      />
    </Tabs>
  );
}
