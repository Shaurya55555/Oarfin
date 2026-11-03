import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { alertIcon } from '../../components/AlertCard';
import { MapCanvas } from '../../components/map/MapCanvas';
import { Button, Card, EmptyState, InfoRow, Notice, SectionTitle, SeverityBadge } from '../../components/ui';
import { useAlerts } from '../../context/AlertsContext';
import { useLocation } from '../../context/LocationContext';
import { formatDateTime, timeAgo } from '../../lib/format';
import { directionsUrl, distanceKm, escapeRoute, formatDistance, mapsLink } from '../../lib/geo';
import { showAlertOnMap } from '../../lib/nav';
import { openUrl } from '../../lib/sos';
import { colors, radius, severityColor } from '../../theme';

export default function AlertDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getAlert, safeLocationsFor } = useAlerts();
  const { position } = useLocation();
  const alert = id ? getAlert(id) : undefined;

  if (!alert) {
    return (
      <EmptyState
        icon="alert-circle-outline"
        title="Alert not available"
        message="This alert may have expired or been filtered out by your settings."
      />
    );
  }

  const tint = severityColor[alert.severity];
  const safe = safeLocationsFor(alert)
    .map((s) => ({ ...s, km: position ? distanceKm(position, s) : null }))
    .sort((a, b) => (a.km ?? 0) - (b.km ?? 0));
  const escape = alert.inside && position ? escapeRoute(position, alert) : null;

  const share = () =>
    Share.share({
      message: `${alert.severity} alert: ${alert.title}\n${alert.description}\nLocation: ${mapsLink(alert)}\nShared from Oarfin`,
    });

  return (
    <>
      <Stack.Screen options={{ headerStyle: { backgroundColor: tint }, headerTintColor: colors.white }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.hero, { backgroundColor: `${tint}14`, borderColor: `${tint}55` }]}>
          <View style={styles.heroTop}>
            <SeverityBadge severity={alert.severity} />
            <Text style={styles.meta}>{timeAgo(alert.issuedAt)}</Text>
            <View style={{ flex: 1 }} />
            <Ionicons name={alertIcon(alert.type)} size={28} color={tint} />
          </View>
          <Text style={styles.title}>{alert.title}</Text>
          <Text style={styles.meta}>Source: {alert.sourceLabel}</Text>
        </View>

        {alert.inside && (
          <Notice tone="error" icon="warning">
            You are inside this {alert.radiusEstimated ? 'estimated ' : ''}danger zone.
            {escape?.direction ? ` Move ${escape.direction} for about ${formatDistance(escape.kmToEdge)} to get out.` : ''}
          </Notice>
        )}

        <View style={styles.mapWrap}>
          <MapCanvas
            initialCenter={alert}
            initialSpanKm={Math.max(alert.radiusKm * 3, 10)}
            interactive={false}
            showsUserLocation
            circles={[{ id: 'zone', center: alert, radiusKm: alert.radiusKm, color: tint }]}
            markers={[
              { id: 'centre', kind: 'alert', coordinate: alert, title: alert.title, color: tint, glyph: '⚠️' },
              ...safe.map((s) => ({
                id: `s:${s.id}`,
                kind: 'safe' as const,
                coordinate: s,
                title: s.description,
                color: colors.safe,
                glyph: '✅',
              })),
            ]}
          />
        </View>

        <View style={styles.actions}>
          <Button title="Open in map" icon="map" variant="secondary" onPress={() => showAlertOnMap(alert)} style={{ flex: 1 }} />
          <Button title="Share" icon="share-social" variant="secondary" onPress={share} style={{ flex: 1 }} />
        </View>

        {!!alert.description && (
          <View>
            <SectionTitle>What’s happening</SectionTitle>
            <Text style={styles.body}>{alert.description}</Text>
          </View>
        )}

        <View>
          <SectionTitle>Details</SectionTitle>
          <Card style={{ paddingVertical: 4 }}>
            <InfoRow label="Type" value={alert.type} />
            {alert.country ? <InfoRow label="Region" value={alert.country} /> : null}
            <InfoRow label="Issued" value={formatDateTime(alert.issuedAt)} />
            {alert.expiresAt ? <InfoRow label={alert.source === 'gdacs' ? 'Last update' : 'Expires'} value={formatDateTime(alert.expiresAt)} /> : null}
            <InfoRow
              label="Affected area"
              value={`${formatDistance(alert.radiusKm)} radius${alert.radiusEstimated ? ' (estimated)' : ''}`}
            />
            {alert.distanceKm !== null && <InfoRow label="Distance" value={alert.inside ? 'You are inside' : `${formatDistance(alert.distanceKm)} from you`} />}
            <InfoRow label="Coordinates" value={`${alert.latitude.toFixed(4)}, ${alert.longitude.toFixed(4)}`} />
          </Card>
        </View>

        <View>
          <SectionTitle>Safe areas marked by authorities</SectionTitle>
          {safe.length === 0 ? (
            <Text style={styles.muted}>None marked yet for this event. The Map tab shows nearby shelters and hospitals.</Text>
          ) : (
            <View style={{ gap: 10 }}>
              {safe.map((s) => (
                <Card key={s.id} style={styles.safeRow}>
                  <Ionicons name="shield-checkmark" size={22} color={colors.safe} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.safeName}>{s.description}</Text>
                    {s.km !== null && <Text style={styles.muted}>{formatDistance(s.km)} from you</Text>}
                  </View>
                  <Button title="Go" icon="navigate" compact variant="safe" onPress={() => openUrl(directionsUrl(s))} />
                </Card>
              ))}
            </View>
          )}
        </View>

        {alert.reportUrl && (
          <Button title="Full GDACS report" icon="open-outline" variant="ghost" onPress={() => openUrl(alert.reportUrl!)} />
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  hero: { borderRadius: radius.lg, padding: 16, gap: 8, borderWidth: 1 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  meta: { fontSize: 13, color: colors.textSecondary },
  mapWrap: { height: 220, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  actions: { flexDirection: 'row', gap: 10 },
  body: { fontSize: 15, color: colors.text, lineHeight: 22 },
  muted: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  safeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  safeName: { fontSize: 15, fontWeight: '600', color: colors.text },
});
