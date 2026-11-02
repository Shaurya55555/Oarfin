import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AlertWithDistance } from '../context/AlertsContext';
import { timeAgo } from '../lib/format';
import { formatDistance } from '../lib/geo';
import { colors, radius, severityColor, shadow } from '../theme';
import { SeverityBadge, type IconName } from './ui';

export const TYPE_ICONS: Record<string, IconName> = {
  Earthquake: 'pulse',
  Flood: 'water',
  'Tropical Cyclone': 'thunderstorm',
  Storm: 'thunderstorm',
  Volcano: 'flame',
  Wildfire: 'flame',
  Fire: 'flame',
  Drought: 'sunny',
};

export function alertIcon(type: string): IconName {
  return TYPE_ICONS[type] ?? 'warning';
}

export function AlertCard({
  alert,
  onPress,
  onShowOnMap,
}: {
  alert: AlertWithDistance;
  onPress: () => void;
  onShowOnMap: () => void;
}) {
  const tint = severityColor[alert.severity];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, { borderLeftColor: tint, opacity: pressed ? 0.85 : 1 }]}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: `${tint}22` }]}>
          <Ionicons name={alertIcon(alert.type)} size={20} color={tint} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.title} numberOfLines={2}>
            {alert.title}
          </Text>
          <View style={styles.metaRow}>
            <SeverityBadge severity={alert.severity} />
            <Text style={styles.meta}>{timeAgo(alert.issuedAt)}</Text>
          </View>
        </View>
      </View>

      {!!alert.description && (
        <Text style={styles.description} numberOfLines={2}>
          {alert.description}
        </Text>
      )}

      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          {alert.inside ? (
            <Text style={[styles.distance, { color: colors.critical }]}>You are inside this zone</Text>
          ) : alert.distanceKm !== null ? (
            <Text style={styles.distance}>{formatDistance(alert.distanceKm)} away</Text>
          ) : null}
          <Text style={styles.source} numberOfLines={1}>
            {alert.source === 'authority' ? 'Issued by authorities' : alert.country || 'GDACS'}
          </Text>
        </View>
        <Pressable onPress={onShowOnMap} hitSlop={8} style={styles.mapButton} accessibilityLabel="Show on map">
          <Ionicons name="map-outline" size={16} color={colors.primary} />
          <Text style={styles.mapText}>Map</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 14,
    borderLeftWidth: 5,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
    ...shadow,
  },
  header: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  iconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meta: { fontSize: 12, color: colors.textMuted },
  description: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  footerInfo: { flex: 1 },
  distance: { fontSize: 13, fontWeight: '700', color: colors.text },
  source: { fontSize: 12, color: colors.textMuted },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: `${colors.primary}12`,
  },
  mapText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
});
