import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAlerts, type AlertWithDistance } from '../context/AlertsContext';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { useSettings } from '../context/SettingsContext';
import { directionsUrl, distanceKm, escapeRoute, formatDistance } from '../lib/geo';
import { openAlert } from '../lib/nav';
import { callNumber, openUrl, sendSos, sosMessage } from '../lib/sos';
import { colors, radius } from '../theme';
import { Button } from './ui';

type Destination = { name: string; latitude: number; longitude: number; km: number; authority: boolean };

// Shown at the top of the Alerts tab whenever the user is inside a danger zone.
export function DangerPanel({ alert }: { alert: AlertWithDistance }) {
  const { position } = useLocation();
  const { user } = useAuth();
  const { settings, contacts } = useSettings();
  const { safeLocationsFor, shelters, sheltersLoading, loadShelters } = useAlerts();

  useEffect(() => {
    loadShelters();
  }, [loadShelters]);

  const escape = position ? escapeRoute(position, alert) : null;

  // Prefer a safe area authorities marked for this disaster; otherwise the nearest
  // shelter/hospital that sits outside the danger zone.
  const destination = useMemo<Destination | null>(() => {
    if (!position) return null;
    const official = safeLocationsFor(alert)
      .map((s) => ({ name: s.description, latitude: s.latitude, longitude: s.longitude, authority: true }))
      .map((s) => ({ ...s, km: distanceKm(position, s) }))
      .sort((a, b) => a.km - b.km)[0];
    if (official) return official;
    const outside = shelters
      .map((s) => ({ name: s.name || capitalizeType(s.type), latitude: s.lat, longitude: s.lng, authority: false }))
      .filter((s) => distanceKm(alert, s) > alert.radiusKm)
      .map((s) => ({ ...s, km: distanceKm(position, s) }))
      .sort((a, b) => a.km - b.km)[0];
    return outside ?? null;
  }, [position, alert, safeLocationsFor, shelters]);

  const onSos = () => sendSos(contacts, sosMessage(user?.displayName, position, alert.type.toLowerCase()));

  return (
    <View style={styles.panel}>
      <View style={styles.headerRow}>
        <Ionicons name="warning" size={26} color={colors.white} />
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>YOU ARE IN A DANGER ZONE</Text>
          <Text style={styles.title} numberOfLines={2}>
            {alert.title}
          </Text>
        </View>
      </View>

      {escape && (
        <Text style={styles.body}>
          {escape.direction
            ? `Move ${escape.direction} — about ${formatDistance(escape.kmToEdge)} to leave the ${alert.radiusEstimated ? 'estimated ' : ''}zone.`
            : `You are near the centre. The zone edge is about ${formatDistance(escape.kmToEdge)} away in any direction.`}
        </Text>
      )}

      <View style={styles.destination}>
        <Ionicons name="shield-checkmark" size={18} color={colors.safe} />
        <Text style={styles.destinationText} numberOfLines={2}>
          {destination
            ? `${destination.authority ? 'Official safe area' : 'Nearest safe place'}: ${destination.name} (${formatDistance(destination.km)})`
            : sheltersLoading
              ? 'Looking for the nearest safe place…'
              : 'No marked safe place nearby yet. Follow local authority instructions.'}
        </Text>
      </View>

      <View style={styles.actions}>
        {destination && (
          <Button
            title="Directions to safety"
            icon="navigate"
            variant="safe"
            onPress={() => openUrl(directionsUrl(destination))}
            style={styles.fullWidth}
          />
        )}
        <View style={styles.row}>
          <Button title="SOS" icon="megaphone" variant="secondary" onPress={onSos} style={styles.half} />
          <Button
            title={`Call ${settings.emergencyNumber}`}
            icon="call"
            variant="secondary"
            onPress={() => callNumber(settings.emergencyNumber)}
            style={styles.half}
          />
        </View>
        <Button
          title="Alert details"
          variant="ghost"
          compact
          onPress={() => openAlert(alert.id)}
          style={styles.ghost}
        />
      </View>
    </View>
  );
}

function capitalizeType(type: string) {
  return type.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.critical, borderRadius: radius.lg, padding: 16, gap: 12 },
  headerRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  kicker: { color: '#FFE4E6', fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
  title: { color: colors.white, fontSize: 18, fontWeight: '800' },
  body: { color: colors.white, fontSize: 15, lineHeight: 21 },
  destination: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 10,
  },
  destinationText: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '600' },
  actions: { gap: 8 },
  fullWidth: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', gap: 8 },
  half: { flex: 1 },
  ghost: { alignSelf: 'center' },
});
