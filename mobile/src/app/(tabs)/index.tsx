import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { AlertCard } from '../../components/AlertCard';
import { DangerPanel } from '../../components/DangerPanel';
import { Button, Card, EmptyState, Notice } from '../../components/ui';
import { useAlerts } from '../../context/AlertsContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { useSettings } from '../../context/SettingsContext';
import { SEVERITY_RANK } from '../../lib/alerts';
import { timeAgo } from '../../lib/format';
import { formatDistance } from '../../lib/geo';
import { openAlert, showAlertOnMap } from '../../lib/nav';
import { callNumber, sendSos, sosMessage } from '../../lib/sos';
import { colors, radius } from '../../theme';

type Scope = 'near' | 'world';

export default function AlertsScreen() {
  const { alerts, nearby, dangerAlerts, loading, error, lastUpdated, refresh } = useAlerts();
  const { permission, position, requestPermission } = useLocation();
  const { settings, contacts } = useSettings();
  const { user } = useAuth();
  const [scope, setScope] = useState<Scope>('near');

  const worst = useMemo(
    () => [...dangerAlerts].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])[0],
    [dangerAlerts],
  );
  // Without a location fix "near me" means nothing, so show everything.
  const activeScope: Scope = position ? scope : 'world';
  const list = activeScope === 'near' ? nearby : alerts;

  const header = (
    <View style={{ gap: 14, marginBottom: 6 }}>
      {permission === 'denied' || permission === 'services-off' ? (
        <Notice
          tone="warning"
          icon="location"
          action={<Button title="Allow location" compact icon="locate" onPress={requestPermission} style={{ alignSelf: 'flex-start' }} />}
        >
          {permission === 'services-off'
            ? 'Location services are off. Turn them on so Oarfin can warn you about danger zones around you.'
            : 'Oarfin needs your location to warn you when you are inside a danger zone.'}
        </Notice>
      ) : null}

      {worst ? (
        <>
          <DangerPanel alert={worst} />
          {dangerAlerts.length > 1 && (
            <Text style={styles.moreZones}>You are inside {dangerAlerts.length} danger zones. All of them are listed below.</Text>
          )}
        </>
      ) : (
        <Card style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusIcon, { backgroundColor: position ? `${colors.safe}22` : colors.section }]}>
              <Ionicons name={position ? 'shield-checkmark' : 'locate'} size={24} color={position ? colors.safe : colors.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusTitle}>{position ? 'No danger zone at your location' : 'Finding your location…'}</Text>
              <Text style={styles.statusSub}>
                {position
                  ? `${nearby.length} active alert${nearby.length === 1 ? '' : 's'} within ${formatDistance(settings.alertRadiusKm)}`
                  : 'Alerts near you will appear once your location is known.'}
              </Text>
            </View>
          </View>
          <View style={styles.quickRow}>
            <QuickAction
              icon="megaphone"
              label="SOS"
              color={colors.critical}
              onPress={() => sendSos(contacts, sosMessage(user?.displayName, position))}
            />
            <QuickAction
              icon="call"
              label={`Call ${settings.emergencyNumber}`}
              color={colors.primary}
              onPress={() => callNumber(settings.emergencyNumber)}
            />
            <QuickAction
              icon="medkit"
              label="Shelters"
              color={colors.safe}
              onPress={() => router.navigate({ pathname: '/map', params: { layer: 'shelters' } })}
            />
          </View>
        </Card>
      )}

      {error && <Notice tone="error">{error}</Notice>}

      <View style={styles.segment}>
        {(['near', 'world'] as const).map((s) => (
          <Pressable key={s} onPress={() => setScope(s)} style={[styles.segmentItem, activeScope === s && styles.segmentActive]}>
            <Text style={[styles.segmentText, activeScope === s && styles.segmentTextActive]}>
              {s === 'near' ? `Near me (${position ? nearby.length : '–'})` : `Worldwide (${alerts.length})`}
            </Text>
          </Pressable>
        ))}
      </View>
      {lastUpdated && <Text style={styles.updated}>Updated {timeAgo(new Date(lastUpdated).toISOString()).toLowerCase()}</Text>}
    </View>
  );

  return (
    <FlatList
      data={list}
      keyExtractor={(a) => a.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={header}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}
      renderItem={({ item }) => (
        <AlertCard
          alert={item}
          onPress={() => openAlert(item.id)}
          onShowOnMap={() => showAlertOnMap(item)}
        />
      )}
      ListEmptyComponent={
        loading ? undefined : (
          <EmptyState
            icon="notifications-off-outline"
            title={activeScope === 'near' ? 'No alerts near you' : 'No active alerts'}
            message={
              activeScope === 'near'
                ? `Nothing within ${formatDistance(settings.alertRadiusKm)}. You can widen the radius in settings or check worldwide alerts.`
                : 'Pull down to refresh.'
            }
            action={activeScope === 'near' ? <Button title="See worldwide" variant="secondary" onPress={() => setScope('world')} /> : undefined}
          />
        )
      }
    />
  );
}

function QuickAction({ icon, label, color, onPress }: { icon: any; label: string; color: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quick, { opacity: pressed ? 0.7 : 1 }]}>
      <View style={[styles.quickIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.quickLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  moreZones: { fontSize: 13, color: colors.critical, fontWeight: '600' },
  statusCard: { gap: 14 },
  statusRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  statusIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  statusTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  statusSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  quickRow: { flexDirection: 'row', gap: 10 },
  quick: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 8, borderRadius: radius.md, backgroundColor: colors.section },
  quickIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 12, fontWeight: '600', color: colors.text },
  segment: { flexDirection: 'row', backgroundColor: colors.section, borderRadius: radius.md, padding: 4 },
  segmentItem: { flex: 1, paddingVertical: 9, borderRadius: radius.sm, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.card },
  segmentText: { fontWeight: '600', color: colors.textSecondary, fontSize: 14 },
  segmentTextActive: { color: colors.primary },
  updated: { fontSize: 12, color: colors.textMuted, textAlign: 'right' },
});
